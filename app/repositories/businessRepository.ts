import { prisma } from "../lib/prisma";

export async function getBusinesses() {
  return prisma.business.findMany({
    orderBy: {
      name: "asc",
    },

    include: {
      employments: {
        include: {
          person: true,
        },
      },

      opportunities: true,
      inboxItems: true,
    },
  });
}