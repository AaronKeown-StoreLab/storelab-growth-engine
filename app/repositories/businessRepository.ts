import { prisma } from "../lib/prisma";

export async function getBusinesses() {
  return prisma.business.findMany({
    where: {
      status: {
        not: "archived",
      },
    },
    orderBy: {
      name: "asc",
    },
    include: {
      employments: {
        where: {
          isCurrent: true,
        },
        include: {
          person: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      opportunities: {
        orderBy: {
          createdAt: "desc",
        },
      },
      inboxItems: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notebookEntries: {
        orderBy: {
          createdAt: "desc",
        },
      },
      timeline: {
        orderBy: {
          occurredAt: "desc",
        },
      },
    },
  });
}

export async function addNotebookEntryToBusiness(
  businessId: string,
  content: string
) {
  const note = await prisma.notebookEntry.create({
    data: {
      businessId,
      content,
    },
  });

  await prisma.timelineEvent.create({
    data: {
      businessId,
      eventType: "notebook_entry",
      summary: content.length > 160 ? `${content.slice(0, 160)}...` : content,
    },
  });

  return note;
}