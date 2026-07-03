export interface Company {
  id: string;
  name: string;
  region: string;

  relationshipHealth: "Strong" | "Warm" | "Cooling" | "New";

  industry: string;

  customerStatus: "Prospect" | "Customer" | "Former Customer";

  website?: string;
}