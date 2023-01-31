const express = require('express')
const app = express()
const Account = require('../models/Account')
const Routine = require('../models/rutin_models')
const Class = require('../models/class_model');
var jwt = require('jsonwebtoken');










// login 
exports.login = async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body.password);
    try {
      // Find user by username
      const user = await Account.findOne({ username });
   
      console.log(user.password);
      if (!user) return res.status(400).json({ message: "user not found" });
  
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
  }
  




//..... creat 

exports.createAccount = async (req, res)=> {
    const { name, username, password } = req.body
   
   
   
    try {


      const existingUser = await Account.findOne({ username });
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
   



  
  }