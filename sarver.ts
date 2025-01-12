import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import jwt, { Secret } from 'jsonwebtoken';

// Import routes
import auth_route from './Features/Account/routes/Features';
import routine_route from './Features/Routines/routes/Features';
import class_route from './Features/Routines/routes/class_route';
import summary from './Features/Routines/routes/summary_route';
import account from './Features/Account/routes/account_route';
import notice from './Features/Notice_Features/routes/notice_route';
import notification from './Features/Notification_Features/routes/notification.route';

// Initialize the Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//****************************************************************************/
//
//...............................  Routes.....................................//
//
//****************************************************************************/
// Account and auth 
app.use("/auth", auth_route);
app.use("/account", account);

// Routine 
app.use("/rutin", routine_route);
app.use("/routine", routine_route);
app.use("/routine", routine_route);
app.use("/class", class_route);
app.use("/summary", summary);

// NoticeBoard
app.use("/notice", notice);

// Notification
app.use("/notification", notification);

// Basic Routes
app.get("/", (req: Request, res: Response) => {
  console.log(req.body);
  res.status(200).json({ message: "hi i am working" });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route Not Found' });
});

// Port
const port = 4000;

// MongoDB connection
import { NoticeDB, maineDB, RoutineDB, NotificationDB } from './prisma/mongodb.connection';
import { isTokenExpired } from './services/Authentication/helper/Jwt.helper';

// Create HTTP server
const server = http.createServer(app);
// Initialize socket.io
const io = new Server(server);



// Middleware to authenticate socket connection
io.use((socket, next) => {
  try {
    // Log the headers to inspect the structure
    console.log('Socket handshake headers:', socket.handshake.headers);

    // Access the Authorization header directly from the headers object
    const authHeader = socket.handshake.headers['authorization']; // This should be 'Bearer token'

    if (!authHeader) {
      console.log('Authorization token missing.');
      return next(new Error('Authentication error: Token missing.'));
    }

    // Split the 'Bearer token' string to extract the token
    const tokenArray = authHeader.split(' ') ?? [];
    const token = tokenArray[tokenArray.length - 1]; // Get the token part

    if (!token) {
      console.log('Authorization token missing.');
      return next(new Error('Authentication error: Token missing.'));
    }

    // Verify if the token is expired
    const isAuthTokenExpired = isTokenExpired(token, process.env.JWT_SECRET_KEY as Secret);

    if (isAuthTokenExpired) {
      console.log('Authorization token has expired.');
      return next(new Error('Authentication error: Token expired.'));
    }

    // Decode the token to get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as Secret); // Verify and decode the JWT token

    console.log('Authenticated user:', decoded);

    // Attach the decoded user to the socket for future use in events
    (socket as any).user = decoded;

    return next(); // Proceed to the connection handler if the token is valid
  } catch (error) {
    console.log('Error during token validation:', error);
    return next(new Error('Authentication error: Token verification failed.'));
  }
});
// Handle socket.io connections
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
  // chats 


  socket.on('chat message', (data) => {
    const { message, room } = data;

    console.log(`Message received in room ${room}: ${message}`);

    // Broadcast the message to the specific room
    io.to(room).emit('chat message', {
      socketMessage: 'Message save to db',
      message: "Message received",
      room: 'chat',
    });
  });
});

// Use Promise.all to wait for database connections to be established
Promise.all([maineDB, NoticeDB, RoutineDB, NotificationDB])
  .then(() => {
    server.listen(port, () => {
      console.log("****Server started**** on port " + port);
    });
  })
  .catch((error) => {
    console.error('Error connecting to databases:', error);
  });
