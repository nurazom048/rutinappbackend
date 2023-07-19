import express from 'express';
import verifyToken from "../controllers/Auth/helper/varifitoken";
import { createAccount, loginAccount, } from "../controllers/Auth/auth_controllers";
import { allPendingAccount, acceptPending } from "../controllers/Auth/pending_account.controller";
import { continueWithGoogle } from "../controllers/Auth/google_auth.controller";

const app = express();

// 1
app.post("/create", createAccount);
app.post("/login", loginAccount);
//app.delete("/delete/:id", verifyToken, deleteAccount);

// continued with goglet
app.post("/google", continueWithGoogle);

// pending 
app.get("/pending", allPendingAccount);
app.get("/pending/:id", acceptPending);
//app.delete("/pending/:id", rejectPending);

export default app;
