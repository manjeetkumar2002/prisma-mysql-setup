
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");


const prisma = new PrismaClient();

async function main() {
  // INSERT
  const user = await prisma.user.create({
    data: {
      name: "Manjeet",
      email: "manjeet@example.com",
      age: 22,
    },
  });

  console.log("Inserted:", user);

  // SELECT
  const users = await prisma.user.findMany();
  console.log("All users:", users);

  // UPDATE
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { age: 23 },
  });

  console.log("Updated:", updated);

  // DELETE - optional
  // await prisma.user.delete({
  //   where: { id: user.id },
  // });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
