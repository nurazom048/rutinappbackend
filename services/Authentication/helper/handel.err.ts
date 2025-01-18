import express, { Request, Response } from 'express';



export const handleLoginError = (error: any, res: Response) => {
    console.error("Login error:", error);

    if (error.code === "auth/wrong-password") {
        return res.status(400).json({ message: "Wrong password" });
    }

    if (error.code === "auth/invalid-email") {
        return res.status(400).json({ message: "Invalid email" });
    }

    return res.status(500).json({ message: `Error logging in: ${error.message}` });
};