import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "@prisma/client";

export const refreshUserToken = (req: Request, res: Response) => {
  const { jwtCookie } = req.cookies;

  if (jwtCookie.expiry < Date.now() + 10 * 60) {
    const user = req.user as User;

    // Create JWT Token
    const token = jwt.sign(
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
      .cookie("jwt", token, { maxAge: 30 * 60 * 1000, httpOnly: true })
      .send("Refreshed token successfully");
  }
};
