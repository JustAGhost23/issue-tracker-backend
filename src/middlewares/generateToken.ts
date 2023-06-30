import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "@prisma/client";

export default function generateUserToken(req: Request, res: Response) {
  const user = req.user as User;

  // Create JWT Token
  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.TOKEN_SECRET!,
    { expiresIn: "1d" }
  );

  // Sending cookie with the token
  res
    .status(200)
    .cookie("jwt", token, { maxAge: 24 * 3600000, httpOnly: true })
    .send(`Logged in successfully with token ${token}`);
}
