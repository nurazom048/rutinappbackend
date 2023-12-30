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
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Jwt_helper_1 = require("./Jwt.helper");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('verifyToken', req.headers);
    try {
        const tokenArray = req.headers.authorization.split(' ');
        const token = tokenArray[tokenArray.length - 1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        // Check if the token is expired
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            // Token has expired
            // Verify the refresh token
            const refreshToken = req.headers['x-refresh-token'];
            const refreshDecoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            if (refreshDecoded.exp < Math.floor(Date.now() / 1000)) {
                // Refresh token has also expired
                return res.status(401).json({ message: 'Token has expired Please login again.' });
            }
            // Generate new token
            const newToken = (0, Jwt_helper_1.generateAuthToken)(refreshDecoded.userId, refreshDecoded.username);
            // Set the new token in the response header
            res.setHeader('Authorization', `Bearer ${newToken}`);
        }
        next();
    }
    catch (error) {
        console.log(error);
        return res.status(401).json({ message: 'Auth failed Please login again.' });
    }
});
exports.verifyToken = verifyToken;
