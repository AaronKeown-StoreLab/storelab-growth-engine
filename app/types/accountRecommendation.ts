import { Company } from "./company";
import { Goal } from "./goal";
import { Person } from "./person";
import { RelationshipSignals } from "./signals";
import { RelationshipEvent } from "./event";


export interface AccountRecommendation {
  company: Company;
  goal?: Goal;
  contacts: Person[];
  events: RelationshipEvent[];
  recommendation: string;
  reasons: string[];
  signals: RelationshipSignals;
}