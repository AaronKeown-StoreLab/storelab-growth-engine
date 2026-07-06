import { Business } from "../types/business";

export type ChiefOfStaffBrief = {
  headline: string;
  summary: string;
  priorities: string[];
};

export function buildChiefOfStaffBrief(
  business: Business
): ChiefOfStaffBrief {
  const relationshipCount = business.employments.length;
  const opportunityCount = business.opportunities.length;
  const interactionCount = business.interactions.length;

  const priorities: string[] = [];

  if (opportunityCount > 0) {
    priorities.push(
      `${opportunityCount} open ${
        opportunityCount === 1 ? "opportunity" : "opportunities"
      }`
    );
  }

  if (interactionCount === 0) {
    priorities.push("No relationship activity recorded yet.");
  } else {
    priorities.push(
      `${interactionCount} relationship ${
        interactionCount === 1 ? "interaction" : "interactions"
      } captured`
    );
  }

  if (relationshipCount === 0) {
    priorities.push("No active relationships.");
  }

  return {
    headline: "Chief of Staff",
    summary: `${business.name} currently has ${relationshipCount} active ${
      relationshipCount === 1 ? "relationship" : "relationships"
    } and ${opportunityCount} open ${
      opportunityCount === 1 ? "opportunity" : "opportunities"
    }.`,
    priorities,
  };
}