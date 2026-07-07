export type ResearchSourceKind =
  | "PDF"
  | "Image"
  | "Document"
  | "Presentation"
  | "Spreadsheet"
  | "Audio"
  | "Video"
  | "Website"
  | "Notes"
  | "File";

export type ResearchProposalAction = "create_business" | "attach_to_business" | "needs_more_context";

export type ResearchSourceForAnalysis = {
  name: string;
  kind: ResearchSourceKind;
  detail: string;
  content?: string;
  imageDataUrl?: string;
  mimeType?: string;
  detected: string[];
};

export type ResearchBusinessContext = {
  id: string;
  name: string;
  website?: string | null;
  summary?: string | null;
  people: string[];
};

export type ResearchProposal = {
  action: ResearchProposalAction;
  confidence: "low" | "medium" | "high";
  title: string;
  description: string;
  businessId?: string;
  businessName?: string;
  businessUpdates?: {
    name?: string;
    website?: string;
    industry?: string;
    country?: string;
    summary?: string;
  };
  person?: {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    linkedinUrl?: string;
    email?: string;
    notes?: string;
    connectionStatus?: "connection_requested" | "accepted" | "existing_contact";
  };
  evidenceTitle: string;
  evidenceContent: string;
};

export type ResearchAnalysis = {
  summary: string;
  proposals: ResearchProposal[];
};

