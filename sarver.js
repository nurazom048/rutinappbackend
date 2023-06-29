require('dotenv').config();

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const rutin_route = require('./routes/rutin_routes');
const auth_route = require('./routes/auth_route');
const class_route = require('./routes/class_route');
const summary = require('./routes/summary_route');
const account = require('./routes/account_route');
const notice = require('./routes/notice_route');
const notification = require('./routes/notice_route');
const cors = require("cors");

//mid
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//..... Connection....//
mongoose.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected!'));


// ------- Routes ------------------------//

app.use("/auth", auth_route); //.. auth_route
app.use("/rutin", rutin_route);//.. rutin_route
app.use("/class", class_route);//.. class_route
app.use("/summary", summary);//.. class_route
app.use("/account", account);//.. acount_route
app.use("/notice", notice);//.. notice_route
app.use("/notification", notification);//.. notice_route




const multer = require('multer');


// Set up multer with the storage
const upload = multer({
  storage: multer.memoryStorage(),
  // limits: {
  //   fileSize: 5 * 1024 * 1024 // 5 MB limit
  // }
});
const { createNotification, deleteNotification, getAllNotifications } = require('./controllers/notification/notification.controller');

app.post("/notification", upload.single('image'), createNotification);
app.patch("/notification/:notificationId", deleteNotification);
app.get("/notification/", getAllNotifications);


app.get("/", (req, res) => {

  console.log(req.body)
  res.status(200).json({ message: "hi i am working" });
});


app.get("/", (req, res) => {

  console.log(req.body)
  res.status(200).json({ message: "hi i am working" });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route Not Found' });
});



const port = process.env.PORT || 3000

app.listen(port, function () {
  console.log(" ****server started ********");
});