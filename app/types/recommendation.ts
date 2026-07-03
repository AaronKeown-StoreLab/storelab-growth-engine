import { Goal } from "./goal";
import { Company } from "./company";
import { Person } from "./person";
import { RelationshipSignals } from "./signals";

export interface Recommendation {
  company?: Company;
  person?: Person;
  goal?: Goal;

  strength: string;

  recommendation?: string;

  reasons: string[];

  confidence: number;

  signals: RelationshipSignals;
}