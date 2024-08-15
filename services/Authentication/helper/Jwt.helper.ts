import { Types } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import jwt, { Secret } from 'jsonwebtoken';
import { printD } from '../../../utils/utils';


export const generateAuthToken = (userId: Types.ObjectId, username: string): string => {
  const token = jwt.sign({ id: userId.toString(), username: username }, process.env.JWT_SECRET_KEY!, { expiresIn: '1d' });
  return token;
};

export const generateRefreshToken = (userId: Types.ObjectId, username: string): string => {
  const token = jwt.sign({ id: userId.toString(), username: username }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '2d' });
  return token;
};

// ************ Token Expire check Method */
export const isTokenExpired = (token: any, envSecret: Secret) => {
  try {
    jwt.verify(token as string, envSecret);
    return false; // Token is not expired
  } catch (err: any) {
    printD("error on isTokenExpired " + err);
    if (err.name === 'TokenExpiredError') {
      return true; // Token has expired
    } else {
      throw false;
    }
  }
};
