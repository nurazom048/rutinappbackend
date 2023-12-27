"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./Fetures/Account/routes/auth_route"));
const routine_routes_1 = __importDefault(require("./Fetures/Routines/routes/routine_routes"));
const class_route_1 = __importDefault(require("./Fetures/Routines/routes/class_route"));
const summary_route_1 = __importDefault(require("./Fetures/Routines/routes/summary_route"));
const account_route_1 = __importDefault(require("./Fetures/Account/routes/account_route"));
const notice_route_1 = __importDefault(require("./Fetures/Notice_Fetures/routes/notice_route"));
const notification_route_1 = __importDefault(require("./Fetures/Notification_Fetures/routes/notification.route"));
const app = (0, express_1.default)();
// Middleware
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
//****************************************************************************/
//
//...............................  Routes.....................................//
//
//****************************************************************************/
//   Account and auth 
app.use("/auth", auth_route_1.default);
app.use("/account", account_route_1.default);
// Routine 
app.use("/rutin", routine_routes_1.default);
app.use("/routine", routine_routes_1.default);
app.use("/class", class_route_1.default);
app.use("/summary", summary_route_1.default);
// NoticeBoard
app.use("/notice", notice_route_1.default);
// Notification
app.use("/notification", notification_route_1.default);
// Basic Routes
app.get("/", (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: "hi i am working" });
});
app.use((req, res) => {
    res.status(404).json({ message: 'Route Not Found' });
});
const port = process.env.PORT || 3000;
console.log("port");
console.log(port);
//mongodb connection
const mongodb_connection_1 = require("./connection/mongodb.connection");
// Use Promise.all to wait for both database connections to be established
Promise.all([mongodb_connection_1.maineDB, mongodb_connection_1.NoticeDB, mongodb_connection_1.RoutineDB, mongodb_connection_1.NotificationDB])
    .then(() => {
    app.listen(port, () => {
        console.log("****server started********"); // git ignore fixed
    });
})
    .catch((error) => {
    console.error('Error connecting to databases:' + port, error);
});
