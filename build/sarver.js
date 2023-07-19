"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const notification_controller_1 = require("./controllers/notification/notification.controller");
const oneSignalNotification_controller_1 = require("./controllers/notification/oneSignalNotification.controller");
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./routes/auth_route"));
const routine_routes_1 = __importDefault(require("./routes/routine_routes"));
const class_route_1 = __importDefault(require("./routes/class_route"));
const summary_route_1 = __importDefault(require("./routes/summary_route"));
const account_route_1 = __importDefault(require("./routes/account_route"));
const notice_route_1 = __importDefault(require("./routes/notice_route"));
const notice_route_2 = __importDefault(require("./routes/notice_route"));
const app = (0, express_1.default)();
// Middleware
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// Connection
mongoose_1.default.connect('mongodb+srv://nurapp:rr1234@cluster0.wwfxxwu.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('Connected!'));
// Routes
app.use("/auth", auth_route_1.default);
app.use("/rutin", routine_routes_1.default);
app.use("/class", class_route_1.default);
app.use("/summary", summary_route_1.default);
app.use("/account", account_route_1.default);
app.use("/notice", notice_route_1.default);
app.use("/notification", notice_route_2.default);
// Multer setup
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
});
app.post("/notification", upload.single('image'), notification_controller_1.createNotification);
app.patch("/notification/:notificationId", notification_controller_1.deleteNotification);
app.get("/notification/", notification_controller_1.getAllNotifications);
app.get("/oneSignal", oneSignalNotification_controller_1.onesignal);
app.get("/", (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: "hi i am working" });
});
app.use((req, res) => {
    res.status(404).json({ message: 'Route Not Found' });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("****server started********");
});
