// @ts-nocheck

import { io } from "socket.io-client";
import { detour, extractSubObject, findChildKeyInObject, findChildKeysInObject, findClassByMethod, transformObject } from "./utils";

export async function pageLoadedEntry() {
    if (window.destroy) window.destroy();
    const destroyFns = [];
    window.destroy = () => {
        console.log('[GSM] Destroying...');
        destroyFns.forEach(fn => fn());
    };

    const Vector2 = findClassByMethod('clone', 0, x => x.includes('(this.x,this.y)'));
    const GameRenderer = findClassByMethod('render', 2, x => x.includes('this.context.fillRect(0,0,this.context.canvas.width,this.context.canvas.height);'));
    const PlayerRenderer = findClassByMethod('render', 3, x => x.includes('RIGHT') && x.includes('DOWN'))

    let initialized = false;
    let gameInstance;
    let gameInstanceKey1;
    let otherInstance = {};
    let otherRenderer;
    let lastDataSend = 0;

    function createPlayerRenderer(instance, settings, ctx) {
        return new PlayerRenderer(instance, settings, ctx);
    };

    function init(instance, settings, ctx) {
        otherRenderer = createPlayerRenderer(otherInstance, settings, ctx);
    };

    function serializeGameInstance(gameInstance) {
        //console.log('[GSM] Serialize', gameInstance.oa);
        
        const isSimple = x => typeof x === 'boolean' || typeof x === 'number' || typeof x === 'string' || x.constructor.name === 'Object';
        const isVector2 = x => x instanceof Vector2;

        const typify = type => data => ({type, data});
        const serializeSimple = x => typify('simple_object')(JSON.stringify(x));
        const serializeVector = x => typify('vector2')({x: x.x, y: x.y});
        const serializeVectorArray = x => typify('vector2_array')(x.map(serializeVector));
        
        //const simpleKeys = [...simpleValueKeys, ...simpleArrayKeys, ...vectorKeys, ...vectorArrayKeys];
        //const aux1 = new Set(simpleKeys);
        //const aux2 = Object.keys(gameInstance.oa).filter(x => !aux1.has(x));
        //console.log('Not handled keys:', aux2.join(', '));
        
        const oaSimpleValueKeys = findChildKeysInObject(gameInstance.oa, isSimple);
        const oaSimpleArrayKeys = findChildKeysInObject(gameInstance.oa, x => Array.isArray(x) && isSimple(x[0]));
        const oaVectorKeys = findChildKeysInObject(gameInstance.oa, isVector2);
        const oaVectorArrayKeys = findChildKeysInObject(gameInstance.oa, x => Array.isArray(x) && isVector2(x[0]));
        
        const settingsSimpleValueKeys = findChildKeysInObject(gameInstance.settings, isSimple);
        const settingsSimpleArrayKeys = findChildKeysInObject(gameInstance.settings, x => Array.isArray(x) && isSimple(x[0]));

        return {
            settings: typify('object')({
                ...(extractSubObject(gameInstance.settings, settingsSimpleValueKeys, serializeSimple)),
                ...(extractSubObject(gameInstance.settings, settingsSimpleArrayKeys, serializeSimple)),
            }),
            oa: typify('object')({
                ...(extractSubObject(gameInstance.oa, oaSimpleValueKeys, serializeSimple)),
                ...(extractSubObject(gameInstance.oa, oaSimpleArrayKeys, serializeSimple)),
                ...(extractSubObject(gameInstance.oa, oaVectorKeys, serializeVector)),
                ...(extractSubObject(gameInstance.oa, oaVectorArrayKeys, serializeVectorArray)),
            }),
            ticks: serializeSimple(gameInstance.ticks),
        };
    };

    function deserializeOnInstance(serializedData, gameInstance, outInstance) {
        const deserialize = x => transformObject(x, x => {
            if (x.type === 'object') return deserialize(x.data);
            if (x.type === 'simple_object') return JSON.parse(x.data);
            if (x.type === 'vector2') return new Vector2(x.data.x, x.data.y);
            if (x.type === 'vector2_array') return x.data.map(x => new Vector2(x.data.x, x.data.y));
            throw new Error('Unsupported deserialization!');
        });
        const data = deserialize(serializedData);

        for (const key in data) {
            if (key === 'settings' || key === gameInstanceKey1) {
                for (const subKey in gameInstance[key]) {
                    outInstance[key][subKey] = data[key][subKey] || gameInstance[key][subKey];
                }
            } else {
                outInstance[key] = data[key] || outInstance[key] || gameInstance[key];
            }
        }
    };

    function main() {
        console.log('[GSM] Starting...');
        
        const socket = io('ws://localhost:3000', { secure: false, transports: ['websocket'] });
        socket.on('connect', () => {
            console.log('[GSM] Connected to the server!');
        });
        socket.on('other', (serializedData) => {
            console.log('Other data received!');
            deserializeOnInstance(serializedData, gameInstance, otherInstance);
        });
        destroyFns.push(() => socket.close());

        const revertGameRenderPath = patchGameRender(); // TODO: Dynamically patch that method body

        const revertOnGameRenderDetour = detour(GameRenderer.prototype, 'render', function (...args) {
            const gameInstanceKey = findChildKeyInObject(this, x => x.ticks !== undefined && x.settings !== undefined && x.menu !== undefined);
            gameInstance = this[gameInstanceKey];
            gameInstanceKey1 = findChildKeyInObject(gameInstance, x => x.direction !== undefined && x.settings !== undefined);

            if (!initialized) {
                console.log('[GSM] Game render hook initization started successfully');
                init(gameInstance, this.settings, this.oa);
                initialized = true;
                console.log('[GSM] GameInstance:', gameInstance);
                const n = () => document.createElement('div');
                const c = () => document.createElement('canvas');
                const settings = new s_Vte(n());
                const menu = new s_2H(settings, n(), n(), c(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n());
                const header = new s_Nue(settings, n(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n());
                //Object.assign(otherInstance, {...gameInstance}, {oa: new s_fte(settings)});
                
                
                Object.assign(otherInstance, {...gameInstance}, {settings, menu, header}, {oa:{...gameInstance.oa}});
                console.log('[GSM] OtherInstance:', otherInstance);
            }

            if (lastDataSend === undefined || Date.now() - lastDataSend > 20) {
                const serializedData = serializeGameInstance(gameInstance);
                socket.emit('data', serializedData);
                lastDataSend = Date.now();
            }

            //console.log('serializedData', serializedData);
            //deserializeOnInstance(serializedData, gameInstance, otherInstance);
        });

        //const revertOnPlayerRenderDetour = detour(s_ate.prototype, 'render', function (...args) {});

        destroyFns.push(revertOnGameRenderDetour);
        //destroyFns.push(revertOnPlayerRenderDetour);
        destroyFns.push(revertGameRenderPath);
    }

    main();
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
        
        /*
        const socket = window.socket = io('ws://localhost:3000', { secure: false, transports: ['websocket'] });
        socket.on('connect', () => {
            console.log('connect');
        });
        */

        /*
        {
            settings: window.gameInstance.settings,
            oa: window.gameInstance.oa,
            ka: window.gameInstance.ka,
            wk: window.gameInstance.wk,
            La: window.gameInstance.La,
            Tg: window.gameInstance.Tg,
            Ma: {
                oa: window.gameInstance.Ma.oa,
            },
            ka: {
                ka: {
                    width: window.gameInstance.ka.ka.width,
                    height: window.gameInstance.ka.ka.height,
                },
                oa: window.gameInstance.ka.oa,
            },
            oa: {
                yn: {
                    x: window.gameInstance.oa.yn.x,
                    y: window.gameInstance.oa.yn.y,
                },
                Ga: window.gameInstance.oa.Ga,
                Xa: window.gameInstance.oa.Xa,
                La: window.gameInstance.oa.La,
                Da: window.gameInstance.oa.Da,
                ka: window.gameInstance.oa.ka,
                Sa: window.gameInstance.oa.Sa,
                he: window.gameInstance.oa.he,
                wa: window.gameInstance.oa.wa,
                Mc: {
                    x: window.gameInstance.oa.Mc.x,
                    y: window.gameInstance.oa.Mc.y,
                },
                kd: {
                    x: window.gameInstance.oa.kd.x,
                    y: window.gameInstance.oa.kd.y,
                },
                kb: {
                    x: window.gameInstance.oa.kb.x,
                    y: window.gameInstance.oa.kb.y,
                },
                Ra: window.gameInstance.oa.Ra,
                direction: window.gameInstance.oa.direction,
                Ma: window.gameInstance.oa.Ma,
                ka: window.gameInstance.oa.ka,
            }
        }
        */

        /*

        window.gameInstance = gte.ka; // Game instance, snake body positions, etc...

        window.otherData = {};
        window.otherRenderer = new s_ate(window.otherData, gte.settings, gte.oa);*/
    //};


















    /*
    s_ate.prototype.render = function(a, b, c) {
        var d = a,
            e = Math.pow(d, .2);
        this.ka.wk && (a = 3 === this.ka.oa.Ga ? 1 : 2 === this.ka.oa.Ga ? 1 - a : 1 === this.ka.oa.Ga ? 1 - Math.pow(a, .5) / 2 : .5);
        if ("NONE" === this.ka.oa.direction || this.ka.oa.Ma) a = 0;
        for (var f = new s_0g(this.ka.oa.ka[0].x * this.ka.ka.oa + this.ka.ka.oa / 2, this.ka.oa.ka[0].y * this.ka.ka.oa + this.ka.ka.oa / 2), g = this.ka.oa.ka.length - 1; 0 <= g; g--) {
            var k = (this.ka.oa.ka[g].x + this.ka.oa.ka[g].y) % 2,
                h = s_TH(this.settings, 3) && 0 < g && 0 === k,
                l = s_TH(this.settings, 13) && !s_TH(this.settings, 11) &&
                !this.ka.wk && 0 < g && g < this.ka.oa.Ra.length && 0 === this.ka.oa.Ra[g],
                m = h || l;
            this.oa.lineCap = g === this.ka.oa.ka.length - 1 || (1 >= this.ka.ticks || 0 < this.ka.oa.Ga) && g === this.ka.oa.ka.length - 2 || this.ka.wk && 0 === g || this.ka.wk && g === this.ka.oa.ka.length - 2 && this.ka.oa.ka[this.ka.oa.ka.length - 2].equals(this.ka.oa.ka[this.ka.oa.ka.length - 1]) || this.ka.wk && g === this.ka.oa.ka.length - 2 && s_TH(this.settings, 7) ? "round" : "butt";
            if (s_TH(this.settings, 3) || s_TH(this.settings, 11)) this.oa.lineCap = this.ka.wk && 0 === g ? "round" : "butt";
            if (0 ===
                g) {
                var n = this.ka.oa.ka[0].clone();
                "LEFT" === this.ka.oa.direction ? (--n.x, 0 > n.x && (n.x = this.ka.ka.ka.width - 1)) : "RIGHT" === this.ka.oa.direction ? (n.x += 1, n.x >= this.ka.ka.ka.width && (n.x = 0)) : "UP" === this.ka.oa.direction ? (--n.y, 0 > n.y && (n.y = this.ka.ka.ka.height - 1)) : "DOWN" === this.ka.oa.direction && (n.y += 1, n.y >= this.ka.ka.ka.height && (n.y = 0))
            } else n = this.ka.oa.ka[g - 1].clone();
            h = this.ka.oa.ka[g].clone();
            var p = g === this.ka.oa.ka.length - 1 ? this.ka.oa.kb.clone() : this.ka.oa.ka[g + 1].clone();
            var q = void 0;
            l = s_d(this.ka.Ma.oa);
            for (var r = l.next(); !r.done; r = l.next())
                if (r = r.value, h.equals(r.Ib) && (this.ka.wk || g >= r.fea)) {
                    q = r;
                    r.lOa ? n = h.clone() : p = h.clone();
                    break
                } l = h.clone();
            r = h.clone();
            l.x *= this.ka.ka.oa;
            l.y *= this.ka.ka.oa;
            r.x *= this.ka.ka.oa;
            r.y *= this.ka.ka.oa; - 1 === h.x - p.x || 1 < h.x - p.x ? (r.x += this.ka.ka.oa, r.y += this.ka.ka.oa / 2) : 1 === h.x - p.x || -1 > h.x - p.x ? r.y += this.ka.ka.oa / 2 : -1 === h.y - p.y || 1 < h.y - p.y ? (r.y += this.ka.ka.oa, r.x += this.ka.ka.oa / 2) : 1 === h.y - p.y || -1 > h.y - p.y ? r.x += this.ka.ka.oa / 2 : (r.x += this.ka.ka.oa / 2, r.y += this.ka.ka.oa / 2); - 1 ===
                h.x - n.x || 1 < h.x - n.x ? (l.x += this.ka.ka.oa, l.y += this.ka.ka.oa / 2) : 1 === h.x - n.x || -1 > h.x - n.x ? l.y += this.ka.ka.oa / 2 : -1 === h.y - n.y || 1 < h.y - n.y ? (l.y += this.ka.ka.oa, l.x += this.ka.ka.oa / 2) : 1 === h.y - n.y || -1 > h.y - n.y ? l.x += this.ka.ka.oa / 2 : (l.x += this.ka.ka.oa / 2, l.y += this.ka.ka.oa / 2);
            if (0 === g) {
                f = a;
                var t = !s_4H(this.settings) && (0 === this.ka.oa.ka[0].x && "LEFT" === this.ka.oa.direction || this.ka.oa.ka[0].x === this.ka.ka.ka.width - 1 && "RIGHT" === this.ka.oa.direction || 0 === this.ka.oa.ka[0].y && "UP" === this.ka.oa.direction || this.ka.oa.ka[0].y ===
                        this.ka.ka.ka.height - 1 && "DOWN" === this.ka.oa.direction),
                    u = this.ka.oa.ka[0].clone(),
                    v = this.ka.oa.ka[0].clone();
                switch (this.ka.oa.direction) {
                    case "RIGHT":
                        u.x += 1;
                        v.x += 2;
                        break;
                    case "LEFT":
                        --u.x;
                        v.x -= 2;
                        break;
                    case "DOWN":
                        u.y += 1;
                        v.y += 2;
                        break;
                    case "UP":
                        --u.y, v.y -= 2
                }
                s_TH(this.settings, 4) && (s_0H(this.ka.ka, u), s_0H(this.ka.ka, v));
                if (!s_TH(this.settings, 14)) {
                    if (s_TH(this.settings, 1) || s_TH(this.settings, 8) || s_TH(this.settings, 13)) {
                        var w = this.ka.Da.wa.get(s_MH(u));
                        t = t || this.ka.ka.f9(u) && void 0 !== w && !w.gM && w.Jh
                    }
                    s_TH(this.settings,
                        9) && this.ka.ka.f9(u) && this.ka.ka.f9(v) && 7 === this.ka.ka.wa[u.y][u.x] && s__H(this.ka.ka, v) && (t = !0);
                    s_TH(this.settings, 7) && (v = s_XH(this.ka.oa, 0), t = t || u.equals(v))
                }
                t && (f = Math.min(a, .5));
                l.x = l.x * f + r.x * (1 - f);
                l.y = l.y * f + r.y * (1 - f);
                this.ka.oa.direction === this.ka.oa.Da || b ? (this.ka.oa.Mc = l.clone(), this.ka.oa.he = a) : this.ka.wk || (f = (a - this.ka.oa.he) / (1 - this.ka.oa.he), l.x = l.x * f + this.ka.oa.Mc.x * (1 - f), l.y = l.y * f + this.ka.oa.Mc.y * (1 - f));
                f = l.clone()
            } else g === this.ka.oa.ka.length - 1 && (t = a, 0 < this.ka.oa.Sa && (t = 2 === this.ka.oa.ka.length ?
                .5 - a / 2 : 0), r.x = r.x * (1 - t) + l.x * t, r.y = r.y * (1 - t) + l.y * t);
            s_TH(this.settings, 5) && (g !== this.ka.oa.ka.length - 1 || this.ka.oa.Ma ? 0 === g && this.ka.oa.Ma && (s_4H(this.settings) || s_TH(this.settings, 2) || (l.x = this.ka.oa.kd.x * (1 - e) + l.x * e, l.y = this.ka.oa.kd.y * (1 - e) + l.y * e), f = l.clone()) : this.ka.oa.kd = r.clone());
            w = this.oa.createLinearGradient(l.x, l.y, r.x, r.y);
            0 === g ? (t = 0, u = a / (this.ka.oa.ka.length - 1)) : g === this.ka.oa.ka.length - 1 ? (t = a / (this.ka.oa.ka.length - 1) + (g - 1) / (this.ka.oa.ka.length - 1), u = 1) : (t = a / (this.ka.oa.ka.length - 1) + (g -
                1) / (this.ka.oa.ka.length - 1), u = a / (this.ka.oa.ka.length - 1) + g / (this.ka.oa.ka.length - 1));
            v = Math.max(0, g - 1 + a);
            w.addColorStop(0, s_3H(this.ka, t, v, d, !1));
            w.addColorStop(1, s_3H(this.ka, u, v + 1, d, !1));
            this.oa.strokeStyle = w;
            w = Math.min(1, (this.ka.oa.ka.length - 4) / 12);
            var x = g / this.ka.oa.ka.length * w;
            this.ka.oa.Ma && (x = x * d + (1 - g / this.ka.oa.ka.length) * w * (1 - d));
            w = .4 * this.ka.ka.oa;
            this.oa.lineWidth = .8 * this.ka.ka.oa * (1 - x) + w * x;
            if (s_TH(this.settings, 3))
                for (x = 0; x < this.ka.oa.La.length; x++)
                    if (4 > Math.abs(this.ka.oa.La[x].X6 - g)) {
                        x =
                            1 + (1 - 2 * Math.abs((4 - (g - this.ka.oa.La[x].X6) + a) / 8 - .5));
                        this.ka.wk && (x = 3 === this.ka.oa.Ga ? x * (.5 + (1 - d) / 2) : 2 === this.ka.oa.Ga ? (1 - d) / 2 * x : 1, x = Math.max(1, x));
                        x = 1 + (x - 1) * (this.ka.ka.oa / this.oa.lineWidth - 1);
                        x = 1 + (x - 1) * (1 - g / this.ka.oa.ka.length);
                        this.oa.lineWidth *= x;
                        break
                    } x = h.clone();
            var y = !m && !(s_TH(this.settings, 3) && 0 === g && 0 === k && !this.ka.wk);
            k = h.y - n.y + (h.y - p.y);
            k = 0 !== h.x - n.x + (h.x - p.x) && 0 !== k || this.ka.oa.Ma && 0 === g;
            m = s_TH(this.settings, 11) && !s_TH(this.settings, 3);
            if (y) {
                s_TH(this.settings, 11) && (y = (s_TH(this.settings,
                    3) ? .125 : .2) + (s_TH(this.settings, 7) || s_rse(this.settings) ? 0 : s_kse[this.settings.oa]), this.oa.globalAlpha = s_UH(this.ka, d, this.ka.oa.wa[g], y));
                this.oa.beginPath();
                this.oa.moveTo(l.x, l.y);
                if (k) {
                    h.x = h.x * this.ka.ka.oa + this.ka.ka.oa / 2;
                    h.y = h.y * this.ka.ka.oa + this.ka.ka.oa / 2;
                    if (g === this.ka.oa.ka.length - 1 && 0 === this.ka.oa.Sa) {
                        y = m && this.ka.oa.wa[g];
                        if (s_TH(this.settings, 3) || m) {
                            var z = new s_0g(h.x + (h.x - l.x), h.y + (h.y - l.y)),
                                A = Math.pow(a, y ? 1 : 1 / 3);
                            r.x = r.x * (1 - A) + z.x * A;
                            r.y = r.y * (1 - A) + z.y * A;
                            r.x = r.x * (1 - a) + l.x * a;
                            r.y = r.y *
                                (1 - a) + l.y * a
                        }
                        y = Math.pow(a, y ? 2 : 1);
                        h.x = h.x * (1 - y) + (l.x + r.x) / 2 * y;
                        h.y = h.y * (1 - y) + (l.y + r.y) / 2 * y
                    } else 0 === g && (y = this.ka.oa.Ma ? 1 - d : a, h.x = h.x * y + (l.x + r.x) / 2 * (1 - y), h.y = h.y * y + (l.y + r.y) / 2 * (1 - y));
                    this.oa.quadraticCurveTo(h.x, h.y, r.x, r.y)
                } else this.oa.lineTo(r.x, r.y);
                this.oa.stroke();
                A = 0;
                y = !1;
                z = "NONE" === this.ka.oa.direction && 0 === this.ka.Tg;
                if (m && g === this.ka.oa.ka.length - 1) {
                    this.oa.fillStyle = s_3H(this.ka, u - (z ? .35 : 0), g - (z ? 1 : 0), d, !1);
                    this.oa.beginPath();
                    if (!this.ka.oa.wa[g] || this.ka.La && !s_TH(this.settings, 2)) {
                        if (k) p =
                            x.x !== p.x ? x.x < p.x ? 3 * Math.PI / 2 : Math.PI / 2 : x.y < p.y ? 0 : Math.PI, n = p - (0 < this.ka.oa.Sa ? p : x.x !== n.x ? x.x < n.x ? 3 * Math.PI / 2 : Math.PI / 2 : x.y < n.y ? 0 : Math.PI), n > Math.PI ? n -= 2 * Math.PI : n < -Math.PI && (n += 2 * Math.PI), A = p + n * Math.pow(a, .36);
                        else if (q && q.lOa) switch (q.Yxa) {
                            default:
                            case "UP":
                                A = 0;
                                break;
                            case "RIGHT":
                                A = Math.PI / 2;
                                break;
                            case "DOWN":
                                A = Math.PI;
                                break;
                            case "LEFT":
                                A = 3 * Math.PI / 2
                        } else x.equals(n) ? (n = this.ka.oa.ka[g - 2].clone(), A = x.x !== n.x ? x.x < n.x ? Math.PI / 2 : 3 * Math.PI / 2 : x.y < n.y ? Math.PI : 0) : A = x.x !== n.x ? x.x < n.x ? Math.PI / 2 : 3 * Math.PI /
                            2 : x.y < n.y ? Math.PI : 0;
                        this.oa.arc(r.x, r.y, this.oa.lineWidth / 2, A, A + Math.PI)
                    } else this.oa.arc(r.x, r.y, this.oa.lineWidth / 2, 0, 2 * Math.PI), y = !0;
                    this.oa.fill()
                }
                s_TH(this.settings, 7) && (p = new s_0g(c.width - l.x, c.height - l.y), n = new s_0g(c.width - r.x, c.height - r.y), q = this.oa.createLinearGradient(p.x, p.y, n.x, n.y), q.addColorStop(0, s_3H(this.ka, t, v, d, !0)), q.addColorStop(1, s_3H(this.ka, u, v + 1, d, !0)), this.oa.strokeStyle = q, this.oa.beginPath(), this.oa.moveTo(p.x, p.y), k ? (p = new s_0g(c.width - h.x, c.height - h.y), this.oa.quadraticCurveTo(p.x,
                    p.y, n.x, n.y)) : this.oa.lineTo(n.x, n.y), this.oa.stroke(), m && g === this.ka.oa.ka.length - 1 && (this.oa.fillStyle = s_3H(this.ka, u - (z ? .35 : 0), g - (z ? 1 : 0), d, !0), this.oa.beginPath(), y ? this.oa.arc(n.x, n.y, this.oa.lineWidth / 2, 0, 2 * Math.PI) : (p = A + Math.PI, this.oa.arc(n.x, n.y, this.oa.lineWidth / 2, p, p + Math.PI)), this.oa.fill()))
            }
            n = this.settings;
            if (!(s_TH(n, 5) || s_TH(n, 2) || s_TH(n, 3) || s_TH(n, 11) || s_TH(n, 13)))
                for (n = 0; n < this.ka.oa.La.length; n++)
                    if (this.ka.oa.La[n].X6 === g) {
                        n = this.ka.oa.La[n];
                        p = s_3H(this.ka, t * a + u * (1 - a), v, this.ka.oa.Xa ?
                            d : 0, !1);
                        l = new s_0g(l.x * (1 - a) + r.x * a, l.y * (1 - a) + r.y * a);
                        k && (r = .5 * (1 - Math.abs(a - .5) / .5), l.x = l.x * (1 - r) + h.x * r, l.y = l.y * (1 - r) + h.y * r);
                        h = Math.max(0, .7 * (1 - (n.X6 + 2 * a) / (n.yac + 6)) * this.ka.ka.oa);
                        1 > n.X6 + 2 * a && (h *= n.X6 + 2 * a);
                        this.ka.wk && (h = 3 === this.ka.oa.Ga ? h * (.5 + (1 - d) / 2) : 2 === this.ka.oa.Ga ? (1 - d) / 2 * h : 0);
                        if (h < .75 * w) break;
                        n.D5a && (l.x = c.width - l.x, l.y = c.height - l.y, p = s_3H(this.ka, t * a + u * (1 - a), v, this.ka.oa.Xa ? d : 0, !0));
                        this.oa.fillStyle = p;
                        this.oa.beginPath();
                        this.oa.arc(l.x, l.y, h, 0, 2 * Math.PI);
                        this.oa.fill();
                        break
                    }
        }
        s_TH(this.settings,
            11) && (this.oa.globalAlpha = 1);
        s_TH(this.settings, 4) && (this.ka.oa.yn = f);
        s_TH(this.settings, 7) && s_bte(this, new s_0g(this.ka.ka.ka.width * this.ka.ka.oa - f.x, this.ka.ka.ka.height * this.ka.ka.oa - f.y), d, !1, !0);
        s_bte(this, f, d)
    }*/

    function patchGameRender() {
        const original = s_Ste.prototype.render;
        s_Ste.prototype.render = function(a, b) {
            this.ka.zk && this.ka.kb && (a = 0);
            this.oa.clearRect(0, 0, this.oa.canvas.width, this.oa.canvas.height);
            this.wa.clearRect(0, 0, this.wa.canvas.width, this.wa.canvas.height);
            this.context.fillStyle = s_WH(this.settings, this.settings.ka, 3);
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
            s_QH(this.settings, 4) && (this.oa.save(), this.oa.translate(2 * this.ka.ka.oa, 2 * this.ka.ka.oa), this.kb.render(a));
            

            this.Ga.render(a, b, s_Tte(this));
            try {
                if (otherRenderer && otherInstance) otherRenderer.render(a, b, s_Tte(this));
            } catch (exc) {
                console.error('Something went wrong on other render', exc);
            }

            
            b = s_d(this.ka.wa.ka);
            for (var c = b.next(); !c.done; c = b.next()) this.Sa.render(a, c.value);
            this.Bb.render(a);
            b = this.Da;
            c = a;
            for (var d = s_d(b.ka.Aa.oa), e = d.next(); !e.done; e = d.next()) {
                var f = b,
                    g = c;
                e = e.value;
                var k = e.Hb.clone();
                if (e.prev) {
                    var h = e.prev.clone();
                    k.x = k.x * g + h.x * (1 - g);
                    k.y = k.y * g + h.y * (1 - g)
                }
                k.x = k.x * f.ka.ka.oa + f.ka.ka.oa / 2;
                k.y = k.y * f.ka.ka.oa + f.ka.ka.oa / 2;
                h = f.ka.ka.oa * (e.lp && !f.ka.zk ? g : 1);
                s_QH(f.settings, 11) && (f.wa.globalAlpha = s_RH(f.ka, g, e.Jh, 0 === (e.Hb.x + e.Hb.y) % 2 ? .365 : .265));
                s_mte(f, e, h, k);
                if (s_QH(f.settings, 4) && null !== e.prev) {
                    g =
                        f.ka.ka.oa * f.ka.ka.ka.width;
                    var l = f.ka.ka.oa * f.ka.ka.ka.height;
                    0 === e.Hb.x && 0 > e.prev.x ? s_mte(f, e, h, new s_6g(k.x + g, k.y)) : e.Hb.x === f.ka.ka.ka.width - 1 && e.prev.x > f.ka.ka.ka.width - 1 && s_mte(f, e, h, new s_6g(k.x - g, k.y));
                    0 === e.Hb.y && 0 > e.prev.y ? s_mte(f, e, h, new s_6g(k.x, k.y + l)) : e.Hb.y === f.ka.ka.ka.height - 1 && e.prev.y > f.ka.ka.ka.height - 1 && s_mte(f, e, h, new s_6g(k.x, k.y - l))
                }
                f.wa.globalAlpha = 1
            }
            s_QH(this.settings, 4) || s_Ute(this);
            b = this.Ma;
            c = a;
            d = s_d(b.ka.Ga.oa);
            for (e = d.next(); !e.done; e = d.next()) f = b, k = c, g = e.value, e = new s_6g(g.Hb.x *
                f.ka.ka.oa, g.Hb.y * f.ka.ka.oa), s_QH(f.settings, 11) && (f.wa.globalAlpha = s_RH(f.ka, k, g.Jh, .3)), k = Math.min(f.Aa.wa - 1, Math.floor((g.ay + k) / 2 * f.Aa.wa)), g = f.ka.ka.oa / f.Aa.zd(), f.Aa.render(k, e, null, 0, g), f.wa.globalAlpha = 1;
            d = s_d(b.ka.Ga.Aa);
            for (e = d.next(); !e.done; e = d.next()) f = b, e = e.value, f.wa.globalAlpha = (e.ticks - c) / 3 * .8, f.wa.fillStyle = e.color, k = 3 * f.ka.ka.oa, f.wa.fillRect(e.Hb.x - k / 2, e.Hb.y - k / 2, k, k), f.wa.globalAlpha = 1;
            !s_QH(this.settings, 4) && s_QH(this.settings, 12) && s_Hte(this.Ma, a);
            !s_QH(this.settings, 4) && s_QH(this.settings,
                9) && s_pte(this.Da);
            s_QH(this.settings, 4) || this.kb.render(a);
            this.Oa.render(a);
            this.Xa.render(a);
            s_QH(this.settings, 13);
            b = this.Ga;
            c = s_Tte(this);
            0 < b.ka.oa.uc && (d = b.ka.ka.oa / 30, f = Math.floor((6 - b.ka.oa.uc + a) / 6 * b.Ga.wa) % b.Ga.wa, e = new s_6g(b.ka.oa.Bb.x * b.ka.ka.oa + b.ka.ka.oa / 2, b.ka.oa.Bb.y * b.ka.ka.oa + b.ka.ka.oa / 2), k = new s_6g(-b.Ga.zd(), -b.Ga.ud() / 2), b.Ga.render(f, e, k, b.ka.oa.Pb, d), s_QH(b.settings, 7) && b.Ga.render(f, new s_6g(c.width - e.x, c.height - e.y), k, b.ka.oa.Pb + Math.PI, d));
            this.Eb.render();
            f = e = 0;
            1 < this.ka.oa.Ga &&
                (e = 8 * Math.random() - 4, f = 8 * Math.random() - 4);
            if (s_QH(this.settings, 4)) {
                b = e;
                c = f;
                d = this.Qa;
                d.context.fillStyle = s_WH(d.settings, d.settings.ka, 0);
                d.context.fillRect(0, 0, d.context.canvas.width, d.context.canvas.height);
                d.context.fillStyle = s_WH(d.settings, d.settings.ka, 1);
                f = new s_6g(d.context.canvas.width / 2 % d.ka.ka.oa, d.context.canvas.height / 2 % d.ka.ka.oa);
                e = !1;
                0 !== a || d.ka.zk || "LEFT" !== d.ka.oa.direction && "UP" !== d.ka.oa.direction ? !d.ka.Eb || "RIGHT" !== d.ka.oa.direction && "DOWN" !== d.ka.oa.direction || (e = !0) : e = !0;
                k = new s_6g(d.ka.oa.Bn.x % d.ka.ka.oa, d.ka.oa.Bn.y % d.ka.ka.oa);
                for (g = -1; g < d.ka.ka.ka.width + 3; g++)
                    for (h = -1; h < d.ka.ka.ka.height + 3; h++) Math.abs((g + h) % 2) !== (d.ka.ka.Da + (e ? 1 : 0)) % 2 && d.context.fillRect(g * d.ka.ka.oa - k.x + f.x, h * d.ka.ka.oa - k.y + f.y, d.ka.ka.oa, d.ka.ka.oa);
                this.oa.restore();
                this.Aa.clearRect(0, 0, this.Aa.canvas.width, this.Aa.canvas.height);
                this.Aa.drawImage(this.oa.canvas, 0, 0);
                this.oa.clearRect(0, 0, this.oa.canvas.width, this.oa.canvas.height);
                d = Math.round(this.oa.canvas.width / 2 - this.ka.oa.Bn.x - 2 * this.ka.ka.oa);
                f = Math.round(this.oa.canvas.height / 2 - this.ka.oa.Bn.y - 2 * this.ka.ka.oa);
                e = 2 * this.ka.ka.oa;
                k = d >= -e;
                g = d <= e;
                h = f <= e;
                l = this.ka.ka.ka.width * this.ka.ka.oa;
                var m = this.ka.ka.ka.height * this.ka.ka.oa;
                f >= -e && (k && this.oa.drawImage(this.Aa.canvas, d - l, f - m), g && this.oa.drawImage(this.Aa.canvas, d + l, f - m), this.oa.drawImage(this.Aa.canvas, d, f - m));
                k && this.oa.drawImage(this.Aa.canvas, d - l, f);
                g && this.oa.drawImage(this.Aa.canvas, d + l, f);
                h && (k && this.oa.drawImage(this.Aa.canvas, d - l, f + m), g && this.oa.drawImage(this.Aa.canvas, d + l,
                    f + m), this.oa.drawImage(this.Aa.canvas, d, f + m));
                this.oa.drawImage(this.Aa.canvas, d, f);
                s_Ute(this);
                s_QH(this.settings, 9) && (this.wa.save(), this.wa.translate(d + 2 * this.ka.ka.oa, f + 2 * this.ka.ka.oa), s_pte(this.Da), this.wa.restore());
                s_QH(this.settings, 12) && (this.wa.save(), this.wa.translate(d + 2 * this.ka.ka.oa, f + 2 * this.ka.ka.oa), s_Hte(this.Ma, a), this.wa.restore());
                a = (this.oa.canvas.width - this.context.canvas.width) / 2;
                d = (this.oa.canvas.height - this.context.canvas.height) / 2;
                this.context.drawImage(this.wa.canvas,
                    b - a, c - d);
                this.context.drawImage(this.oa.canvas, b - a, c - d)
            } else {
                b = Math.round((this.context.canvas.width - this.Ba.canvas.width) / 2);
                c = Math.round((this.context.canvas.height - this.Ba.canvas.height) / 2);
                this.Ba.drawImage(this.La.canvas, e, f);
                this.Ba.drawImage(this.wa.canvas, e, f);
                this.Ba.drawImage(this.oa.canvas, e, f);
                if (s_QH(this.settings, 9))
                    for (d = this.Da, f = new s_6g(b + e, c + f), e = s_d(d.ka.Aa.oa), k = e.next(); !k.done; k = e.next())
                        if (k = k.value, g = null !== k.prev || d.ka.La ? a : 1, k.Jh && (0 === k.Hb.x ? s_nte(d, new s_6g(-1, k.Hb.y),
                                f, g) : k.Hb.x === d.ka.ka.ka.width - 1 && s_nte(d, new s_6g(d.ka.ka.ka.width, k.Hb.y), f, g), 0 === k.Hb.y ? s_nte(d, new s_6g(k.Hb.x, -1), f, g) : k.Hb.y === d.ka.ka.ka.height - 1 && s_nte(d, new s_6g(k.Hb.x, d.ka.ka.ka.height), f, g)), null !== k.prev || !k.Jh && d.ka.La) k = null !== k.prev ? k.prev : k.Hb, 0 === k.x ? s_nte(d, new s_6g(-1, k.y), f, 1 - a) : k.x === d.ka.ka.ka.width - 1 && s_nte(d, new s_6g(d.ka.ka.ka.width, k.y), f, 1 - a), 0 === k.y ? s_nte(d, new s_6g(k.x, -1), f, 1 - a) : k.y === d.ka.ka.ka.height - 1 && s_nte(d, new s_6g(k.x, d.ka.ka.ka.height), f, 1 - a);
                this.context.drawImage(this.Ba.canvas,
                    b, c)
            }
        };
        return () => s_Ste.prototype.render = original;
    }
}
