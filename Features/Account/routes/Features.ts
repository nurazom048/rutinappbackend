import express from 'express';
import { createAccount, loginAccount } from '../../../services/Authentication/controllers/auth_controllers';
import { allPendingAccount, acceptPending } from "../../../services/Authentication/controllers/pending_account.controller";
import { continueWithGoogle } from '../../../services/Authentication/controllers/google_auth.controller';
import { validateAccountCreation } from '../middleware/account.middleware';

const app = express();

// 1
app.post("/create",
    validateAccountCreation,
    createAccount,
);
app.post("/login", loginAccount);
//app.delete("/delete/:id", verifyToken, deleteAccount);

// continued with goglet
app.post("/google", continueWithGoogle);

// pending 
app.get("/pending", allPendingAccount);
app.get("/pending/:id", acceptPending);
//app.delete("/pending/:id", rejectPending);

export default app;
