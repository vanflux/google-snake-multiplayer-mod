import { Server } from "socket.io";

const port = 3512;

export const server = new Server({
    transports: ['websocket'],
    cors: { origin: '*' },
    
});

server.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    [...server.sockets.sockets.values()].map(s => s.id).filter(id => socket.id !== id).forEach(id => socket.emit('other_connect', {id}));
    socket.broadcast.emit('other_connect', {id: socket.id});

    socket.on('data', (data) => {
        socket.broadcast.emit('other_data', {id: socket.id, data});
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('other_disconnect', {id: socket.id});
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(port);
console.log(`Server listening at ${port}`);

