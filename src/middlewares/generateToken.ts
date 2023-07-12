import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "@prisma/client";
import { redisClient } from "../config/db.js";

export const generateAccessToken = (user: User) => {
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
  if (!accessToken) {
    throw Error("Something went wrong while generating access token");
  }

  // Sending token
  return accessToken;
};

export const generateRefreshToken = (user: User) => {
  // Create JWT Token
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );
  if (!refreshToken) {
    throw Error("Something went wrong while generating refresh token");
  }

  // Sending token
  return refreshToken;
};

export const generateTokens = async (req: Request, res: Response) => {
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
  if (!accessToken) {
    throw Error("Something went wrong while generating access token");
  }

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );
  if (!refreshToken) {
    throw Error("Something went wrong while generating refresh token");
  }
  
  // Sending cookie with the token
  res
    .status(200)
    .cookie("jwt", accessToken, {
      maxAge: 30 * 60 * 1000,
      httpOnly: true,
    })
    .cookie("refresh", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    })
    .send("Logged in successfully");
};
