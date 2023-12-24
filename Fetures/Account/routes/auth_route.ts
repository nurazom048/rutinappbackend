import express from 'express';
import { verifyToken } from "../../../services/Authantication/helper/varifitoken";
import { createAccount, loginAccount } from '../../../services/Authantication/controllers/auth_controllers';
import { allPendingAccount, acceptPending } from "../../../services/Authantication/controllers/pending_account.controller";
import { continueWithGoogle } from '../../../services/Authantication/controllers/google_auth.controller';

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
