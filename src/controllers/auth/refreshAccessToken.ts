import jwt from "jsonwebtoken";
import { Request, Response, RequestHandler } from "express";
import { User } from "@prisma/client";
import { redisClient } from "../../config/db.js";

/**
 @route POST /api/auth/refresh
 @type RequestHandler
 */

export const refreshAccessToken: RequestHandler = async (
  req: Request,
  res: Response
) => {
  // Check if Refresh token is valid
  const valid = await redisClient.get(`blacklist_${req.cookies["refresh"]}`);
  if (valid) {
    return res.status(401).send({ error: "Unauthorized" });
  }

  const user = req.user as User;

  // Create JWT Token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.TOKEN_SECRET!,
    { expiresIn: "30m" }
  );

  // Sending cookie with the token
  res
    .status(200)
    .clearCookie("jwt")
    .cookie("jwt", accessToken, { maxAge: 30 * 60 * 1000, httpOnly: true })
    .send("Refreshed access token successfully");
};
