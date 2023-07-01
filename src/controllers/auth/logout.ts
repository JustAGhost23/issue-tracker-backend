import { RequestHandler, Request, Response, NextFunction } from "express";

/**
 @route POST /api/auth/logout
 @type RequestHandler
 */

export const logout: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Clear JWT Token
  res
    .status(200)
    .clearCookie("jwt")
    .send({ message: "Logged out successfully" });
};
