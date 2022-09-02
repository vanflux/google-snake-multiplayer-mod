import { Server } from "socket.io";

export const server = new Server({
    transports: ['websocket'],
    cors: { origin: '*' },
    
});

server.on('connection', (socket) => {
    socket.on('data', (data) => {
        console.log('Repassing...', Math.random());
        socket.broadcast.emit('other', data);
    });
});

server.listen(3000);

