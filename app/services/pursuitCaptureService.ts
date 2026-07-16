import { analysePursuitCapture } from "../brain/pursuitBrain";
import { approvePursuitCapture, listPursuits } from "../repositories/pursuitRepository";
import { loadBusinesses } from "./businessService";
import { PursuitCaptureAnalysis } from "../types/pursuit";

// --- NEW CLEANER: Removes hidden "junk" from LinkedIn HTML to save money ---
function distillLinkedInText(text: string): string {
  if (!text) return "";
  // If it looks like raw HTML, we strip out the tags (the expensive part)
  if (text.includes('<') && text.includes('>')) {
    return text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }
  return text.trim();
}

export async function listLinkedInPursuits() {
  return listPursuits();
}

export async function analyseLinkedInPursuitNote(input: { note?: unknown }) {
  // Scrub the text immediately to save money
  const note = distillLinkedInText(String(input.note ?? ""));

  if (!note) {
    throw new Error("Tell StoreLab what happened on LinkedIn first.");
  }

  const businesses = await loadBusinesses();
  const pursuits = await listPursuits();

  return analysePursuitCapture(note, {
    businesses: businesses.map((business) => ({
      id: business.id,
      name: business.name,
      people: business.employments.map((employment) =>
        `${employment.person.firstName} ${employment.person.lastName} ${employment.jobTitle ?? ""}`.trim()
      ),
    })),
    pursuits: pursuits.map((pursuit) => ({
      id: pursuit.id,
      personName: `${pursuit.person.firstName} ${pursuit.person.lastName}`.trim(),
      businessName: pursuit.business.name,
      stage: pursuit.stage,
      nextAction: pursuit.nextAction,
      storeLabAngle: pursuit.storeLabAngle,
    })),
  });
}

export async function approveLinkedInPursuit(input: { analysis?: PursuitCaptureAnalysis }) {
  if (!input.analysis) {
    throw new Error("Review a LinkedIn pursuit update before saving it.");
  }
  return approvePursuitCapture(input.analysis);
}