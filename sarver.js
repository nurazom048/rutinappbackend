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
const cors = require("cors");
require('dotenv').config();



app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());


//..... Connection....//
// mongoose.connect("mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/")
//   .then(() => console.log('Connected!'));



// ------- Routes ------------------------//

app.use("/auth", auth_route); //.. auth_route
app.use("/rutin", rutin_route);//.. rutin_route
app.use("/class", class_route);//.. class_route
app.use("/summary", summary);//.. class_route
app.use("/account", account);//.. acount_route
app.use("/notice", notice);//.. notice_route

app.get("/", (req, res) => {

  console.log(req.body)
  res.status(200).json({ message: "hi i am working" });
});



app.listen(3000, function () {



  console.log(" ****server started ********");
});



