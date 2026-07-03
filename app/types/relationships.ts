export interface Relationship {
  id: string;

  personId: string;
  companyId: string;

  relationshipStrength: "Strong" | "Warm" | "Cooling" | "New";

  relationshipType:
    | "Champion"
    | "Decision Maker"
    | "Influencer"
    | "Gatekeeper"
    | "Warm Intro"
    | "Unknown";

  introducedBy?: string;

  lastMeaningfulInteraction?: string;

  nextRecommendedAction?: string;

  source: string;

  notes?: string;
}