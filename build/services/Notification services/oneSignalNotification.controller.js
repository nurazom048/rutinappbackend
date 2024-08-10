"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationMethods = exports.onesignal = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
// ************ One Signal ***************//
const onesignal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const { tokenIdList, contents, heading } = req.body;
    try {
        const response = yield sendNotification(tokenIdList, contents, heading);
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ error: 'Something went wrong', message: error.message });
    }
});
exports.onesignal = onesignal;
function sendNotification(tokenIdList, contents, heading) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiUrl = 'https://onesignal.com/api/v1/notifications';
        const appId = 'db13122e-448d-4418-9df0-b83989eef9ab'; // Replace with your OneSignal App ID
        const apiKey = 'MzQ2YWQ3OGUtYWU5OC00Y2MzLWEyM2EtNjEyNjE2ODZkYmJl'; // Replace with your OneSignal API Key
        const data = {
            app_id: appId,
            include_player_ids: tokenIdList,
            android_accent_color: 'FF9976D2',
            small_icon: 'ic_stat_onesignal_default',
            headings: { en: heading },
            contents: { en: contents },
        };
        const config = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                Authorization: `Basic ${apiKey}`,
                'Content-Type': 'application/json' // Updated
            },
            body: JSON.stringify(data)
        };
        try {
            const response = yield (0, node_fetch_1.default)(apiUrl, config);
            const jsonResponse = yield response.json();
            return jsonResponse;
        }
        catch (error) {
            throw new Error(`Error sending notification: ${error.message}`);
        }
    });
}
// // Call the function to send the notification
// sendNotification(["5f018a24-8cba-408d-9a2a-27a63f8c7b26"], "Notification content", "Notification heading")
//     .then(json => console.log(json))
//     .catch(err => console.error('error:' + err));
//******* Export*****/
const sendNotificationMethods = (tokenIdList, contents, heading) => __awaiter(void 0, void 0, void 0, function* () {
    const apiUrl = 'https://onesignal.com/api/v1/notifications';
    const appId = 'db13122e-448d-4418-9df0-b83989eef9ab'; // Replace with your OneSignal App ID
    const apiKey = 'MzQ2YWQ3OGUtYWU5OC00Y2MzLWEyM2EtNjEyNjE2ODZkYmJl'; // Replace with your OneSignal API Key
    const data = {
        app_id: appId,
        include_player_ids: tokenIdList,
        android_accent_color: 'FF9976D2',
        small_icon: 'ic_stat_onesignal_default',
        headings: { en: heading },
        contents: { en: contents },
    };
    const config = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    try {
        const response = yield (0, node_fetch_1.default)(apiUrl, config);
        const jsonResponse = yield response.json();
        return jsonResponse;
    }
    catch (error) {
        throw new Error(`Error sending notification: ${error.message}`);
    }
});
exports.sendNotificationMethods = sendNotificationMethods;
