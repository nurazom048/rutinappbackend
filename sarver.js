const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const rutin_route = require('./routes/rutin_routes');
const auth_route = require('./routes/auth_route');
const class_route = require('./routes/class_route');




//..... Connection
mongoose.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected!'));
app.use(bodyParser.json());








// ------- Routes ------------------------//

app.use("/auth",auth_route); //.. auth_route
app.use("/rutin",rutin_route );//.. rutin_route
app.use("/class",class_route);//.. class_route







app.listen(3000, function(){
  console.log(" ****server started ********");
});