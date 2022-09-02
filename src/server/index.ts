import { Server } from "socket.io";

export const server = new Server({
    transports: ['websocket'],
    cors: { origin: '*' },
    
});

server.on('connection', (socket) => {
    console.log('Client connected!');
    socket.on('data', (data) => {
        //console.log('Repassing...', Math.random());
        socket.broadcast.emit('other', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected!');
    });
});

server.listen(3000);

