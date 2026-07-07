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

function nameFromLinkedInUrl(detail: string) {
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

function nameFromSourceContent(content?: string) {
  if (!content) return null;

  const compact = content.replace(/\s+/g, " ").trim();
  const match = compact.match(
    /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b(?:\s+is)?(?:\s+(?:a|an|the))?\s+([^.,;]{2,80}?)\s+(?:at|with|for)\s+([A-Z][A-Za-z0-9&' -]{1,80})/i
  );

  if (!match) return null;

  const jobTitle = match[3]
    ?.replace(/^(is|a|an|the)\s+/i, "")
    .trim();

  return {
    firstName: `${match[1].charAt(0).toUpperCase()}${match[1].slice(1)}`,
    lastName: `${match[2].charAt(0).toUpperCase()}${match[2].slice(1)}`,
    jobTitle: jobTitle || undefined,
  };
}

function linkedinUrlFromDetail(detail: string) {
  const host = hostFromDetail(detail);

  return host === "linkedin.com" || host.endsWith(".linkedin.com") ? detail : undefined;
}
function findBusinessMatch(source: ResearchSourceForAnalysis, businesses: ResearchBusinessContext[]) {
  const host = hostFromDetail(source.detail);
  const platformHosts = ["linkedin.com", "facebook.com", "instagram.com", "x.com", "twitter.com"];
  const isPlatformSource = platformHosts.some(
    (platformHost) => host === platformHost || host.endsWith(`.${platformHost}`)
  );
  const haystack = [isPlatformSource ? "" : source.detail, source.content ?? ""]
    .join(" ")
    .toLowerCase();

  return businesses.find((business) => {
    const businessWords = words(business.name);
    const websiteHost = business.website ? hostFromDetail(business.website) : "";

    if (!isPlatformSource && websiteHost && host && websiteHost === host) return true;
    if (business.name && haystack.includes(business.name.toLowerCase())) return true;

    return businessWords.some((word) => haystack.includes(word));
  });
}

function fallbackAnalysis(input: Input): ResearchAnalysis {
  const preferredBusiness = input.businesses.find(
    (business) => business.id === input.preferredBusinessId
  );
  const sourcePerson =
    nameFromLinkedInUrl(input.source.detail) ?? nameFromSourceContent(input.source.content);
  const match =
    findBusinessMatch(input.source, input.businesses) ??
    (sourcePerson ? preferredBusiness : undefined);
  const host = hostFromDetail(input.source.detail);
  const inferredName = host ? titleFromHost(host) : input.source.name;

  const person = sourcePerson
    ? {
        ...sourcePerson,
        linkedinUrl: linkedinUrlFromDetail(input.source.detail),
        notes: `Captured from ${input.source.name}.`,
      }
    : undefined;

  const baseProposal: ResearchProposal = match
    ? {
        action: "attach_to_business",
        businessId: match.id,
        confidence: person ? "medium" : "low",
        title: person
          ? `Add ${person.firstName} ${person.lastName} to ${match.name}`
          : `Add source to ${match.name}`,
        description: person
          ? `Detected a person profile and matched this source to ${match.name}.`
          : `Matched this source to an existing business based on source text or domain.`,
        person,
        evidenceTitle: input.source.name,
        evidenceContent: input.source.content || input.source.detail || input.source.name,
      }
    : {
        action: "create_business",
        businessName: inferredName,
        confidence: host ? "medium" : "low",
        title: `Create ${inferredName}`,
        description: "No existing business match was found. Approve to create a new business workspace from this source.",
        businessUpdates: {
          name: inferredName,
          website: input.source.kind === "Website" ? input.source.detail : undefined,
          summary: `Created from approved research source: ${input.source.name}.`,
        },
        person,
        evidenceTitle: input.source.name,
        evidenceContent: input.source.content || input.source.detail || input.source.name,
      };

  return {
    summary: match
      ? `Matched ${input.source.name} to ${match.name}.`
      : `Prepared ${input.source.name} as a new business proposal.`,
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
              proposal.action === "attach_to_business") &&
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

  try {
    const response = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are the StoreLab OS Research Brain.

Your job is to analyse one research source and propose Relationship OS changes.
Do not write to the database. Propose only.

Existing businesses:
${JSON.stringify(input.businesses, null, 2)}

Currently selected business, when the user is working inside one:
${JSON.stringify(input.businesses.find((business) => business.id === input.preferredBusinessId) ?? null, null, 2)}

Source:
${JSON.stringify(input.source, null, 2)}

Rules:
- If the source is about a person/customer at an existing business, propose attach_to_business with the existing businessId and a person object.
- If the source identifies a new business, propose create_business with businessUpdates.
- If both a new business and a person are visible, include both in one create_business proposal.
- Prefer existing business matches over creating duplicates. Match by business name, brand, website domain, employer, and source content.
- If the source is a person profile and the employer is not visible, use the currently selected business as the attach target when present.
- If a LinkedIn profile shows a person and employer, put the person in person and the employer/business in business matching fields.
- Keep confidence honest: low, medium, high.
- Return ONLY JSON with this shape:
{
  "summary": "short explanation",
  "proposals": [
    {
      "action": "create_business | attach_to_business",
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
`,
            },
          ],
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
