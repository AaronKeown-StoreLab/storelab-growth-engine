export const pursuitStages = [
  "Found",
  "Message Drafted",
  "Connection Sent",
  "Connected",
  "Follow-up Sent",
  "Demo Proposed",
  "Demo Accepted",
  "Email / Time Requested",
  "Email Captured",
  "Email Sent",
  "Calendar Sent",
  "Demo Booked",
  "Gone Quiet",
  "Parked",
  "Not Relevant",
] as const;

export type PursuitStage = (typeof pursuitStages)[number];

export const pursuitPriorities = ["High", "Medium", "Low"] as const;

export type PursuitPriority = (typeof pursuitPriorities)[number];

export type PursuitCaptureAnalysis = {
  confidence: "low" | "medium" | "high";
  originalNote: string;
  person: {
    firstName: string;
    lastName?: string;
    role?: string;
    linkedinUrl?: string;
  };
  business: {
    name: string;
  };
  stage: PursuitStage;
  priority: PursuitPriority;
  source: "LinkedIn";
  whatChanged: string;
  whyRelevant?: string;
  storeLabAngle?: string;
  currentStatus?: string;
  nextAction: string;
  nextActionDueAt?: string;
  teaserVideoSent: boolean;
  messageText?: string;
  suggestedMessage?: string;
  touchpointType: string;
  touchpointSummary: string;
  aiNotes?: string;
};

export type PursuitListItem = {
  id: string;
  stage: PursuitStage;
  priority: PursuitPriority;
  source: string;
  whyRelevant?: string | null;
  storeLabAngle?: string | null;
  currentStatus?: string | null;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  teaserVideoSent: boolean;
  lastInteractionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    linkedinUrl?: string | null;
    email?: string | null;
    role?: string | null;
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
    messageText?: string | null;
    aiNotes?: string | null;
    occurredAt: string;
  }[];
};
