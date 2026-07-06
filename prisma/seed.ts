import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingMars = await prisma.business.findFirst({
    where: {
      name: "Mars",
    },
  });

  if (existingMars) {
    console.log("Mars already exists");
    return;
  }

  await prisma.business.create({
    data: {
      name: "Mars",
      industry: "FMCG",
      country: "Global",
      status: "active",
      summary:
        "Long-term StoreLab relationship connected to the Mars Growth Centre, research, virtual retail and storytelling opportunities.",
      opportunities: {
        create: [
          {
            title: "Growth Centre and Research",
            status: "open",
            nextAction:
              "Arrange catch-up regarding Growth Centre and Research.",
            summary:
              "Mars has an active opportunity around Virtual Research and Growth Centre planning.",
          },
        ],
      },
    },
  });

  console.log("Seed complete");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });