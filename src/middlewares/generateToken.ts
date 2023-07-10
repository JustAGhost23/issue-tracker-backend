import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "@prisma/client";

export const generateUserToken = (req: Request, res: Response) => {
  const user = req.user as User;

  // Create JWT Token
  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.TOKEN_SECRET!,
    { expiresIn: "12h" }
  );

  // Sending cookie with the token
  res
    .status(200)
    .cookie("jwt", token, { maxAge: 12 * 60 * 60 * 1000, httpOnly: true })
    .send(`Logged in successfully with token ${token}`);
}
