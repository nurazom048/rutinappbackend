
import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import auth_route from './Fetures/Account/routes/auth_route';
import routine_route from './Fetures/Routines/routes/routine_routes';
import class_route from './Fetures/Routines/routes/class_route';
import summary from './Fetures/Routines/routes/summary_route';
import account from './Fetures/Account/routes/account_route';
import notice from './Fetures/Notice_Fetures/routes/notice_route';
import notification from './Fetures/Notification_Fetures/routes/notification.route';

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
//   Account and auth 
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

const port = process.env.PORT || 3000;
console.log("port")
console.log(port)


//mongodb connection
import { NoticeDB, maineDB, RoutineDB, NotificationDB } from './connection/mongodb.connection'

// Use Promise.all to wait for both database connections to be established
Promise.all([maineDB, NoticeDB, RoutineDB, NotificationDB])
  .then(() => {
    app.listen(port, () => {
      console.log("****server started********"); // git ignore fixed
    });
  })
  .catch((error) => {
    console.error('Error connecting to databases:' + port, error);
  });