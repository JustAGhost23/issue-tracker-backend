import { RequestHandler, Request, Response } from "express";

/**
 @route POST /api/auth/logout
 @type RequestHandler
 */
export const logout: RequestHandler = async (req: Request, res: Response) => {
  // Clear JWT Token
  res
    .status(200)
    .clearCookie("jwt")
    .clearCookie("refresh")
    .send({ message: "Logged out successfully" });
};
