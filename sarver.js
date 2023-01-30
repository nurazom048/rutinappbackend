const express = require('express')
const app = express()
const mongoose = require('mongoose');





mongoose.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected!'));






  app.get("/",(req, res)=> {
    res.send("hey")
  })



  app.listen(3000, function(){
    console.log(" ****server started ********");
});