import { User } from "@prisma/client";
import { prisma } from "../config/db.js";
import { Request, Response } from "express";

export const getCurrentUser = async (req: Request, res: Response) => {
  // Check if user is valid
  const reqUser = req.user as User;
  if (!reqUser) {
    return res.status(400).send({ error: "Invalid user sent in request" });
  }
  // Check if user exists
  const user = await prisma.user.findFirst({
    where: {
      id: reqUser.id,
    },
  });
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }
};
