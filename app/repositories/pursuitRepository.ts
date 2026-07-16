import { prisma } from "../lib/prisma";
import { pursuitStages, PursuitCaptureAnalysis, PursuitListItem, PursuitPriority, PursuitStage } from "../types/pursuit";

const pursuitInclude = {
  person: {
    include: {
      employments: true,
    },
  },
  business: true,
  interactions: {
    orderBy: {
      occurredAt: "desc" as const,
    },
  },
};

export type PursuitUpdateInput = {
  person?: {
    firstName?: string;
    lastName?: string;
    role?: string;
    email?: string;
    location?: string;
    linkedinUrl?: string;
  };
  business?: {
    name?: string;
  };
  stage?: PursuitStage;
  priority?: PursuitPriority;
  storeLabAngle?: string;
  whyRelevant?: string;
  currentStatus?: string;
  nextAction?: string;
  messageText?: string;
  source?: string;
  note?: string;
  noteOnly?: boolean;
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

type IncludedEmployment = {
  id: string;
  businessId: string;
  jobTitle: string | null;
  isCurrent: boolean;
};

type IncludedInteraction = {
  id: string;
  type: string;
  channel: string;
  summary: string;
  messageText: string | null;
  aiNotes: string | null;
  occurredAt: Date;
};

type IncludedPursuit = {
  id: string;
  businessId: string;
  stage: string;
  priority: string;
  source: string;
  whyRelevant: string | null;
  storeLabAngle: string | null;
  currentStatus: string | null;
  nextAction: string | null;
  nextActionDueAt: Date | null;
  teaserVideoSent: boolean;
  lastInteractionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    linkedinUrl: string | null;
    email: string | null;
    location: string | null;
    employments: IncludedEmployment[];
  };
  business: {
    id: string;
    name: string;
  };
  interactions: IncludedInteraction[];
};

function toListItem(pursuit: IncludedPursuit): PursuitListItem {
  const role = pursuit.person.employments?.find(
    (employment: { businessId: string; isCurrent: boolean }) =>
      employment.businessId === pursuit.businessId && employment.isCurrent
  )?.jobTitle ?? null;

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
      location: pursuit.person.location,
      role,
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
  const email = cleanText(input.email);
  const location = cleanText(input.location);

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
          email: email || existing.email,
          location: location || existing.location,
        },
      })
    : await prisma.person.create({
        data: {
          firstName,
          lastName,
          linkedinUrl: linkedinUrl || null,
          email: email || null,
          location: location || null,
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
      channel: cleanText(analysis.source) || "LinkedIn",
      summary: touchpointSummary,
      messageText: cleanText(analysis.messageText) || cleanText(analysis.suggestedMessage) || null,
      aiNotes: cleanText(analysis.aiNotes) || cleanText(analysis.whyRelevant) || null,
      occurredAt: now,
    },
  });


  const captureNote = cleanText(analysis.captureNote);
  if (captureNote) {
    await prisma.contactInteraction.create({
      data: {
        personId: person.id,
        businessId: business.id,
        pursuitId: pursuit.id,
        type: "note",
        channel: "StoreLab OS",
        summary: captureNote,
        aiNotes: `Status when noted: ${analysis.stage}`,
        occurredAt: now,
      },
    });
  }
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

function nextActionForManualStage(stage: PursuitStage) {
  if (stage === "Found") return "Draft a short, personal connection request.";
  if (stage === "Message Drafted") return "Review the suggested connection message, then send the LinkedIn request.";
  if (stage === "Connection Sent") return "Monitor for the connection to be accepted.";
  if (stage === "Connected") return "Send a warm follow-up and propose a quick StoreLab demo.";
  if (stage === "Follow-up Sent") return "Monitor for a reply, then follow up lightly if they go quiet.";
  if (stage === "Demo Proposed") return "Monitor for them to accept the demo idea.";
  if (stage === "Demo Accepted") return "Ask for their email address and say you will lock in time by email.";
  if (stage === "Email / Time Requested") return "Monitor for their email address or availability.";
  if (stage === "Email Captured") return "Send an email to confirm day, time, and Teams or onsite Pymble.";
  if (stage === "Email Sent") return "Send the calendar booking once the time is agreed.";
  if (stage === "Calendar Sent") return "Monitor for the calendar booking to be accepted.";
  if (stage === "Demo Booked") return "Prepare a short demo brief and the best StoreLab angle.";
  if (stage === "Successful Connection") return "Keep this relationship warm and watch for the next useful business signal.";
  if (stage === "Gone Quiet") return "Try a different angle, channel, or timing before giving up.";
  if (stage === "Parked") return "Leave parked until a better signal appears.";

  return "Leave this relationship out of active pursuit.";
}

function defaultDueDateForManualStage(stage: PursuitStage) {
  if (["Found", "Message Drafted", "Connected", "Demo Accepted", "Email Captured", "Email Sent"].includes(stage)) return addDaysFromNow(1);
  if (["Connection Sent", "Follow-up Sent", "Demo Proposed", "Email / Time Requested", "Calendar Sent"].includes(stage)) return addDaysFromNow(5);
  if (stage === "Gone Quiet") return addDaysFromNow(7);

  return null;
}

function addDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

function asPursuitStage(value?: string): PursuitStage | undefined {
  return pursuitStages.includes(value as PursuitStage) ? value as PursuitStage : undefined;
}

