import { Company } from "../types/company";

export const companies: Company[] = [
  { id: "mars", name: "Mars", region: "Global", industry: "FMCG", customerStatus: "Customer", relationshipHealth: "Strong" },
  { id: "pepsico", name: "PepsiCo", region: "Global", industry: "FMCG", customerStatus: "Customer", relationshipHealth: "Warm" },
  { id: "mondelez", name: "Mondelez", region: "Global", industry: "FMCG", customerStatus: "Prospect", relationshipHealth: "New" },
  { id: "bayer", name: "Bayer", region: "Europe", industry: "Healthcare / FMCG", customerStatus: "Customer", relationshipHealth: "Warm" },
  { id: "village", name: "Village Cinemas", region: "Australia", industry: "Entertainment", customerStatus: "Prospect", relationshipHealth: "Warm" },
  { id: "diageo", name: "Diageo", region: "Australia", industry: "Alcohol / Retail", customerStatus: "Prospect", relationshipHealth: "Warm" },
  { id: "lactalis", name: "Lactalis", region: "Australia", industry: "Dairy", customerStatus: "Customer", relationshipHealth: "Warm" },
  { id: "danone", name: "Danone", region: "Australia", industry: "Dairy", customerStatus: "Customer", relationshipHealth: "New" },
  { id: "coles", name: "Coles", region: "Australia", industry: "Retail", customerStatus: "Customer", relationshipHealth: "Strong" },
  { id: "mycar", name: "mycar", region: "Australia", industry: "Automotive Retail", customerStatus: "Prospect", relationshipHealth: "Warm" },
];