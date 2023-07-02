
const express = require('express')
const app = express()
const verifyToken = require("../varifitoken")
const auth = require("../controllers/auth_controllers")
const { allPendingAccount, acceptPending, } = require("../controllers/Auth/pending_account.controller")

// 1
app.post("/create", auth.createAccount);
app.post("/login", auth.loginAccount);
app.delete("/delete/:id", verifyToken, auth.deleteAccount);

// pending 
app.get("/pending", allPendingAccount);
app.get("/pending/:id", acceptPending);
app.delete("/pending/:id", auth.rejectPending);




module.exports = app;       