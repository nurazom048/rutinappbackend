
const express = require('express')
const app = express()
const verifyToken = require("../varifitoken")
const auth = require("../controllers/auth_controllers")
const account = require("../controllers/Account/controllers")



// 1
app.post("/login", auth.login);
app.post("/login/phone", auth.login);

//
app.delete("/delete/:id", account.deleteAccount);
app.post("/create", account.createAccount);







module.exports = app;       