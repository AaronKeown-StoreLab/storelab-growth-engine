export interface InboxItem {
  id: string;

  title: string;

  description: string;

  companyId?: string;

  personId?: string;

  source:
    | "LinkedIn"
    | "Email"
    | "Calendar"
    | "AI";

  status:
    | "Pending"
    | "Accepted"
    | "Rejected";

  created: string;
}