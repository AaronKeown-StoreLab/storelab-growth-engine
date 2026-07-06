export type Business = {
  id: string;
  name: string;
  industry?: string | null;
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
    jobTitle?: string | null;
    isCurrent: boolean;

    person: {
      id: string;
      firstName: string;
      lastName: string;
      notes?: string | null;
    };
  }[];

  notebookEntries: {
    id: string;
    content: string;
    createdAt: string;
  }[];

  timeline: {
    id: string;
    eventType: string;
    summary: string;
    occurredAt: string;
  }[];
};