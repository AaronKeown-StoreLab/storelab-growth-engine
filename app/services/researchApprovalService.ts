import {
  addEvidenceToBusiness,
  createBusiness,
  getBusinessById,
} from "../repositories/businessRepository";

type ApprovalAction = "create_business" | "attach_to_business";

type ApprovalInput = {
  action?: unknown;
  businessId?: unknown;
  businessName?: unknown;
  website?: unknown;
  source?: {
    name?: unknown;
    kind?: unknown;
    detail?: unknown;
    detected?: unknown;
  };
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getApprovalAction(value: unknown): ApprovalAction {
  if (value === "create_business" || value === "attach_to_business") {
    return value;
  }

  throw new Error("Approval action is required.");
}

function sourceContent(input: ApprovalInput) {
  const source = input.source ?? {};
  const name = cleanText(source.name) || "Research source";
  const kind = cleanText(source.kind) || "Source";
  const detail = cleanText(source.detail);
  const detected = Array.isArray(source.detected)
    ? source.detected.map(cleanText).filter(Boolean)
    : [];

  return {
    name,
    kind,
    detail,
    detected,
    content: [detail, detected.length ? `Detected: ${detected.join(", ")}` : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

function websiteFromSource(input: ApprovalInput) {
  const explicitWebsite = cleanText(input.website);
  if (explicitWebsite) return explicitWebsite;

  const detail = cleanText(input.source?.detail);

  if (/^https?:\/\//i.test(detail)) return detail;

  return "";
}

export async function approveResearchSource(input: ApprovalInput) {
  const action = getApprovalAction(input.action);
  const source = sourceContent(input);
  let businessId = cleanText(input.businessId);

  if (action === "create_business") {
    const businessName = cleanText(input.businessName) || source.name;

    const business = await createBusiness({
      name: businessName,
      website: websiteFromSource(input),
      summary: `Created from approved research source: ${source.name}.`,
    });

    businessId = business.id;
  }

  if (!businessId) {
    throw new Error("Choose a business before approving this source.");
  }

  await addEvidenceToBusiness({
    businessId,
    type: source.kind.toLowerCase(),
    title: source.name,
    content: source.content || source.name,
    source: source.detail,
  });

  const business = await getBusinessById(businessId);

  if (!business) {
    throw new Error("Approved source was saved, but the business could not be reloaded.");
  }

  return business;
}