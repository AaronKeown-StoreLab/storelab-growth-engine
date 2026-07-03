import { InboxItem } from "../types/inboxItem";

export const inbox: InboxItem[] = [
  {
    id: "1",
    title: "Barbara accepted your LinkedIn invitation",
    description:
      "AI detected a newly accepted LinkedIn connection.",
    companyId: "consultant",
    personId: "barbara-du-perron",
    source: "LinkedIn",
    status: "Pending",
    created: "2026-07-03",
  },

  {
    id: "2",
    title: "Simon posted about shopper research",
    description:
      "AI detected a new LinkedIn post that may represent a research opportunity.",
    companyId: "mars",
    personId: "simon-watts",
    source: "LinkedIn",
    status: "Pending",
    created: "2026-07-03",
  },
];