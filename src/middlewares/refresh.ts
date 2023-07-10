import jwt from "jsonwebtoken";
import { Request, response } from "express";
import { User } from "@prisma/client";

export const refreshUserToken = (req: Request, res = response) => {
  const refreshCookie = req.cookies["refresh"];

  const decodedToken = jwt.verify(
    refreshCookie,
    process.env.REFRESH_TOKEN_SECRET!
  );
  const user = decodedToken as User;

  // Create JWT Token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.TOKEN_SECRET!,
    { expiresIn: "5s" }
  );

  // Sending cookie with the token
  res
    .status(200)
    .cookie("jwt", accessToken, { maxAge: 5 * 1000, httpOnly: true })
    .send("Refreshed access token successfully");
};
