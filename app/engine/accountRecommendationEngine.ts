import { companies } from "../data/companies";
import { people } from "../data/people";
import { relationships } from "../data/relationships";
import { goals } from "../data/goals";
import { events } from "../data/events";

import { AccountRecommendation } from "../types/accountRecommendation";
import { Person } from "../types/person";

import {
  calculatePriority,
  calculateMomentum,
} from "./priorityEngine";

export function getAccountRecommendations(): AccountRecommendation[] {
  return companies.map((company) => {

    const companyRelationships = relationships.filter(
      (r) => r.companyId === company.id
    );

    const contacts = companyRelationships
      .map((r) =>
        people.find((p) => p.id === r.personId)
      )
      .filter(Boolean);

    const companyEvents = events.filter(
      (e) => e.companyId === company.id
    );

    const goal = goals.find(
      (g) => g.companyId === company.id
    );

    return {
      company,

      goal,

      contacts: contacts as Person[],
      events: companyEvents,

      recommendation:
        companyRelationships[0]?.nextRecommendedAction ??
        "Review account",

      reasons: companyEvents.map((e) => e.title),

      signals: {
        relationship: 90,

        opportunity: 84,

        momentum: calculateMomentum(companyEvents),

        engagement: 80,

        priority: calculatePriority(companyEvents),
      },
    };
  });
}