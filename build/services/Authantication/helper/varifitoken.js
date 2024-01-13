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
// Middleware to verify and refresh tokens
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('verifyToken', req.headers);
    try {
        // Extract the token from the Authorization header
        const tokenArray = req.headers.authorization.split(' ');
        const token = tokenArray[tokenArray.length - 1];
        // Check if the token is expired
        const isAuthTokenExpired = (0, Jwt_helper_1.isTokenExpired)(token, process.env.JWT_SECRET_KEY);
        if (isAuthTokenExpired) {
            // Token has expired
            // Verify the refresh token
            const refreshToken = req.headers['x-refresh-token'];
            const isRefreshTokenExpired = (0, Jwt_helper_1.isTokenExpired)(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log('isRefreshTokenExpired', isRefreshTokenExpired);
            if (isRefreshTokenExpired) {
                // Refresh token has also expired
                return res.status(401).json({ message: 'Token has expired. Please log in again.' });
            }
            // Generate new auth and refresh tokens
            const refreshDecoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log("refreshDecoded:", refreshDecoded);
            const newAuthToken = (0, Jwt_helper_1.generateAuthToken)(refreshDecoded.id, refreshDecoded.username);
            const newRefreshToken = (0, Jwt_helper_1.generateRefreshToken)(refreshDecoded.id, refreshDecoded.username);
            console.log("newAuthToken:", newAuthToken);
            // Set the new tokens in the response headers
            res.setHeader('Authorization', `Bearer ${newAuthToken}`);
            res.setHeader('x-refresh-token', newRefreshToken);
            // Decode the new auth token and set it to the user
            const newAuthTokenDecoded = jsonwebtoken_1.default.verify(newAuthToken, process.env.JWT_SECRET_KEY);
            console.log("newAuthTokenDecoded:", newAuthTokenDecoded);
            req.user = newAuthTokenDecoded;
            next();
        }
        else {
            // Token is still valid
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
            req.user = decoded;
            next();
        }
    }
    catch (error) {
        console.log(error);
        return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
    }
});
exports.verifyToken = verifyToken;
// export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
//   console.log('verifyToken', req.headers);
//   try {
//     const tokenArray = req.headers.authorization.split(' ');
//     const token = tokenArray[tokenArray.length - 1];
//     // Check if the token is expired
//     const isAuthTokenExpire: Boolean = isTokenExpired(token, process.env.JWT_SECRET_KEY as Secret);
//     if (isAuthTokenExpire) { // Token has expired
//       // Verify the refresh token
//       const refreshToken = req.headers['x-refresh-token'];
//       const isRefreshTokenExpire: Boolean = isTokenExpired(refreshToken, process.env.REFRESH_TOKEN_SECRET as Secret);
//       console.log('isRefreshTokenExpire expired' + isRefreshTokenExpire);
//       if (isRefreshTokenExpire) {
//         // Refresh token has also expired
//         return res.status(401).json({ message: 'Token has expired Please login again.' });
//       }
//       //
//       // Generate new token
//       const refreshDecoded = jwt.verify(refreshToken as string, process.env.REFRESH_TOKEN_SECRET as Secret) as any;
//       console.log("refreshDecoded: " + refreshDecoded + refreshDecoded.id);
//       const newAuthToken = generateAuthToken(refreshDecoded.id, refreshDecoded.username);
//       const newRefreshToken = generateRefreshToken(refreshDecoded.id, refreshDecoded.username);
//       console.log("newToken" + newAuthToken);
//       // Set the new token in the response header
//       // Create a new auth token and refresh token
//       // Set the tokens in the any headers
//       res.setHeader('Authorization', `Bearer ${newAuthToken}`);
//       res.setHeader('x-refresh-token', newRefreshToken);
//       // decode new auth token and set it to user
//       const newAuthTokenDecoded = jwt.verify(newAuthToken as string, process.env.JWT_SECRET_KEY as Secret) as any;
//       console.log("newTokenSet" + newAuthTokenDecoded);
//       req.user = newAuthToken
//       next();
//     } else {
//       const decoded = jwt.verify(token as string, process.env.JWT_SECRET_KEY as Secret) as any;
//       req.user = decoded;
//       next();
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(401).json({ message: 'Auth failed Please login again.' });
//   }
// };
