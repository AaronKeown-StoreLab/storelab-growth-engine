import {
  addNotebookEntryToBusiness,
  createBusiness,
  getBusinesses,
} from "../repositories/businessRepository";

function cleanOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function loadBusinesses() {
  return getBusinesses();
}

export async function createBusinessWorkspace(input: {
  name?: unknown;
  website?: unknown;
  summary?: unknown;
}) {
  const name = cleanOptionalText(input.name);
  const website = cleanOptionalText(input.website);
  const summary = cleanOptionalText(input.summary);

  if (!name) {
    throw new Error("Business name is required.");
  }

  return createBusiness({
    name,
    website,
    summary,
  });
}

export async function createNotebookEntry(businessId: string, content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Note cannot be empty.");
  }

  return addNotebookEntryToBusiness(businessId, trimmedContent);
}