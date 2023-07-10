import { User } from "@prisma/client";
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
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    return Error("User not found");
  }
  return user;
};
