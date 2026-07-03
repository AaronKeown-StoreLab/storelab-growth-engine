import { goals } from "../data/goals";
import { calculatePriority, calculateMomentum } from "./priorityEngine";
import { companies } from "../data/companies";
import { people } from "../data/people";
import { relationships } from "../data/relationships";
import { events } from "../data/events";
import { Recommendation } from "../types/recommendation";

export function getMorningRecommendations(): Recommendation[] {
  return relationships
    .map((relationship) => {
      const person = people.find((p) => p.id === relationship.personId);
      const company = companies.find((c) => c.id === relationship.companyId);
      const goal = goals.find((g) => g.companyId === relationship.companyId);

      const relatedEvents = events.filter(
        (event) =>
          event.companyId === relationship.companyId &&
          (!event.personId || event.personId === relationship.personId)
      );
const priority = calculatePriority(relatedEvents);
const momentum = calculateMomentum(relatedEvents);
      return {
        person,
        company,
        goal,

        recommendation: relationship.nextRecommendedAction,

        strength: relationship.relationshipStrength,

        reasons: relatedEvents.map((event) => event.title),

        confidence: 92,

        signals: {
          relationship: 94,
          opportunity: 82,
          momentum,
          engagement: 88,
          priority,
        },
      };
    })
    .sort((a, b) => b.signals.priority - a.signals.priority);
}