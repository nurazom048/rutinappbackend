import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';
import { createNotification, deleteNotification, getAllNotifications } from './controllers/notification/notification.controller';
import { onesignal } from './controllers/notification/oneSignalNotification.controller';
import cors from 'cors';
import auth_route from './routes/auth_route';
import routine_route from './routes/routine_routes';
import class_route from './routes/class_route';
import summary from './routes/summary_route';
import account from './routes/account_route';
import notice from './routes/notice_route';
import notification from './routes/notice_route';

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Connection
mongoose.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected!'));

// Routes
app.use("/auth", auth_route);
app.use("/rutin", routine_route);
app.use("/class", class_route);
app.use("/summary", summary);
app.use("/account", account);
app.use("/notice", notice);
app.use("/notification", notification);

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
});

app.post("/notification", upload.single('image'), createNotification);
app.patch("/notification/:notificationId", deleteNotification);
app.get("/notification/", getAllNotifications);

app.get("/oneSignal", onesignal);

app.get("/", (req: Request, res: Response) => {
  console.log(req.body);
  res.status(200).json({ message: "hi i am working" });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route Not Found' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("****server started********");
});
