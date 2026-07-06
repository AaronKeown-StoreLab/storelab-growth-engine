import { Business } from "../types/business";

type Employment = Business["employments"][number];

export type RelationshipHealth = {
  score: number;
  status: "New" | "Cooling" | "Warm" | "Strong";
  reasons: string[];
};

function daysSince(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function thinkAboutRelationship(
  business: Business,
  employment: Employment
): RelationshipHealth {
  let score = 20;
  const reasons: string[] = [];

  const personInteractions = business.interactions.filter(
    (interaction) => interaction.personId === employment.person.id
  );

  if (employment.isCurrent) {
    score += 15;
    reasons.push("Current relationship");
  }

  if (business.opportunities.length > 0) {
    score += 15;
    reasons.push("Business has an open opportunity");
  }

  if (employment.person.notes) {
    score += 10;
    reasons.push("Relationship notes captured");
  }

  if (personInteractions.length > 0) {
    score += 15;
    reasons.push(`${personInteractions.length} interaction captured`);
  }

  if (personInteractions.length >= 3) {
    score += 10;
    reasons.push("Multiple relationship touchpoints");
  }

  const latestInteraction = personInteractions[0];

  if (latestInteraction) {
    const days = daysSince(latestInteraction.occurredAt);

    if (days <= 30) {
      score += 25;
      reasons.push("Recent interaction in the last 30 days");
    } else if (days <= 90) {
      score += 15;
      reasons.push("Interaction recorded in the last 90 days");
    } else {
      reasons.push("No recent interaction");
    }
  } else {
    reasons.push("No interaction history yet");
  }

  const finalScore = Math.min(score, 100);

  return {
    score: finalScore,
    status:
      finalScore >= 80
        ? "Strong"
        : finalScore >= 60
          ? "Warm"
          : finalScore >= 40
            ? "Cooling"
            : "New",
    reasons,
  };
}