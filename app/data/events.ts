import { RelationshipEvent } from "../types/event";

export const events: RelationshipEvent[] = [
  {
    id: "mars-research-opportunity",
    companyId: "mars",
    personId: "simon-watts",
    type: "note",
    title: "Research opportunity identified",
    description:
      "Mars has an active opportunity around Virtual Research and Growth Centre planning.",
    date: "2026-07-01",
    source: "Prototype data",
    impact: "Positive",
  },
  {
    id: "mars-no-recent-follow-up",
    companyId: "mars",
    personId: "simon-watts",
    type: "note",
    title: "No recent follow-up",
    description:
      "No meaningful follow-up has occurred recently, making this account worth attention.",
    date: "2026-07-03",
    source: "Prototype data",
    impact: "Neutral",
  },
];