export function adjacentStage(currentStage: PursuitStage, direction: "next" | "back" | "park") {
  if (direction === "park") return "Parked";

  const activeStages = pursuitStages.filter((stage) => !["Gone Quiet", "Parked", "Not Relevant"].includes(stage));
  const currentIndex = Math.max(0, activeStages.indexOf(currentStage));
  const nextIndex = direction === "next"
    ? Math.min(activeStages.length - 1, currentIndex + 1)
    : Math.max(0, currentIndex - 1);

  return activeStages[nextIndex];
}

export async function updatePursuit(pursuitId: string, input: PursuitUpdateInput) {
  const existing = await prisma.pursuit.findUnique({
    where: {
      id: pursuitId,
    },
    include: pursuitInclude,
  });

  if (!existing) {
    throw new Error("Could not find that pursuit.");
  }

  const existingRole = existing.person.employments.find(
    (employment) => employment.businessId === existing.businessId && employment.isCurrent
  )?.jobTitle ?? "";
  const firstName = input.person && "firstName" in input.person ? cleanText(input.person.firstName) || existing.person.firstName : existing.person.firstName;
  const lastName = input.person && "lastName" in input.person ? cleanText(input.person.lastName) : existing.person.lastName;
  const email = input.person && "email" in input.person ? cleanText(input.person.email) : existing.person.email ?? "";
  const linkedinUrl = input.person && "linkedinUrl" in input.person ? cleanText(input.person.linkedinUrl) : existing.person.linkedinUrl ?? "";
  const location = input.person && "location" in input.person ? cleanText(input.person.location) : existing.person.location ?? "";
  const role = input.person && "role" in input.person ? cleanText(input.person.role) : existingRole;
  const businessName = input.business && "name" in input.business ? cleanText(input.business.name) || existing.business.name : existing.business.name;
  const stage = asPursuitStage(input.stage) ?? asStage(existing.stage);
  const now = new Date();

  if (input.noteOnly) {
    const note = cleanText(input.note);
    if (!note) {
      throw new Error("Note is required.");
    }

    const pursuit = await prisma.pursuit.update({
      where: {
        id: pursuitId,
      },
      data: {
        lastInteractionAt: now,
      },
    });

    await prisma.contactInteraction.create({
      data: {
        personId: existing.personId,
        businessId: existing.businessId,
        pursuitId: pursuit.id,
        type: "note",
        channel: "StoreLab OS",
        summary: note,
        aiNotes: `Status when noted: ${stage}`,
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
      throw new Error("Note was added, but pursuit could not be reloaded.");
    }

    return toListItem(saved);
  }
  const business = normalise(businessName) === normalise(existing.business.name)
    ? existing.business
    : await findOrCreateBusiness(businessName);

  await prisma.person.update({
    where: {
      id: existing.personId,
    },
    data: {
      firstName,
      lastName,
      email: email || null,
      location: location || null,
      linkedinUrl: linkedinUrl || existing.person.linkedinUrl,
    },
  });

  if (business.id !== existing.businessId) {
    await prisma.employment.updateMany({
      where: {
        personId: existing.personId,
        businessId: existing.businessId,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
        endDate: now,
      },
    });
  }

  const currentEmployment = existing.person.employments.find(
    (employment) => employment.businessId === business.id && employment.isCurrent
  );

  if (input.person && "role" in input.person) {
    if (currentEmployment) {
      await prisma.employment.update({
        where: {
          id: currentEmployment.id,
        },
        data: {
          jobTitle: role || null,
        },
      });
    } else if (role) {
      await prisma.employment.create({
        data: {
          personId: existing.personId,
          businessId: business.id,
          jobTitle: role,
          isCurrent: true,
        },
      });
    }
  }

  const nextAction = cleanText(input.nextAction) || nextActionForManualStage(stage);
  const note = cleanText(input.note);
  const messageText = cleanText(input.messageText);
  const displayName = `${firstName}${lastName ? ` ${lastName}` : ""}`;

  const pursuit = await prisma.pursuit.update({
    where: {
      id: pursuitId,
    },
    data: {
      businessId: business.id,
      stage,
      priority: input.priority ?? asPriority(existing.priority),
      storeLabAngle: Object.prototype.hasOwnProperty.call(input, "storeLabAngle") ? cleanText(input.storeLabAngle) || null : existing.storeLabAngle,
      whyRelevant: Object.prototype.hasOwnProperty.call(input, "whyRelevant") ? cleanText(input.whyRelevant) || null : existing.whyRelevant,
      source: Object.prototype.hasOwnProperty.call(input, "source") ? cleanText(input.source) || existing.source : existing.source,
      currentStatus: cleanText(input.currentStatus) || nextAction,
      nextAction,
      nextActionDueAt: defaultDueDateForManualStage(stage),
      lastInteractionAt: now,
    },
  });

  await prisma.contactInteraction.create({
    data: {
      personId: existing.personId,
      businessId: business.id,
      pursuitId: pursuit.id,
      type: "manual_update",
      channel: "StoreLab OS",
      summary: note || `${displayName} moved to ${stage}.`,
      messageText: messageText || null,
      aiNotes: nextAction,
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
    throw new Error("Pursuit was updated, but could not be reloaded.");
  }

  return toListItem(saved);
}






