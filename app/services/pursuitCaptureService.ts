import { analysePursuitCapture } from "../brain/pursuitBrain";
import { approvePursuitCapture, listPursuits } from "../repositories/pursuitRepository";
import { loadBusinesses } from "./businessService";
import { PursuitCaptureAnalysis } from "../types/pursuit";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listLinkedInPursuits() {
  return listPursuits();
}

export async function analyseLinkedInPursuitNote(input: { note?: unknown }) {
  const note = cleanText(input.note);

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
