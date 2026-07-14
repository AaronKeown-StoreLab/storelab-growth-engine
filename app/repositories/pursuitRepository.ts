import { prisma } from "../lib/prisma";
import { PursuitCaptureAnalysis, PursuitListItem, PursuitPriority, PursuitStage } from "../types/pursuit";

const pursuitInclude = {
  person: true,
  business: true,
  interactions: {
    orderBy: {
      occurredAt: "desc" as const,
    },
  },
};

function cleanText(value?: string | null) {
  return (value ?? "").trim();
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function dateOrNull(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asStage(value: string): PursuitStage {
  return value as PursuitStage;
}

function asPriority(value: string): PursuitPriority {
  return value as PursuitPriority;
}

type PursuitWithContext = Awaited<ReturnType<typeof prisma.pursuit.findFirst>> & {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    linkedinUrl: string | null;
    email: string | null;
  };
  business: {
    id: string;
    name: string;
  };
  interactions: {
    id: string;
    type: string;
    channel: string;
    summary: string;
    messageText: string | null;
    aiNotes: string | null;
    occurredAt: Date;
  }[];
};

function toListItem(pursuit: NonNullable<PursuitWithContext>): PursuitListItem {
  return {
    id: pursuit.id,
    stage: asStage(pursuit.stage),
    priority: asPriority(pursuit.priority),
    source: pursuit.source,
    whyRelevant: pursuit.whyRelevant,
    storeLabAngle: pursuit.storeLabAngle,
    currentStatus: pursuit.currentStatus,
    nextAction: pursuit.nextAction,
    nextActionDueAt: pursuit.nextActionDueAt?.toISOString() ?? null,
    teaserVideoSent: pursuit.teaserVideoSent,
    lastInteractionAt: pursuit.lastInteractionAt?.toISOString() ?? null,
    createdAt: pursuit.createdAt.toISOString(),
    updatedAt: pursuit.updatedAt.toISOString(),
    person: {
      id: pursuit.person.id,
      firstName: pursuit.person.firstName,
      lastName: pursuit.person.lastName,
      linkedinUrl: pursuit.person.linkedinUrl,
      email: pursuit.person.email,
    },
    business: {
      id: pursuit.business.id,
      name: pursuit.business.name,
    },
    interactions: pursuit.interactions.map((interaction) => ({
      id: interaction.id,
      type: interaction.type,
      channel: interaction.channel,
      summary: interaction.summary,
      messageText: interaction.messageText,
      aiNotes: interaction.aiNotes,
      occurredAt: interaction.occurredAt.toISOString(),
    })),
  };
}

export async function listPursuits() {
  const pursuits = await prisma.pursuit.findMany({
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
    include: pursuitInclude,
  });

  return pursuits.map((pursuit) => toListItem(pursuit));
}

async function findOrCreateBusiness(name: string) {
  const cleanedName = cleanText(name);

  if (!cleanedName) {
    throw new Error("Company is required before saving a LinkedIn pursuit.");
  }

  const businesses = await prisma.business.findMany({
    where: {
      status: {
        not: "archived",
      },
    },
  });
  const existing = businesses.find((business) => normalise(business.name) === normalise(cleanedName));

  if (existing) return existing;

  return prisma.business.create({
    data: {
      name: cleanedName,
      summary: "Created from LinkedIn pursuit capture.",
      timeline: {
        create: {
          eventType: "business_added",
          summary: "Business added from LinkedIn pursuit capture.",
        },
      },
    },
  });
}

async function findOrCreatePerson(input: PursuitCaptureAnalysis["person"], businessId: string) {
  const firstName = cleanText(input.firstName);
  const lastName = cleanText(input.lastName);
  const linkedinUrl = cleanText(input.linkedinUrl);

  if (!firstName) {
    throw new Error("Person name is required before saving a LinkedIn pursuit.");
  }

  const existing = await prisma.person.findFirst({
    where: {
      OR: [
        linkedinUrl ? { linkedinUrl } : undefined,
        firstName && lastName ? { firstName, lastName } : undefined,
        !lastName
          ? {
              firstName,
              employments: {
                some: {
                  businessId,
                  isCurrent: true,
                },
              },
            }
          : undefined,
      ].filter(Boolean) as object[],
    },
  });

  const person = existing
    ? await prisma.person.update({
        where: {
          id: existing.id,
        },
        data: {
          linkedinUrl: linkedinUrl || existing.linkedinUrl,
        },
      })
    : await prisma.person.create({
        data: {
          firstName,
          lastName,
          linkedinUrl: linkedinUrl || null,
        },
      });

  const currentEmployment = await prisma.employment.findFirst({
    where: {
      personId: person.id,
      businessId,
      isCurrent: true,
    },
  });

  if (currentEmployment) {
    const role = cleanText(input.role);

    if (role && !currentEmployment.jobTitle) {
      await prisma.employment.update({
        where: {
          id: currentEmployment.id,
        },
        data: {
          jobTitle: role,
        },
      });
    }
  } else {
    await prisma.employment.create({
      data: {
        personId: person.id,
        businessId,
        jobTitle: cleanText(input.role) || null,
        isCurrent: true,
      },
    });
  }

  return person;
}

export async function approvePursuitCapture(analysis: PursuitCaptureAnalysis) {
  const business = await findOrCreateBusiness(analysis.business.name);
  const person = await findOrCreatePerson(analysis.person, business.id);
  const nextActionDueAt = dateOrNull(analysis.nextActionDueAt);
  const now = new Date();

  const existingPursuit = await prisma.pursuit.findFirst({
    where: {
      personId: person.id,
      businessId: business.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const pursuitData = {
    stage: analysis.stage,
    priority: analysis.priority,
    source: analysis.source,
    whyRelevant: cleanText(analysis.whyRelevant) || null,
    storeLabAngle: cleanText(analysis.storeLabAngle) || null,
    currentStatus: cleanText(analysis.currentStatus) || cleanText(analysis.whatChanged) || null,
    nextAction: cleanText(analysis.nextAction) || null,
    nextActionDueAt,
    teaserVideoSent: analysis.teaserVideoSent,
    lastInteractionAt: now,
  };

  const pursuit = existingPursuit
    ? await prisma.pursuit.update({
        where: {
          id: existingPursuit.id,
        },
        data: pursuitData,
      })
    : await prisma.pursuit.create({
        data: {
          personId: person.id,
          businessId: business.id,
          ...pursuitData,
        },
      });

  const touchpointSummary = cleanText(analysis.touchpointSummary) || cleanText(analysis.whatChanged) || analysis.stage;

  await prisma.contactInteraction.create({
    data: {
      personId: person.id,
      businessId: business.id,
      pursuitId: pursuit.id,
      type: cleanText(analysis.touchpointType) || analysis.stage.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      channel: "LinkedIn",
      summary: touchpointSummary,
      messageText: cleanText(analysis.messageText) || cleanText(analysis.suggestedMessage) || null,
      aiNotes: cleanText(analysis.aiNotes) || cleanText(analysis.whyRelevant) || null,
      occurredAt: now,
    },
  });

  await prisma.timelineEvent.create({
    data: {
      businessId: business.id,
      personId: person.id,
      eventType: `pursuit_${analysis.stage.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      summary: `${person.firstName}${person.lastName ? ` ${person.lastName}` : ""}: ${touchpointSummary}`,
      occurredAt: now,
    },
  });

  const saved = await prisma.pursuit.findUnique({
    where: {
      id: pursuit.id,
    },
    include: pursuitInclude,
  });

  if (!saved) {
    throw new Error("Pursuit was saved, but could not be reloaded.");
  }

  return toListItem(saved);
}
