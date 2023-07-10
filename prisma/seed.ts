import { PrismaClient, Provider, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPasswordOne = await bcrypt.hash(process.env.ADMIN_PASSWORD_ONE!, salt);
  const hashedPasswordTwo = await bcrypt.hash(process.env.ADMIN_PASSWORD_TWO!, salt);


  const AdminOne = await prisma.user.upsert({
    where: { email: "adminone@issuetracker.com" },
    update: {},
    create: {
      username: "adminone",
      email: "adminone@issuetracker.com",
      name: "Admin One",
      password: hashedPasswordOne,
      provider: [Provider.LOCAL],
      role: Role.ADMIN,
    },
  });
  const AdminTwo = await prisma.user.upsert({
    where: { email: "admintwo@issuetracker.com" },
    update: {},
    create: {
      username: "admintwo",
      email: "admintwo@issuetracker.com",
      name: "Admin Two",
      password: hashedPasswordTwo,
      provider: [Provider.LOCAL],
      role: Role.ADMIN,
    },
  });
  console.log({ AdminOne, AdminTwo });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
