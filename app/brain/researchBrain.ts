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
  country?: string;
  previousEmployments?: string[];
  connectionStatus?: "connection_requested" | "accepted" | "existing_contact";
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

function cleanExtractedRole(value?: string) {
  return value
    ?.replace(/^(is|a|an|the)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanExtractedEmployer(value?: string) {
  return value
    ?.replace(/\s+(Greater|Melbourne|Sydney|Brisbane|Perth|Adelaide|Victoria|NSW|Queensland)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function lineValue(content: string, label: string) {
  const line = content
    .split(/\r?\n|`n/g)
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));

  return line?.slice(label.length + 1).trim() ?? "";
}

function contentLines(content: string) {
  return content
    .split(/\r?\n|`n/g)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const countryNames = [
  "Australia",
  "Malaysia",
  "Singapore",
  "New Zealand",
  "United States",
  "United Kingdom",
  "India",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Japan",
  "China",
  "Hong Kong",
  "South Korea",
  "Canada",
];

const locationCountryAliases: Array<[RegExp, string]> = [
  [/\b(greater sydney|sydney|melbourne|brisbane|perth|adelaide|victoria|nsw|queensland|australia)\b/i, "Australia"],
  [/\b(kuala lumpur|selangor|malaysia)\b/i, "Malaysia"],
  [/\b(auckland|wellington|christchurch|new zealand)\b/i, "New Zealand"],
  [/\b(singapore)\b/i, "Singapore"],
];

function countryFromLocation(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();

  if (!cleaned) return "";

  const explicitCountry = countryNames.find((country) =>
    new RegExp(`\\b${country.replace(/ /g, "\\s+")}\\b`, "i").test(cleaned)
  );

  if (explicitCountry) return explicitCountry;

  return locationCountryAliases.find(([pattern]) => pattern.test(cleaned))?.[1] ?? "";
}

function countryFromContent(content?: string) {
  if (!content) return "";

  return countryFromLocation(lineValue(content, "Location"));
}
function linkedinConnectionStatusFromContent(content?: string) {
  if (!content) return undefined;

  const relationship = lineValue(content, "LinkedIn relationship");
  const profileHeader = contentLines(content).slice(0, 20).join(" ");
  const signal = relationship || profileHeader;

  if (/\b1st\b/i.test(signal)) return "accepted" as const;
  if (/\b(2nd|3rd)\b/i.test(signal)) return "connection_requested" as const;

  return undefined;
}
const experienceEndHeadings = [
  "About",
  "Activity",
  "Education",
  "Licenses",
  "Skills",
  "Recommendations",
  "Interests",
  "More profiles for you",
  "People you may know",
  "Contact info",
  "Highlights",
];

function experienceSectionLines(content: string) {
  const lines = contentLines(content);
  const startIndex = lines.findIndex((line) => {
    const lower = line.toLowerCase();

    return lower === "experience" || lower === "experience section:";
  });

  if (startIndex < 0) return [];

  const result: string[] = [];

  for (const line of lines.slice(startIndex + 1)) {
    if (experienceEndHeadings.some((heading) => line.toLowerCase() === heading.toLowerCase())) {
      break;
    }

    if (/^(show all|show more|experience)$/i.test(line)) continue;
    result.push(line);
  }

  return result;
}

function isDateOrDurationLine(value: string) {
  return /\b(present|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|yrs?|years?|mos?|months?|[12][0-9]{3})\b/i.test(
    value
  );
}

function isLikelyLocationLine(value: string) {
  return (
    /\b(area|region|city|county|greater|metro|remote|hybrid|onsite)\b/i.test(value) ||
    Boolean(countryFromLocation(value))
  );
}

function cleanExperienceBusiness(value: string) {
  return value
    .replace(/\s+(full-time|part-time|contract|self-employed|freelance|internship)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentExperienceFromContent(content: string) {
  const lines = experienceSectionLines(content).filter((line) => !isDateOrDurationLine(line));

  if (lines.length < 2) return null;

  return {
    role: cleanExtractedRole(lines[0]) || "",
    business: cleanExperienceBusiness(lines[1]),
    country: countryFromLocation(lines[1]) || countryFromContent(content),
  };
}

function previousExperienceSummaryFromContent(content: string) {
  const lines = experienceSectionLines(content);
  const currentDateIndex = lines.findIndex((line, index) => index > 1 && isDateOrDurationLine(line));
  const previousLines = lines.slice(currentDateIndex >= 0 ? currentDateIndex + 1 : 2);
  const previousEmployer = previousLines.find(
    (line) => !isDateOrDurationLine(line) && !isLikelyLocationLine(line)
  );

  if (!previousEmployer) return [];

  const employerIndex = previousLines.indexOf(previousEmployer);
  const roles = previousLines
    .slice(employerIndex + 1)
    .filter((line) => !isDateOrDurationLine(line) && !isLikelyLocationLine(line))
    .slice(0, 4);

  return [`${previousEmployer}${roles.length ? `: ${roles.join(", ")}` : ""}`];
}

function businessNameWithCountry(employerName: string, country: string) {
  if (!country) return employerName;

  const normalisedEmployer = normaliseName(employerName);
  const normalisedCountry = normaliseName(country);

  return normalisedEmployer.includes(normalisedCountry)
    ? employerName
    : `${employerName} ${country}`;
}

function personFromProfileLabels(content: string): ExtractedPerson | null {
  const profileName = lineValue(content, "Profile name")
    .replace(/\s*(?:\u00b7)?\s*\b(1st|2nd|3rd)\b/i, "")
    .trim();
  const headline = lineValue(content, "Headline");
  const country = countryFromContent(content);
  const currentExperience = currentExperienceFromContent(content);
  const previousEmployments = previousExperienceSummaryFromContent(content);
  const connectionStatus = linkedinConnectionStatusFromContent(content);

  if (!profileName) return null;

  const nameParts = profileName.split(/\s+/).filter(Boolean);
  const headlineMatch = headline.match(/^(.+?)\s+(?:at|with|for|@)\s+(.+)$/i);

  if (nameParts.length < 2) return null;

  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    jobTitle:
      currentExperience?.role ||
      (headlineMatch ? cleanExtractedRole(headlineMatch[1]) || undefined : undefined),
    employerName:
      currentExperience?.business ||
      (headlineMatch ? cleanExtractedEmployer(headlineMatch[2]) || undefined : undefined),
    country: currentExperience?.country || country || undefined,
    previousEmployments: previousEmployments.length ? previousEmployments : undefined,
    connectionStatus,
  };
}

function contentWithoutMetadata(content: string) {
  return content
    .split(/\r?\n|`n/g)
    .filter((line) => !/^\s*(person linkedin url|profile name|headline|location|linkedin relationship|company clues|education clues):/i.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameFromSourceContent(content?: string): ExtractedPerson | null {
  if (!content) return null;

  const labelledPerson = personFromProfileLabels(content);
  if (labelledPerson) return labelledPerson;

  const compact = contentWithoutMetadata(content);
  const atMatch = compact.match(
    /\b([A-Z][a-z]+)\s+([A-Z][A-Za-z'-]+)\b.*?\b([^.,;\n]{2,80}?)\s+(?:at|with|for)\s+([A-Z0-9][A-Za-z0-9&.' -]{1,80}?)(?=\s+(?:Greater|Melbourne|Sydney|Brisbane|Perth|Adelaide|Victoria|NSW|Queensland|and|in|from|based|is|was|on)|[.,;\n]|$)/
  );
  const commaMatch = compact.match(
    /\b([A-Z][a-z]+)\s+([A-Z][A-Za-z'-]+)\b\s+([^,;\n]{2,80}?),\s+([A-Z0-9][A-Za-z0-9&.' -]{1,80}?)(?=\s+(?:Greater|Melbourne|Sydney|Brisbane|Perth|Adelaide|Victoria|NSW|Queensland|and|in|from|based|is|was|on)|[.,;\n]|$)/
  );
  const match = atMatch ?? commaMatch;

  if (!match) return null;

  const jobTitle = cleanExtractedRole(match[3]);
  const employerName = cleanExtractedEmployer(match[4]);

  return {
    firstName: `${match[1].charAt(0).toUpperCase()}${match[1].slice(1)}`,
    lastName: `${match[2].charAt(0).toUpperCase()}${match[2].slice(1)}`,
    jobTitle: jobTitle || undefined,
    employerName: employerName || undefined,
    country: countryFromContent(content) || undefined,
    connectionStatus: linkedinConnectionStatusFromContent(content),
  };
}

function employerFromContent(content?: string) {
  if (!content) return "";

  const labelledPerson = personFromProfileLabels(content);
  if (labelledPerson?.employerName) return labelledPerson.employerName;

  const compact = content.replace(/\s+/g, " ").trim();
  const match = compact.match(
    /\b(?:works?\s+(?:at|with|for)|employed\s+(?:at|by)|(?:at|with|for))\s+([A-Z0-9][A-Za-z0-9&.' -]{1,80}?)(?=\s+(?:Greater|Melbourne|Sydney|Brisbane|Perth|Adelaide|Victoria|NSW|Queensland|and|in|from|based|is|was|on)|[.,;\n]|$)/
  );

  return cleanExtractedEmployer(match?.[1]) ?? "";
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

    return businessWords.length > 1 && businessWords.every((word) => haystack.includes(word));
  });
}

function proposalPerson(source: ResearchSourceForAnalysis, person?: ExtractedPerson | null) {
  if (!person) return undefined;

  const linkedinUrl = linkedinUrlFromDetail(source.detail);
  const previousEmploymentNote = person.previousEmployments?.length
    ? ` Previous LinkedIn experience: ${person.previousEmployments.join("; ")}.`
    : "";

  return {
    firstName: person.firstName,
    lastName: person.lastName,
    jobTitle: person.jobTitle,
    linkedinUrl,
    notes: `Captured from ${source.name}.${previousEmploymentNote}`,
    connectionStatus: person.connectionStatus ?? (linkedinUrl ? "connection_requested" as const : undefined),
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
  const country = sourcePerson?.country ?? countryFromContent(input.source.content);
  const employerBusinessName = employerName
    ? businessNameWithCountry(employerName, country)
    : "";
  const employerMatch = employerName
    ? findBusinessByName(employerBusinessName, input.businesses) ||
      (!country ? findBusinessByName(employerName, input.businesses) : undefined)
    : undefined;
  const match = employerName ? employerMatch : findBusinessMatch(input.source, input.businesses);
  const host = hostFromDetail(input.source.detail);
  const platformSource = isPlatformSource(input.source.detail);
  const inferredName = employerBusinessName || employerName || (host ? titleFromHost(host) : input.source.name);
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
          ? `Detected ${employerName}${country ? ` in ${country}` : ""} as the employer. Approve to create the business and attach the person/source.`
          : "No existing business match was found. Approve to create a new business workspace from this source.",
        businessUpdates: {
          name: inferredName,
          website: !platformSource && input.source.kind === "Website" ? input.source.detail : undefined,
          country: country || undefined,
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

function applySourceConnectionStatus(analysis: ResearchAnalysis, source: ResearchSourceForAnalysis) {
  const connectionStatus = linkedinConnectionStatusFromContent(source.content);

  if (!connectionStatus) return analysis;

  return {
    ...analysis,
    proposals: analysis.proposals.map((proposal) => ({
      ...proposal,
      person: proposal.person
        ? {
            ...proposal.person,
            connectionStatus: proposal.person.connectionStatus ?? connectionStatus,
          }
        : proposal.person,
    })),
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
- Evaluate fit for StoreLab: retail, supermarkets, convenience, QSR, FMCG, shopper marketing, franchise, store operations, growth, loyalty, category, merchandising, digital, or decision-maker roles are stronger fits.
- Put the fit reasoning and recommended next action in the proposal description and/or person notes, including whether Aaron should connect, message, or hold off.
- If the source is an article, website post, award, announcement, interview, or good-news story about a person, preserve the useful facts in evidenceContent so approval adds it to their personal background.
- If the source identifies a new employer/business, propose create_business with businessUpdates and include the person if visible.
- If both a new business and a person are visible, include both in one create_business proposal.
- Prefer the employer shown in the source over the currently selected business. Never attach a person to the selected business if the source shows a different employer.
- Prefer existing business matches over creating duplicates. Match by business name, brand, website domain, employer, and source content.
- If a LinkedIn profile shows a person and employer, put the person in person and the employer/business in business matching fields. Never put a person LinkedIn URL in businessUpdates.website.
- Read the LinkedIn Experience section when visible. The first experience item is current employment: role on the first line, business on the second line. Previous employers and roles belong in person notes/evidence, not as the current business.
- Read LinkedIn relationship badges. If the profile says "1st" or "LinkedIn relationship: 1st", set person.connectionStatus to "accepted" because Aaron is already connected. If it says "2nd" or "3rd", set "connection_requested".
- Use the LinkedIn location as country context for the business. Example: a person at Mars Wrigley with Location: Malaysia should create or match Mars Wrigley Malaysia, not generic Mars or Mars Australia.
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
    const analysis = applySourceConnectionStatus(normalizeAnalysis(parsed, fallback), input.source);

    return analysis.proposals.length ? analysis : fallback;
  } catch (error) {
    console.error("Research Brain fallback used:", error);
    return fallback;
  }
}

