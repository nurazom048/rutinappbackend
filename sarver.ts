// Import necessary modules
import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';

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
import { NoticeDB, maineDB, RoutineDB, NotificationDB } from './connection/mongodb.connection';

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server);

// Handle socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for chat messages from clients
  socket.on('chat message', (msg) => {
    console.log('Message received:', msg);
    // Broadcast the message to all connected clients
    io.emit('chat message', msg);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
