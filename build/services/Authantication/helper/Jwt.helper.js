"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAuthToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
