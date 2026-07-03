export interface Goal {
  id: string;

  companyId: string;

  title: string;

  description: string;

  status:
    | "Active"
    | "Won"
    | "Paused";

  priority:
    | "High"
    | "Medium"
    | "Low";

  owner: string;

  targetDate?: string;
}