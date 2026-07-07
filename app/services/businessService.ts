import {
  addNotebookEntryToBusiness,
  archiveBusiness,
  createBusiness,
  getBusinesses,
  updateBusiness,
} from "../repositories/businessRepository";

function cleanOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalField(value: unknown) {
  const cleaned = cleanOptionalText(value);
  return cleaned || undefined;
}

export async function loadBusinesses() {
  return getBusinesses();
}

export async function createBusinessWorkspace(input: {
  name?: unknown;
  website?: unknown;
  industry?: unknown;
  country?: unknown;
  summary?: unknown;
}) {
  const name = cleanOptionalText(input.name);

  if (!name) {
    throw new Error("Business name is required.");
  }

  return createBusiness({
    name,
    website: optionalField(input.website),
    industry: optionalField(input.industry),
    country: optionalField(input.country),
    summary: optionalField(input.summary),
  });
}

export async function updateBusinessWorkspace(
  businessId: string,
  input: {
    name?: unknown;
    website?: unknown;
    industry?: unknown;
    country?: unknown;
    summary?: unknown;
  }
) {
  const name = cleanOptionalText(input.name);

  if (!name) {
    throw new Error("Business name is required.");
  }

  return updateBusiness(businessId, {
    name,
    website: cleanOptionalText(input.website),
    industry: cleanOptionalText(input.industry),
    country: cleanOptionalText(input.country),
    summary: cleanOptionalText(input.summary),
  });
}

export async function deleteBusinessWorkspace(businessId: string) {
  return archiveBusiness(businessId);
}

export async function createNotebookEntry(businessId: string, content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Note cannot be empty.");
  }

  return addNotebookEntryToBusiness(businessId, trimmedContent);
}