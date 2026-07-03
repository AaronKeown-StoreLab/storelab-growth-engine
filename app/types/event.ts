export interface RelationshipEvent {
  id: string;

  companyId: string;
  personId?: string;

  type:
    | "linkedin_connection"
    | "linkedin_post"
    | "email"
    | "meeting"
    | "proposal"
    | "job_change"
    | "note";

  title: string;

  description: string;

  date: string;

  source: string;

  impact:
    | "Positive"
    | "Neutral"
    | "Negative";
}