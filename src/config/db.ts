import { PrismaClient } from "@prisma/client";
/**
 * This is the code that connects to the database.
 */

const prisma: PrismaClient = new PrismaClient({
  log: ["query", "warn", "error"],
});

export { prisma };
