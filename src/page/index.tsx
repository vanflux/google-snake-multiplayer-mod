import { io } from "socket.io-client";
import { detour, extractSubObject, findChildKeyInObject, findChildKeysInObject, findClassByMethod, transformObject } from "./utils";

export async function pageLoadedEntry() {
    if (window.destroy) window.destroy();
    const destroyFns: (()=>any)[] = [];
    window.destroy = () => {
        console.log('[GSM] Destroying...');
        destroyFns.forEach(fn => fn());
    };

    const Vector2 = findClassByMethod('clone', 0, x => x.includes('(this.x,this.y)'));
    const GameRenderer = findClassByMethod('render', 2, x => x.includes('this.context.fillRect(0,0,this.context.canvas.width,this.context.canvas.height);'));
    const PlayerRenderer = findClassByMethod('render', 3, x => x.includes('RIGHT') && x.includes('DOWN'));
    const Settings = findClassByMethod('toString', 0, x => x.includes('v=10,color='));
    const Menu = findClassByMethod('update', 0, x => x.includes('this.isVisible()') && x.includes('settings'));
    const Header = findClassByMethod(/.*/, 1, x => x.includes('images/icons/material'));

    let initialized = false;
    let gameInstance: any;
    let gameInstanceCtxKey: string;
    let otherInstance: any = {};
    let otherRenderer: any;
    let lastDataSend = 0;

    // Variables used to know WHEN render other players without code patching
    // Google made something to serve a different code for groups of users and sometimes it randomly changes too :p (why? can you collaborate with me???)
    let canRenderOtherPlayers = false;

    function serializeGameInstance(gameInstance: any, renderPart: number) {
        const isSimple = (x: any) => typeof x === 'boolean' || typeof x === 'number' || typeof x === 'string' || x.constructor.name === 'Object';
        const isVector2 = (x: any) => x instanceof Vector2;

        const typify = (type: string) => (data: any) => ({type, data});
        const serializeSimple = (x: any) => typify('simple_object')(JSON.stringify(x));
        const serializeVector = (x: any) => typify('vector2')({x: x.x, y: x.y});
        const serializeVectorArray = (x: any) => typify('vector2_array')(x.map(serializeVector));
        
        //const simpleKeys = [...simpleValueKeys, ...simpleArrayKeys, ...vectorKeys, ...vectorArrayKeys];
        //const aux1 = new Set(simpleKeys);
        //const aux2 = Object.keys(gameInstance[gameInstanceKey1]).filter(x => !aux1.has(x));
        //console.log('Not handled keys:', aux2.join(', '));
        
        const childSimpleValueKeys = findChildKeysInObject(gameInstance, isSimple); // FIXME: "zk" variable (false when live, true when death) -> snake flickering
        const childSimpleArrayKeys = findChildKeysInObject(gameInstance, x => Array.isArray(x) && isSimple(x[0]));

        const oaSimpleValueKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], isSimple);
        const oaSimpleArrayKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], x => Array.isArray(x) && isSimple(x[0]));
        const oaVectorKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], isVector2);
        const oaVectorArrayKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], x => Array.isArray(x) && isVector2(x[0]));
        
        const settingsSimpleValueKeys = findChildKeysInObject(gameInstance.settings, isSimple);
        const settingsSimpleArrayKeys = findChildKeysInObject(gameInstance.settings, x => Array.isArray(x) && isSimple(x[0]));
        
        return {
            ...(extractSubObject(gameInstance, childSimpleValueKeys, serializeSimple)),
            ...(extractSubObject(gameInstance, childSimpleArrayKeys, serializeSimple)),
            settings: typify('object')({
                ...(extractSubObject(gameInstance.settings, settingsSimpleValueKeys, serializeSimple)),
                ...(extractSubObject(gameInstance.settings, settingsSimpleArrayKeys, serializeSimple)),
            }),
            [gameInstanceCtxKey]: typify('object')({
                ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaSimpleValueKeys, serializeSimple)),
                ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaSimpleArrayKeys, serializeSimple)),
                ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaVectorKeys, serializeVector)),
                ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaVectorArrayKeys, serializeVectorArray)),
            }),
            renderPart: serializeSimple(renderPart),
        };
    };

    function deserializeOnInstance(serializedData: any, gameInstance: any, outInstance: any) {
        const deserialize = (x: any): any => transformObject(x, x => {
            if (x.type === 'object') return deserialize(x.data);
            if (x.type === 'simple_object') return JSON.parse(x.data);
            if (x.type === 'vector2') return new Vector2(x.data.x, x.data.y);
            if (x.type === 'vector2_array') return x.data.map((x: any) => new Vector2(x.data.x, x.data.y));
            throw new Error('Unsupported deserialization!');
        });
        const data = deserialize(serializedData);

        for (const key in data) {
            if (typeof outInstance[key] === 'object') {
                for (const subKey in gameInstance[key]) {
                    outInstance[key][subKey] = data[key][subKey] ?? outInstance[key][subKey] ?? gameInstance[key][subKey];
                }
            } else {
                outInstance[key] = data[key] ?? outInstance[key];
            }
        }
    };

    // For testing purposes
    function runInLoop() {
        const mapping: any = {
            NONE: 'RIGHT',
            RIGHT: 'DOWN',
            DOWN: 'LEFT',
            LEFT: 'UP',
            UP: 'RIGHT',
        };
        const id = setInterval(() => {
            if ((window as any).dontLoop) return;
            gameInstance[gameInstanceCtxKey].direction = mapping[gameInstance[gameInstanceCtxKey].direction];
            [...document.querySelectorAll('div > h2')].find(x => x.textContent === 'Play')?.parentElement?.click();
        }, Math.random() * 50 + 500);
        return () => clearInterval(id);
    }

    function main() {
        console.log('[GSM] Starting...');
        
        const socket = io('ws://localhost:3512', { secure: false, transports: ['websocket'] });
        socket.on('connect', () => {
            console.log('[GSM] Connected to the server!');
        });
        socket.on('other', (serializedData) => {
            deserializeOnInstance(serializedData, gameInstance, otherInstance);
        });
        destroyFns.push(() => socket.close());

        const revertOnGameRenderDetour = detour(GameRenderer.prototype, 'render', function (renderPart) {
            canRenderOtherPlayers = true;
            
            const gameInstanceKey = findChildKeyInObject(this, x => x.ticks !== undefined && x.settings !== undefined && x.menu !== undefined);
            gameInstance = this[gameInstanceKey];
            gameInstanceCtxKey = findChildKeyInObject(gameInstance, x => x.direction !== undefined && x.settings !== undefined);

            if (!initialized) {
                console.log('[GSM] Game render hook initization started successfully');
                initialized = true;
                console.log('[GSM] GameInstance:', gameInstance);
                destroyFns.push(runInLoop());
                otherRenderer = new PlayerRenderer(otherInstance, this.settings, this[gameInstanceCtxKey]);
                const n = () => document.createElement('div');
                const c = () => document.createElement('canvas');
                const settings = new Settings(n());
                const menu = new Menu(settings, n(), n(), c(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n());
                const header = new Header(settings, n(), n(), n(), n(), n(), n(), n(), n(), n(), n(), n());
                
                const aux = {
                    ...gameInstance,
                    settings,
                    menu,
                    header,
                    [gameInstanceCtxKey]: document.createElement('canvas').getContext('2d'),
                };
                Object.assign(otherInstance, aux);
                console.log('[GSM] OtherInstance:', otherInstance);
            }

            if (lastDataSend === undefined || Date.now() - lastDataSend > 25) {
                const serializedData = serializeGameInstance(gameInstance, renderPart);
                socket.emit('data', serializedData);
                lastDataSend = Date.now();
            }
        });

        const revertOnPlayerRenderDetour = detour(PlayerRenderer.prototype, 'render', function (a, b, c) {
            if (canRenderOtherPlayers) {
                canRenderOtherPlayers = false;
                
                try {
                    if (otherRenderer && otherInstance) otherRenderer.render(otherInstance.renderPart, b, c);
                } catch (exc) {
                    console.error('Something went wrong on other render', exc);
                }
            }
        });

        destroyFns.push(revertOnGameRenderDetour);
        destroyFns.push(revertOnPlayerRenderDetour);
    }

    main();
}
