import { RelationshipEvent } from "../types/event";

export function calculatePriority(events: RelationshipEvent[]): number {
  let score = 50;

  events.forEach((event) => {
    switch (event.impact) {
      case "Positive":
        score += 15;
        break;
      case "Neutral":
        score += 5;
        break;
      case "Negative":
        score -= 10;
        break;
    }
  });

  return Math.min(100, Math.max(0, score));
}

export function calculateMomentum(events: RelationshipEvent[]): number {
  let score = 50;

  events.forEach((event) => {
    if (event.type === "linkedin_post") score += 10;
    if (event.type === "job_change") score += 20;
    if (event.type === "meeting") score += 15;
    if (event.type === "proposal") score += 10;
  });

  return Math.min(100, Math.max(0, score));
}