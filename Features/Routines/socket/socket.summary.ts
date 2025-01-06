import { io } from "../../../sarver";

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room
    socket.on('join room', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    // Leave a room
    socket.on('leave room', (room) => {
        socket.leave(room);
        console.log(`User left room: ${room}`);
    });


    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });




    //*****************************************************************************/
    //--------------------------Socket IO chat ------------------------------------/
    //*****************************************************************************/
    //



    io.on('chat message', (data) => {
        const { message, room, classId, imageLinks, checkedType } = data;
        const { id } = (socket as any).socket;

        console.log(`Message received in room ${room}: ${message} ${(io as any).user["id"]}`)



        // Broadcast the message to the specific room
        io.to(room).emit('chat message', {
            socketMessage: 'Message save to db',
            message: "Message received",
            room: 'chat',
            classId,
            imageLinks,
            checkedType,
        });
    });

});












