"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controllers_1 = require("../../../services/Authentication/controllers/auth_controllers");
const pending_account_controller_1 = require("../../../services/Authentication/controllers/pending_account.controller");
const google_auth_controller_1 = require("../../../services/Authentication/controllers/google_auth.controller");
const account_middleware_1 = __importDefault(require("../middleware/account.middleware"));
const app = (0, express_1.default)();
// 1
app.post("/create", account_middleware_1.default, auth_controllers_1.createAccount);
app.post("/login", auth_controllers_1.loginAccount);
//app.delete("/delete/:id", verifyToken, deleteAccount);
// continued with goglet
app.post("/google", google_auth_controller_1.continueWithGoogle);
// pending 
app.get("/pending", pending_account_controller_1.allPendingAccount);
app.get("/pending/:id", pending_account_controller_1.acceptPending);
//app.delete("/pending/:id", rejectPending);
exports.default = app;
