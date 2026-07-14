import { getOpenAIClient } from "./ai/openai";
import { PursuitCaptureAnalysis, PursuitStage } from "../types/pursuit";

const stages: PursuitStage[] = [
  "Found",
  "Message Drafted",
  "Connection Sent",
  "Connected",
  "Follow-up Sent",
  "Replied",
  "Demo Proposed",
  "Email / Time Requested",
  "Demo Booked",
  "Gone Quiet",
  "Parked",
  "Not Relevant",
];

type Context = {
  businesses: {
    id: string;
    name: string;
    people: string[];
  }[];
  pursuits: {
    id: string;
    personName: string;
    businessName: string;
    stage: string;
    nextAction?: string | null;
    storeLabAngle?: string | null;
  }[];
};

function cleanJsonResult(result: string) {
  return result.replace(/```json/g, "").replace(/```/g, "").trim();
}

function cleanText(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function splitName(value: string) {
  const parts = cleanText(value).split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);

  return date.toISOString();
}

function inferStage(note: string): PursuitStage {
  const lower = note.toLowerCase();

  if (/not relevant|no longer relevant|bad fit/.test(lower)) return "Not Relevant";
  if (/park|later|not now/.test(lower)) return "Parked";
  if (/gone quiet|no reply|hasn'?t replied|has not replied/.test(lower)) return "Gone Quiet";
  if (/demo booked|meeting booked|teams booked|call booked/.test(lower)) return "Demo Booked";
  if (/email|availability|available|time.*day|day.*time/.test(lower)) return "Email / Time Requested";
  if (/demo proposed|suggested.*demo|proposed.*demo|open to seeing|quick demo|teams demo/.test(lower)) return "Demo Proposed";
  if (/replied|responded|asked for|positive|interested/.test(lower)) return "Replied";
  if (/follow.?up sent|sent .*follow/.test(lower)) return "Follow-up Sent";
  if (/accepted|already connected|\b1st\b/.test(lower)) return "Connected";
  if (/sent .*connection|connection request sent|sent .*request/.test(lower)) return "Connection Sent";
  if (/draft|prepared/.test(lower)) return "Message Drafted";

  return "Found";
}

function touchpointTypeForStage(stage: PursuitStage) {
  return stage.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function nextActionForStage(stage: PursuitStage, teaserVideoSent: boolean) {
  if (stage === "Found") return "Draft a short, personal connection request.";
  if (stage === "Message Drafted") return "Send the LinkedIn connection request.";
  if (stage === "Connection Sent") return "Wait for the connection to be accepted.";
  if (stage === "Connected") return teaserVideoSent ? "Send a warm follow-up referencing the teaser video." : "Send a warm follow-up and consider a teaser video.";
  if (stage === "Follow-up Sent") return "Wait for a reply, then follow up lightly if they go quiet.";
  if (stage === "Replied") return "Reply naturally and ask for email or availability if the timing feels right.";
  if (stage === "Demo Proposed") return "Ask for email, availability, and who should join a Teams demo.";
  if (stage === "Email / Time Requested") return "Wait for availability and be ready to book the Teams demo.";
  if (stage === "Demo Booked") return "Prepare a short demo brief and the best StoreLab angle.";
  if (stage === "Gone Quiet") return "Send one light nudge or park if the timing feels wrong.";
  if (stage === "Parked") return "Leave parked until a better signal appears.";

  return "Leave this relationship out of active pursuit.";
}

function dueDateForStage(stage: PursuitStage) {
  if (["Found", "Connected", "Replied", "Demo Proposed"].includes(stage)) return addDays(1);
  if (["Connection Sent", "Follow-up Sent", "Email / Time Requested"].includes(stage)) return addDays(5);
  if (stage === "Gone Quiet") return addDays(7);

  return undefined;
}

function suggestedMessageForStage(input: {
  stage: PursuitStage;
  firstName: string;
  businessName: string;
  storeLabAngle?: string;
  teaserVideoSent: boolean;
}) {
  const name = input.firstName || "there";
  const angle = input.storeLabAngle ? ` ${input.storeLabAngle}` : "";

  if (input.stage === "Found" || input.stage === "Message Drafted") {
    return `Hi ${name}, noticed your work at ${input.businessName}.${angle} Thought it could be worth connecting.`;
  }

  if (input.stage === "Connected") {
    return input.teaserVideoSent
      ? `Thanks for connecting ${name}. I can send a short StoreLab teaser if useful - keen to compare notes when timing suits.`
      : `Thanks for connecting ${name}. I thought there might be a useful StoreLab conversation for ${input.businessName} when timing suits.`;
  }

  if (input.stage === "Replied") {
    return `Thanks ${name}. Happy to send a little more context. If useful, what is the best email and who should be included for a quick Teams demo?`;
  }

  if (input.stage === "Demo Proposed" || input.stage === "Email / Time Requested") {
    return `Would it be easiest to find 20 minutes on Teams? If you send the best email and a couple of times, I can line it up from our side.`;
  }

  if (input.stage === "Gone Quiet") {
    return `Hi ${name}, just nudging this once in case it is still useful. Happy to leave it for later if timing is not right.`;
  }

  return "";
}

function extractLinkedInUrl(note: string) {
  return note.match(/https?:\/\/[^\s]+linkedin\.com\/[^\s]+/i)?.[0];
}

type ExtractedProfile = {
  personName: string;
  businessName: string;
  role?: string;
  location?: string;
};

const countryWords = [
  "Australia",
  "Malaysia",
  "New Zealand",
  "United Kingdom",
  "Singapore",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "United States",
  "Canada",
];

function cleanBusinessName(value: string) {
  return cleanText(value)
    .replace(/\s+(?:a\s+)?linkedin\b.*$/i, "")
    .replace(/\s+(?:a\s+)?(?:connection request|request|message|follow-?up)\b.*$/i, "")
    .replace(/\s+(?:after|because|mention(?:ing|ed)?|about|who|that|where|worth|already)\b.*$/i, "")
    .replace(/\s+-\s+.*$/, "")
    .replace(/\s+\d+(?:st|nd|rd|th)?\b.*$/i, "")
    .replace(/[.!,]$/, "")
    .trim();
}

function cleanPersonName(value: string) {
  return cleanText(value)
    .replace(/\b(?:1st|2nd|3rd)\b.*$/i, "")
    .replace(/\b(?:Connect|Message|Follow|Contact info)\b.*$/i, "")
    .replace(/[^A-Za-z' -]/g, "")
    .trim();
}

function locationCountry(location?: string) {
  const cleaned = cleanText(location);

  if (!cleaned) return "";

  const direct = countryWords.find((country) => new RegExp(`\\b${country}\\b`, "i").test(cleaned));

  if (direct) return direct;

  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? "";
}

function hasCountryMarker(company: string) {
  return /\b(?:AU|ANZ|Australia|Malaysia|New Zealand|United Kingdom|UK|Singapore|Indonesia|Thailand|Vietnam|Philippines|United States|USA|Canada)\b/i.test(company);
}

function withLocationSuffix(company: string, location?: string) {
  const cleanedCompany = cleanBusinessName(company);
  const country = locationCountry(location);

  if (!cleanedCompany || !country || hasCountryMarker(cleanedCompany)) return cleanedCompany;

  return `${cleanedCompany} ${country}`;
}

function isNoiseLine(line: string) {
  return /^(?:contact info|connect|message|follow|more|highlights|activity|experience|education|licenses|volunteering|show all|people you may know|more profiles for you)$/i.test(line) ||
    /(?:contact info|connections|mutual connection|followers|recent posts|verification|verified)/i.test(line);
}

function linkedinLines(note: string) {
  return note
    .split(/\r?\n|\s{2,}/)
    .map((line) => cleanText(line).replace(/\s+(?:\u00B7|-|\uFFFD)\s*(?:Contact info|1st|2nd|3rd).*$/i, ""))
    .filter((line) => line && !isNoiseLine(line));
}

function parseRoleBusinessLocation(value: string) {
  const headline = cleanText(value).replace(/\s+·\s+.*$/, "");
  const atMatch = headline.match(/^(.{2,90}?)\s+at\s+(.{2,90}?)(?:\s+(Greater [A-Z][A-Za-z ,]+|[A-Z][A-Za-z]+,\s*[A-Z][A-Za-z ,]+|Malaysia|Australia|Singapore|New Zealand|United Kingdom))?$/i);

  if (atMatch) {
    return {
      role: cleanText(atMatch[1]),
      businessName: withLocationSuffix(atMatch[2], atMatch[3]),
      location: cleanText(atMatch[3]),
    };
  }

  const commaMatch = headline.match(/^(.{2,80}?),\s+(.{2,90})$/);

  if (commaMatch) {
    return {
      role: cleanText(commaMatch[1]),
      businessName: cleanBusinessName(commaMatch[2]),
    };
  }

  return undefined;
}

function looksLikeNameLine(line: string) {
  const cleaned = cleanPersonName(line);
  const words = cleaned.split(/\s+/).filter(Boolean);

  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Z][A-Za-z'-]+$/.test(word));
}

function extractFromLinkedInLines(note: string): ExtractedProfile | undefined {
  const lines = linkedinLines(note);
  const nameIndex = lines.findIndex((line) => looksLikeNameLine(line));

  if (nameIndex < 0) return undefined;

  const personName = cleanPersonName(lines[nameIndex]);
  const headline = lines[nameIndex + 1] ?? "";
  const parsedHeadline = parseRoleBusinessLocation(headline);

  if (personName && parsedHeadline?.businessName) {
    const nextLocation = /^[A-Z][A-Za-z ,]+$/.test(lines[nameIndex + 2] ?? "") ? lines[nameIndex + 2] : parsedHeadline.location;

    return {
      personName,
      businessName: withLocationSuffix(parsedHeadline.businessName, nextLocation),
      role: parsedHeadline.role,
      location: nextLocation,
    };
  }

  const role = lines.find((line, index) => index > nameIndex && !isNoiseLine(line) && !/\b(?:Present|yrs?|mos?)\b/i.test(line));
  const business = role ? lines[lines.indexOf(role) + 1] : undefined;

  if (personName && role && business) {
    return {
      personName,
      businessName: cleanBusinessName(business),
      role,
    };
  }

  return undefined;
}

function extractPersonAndBusiness(note: string, context: Context): ExtractedProfile {
  const namePattern = "([A-Z][A-Za-z'-]+(?:\\s+[A-Z][A-Za-z'-]+){1,3})";
  const businessPattern = "([A-Za-z0-9][A-Za-z0-9&.' -]{1,90}?)(?=\\s+(?:a\\s+)?(?:linkedin|connection request|request|message|follow-?up)\\b|\\s+(?:after|because|mention(?:ing|ed)?|about|who|that|where|worth|already)\\b|\\s+-\\s+|[.!,]|$)";
  const isRoleMatch = note.match(new RegExp(`^\\s*${namePattern}\\s+is\\s+(.{2,90}?)\\s+at\\s+(.+?)(?:\\s+in\\s+([^.;]+))?(?:[.;]|$)`, "i"));

  if (isRoleMatch) {
    return {
      personName: cleanPersonName(isRoleMatch[1]),
      role: cleanText(isRoleMatch[2]),
      businessName: withLocationSuffix(isRoleMatch[3], isRoleMatch[4]),
      location: cleanText(isRoleMatch[4]),
    };
  }

  const linkedinProfile = extractFromLinkedInLines(note);

  if (linkedinProfile) return linkedinProfile;

  const actionPrefix = "(?:found|sent|asked|messaged|connected with|demo booked with|followed up with|replied to)";
  const directMatch = note.match(new RegExp(`^\\s*${actionPrefix}?\\s*${namePattern}\\s+(?:at|from|with)\\s+${businessPattern}`, "i"));
  const acceptedMatch = note.match(/([A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){1,3})\s+from\s+([A-Z][A-Za-z0-9&.' -]{1,60})\s+(?:accepted|replied|responded)/);
  const match = directMatch ?? acceptedMatch;

  if (match) {
    return {
      personName: cleanPersonName(match[1]),
      businessName: cleanBusinessName(match[2]),
    };
  }

  const lower = note.toLowerCase();
  const existing = context.pursuits.find((pursuit) => lower.includes(pursuit.personName.toLowerCase()));

  if (existing) {
    return {
      personName: existing.personName,
      businessName: existing.businessName,
    };
  }

  const business = context.businesses.find((item) => lower.includes(item.name.toLowerCase()));

  return {
    personName: "",
    businessName: business?.name ?? "Unknown company",
  };
}
function angleFromNote(note: string) {
  const mentioning = note.match(/mention(?:ing|ed)?\s+(.+?)(?:\.|$)/i)?.[1];
  const because = note.match(/because\s+(.+?)(?:\.|$)/i)?.[1];
  const relevant = note.match(/relevant\s+because\s+(.+?)(?:\.|$)/i)?.[1];
  const storeLab = note.match(/(?:worth reviewing for|useful for|good fit for|StoreLab|demo|retail execution).+?(?:\.|$)/i)?.[0];

  return cleanText(mentioning ?? relevant ?? because ?? storeLab ?? "");
}

export function fallbackPursuitAnalysis(note: string, context: Context): PursuitCaptureAnalysis {
  const cleaned = cleanText(note);
  const stage = inferStage(cleaned);
  const teaserVideoSent = /teaser|video/.test(cleaned.toLowerCase());
  const extracted = extractPersonAndBusiness(note, context);
  const { personName, businessName } = extracted;
  const person = splitName(personName);
  const storeLabAngle = angleFromNote(cleaned);
  const nextAction = nextActionForStage(stage, teaserVideoSent);

  return {
    confidence: person.firstName && businessName !== "Unknown company" ? "medium" : "low",
    originalNote: cleaned,
    person: {
      firstName: person.firstName,
      lastName: person.lastName,
      role: extracted.role,
      linkedinUrl: extractLinkedInUrl(cleaned),
    },
    business: {
      name: businessName,
    },
    stage,
    priority: ["Replied", "Demo Proposed", "Demo Booked"].includes(stage) ? "High" : "Medium",
    source: "LinkedIn",
    whatChanged: cleaned,
    whyRelevant: storeLabAngle || undefined,
    storeLabAngle: storeLabAngle || undefined,
    currentStatus: cleaned,
    nextAction,
    nextActionDueAt: dueDateForStage(stage),
    teaserVideoSent,
    messageText: /sent|asked|messaged/i.test(cleaned) ? cleaned : undefined,
    suggestedMessage: suggestedMessageForStage({
      stage,
      firstName: person.firstName,
      businessName,
      storeLabAngle,
      teaserVideoSent,
    }),
    touchpointType: touchpointTypeForStage(stage),
    touchpointSummary: cleaned,
    aiNotes: storeLabAngle || undefined,
  };
}

function normalizeAnalysis(value: unknown, fallback: PursuitCaptureAnalysis): PursuitCaptureAnalysis {
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Partial<PursuitCaptureAnalysis>;
  const stage = stages.includes(candidate.stage as PursuitStage)
    ? candidate.stage as PursuitStage
    : fallback.stage;

  return {
    confidence: candidate.confidence === "high" || candidate.confidence === "medium" || candidate.confidence === "low" ? candidate.confidence : fallback.confidence,
    originalNote: cleanText(candidate.originalNote) || fallback.originalNote,
    person: {
      firstName: cleanText(candidate.person?.firstName) || fallback.person.firstName,
      lastName: cleanText(candidate.person?.lastName) || fallback.person.lastName,
      role: cleanText(candidate.person?.role) || fallback.person.role,
      linkedinUrl: cleanText(candidate.person?.linkedinUrl) || fallback.person.linkedinUrl,
    },
    business: {
      name: cleanText(candidate.business?.name) || fallback.business.name,
    },
    stage,
    priority: candidate.priority === "High" || candidate.priority === "Medium" || candidate.priority === "Low" ? candidate.priority : fallback.priority,
    source: "LinkedIn",
    whatChanged: cleanText(candidate.whatChanged) || fallback.whatChanged,
    whyRelevant: cleanText(candidate.whyRelevant) || fallback.whyRelevant,
    storeLabAngle: cleanText(candidate.storeLabAngle) || fallback.storeLabAngle,
    currentStatus: cleanText(candidate.currentStatus) || fallback.currentStatus,
    nextAction: cleanText(candidate.nextAction) || nextActionForStage(stage, Boolean(candidate.teaserVideoSent ?? fallback.teaserVideoSent)),
    nextActionDueAt: cleanText(candidate.nextActionDueAt) || fallback.nextActionDueAt,
    teaserVideoSent: Boolean(candidate.teaserVideoSent ?? fallback.teaserVideoSent),
    messageText: cleanText(candidate.messageText) || fallback.messageText,
    suggestedMessage: cleanText(candidate.suggestedMessage) || fallback.suggestedMessage,
    touchpointType: cleanText(candidate.touchpointType) || touchpointTypeForStage(stage),
    touchpointSummary: cleanText(candidate.touchpointSummary) || fallback.touchpointSummary,
    aiNotes: cleanText(candidate.aiNotes) || fallback.aiNotes,
  };
}

export async function analysePursuitCapture(note: string, context: Context) {
  const fallback = fallbackPursuitAnalysis(note, context);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const prompt = `
You are the StoreLab OS LinkedIn Pursuit Brain.

Turn Aaron's rough LinkedIn workflow note into a proposed relationship pursuit update.
Do not write to the database. Return a confirmation only.

This is not a CRM. Use simple human language.
Default channel/source is LinkedIn.
Preserve what Aaron already said so future messages do not repeat the same angle awkwardly.

Existing context:
${JSON.stringify(context, null, 2)}

Aaron's note:
${note}

Stage options:
${stages.join(" | ")}

Message tone:
- short, warm, natural, specific
- no generic sales language
- no "hope this finds you well"
- soft next step, not pushy

Return ONLY JSON with this shape:
{
  "confidence": "low | medium | high",
  "originalNote": "the note",
  "person": { "firstName": "", "lastName": "", "role": "", "linkedinUrl": "" },
  "business": { "name": "" },
  "stage": "one stage option",
  "priority": "High | Medium | Low",
  "source": "LinkedIn",
  "whatChanged": "short plain-English summary",
  "whyRelevant": "why this person matters, if known",
  "storeLabAngle": "angle Aaron used or should use",
  "currentStatus": "where things are up to",
  "nextAction": "what Aaron should do next",
  "nextActionDueAt": "ISO date if useful",
  "teaserVideoSent": false,
  "messageText": "message Aaron sent, if the note says he sent one",
  "suggestedMessage": "draft message if useful",
  "touchpointType": "short snake_case type",
  "touchpointSummary": "what should be remembered",
  "aiNotes": "brief memory note"
}
`;

  try {
    const response = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return normalizeAnalysis(JSON.parse(cleanJsonResult(response.output_text)), fallback);
  } catch (error) {
    console.error("Pursuit Brain fallback used:", error);
    return fallback;
  }
}













