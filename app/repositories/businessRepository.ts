import { prisma } from "../lib/prisma";

const businessInclude = {
  employments: {
    where: {
      isCurrent: true,
    },
    include: {
      person: true,
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  opportunities: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  evidence: {
    orderBy: {
      capturedAt: "desc" as const,
    },
  },
  inboxItems: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  notebookEntries: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  interactions: {
    orderBy: {
      occurredAt: "desc" as const,
    },
  },
  timeline: {
    orderBy: {
      occurredAt: "desc" as const,
    },
  },
};

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
    include: businessInclude,
  });
}

export async function getBusinessById(businessId: string) {
  return prisma.business.findUnique({
    where: {
      id: businessId,
    },
    include: businessInclude,
  });
}

export async function createBusiness(data: {
  name: string;
  website?: string;
  summary?: string;
}) {
  return prisma.business.create({
    data: {
      name: data.name,
      website: data.website || null,
      summary: data.summary || null,
      timeline: {
        create: {
          eventType: "business_added",
          summary: "Business added to StoreLab OS.",
        },
      },
    },
    include: businessInclude,
  });
}

export async function addEvidenceToBusiness(data: {
  businessId: string;
  type: string;
  title: string;
  content: string;
  source?: string;
}) {
  const evidence = await prisma.evidence.create({
    data: {
      businessId: data.businessId,
      type: data.type,
      title: data.title,
      content: data.content,
      source: data.source || null,
    },
  });

  await prisma.timelineEvent.create({
    data: {
      businessId: data.businessId,
      eventType: "source_approved",
      summary: `${data.title} was approved into Relationship OS.`,
    },
  });

  return evidence;
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