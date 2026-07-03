import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mars = await prisma.company.create({
    data: {
      id: "mars",
      name: "Mars",
      industry: "FMCG",
      website: "https://www.mars.com",

      people: {
        create: [
          {
            firstName: "Simon",
            lastName: "Watts",
            role: "Global Growth Centre",
          },
          {
            firstName: "Anna",
            lastName: "Tkacheva",
            role: "Global Insights",
          },
        ],
      },

      goals: {
        create: {
          title: "Secure next Virtual Research project",
          description:
            "Expand StoreLab's footprint within Mars through another research engagement.",
        },
      },

      events: {
        create: [
          {
            title: "Research opportunity identified",
            description:
              "Mars has an active opportunity around Virtual Research.",
            date: new Date("2026-07-01"),
            type: "note",
          },
          {
            title: "No recent follow-up",
            description:
              "No meaningful follow-up has occurred recently.",
            date: new Date("2026-07-03"),
            type: "note",
          },
        ],
      },
    },
  });

  console.log(`Seeded ${mars.name}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });