import { AccountRecommendation } from "../types/accountRecommendation";

export function buildRelationshipMemory(
  recommendation: AccountRecommendation
) {
  const company = recommendation.company.name;

  const contacts = recommendation.contacts
    .map((c) => `${c.firstName} ${c.lastName} — ${c.role}`)
    .join("\n");

  const history = recommendation.events
    .map((e) => `• ${e.title}`)
    .join("\n");

  return `
COMPANY

${company}

OBJECTIVE

${recommendation.goal?.title ?? "No objective defined"}

BEST ROUTES IN

${contacts}

KNOWN HISTORY

${history}

CURRENT RECOMMENDATION

${recommendation.recommendation}
`;
}