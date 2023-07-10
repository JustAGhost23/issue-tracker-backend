import { Request, NextFunction } from "express";
import { redisClient } from "../config/db.js";

export const blacklistToken = async (req: Request, next: NextFunction) => {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const token = header.split(" ");
    if (token[0] !== "Bearer") return Error("Invalid authorization header.");
    if (!token[1]) return Error("Access denied. No token provided");
    const inDenyList = await redisClient.get(`bl_${token[1]}`);
    if (inDenyList) {
      return Error("Token already blacklisted");
    }

    try {
      const token_key = `bl_${token[1]}`;
      await redisClient.set(token_key, token[1], {
        EX: 12 * 60 * 60,
      });
      next();
    } catch (err) {
      return Error("Invalid token");
    }
  } else {
    return Error("Forbidden");
  }
};
