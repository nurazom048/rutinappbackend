import jwt, { Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { generateAuthToken, generateRefreshToken } from './Jwt.helper';
import dotenv from 'dotenv';
dotenv.config();

export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tokenArray = req.headers.authorization.split(' ');
    const token = tokenArray[tokenArray.length - 1];
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET_KEY as Secret) as any;

    req.user = decoded;

    // Check if the token is expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      // Token has expired

      // Verify the refresh token
      const refreshToken = req.headers['x-refresh-token'];
      const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as Secret) as any;
      if (refreshDecoded.exp < Math.floor(Date.now() / 1000)) {
        // Refresh token has also expired
        return res.status(401).json({ message: 'Token has expired Please login again.' });
      }

      // Generate new token
      const newToken = generateAuthToken(refreshDecoded.userId, refreshDecoded.username);
      // Set the new token in the response header
      res.setHeader('Authorization', `Bearer ${newToken}`);
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Auth failed Please login again.' });
  }
};


