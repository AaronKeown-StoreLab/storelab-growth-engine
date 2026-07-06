import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mars = await prisma.business.upsert({
    where: { id: "business_mars" },
    update: {},
    create: {
      id: "business_mars",
      name: "Mars",
      industry: "FMCG",
      country: "Global",
      status: "active",
      summary:
        "Long-term StoreLab relationship connected to the Mars Growth Centre, virtual retail, research and storytelling opportunities.",
    },
  });

  const simon = await prisma.person.upsert({
    where: { id: "person_simon_watts" },
    update: {},
    create: {
      id: "person_simon_watts",
      firstName: "Simon",
      lastName: "Watts",
      notes: "Long-term StoreLab relationship connected to the Mars Growth Centre.",
    },
  });

  const anna = await prisma.person.upsert({
    where: { id: "person_anna_tkacheva" },
    update: {},
    create: {
      id: "person_anna_tkacheva",
      firstName: "Anna",
      lastName: "Tkacheva",
      notes: "Mars contact connected to research methodology discussions.",
    },
  });

  await prisma.employment.upsert({
    where: { id: "employment_simon_mars" },
    update: {},
    create: {
      id: "employment_simon_mars",
      personId: simon.id,
      businessId: mars.id,
      jobTitle: "Global Growth Centre",
      isCurrent: true,
    },
  });

  await prisma.employment.upsert({
    where: { id: "employment_anna_mars" },
    update: {},
    create: {
      id: "employment_anna_mars",
      personId: anna.id,
      businessId: mars.id,
      jobTitle: "Global Insights",
      isCurrent: true,
    },
  });

  await prisma.opportunity.upsert({
    where: { id: "opportunity_mars_growth_centre" },
    update: {},
    create: {
      id: "opportunity_mars_growth_centre",
      businessId: mars.id,
      title: "Growth Centre and Research",
      status: "open",
      nextAction: "Arrange catch-up regarding Growth Centre and Research.",
      summary:
        "Mars has an active opportunity around Virtual Research and Growth Centre planning.",
    },
  });

  await prisma.timelineEvent.create({
    data: {
      businessId: mars.id,
      personId: simon.id,
      eventType: "relationship_note",
      summary:
        "StoreLab has a long-term relationship with Simon connected to the Mars Growth Centre.",
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