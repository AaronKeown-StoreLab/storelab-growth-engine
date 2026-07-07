export type Business = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  country?: string | null;
  summary?: string | null;

  opportunities: {
    id: string;
    title: string;
    status: string;
    nextAction?: string | null;
    summary?: string | null;
  }[];

  employments: {
    id: string;
    personId: string;
    businessId: string;
    jobTitle?: string | null;
    isCurrent: boolean;

    person: {
      id: string;
      firstName: string;
      lastName: string;
      linkedinUrl?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      evidence: {
        id: string;
        type: string;
        title?: string | null;
        content: string;
        source?: string | null;
        capturedAt: string;
      }[];
    };
  }[];

  evidence: {
    id: string;
    type: string;
    title?: string | null;
    content: string;
    source?: string | null;
    capturedAt: string;
  }[];
  notebookEntries: {
    id: string;
    content: string;
    createdAt: string;
  }[];

  interactions: {
    id: string;
    personId: string;
    businessId: string;
    type: string;
    summary: string;
    occurredAt: string;
  }[];

  timeline: {
    id: string;
    eventType: string;
    summary: string;
    occurredAt: string;
  }[];
};
