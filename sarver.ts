import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
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
const mongodbUri_Test = process.env.MONGODB_URI_TEST_PROJECT || '';
const mongodbUri_Production = process.env.MONGODB_URI_PRODUCTION_PROJECT || '';

// Connect to the test project
mongoose.connect(mongodbUri_Test)
  .then(() => console.log('Connected!'))
  .catch((err) => console.error('Error connecting to MongoDB Test:', err));



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

app.listen(port, () => {
  console.log("****server started********");
});
