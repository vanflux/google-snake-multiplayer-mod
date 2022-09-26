import { Server } from "socket.io";

const port = 8443;

export const server = new Server({
    transports: ['websocket'],
    cors: { origin: '*' },
    pingInterval: 2000,
});

server.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let lastPingSent = Date.now();

    [...server.sockets.sockets.values()].map(s => s.id).filter(id => socket.id !== id).forEach(id => socket.emit('other_connect', {id}));
    socket.broadcast.emit('other_connect', {id: socket.id});

    socket.on('snake_data', (data) => {
        socket.broadcast.emit('other_snake_data', {id: socket.id, data});
    });
    
    socket.on('collectables_data', (data) => {
        socket.broadcast.emit('other_collectables_data', {id: socket.id, data});
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('other_disconnect', {id: socket.id});
        console.log('Client disconnected:', socket.id);
    });

    socket.conn.on('packet', (packet) => {
        if (packet.type === 'pong') {
            const latency = Date.now() - lastPingSent;
            socket.emit('latency', {latency});
            socket.broadcast.emit('other_latency', {id: socket.id, latency});
        }
    });
      
    socket.conn.on('packetCreate', (packet) => {
        if (packet.type === 'ping') lastPingSent = Date.now();
    });
});

server.listen(port);
console.log(`Server listening at ${port}`);

