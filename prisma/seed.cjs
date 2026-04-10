const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const name = "Admin";
  const username = "admin";
  const password = "admin123";
  const passwordHash = await hash(password, 10);
  const pickupHandleNames = ["Tamam", "Dimas", "Iqbal", "Tika", "Ratih", "Renata"];

  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
    },
    create: {
      name,
      username,
      passwordHash,
    },
  });

  for (const pickupHandleName of pickupHandleNames) {
    await prisma.pickupHandle.upsert({
      where: { name: pickupHandleName },
      update: {},
      create: { name: pickupHandleName },
    });
  }

  console.log("Default user seeded: admin");
  console.log(`Pickup handles seeded: ${pickupHandleNames.join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
