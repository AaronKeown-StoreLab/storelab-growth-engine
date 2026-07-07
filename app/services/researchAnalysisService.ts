import { loadBusinesses } from "./businessService";
import { analyseResearchSource } from "../brain/researchBrain";
import { ResearchBusinessContext, ResearchSourceForAnalysis } from "../types/research";

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function readUrlContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "StoreLabOS/1.0 Research Assistant",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const readable = contentType.includes("html") ? stripHtml(text) : text;

    return readable.slice(0, 12000);
  } catch {
    return "";
  }
}

function businessContext(businesses: Awaited<ReturnType<typeof loadBusinesses>>): ResearchBusinessContext[] {
  return businesses.map((business) => ({
    id: business.id,
    name: business.name,
    website: business.website,
    summary: business.summary,
    people: business.employments.map(
      (employment) =>
        `${employment.person.firstName} ${employment.person.lastName} ${employment.jobTitle ?? ""}`.trim()
    ),
  }));
}

export async function analyseResearchSourceRequest(
  source: ResearchSourceForAnalysis,
  preferredBusinessId?: string
) {
  const businesses = await loadBusinesses();
  const content =
    source.kind === "Website" && source.detail
      ? await readUrlContent(source.detail)
      : source.content ?? "";

  return analyseResearchSource({
    source: {
      ...source,
      content: content || source.content,
    },
    businesses: businessContext(businesses),
    preferredBusinessId,
  });
}