
const express = require('express')
const app = express()
const rutin = require('../controllers/rutin_controllers');
const verifyToken = require("../varifitoken")
const auth = require("../controllers/auth_controllers")


app.post("/create",auth.createAccount);
app.post("/login",auth.login);







module.exports = app;