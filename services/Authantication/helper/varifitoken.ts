import jwt, { Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { generateAuthToken, generateRefreshToken, isTokenExpired } from './Jwt.helper';
import dotenv from 'dotenv';
dotenv.config();

// Middleware to verify and refresh tokens
export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
  // console.log('verifyToken', req.headers);
  try {
    // Extract the token from the Authorization header
    const tokenArray = req.headers.authorization.split(' ');
    const token = tokenArray[tokenArray.length - 1];

    // Check if the token is expired
    const isAuthTokenExpired: boolean = isTokenExpired(token, process.env.JWT_SECRET_KEY as Secret);

    if (isAuthTokenExpired) {
      // Token has expired

      // Verify the refresh token
      const refreshToken = req.headers['x-refresh-token'];
      const isRefreshTokenExpired: boolean = isTokenExpired(refreshToken, process.env.REFRESH_TOKEN_SECRET as Secret);
      console.log('isRefreshTokenExpired', isRefreshTokenExpired);

      if (isRefreshTokenExpired) {
        // Refresh token has also expired
        return res.status(401).json({ message: 'Token has expired. Please log in again.' });
      }

      // Generate new auth and refresh tokens
      const refreshDecoded = jwt.verify(refreshToken as string, process.env.REFRESH_TOKEN_SECRET as Secret) as any;
      console.log("refreshDecoded:", refreshDecoded);
      const newAuthToken = generateAuthToken(refreshDecoded.id, refreshDecoded.username);
      const newRefreshToken = generateRefreshToken(refreshDecoded.id, refreshDecoded.username);

      console.log("newAuthToken:", newAuthToken);

      // Set the new tokens in the response headers
      res.setHeader('Authorization', `Bearer ${newAuthToken}`);
      res.setHeader('x-refresh-token', newRefreshToken);

      // Decode the new auth token and set it to the user
      const newAuthTokenDecoded = jwt.verify(newAuthToken as string, process.env.JWT_SECRET_KEY as Secret) as any;
      console.log("newAuthTokenDecoded:", newAuthTokenDecoded);
      req.user = newAuthTokenDecoded;
      next();
    } else {
      // Token is still valid
      const decoded = jwt.verify(token as string, process.env.JWT_SECRET_KEY as Secret) as any;
      req.user = decoded;
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
  }
};
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


