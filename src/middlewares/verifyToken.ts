import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/db.js";
import jwt from "jsonwebtoken";

module.exports = async function (req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const token = header.split(" ");
    // if no token found, return response (without going to the next middleware)
    if (token[0] !== "Bearer")
      return res.status(401).send({ error: "Invalid authorization header." });
    if (!token[1])
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });
    const inDenyList = await redisClient.get(`bl_${token[1]}`);
    if (inDenyList) {
      return res.status(401).send({
        message: "Token blacklisted",
      });
    }

    try {
      const decodedToken = jwt.verify(token[1], process.env.TOKEN_SECRET!);
      req.user = decodedToken;
      next();
    } catch (err) {
      res.status(401).send({ error: "Invalid token" });
    }
  } else {
    res.status(403).json({ error: "Forbidden" });
  }
};
