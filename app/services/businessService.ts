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

function isPersonOrSocialProfileUrl(value: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    return (
      host === "linkedin.com" ||
      host.endsWith(".linkedin.com") ||
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "instagram.com" ||
      host.endsWith(".instagram.com") ||
      host === "x.com" ||
      host === "twitter.com"
    );
  } catch {
    return false;
  }
}

function cleanBusinessWebsite(value: unknown) {
  const cleaned = cleanOptionalText(value);

  return isPersonOrSocialProfileUrl(cleaned) ? "" : cleaned;
}

function optionalField(value: unknown) {
  const cleaned = cleanBusinessWebsite(value);
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
    website: cleanBusinessWebsite(input.website),
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
