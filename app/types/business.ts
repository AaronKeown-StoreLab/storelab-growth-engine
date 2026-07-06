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

    person: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
};