import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";
/**
 * This is the code that connects to the database.
 */

const redisClient = createClient();

redisClient.on("error", function (err) {
  console.log(
    "Main Client: Could not establish a connection with redis. " + err
  );
});
redisClient.on("connect", function (err) {
  console.log("Main Client: Connected to redis successfully");
});
redisClient.connect();

const prisma: PrismaClient = new PrismaClient({
  log: ["query", "warn", "error"],
});

export { prisma, redisClient };
