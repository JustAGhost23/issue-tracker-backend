import { RequestHandler, Request, Response, NextFunction } from "express";
import { blacklistToken } from "../../middlewares/blacklistToken.js";

/**
 @route POST /api/auth/logout
 @type RequestHandler
 */
export const logout: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Blacklist JWT Token to deny further requests
  const blacklisted = await blacklistToken(req, next);
  if (blacklisted instanceof Error) {
    return res.status(401).send({ error: blacklisted.message });
  }

  // Clear JWT Token
  res
    .status(200)
    .clearCookie("jwt")
    .send({ message: "Logged out successfully" });
};
