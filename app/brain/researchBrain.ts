import { getOpenAIClient } from "./ai/openai";
import {
  ResearchAnalysis,
  ResearchBusinessContext,
  ResearchProposal,
  ResearchSourceForAnalysis,
} from "../types/research";

type Input = {
  source: ResearchSourceForAnalysis;
  businesses: ResearchBusinessContext[];
  preferredBusinessId?: string;
};

type ExtractedPerson = {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  employerName?: string;
};

function cleanJsonResult(result: string) {
  return result
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2);
}

function normaliseName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(pty|ltd|limited|inc|corp|corporation|company|co)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hostFromDetail(detail: string) {
  try {
    return new URL(detail).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function titleFromHost(host: string) {
  const first = host.split(".")[0] || host;

  return first
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isPlatformSource(detail: string) {
  const host = hostFromDetail(detail);
  const platformHosts = ["linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com"];

  return platformHosts.some(
    (platformHost) => host === platformHost || host.endsWith(`.${platformHost}`)
  );
}

function nameFromLinkedInUrl(detail: string): ExtractedPerson | null {
  try {
    const url = new URL(detail);
    const match = url.pathname.match(/\/in\/([^/?#]+)/i);
    const slug = match?.[1];

    if (!slug) return null;

    const parts = slug
      .split("-")
      .filter((part) => !/^\d+$/.test(part))
      .filter(Boolean);

    if (parts.length < 2) return null;

    return {
      firstName: `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}`,
      lastName: `${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1)}`,
    };
  } catch {
    return null;
  }
}

function nameFromSourceContent(content?: string): ExtractedPerson | null {
  if (!content) return null;

  const compact = content.replace(/\s+/g, " ").trim();
  const match = compact.match(
    /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b.*?\b([^.,;\n]{2,80}?)\s+(?:at|with|for)\s+([A-Z0-9][A-Za-z0-9&' -]{1,80}?)(?=\s+(?:Melbourne|Sydney|Brisbane|Perth|Adelaide|Victoria|NSW|Queensland|and|in|from|based|is|was|on)|[.,;\n]|$)/
  );

  if (!match) return null;

  const jobTitle = match[3]
    ?.replace(/^(is|a|an|the)\s+/i, "")
    .trim();
  const employerName = match[4]?.trim();

  return {
    firstName: `${match[1].charAt(0).toUpperCase()}${match[1].slice(1)}`,
    lastName: `${match[2].charAt(0).toUpperCase()}${match[2].slice(1)}`,
    jobTitle: jobTitle || undefined,
    employerName: employerName || undefined,
  };
}

function employerFromContent(content?: string) {
  if (!content) return "";

  const compact = content.replace(/\s+/g, " ").trim();
  const match = compact.match(
    /\b(?:works?\s+(?:at|with|for)|employed\s+(?:at|by)|(?:at|with|for))\s+([A-Z0-9][A-Za-z0-9&' -]{1,80}?)(?=\s+(?:Melbourne|Sydney|Brisbane|Perth|Adelaide|Victoria|NSW|Queensland|and|in|from|based|is|was|on)|[.,;\n]|$)/
  );

  return match?.[1]?.trim() ?? "";
}

function linkedinUrlFromDetail(detail: string) {
  const host = hostFromDetail(detail);

  return host === "linkedin.com" || host.endsWith(".linkedin.com") ? detail : undefined;
}

function findBusinessByName(name: string, businesses: ResearchBusinessContext[]) {
  const normalised = normaliseName(name);

  if (!normalised) return undefined;

  return businesses.find((business) => {
    const businessName = normaliseName(business.name);

    return (
      businessName === normalised ||
      businessName.includes(normalised) ||
      normalised.includes(businessName)
    );
  });
}

function findBusinessMatch(source: ResearchSourceForAnalysis, businesses: ResearchBusinessContext[]) {
  const host = hostFromDetail(source.detail);
  const platformSource = isPlatformSource(source.detail);
  const haystack = [platformSource ? "" : source.detail, source.content ?? ""]
    .join(" ")
    .toLowerCase();

  return businesses.find((business) => {
    const businessWords = words(business.name);
    const websiteHost = business.website ? hostFromDetail(business.website) : "";

    if (!platformSource && websiteHost && host && websiteHost === host) return true;
    if (business.name && haystack.includes(business.name.toLowerCase())) return true;

    return businessWords.some((word) => haystack.includes(word));
  });
}

function proposalPerson(source: ResearchSourceForAnalysis, person?: ExtractedPerson | null) {
  if (!person) return undefined;

  return {
    firstName: person.firstName,
    lastName: person.lastName,
    jobTitle: person.jobTitle,
    linkedinUrl: linkedinUrlFromDetail(source.detail),
    notes: `Captured from ${source.name}.`,
  };
}

function needsMoreContextProposal(input: Input, person?: ExtractedPerson | null): ResearchProposal {
  const personName = person ? `${person.firstName} ${person.lastName}` : "this LinkedIn profile";

  return {
    action: "needs_more_context",
    confidence: "low",
    title: `Need employer for ${personName}`,
    description:
      "The source did not expose enough profile detail to safely choose a business. Paste the profile text or add a screenshot so StoreLab OS can read the employer before anything is saved.",
    person: proposalPerson(input.source, person),
    evidenceTitle: input.source.name,
    evidenceContent: input.source.content || input.source.detail || input.source.name,
  };
}

function fallbackAnalysis(input: Input): ResearchAnalysis {
  const sourcePerson =
    nameFromSourceContent(input.source.content) ?? nameFromLinkedInUrl(input.source.detail);
  const employerName = sourcePerson?.employerName ?? employerFromContent(input.source.content);
  const employerMatch = employerName ? findBusinessByName(employerName, input.businesses) : undefined;
  const match = employerMatch ?? findBusinessMatch(input.source, input.businesses);
  const host = hostFromDetail(input.source.detail);
  const platformSource = isPlatformSource(input.source.detail);
  const inferredName = employerName || (host ? titleFromHost(host) : input.source.name);
  const person = proposalPerson(input.source, sourcePerson);

  if (!match && platformSource && !employerName) {
    return {
      summary: `Need more profile detail before adding ${input.source.name}.`,
      proposals: [needsMoreContextProposal(input, sourcePerson)],
    };
  }

  const baseProposal: ResearchProposal = match
    ? {
        action: "attach_to_business",
        businessId: match.id,
        confidence: employerName || person ? "medium" : "low",
        title: person
          ? `Add ${person.firstName} ${person.lastName} to ${match.name}`
          : `Add source to ${match.name}`,
        description: person
          ? `Matched this source to ${match.name} from the employer or source evidence.`
          : "Matched this source to an existing business based on source text or domain.",
        person,
        evidenceTitle: input.source.name,
        evidenceContent: input.source.content || input.source.detail || input.source.name,
      }
    : {
        action: "create_business",
        businessName: inferredName,
        confidence: employerName ? "medium" : host ? "medium" : "low",
        title: person
          ? `Create ${inferredName} and add ${person.firstName} ${person.lastName}`
          : `Create ${inferredName}`,
        description: employerName
          ? `Detected ${employerName} as the employer. Approve to create the business and attach the person/source.`
          : "No existing business match was found. Approve to create a new business workspace from this source.",
        businessUpdates: {
          name: inferredName,
          website: !platformSource && input.source.kind === "Website" ? input.source.detail : undefined,
          summary: `Created from approved research source: ${input.source.name}.`,
        },
        person,
        evidenceTitle: input.source.name,
        evidenceContent: input.source.content || input.source.detail || input.source.name,
      };

  return {
    summary: match
      ? `Matched ${input.source.name} to ${match.name}.`
      : `Prepared ${inferredName} as a new business proposal.`,
    proposals: [baseProposal],
  };
}

function normalizeAnalysis(value: unknown, fallback: ResearchAnalysis): ResearchAnalysis {
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Partial<ResearchAnalysis>;

  if (!Array.isArray(candidate.proposals) || candidate.proposals.length === 0) {
    return fallback;
  }

  return {
    summary: typeof candidate.summary === "string" ? candidate.summary : fallback.summary,
    proposals: candidate.proposals
      .filter((proposal): proposal is ResearchProposal => {
        return Boolean(
          proposal &&
            typeof proposal === "object" &&
            (proposal.action === "create_business" ||
              proposal.action === "attach_to_business" ||
              proposal.action === "needs_more_context") &&
            typeof proposal.title === "string" &&
            typeof proposal.description === "string"
        );
      })
      .map((proposal) => ({
        ...proposal,
        confidence: proposal.confidence ?? "low",
        evidenceTitle: proposal.evidenceTitle || fallback.proposals[0]?.evidenceTitle || "Research source",
        evidenceContent:
          proposal.evidenceContent || fallback.proposals[0]?.evidenceContent || "Research source approved.",
      })),
  };
}

export async function analyseResearchSource(input: Input): Promise<ResearchAnalysis> {
  const fallback = fallbackAnalysis(input);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const prompt = `
You are the StoreLab OS Research Brain.

Your job is to analyse one research source and propose Relationship OS changes.
Do not write to the database. Propose only.

Existing businesses:
${JSON.stringify(input.businesses, null, 2)}

Currently selected business, when the user is working inside one:
${JSON.stringify(input.businesses.find((business) => business.id === input.preferredBusinessId) ?? null, null, 2)}

Source:
${JSON.stringify({ ...input.source, imageDataUrl: input.source.imageDataUrl ? "[image attached]" : undefined }, null, 2)}

Rules:
- If the source is about a person/customer at an existing business, propose attach_to_business with the existing businessId and a person object.
- If the source identifies a new employer/business, propose create_business with businessUpdates and include the person if visible.
- If both a new business and a person are visible, include both in one create_business proposal.
- Prefer the employer shown in the source over the currently selected business. Never attach a person to the selected business if the source shows a different employer.
- Prefer existing business matches over creating duplicates. Match by business name, brand, website domain, employer, and source content.
- If a LinkedIn profile shows a person and employer, put the person in person and the employer/business in business matching fields.
- If a LinkedIn URL alone does not expose employer/profile text, return needs_more_context instead of guessing or attaching to the selected business.
- For screenshots/images, read visible LinkedIn profile text, including name, headline, current employer, location, education, and visible mutuals.
- Keep confidence honest: low, medium, high.
- Return ONLY JSON with this shape:
{
  "summary": "short explanation",
  "proposals": [
    {
      "action": "create_business | attach_to_business | needs_more_context",
      "confidence": "low | medium | high",
      "title": "approval button title",
      "description": "what will happen if approved",
      "businessId": "existing id when attaching",
      "businessName": "business name when creating",
      "businessUpdates": {
        "name": "",
        "website": "",
        "industry": "",
        "country": "",
        "summary": ""
      },
      "person": {
        "firstName": "",
        "lastName": "",
        "jobTitle": "",
        "linkedinUrl": "",
        "email": "",
        "notes": ""
      },
      "evidenceTitle": "source title",
      "evidenceContent": "important extracted facts"
    }
  ]
}
`;

  const messageContent: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail: "high" }
  > = [
    {
      type: "input_text",
      text: prompt,
    },
  ];

  if (input.source.imageDataUrl) {
    messageContent.push({
      type: "input_image",
      image_url: input.source.imageDataUrl,
      detail: "high",
    });
  }

  try {
    const response = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });

    const parsed = JSON.parse(cleanJsonResult(response.output_text));
    const analysis = normalizeAnalysis(parsed, fallback);

    return analysis.proposals.length ? analysis : fallback;
  } catch (error) {
    console.error("Research Brain fallback used:", error);
    return fallback;
  }
}