










// io.on('connection', (socket) => {
//     console.log('A user connected:', socket.id);
//     // summary chat
//     socket.on('summary chat', (room) => {
//         console.log(`user sen summary to : ${room}`);
//     });

//     // Join a room
//     socket.on('join room', (room) => {
//         socket.join(room);
//         console.log(`User joined room on server: ${room}`);
//     });

//     // Leave a room
//     socket.on('leave room', (room) => {
//         socket.leave(room);
//         console.log(`User left room: ${room}`);
//     });


//     // Handle disconnection
//     socket.on('disconnect', () => {
//         console.log('User disconnected:', socket.id);
//     });
//     // chats

//     socket.on('chat message', (data) => {
//         const { message, room } = data;

//         console.log(`Message received in room ${room}: ${message}`);

//         // Broadcast the message to the specific room
//         io.to(room).emit('chat message', {
//             socketMessage: 'Message save to db',
//             message: "Message received",
//             room: 'chat',
//         });
//     });

// });












