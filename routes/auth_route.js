
const express = require('express')
const app = express()
const verifyToken = require("../varifitoken")
const auth = require("../controllers/auth_controllers")     

// 1
app.post("/create",auth.createAccount);
app.post("/login",auth.login);
app.delete("/delete/:id", verifyToken ,auth.deleteAccount);

    




module.exports = app;       