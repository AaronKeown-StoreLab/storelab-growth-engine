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
  pursuits: {
    select: {
      id: true,
      stage: true,
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
  industry?: string;
  country?: string;
  summary?: string;
}) {
  return prisma.business.create({
    data: {
      name: data.name,
      website: data.website || null,
      industry: data.industry || null,
      country: data.country || null,
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

export async function updateBusiness(
  businessId: string,
  data: {
    name?: string;
    website?: string;
    industry?: string;
    country?: string;
    summary?: string;
    status?: string;
  }
) {
  return prisma.business.update({
    where: {
      id: businessId,
    },
    data: {
      name: data.name,
      website: data.website,
      industry: data.industry,
      country: data.country,
      summary: data.summary,
      status: data.status,
    },
    include: businessInclude,
  });
}

export async function archiveBusiness(businessId: string) {
  return updateBusiness(businessId, { status: "archived" });
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

export async function addEvidenceToPerson(data: {
  personId: string;
  type: string;
  title: string;
  content: string;
  source?: string;
}) {
  const evidence = await prisma.evidence.create({
    data: {
      personId: data.personId,
      type: data.type,
      title: data.title,
      content: data.content,
      source: data.source || null,
    },
  });

  await prisma.timelineEvent.create({
    data: {
      personId: data.personId,
      eventType: "person_background_added",
      summary: `${data.title} was added to personal background.`,
    },
  });

  return evidence;
}
export async function findPersonByIdentity(data: {
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
  email?: string;
}) {
  const identityMatches = [
    data.linkedinUrl ? { linkedinUrl: data.linkedinUrl } : undefined,
    data.email ? { email: data.email } : undefined,
    data.firstName && data.lastName
      ? { firstName: data.firstName, lastName: data.lastName }
      : undefined,
  ].filter(Boolean) as object[];

  if (!identityMatches.length) return null;

  return prisma.person.findFirst({
    where: {
      OR: identityMatches,
    },
    include: {
      employments: {
        include: {
          business: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
export async function addPersonToBusiness(data: {
  businessId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  linkedinUrl?: string;
  email?: string;
  notes?: string;
}) {
  const existingPerson = await prisma.person.findFirst({
    where: {
      OR: [
        data.linkedinUrl ? { linkedinUrl: data.linkedinUrl } : undefined,
        data.email ? { email: data.email } : undefined,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          employments: {
            some: {
              businessId: data.businessId,
              isCurrent: true,
            },
          },
        },
      ].filter(Boolean) as object[],
    },
  });

  const person = existingPerson
    ? await prisma.person.update({
        where: {
          id: existingPerson.id,
        },
        data: {
          linkedinUrl: data.linkedinUrl || existingPerson.linkedinUrl,
          email: data.email || existingPerson.email,
          notes: data.notes || existingPerson.notes,
        },
      })
    : await prisma.person.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          linkedinUrl: data.linkedinUrl || null,
          email: data.email || null,
          notes: data.notes || null,
        },
      });

  const currentEmployment = await prisma.employment.findFirst({
    where: {
      personId: person.id,
      businessId: data.businessId,
      isCurrent: true,
    },
  });

  if (!currentEmployment) {
    await prisma.employment.create({
      data: {
        personId: person.id,
        businessId: data.businessId,
        jobTitle: data.jobTitle || null,
        isCurrent: true,
      },
    });
  }

  await prisma.timelineEvent.create({
    data: {
      businessId: data.businessId,
      personId: person.id,
      eventType: "person_added",
      summary: `${data.firstName} ${data.lastName} was approved into this business.`,
    },
  });

  return person;
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

