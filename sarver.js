const express = require('express')
const app = express()
const bodyParser = require('body-parser')
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Account = require('./models/Account')

//..... Connection
mongoose.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected!'));

app.use(bodyParser.json())
















// login 

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find user by username
      const user = await Account.find({ username });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });
  
      // Compare passwords
     
      if (password != user.password) return res.status(400).json({ message: "Invalid credentials" });
  
      // Create a JWT token
      const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1d" });
  
      // Send response with token
      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error logging in" });
    }
  });
  








//..... creat 

  app.post("/creat",async (req, res)=> {
    const { name, username, password } = req.body
    const existingUser = await Account.findOne({ username });
   
   
    try {
      if (existingUser) return res.status(400).json({ message: "Username already exists" });
  
      // Create a new account
      const account = new Account({ name, username, password });
      const created = await account.save();
      // Send response
      res.status(200).json({ message: "Account created successfully", created });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating account" });
    }
   



  
  })



  app.listen(3000, function(){
    console.log(" ****server started ********");
});