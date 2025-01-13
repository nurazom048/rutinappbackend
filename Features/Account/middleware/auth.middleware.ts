import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AccountType } from "@prisma/client";
interface DecodedToken {

    user_id: string;
    name: string;
    picture: string;
    iss: string;
    aud: string;
    auth_time: number;
    sub: string;
    iat: number;
    exp: number;
    email: string;
    email_verified: boolean;
    firebase: {
        identities: { [provider: string]: any[]; email: any[] };
        sign_in_provider: string;
    };
}

export const verifyGoogleAuthToken = (req: Request, res: Response, next: NextFunction) => {
    const { googleAuthToken } = req.body;

    if (!googleAuthToken) {
        return res.status(400).json({ message: "Google Auth Token is required." });
    }

    try {
        const decodedToken = jwt.decode(googleAuthToken) as DecodedToken;

        if (!decodedToken) {
            return res.status(401).json({ message: "Invalid Google Auth Token." });
        }


        req.body.decodedToken = decodedToken;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Error decoding Google Auth Token.", error });
    }
};
