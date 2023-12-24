import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const generateAuthToken = (userId: Types.ObjectId, username: string): string => {
  const token = jwt.sign({ id: userId.toString(), username: username }, process.env.JWT_SECRET_KEY!, { expiresIn: '1d' });
  return token;
};

export const generateRefreshToken = (userId: Types.ObjectId, username: string): string => {
  const token = jwt.sign({ id: userId.toString(), username: username }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '2d' });
  return token;
};
