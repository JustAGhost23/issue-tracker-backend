import { RequestHandler, Request, Response } from "express";
import { redisClient } from "../../config/db.js";

/**
 @route POST /api/auth/logout
 @type RequestHandler
 */
export const logout: RequestHandler = async (req: Request, res: Response) => {
  // Clear JWT Token
  try {
    await redisClient.set(
      `blacklist_${req.cookies["refresh"]}`,
      req.cookies["refresh"],
      {
        EX: 7 * 24 * 60 * 60,
      }
    );

    res
      .status(200)
      .clearCookie("jwt")
      .clearCookie("refresh")
      .send({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).send({
      error: "Something went wrong while logging out",
    });
  }
};
