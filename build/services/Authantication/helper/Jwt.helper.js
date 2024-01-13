"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenExpired = exports.generateRefreshToken = exports.generateAuthToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../../../utils/utils");
const generateAuthToken = (userId, username) => {
    const token = jsonwebtoken_1.default.sign({ id: userId.toString(), username: username }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
    return token;
};
exports.generateAuthToken = generateAuthToken;
const generateRefreshToken = (userId, username) => {
    const token = jsonwebtoken_1.default.sign({ id: userId.toString(), username: username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '2d' });
    return token;
};
exports.generateRefreshToken = generateRefreshToken;
// ************ Token Expire check Method */
const isTokenExpired = (token, envSecret) => {
    try {
        jsonwebtoken_1.default.verify(token, envSecret);
        return false; // Token is not expired
    }
    catch (err) {
        (0, utils_1.printD)("error on isTokenExpired " + err);
        if (err.name === 'TokenExpiredError') {
            return true; // Token has expired
        }
        else {
            throw false;
        }
    }
};
exports.isTokenExpired = isTokenExpired;
