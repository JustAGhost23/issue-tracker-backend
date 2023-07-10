import { Request, Response, NextFunction } from "express";
import { User, Role } from "@prisma/client";
import { prisma } from "../config/db.js";

export const getCurrentUser = async (reqUser: User | null) => {
  if (!reqUser) {
    throw Error();
  }
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: {
      id: reqUser.id,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      provider: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    return Error("User not found");
  }
  return user;
};

export const authorize =
  (...permittedRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const reqUser = req.user as User;
    const user = await getCurrentUser(reqUser);
    if (user instanceof Error) {
      return res.status(400).send({ error: "Invalid user" });
    }
    if (user.role && permittedRoles.includes(user.role)) {
      next();
    } else {
      return res
        .status(403)
        .send({ error: "You are not authorised to access this resource" });
    }
  };
