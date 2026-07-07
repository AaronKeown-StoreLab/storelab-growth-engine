import {
  addEvidenceToBusiness,
  addEvidenceToPerson,
  addPersonToBusiness,
  createBusiness,
  getBusinessById,
  updateBusiness,
} from "../repositories/businessRepository";
import { ResearchProposal, ResearchProposalAction } from "../types/research";

type ApprovalInput = {
  proposal?: ResearchProposal;
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

function getApprovalAction(value: unknown): ResearchProposalAction {
  if (value === "create_business" || value === "attach_to_business") {
    return value;
  }

  throw new Error("Approval action is required.");
}

function sourceFallback(input: ApprovalInput) {
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

function businessNameFromProposal(proposal: ResearchProposal, fallbackName: string) {
  return (
    cleanText(proposal.businessUpdates?.name) ||
    cleanText(proposal.businessName) ||
    fallbackName
  );
}

function isSocialOrProfileUrl(value: string) {
  if (!value) return false;

  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    const blockedHosts = [
      "linkedin.com",
      "facebook.com",
      "instagram.com",
      "x.com",
      "twitter.com",
    ];

    return blockedHosts.some(
      (blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`)
    );
  } catch {
    return false;
  }
}

function approvedBusinessWebsite(explicitWebsite: unknown, sourceDetail?: string) {
  const website = cleanText(explicitWebsite);

  if (website && !isSocialOrProfileUrl(website)) return website;

  const sourceUrl = cleanText(sourceDetail);

  if (/^https?:\/\//i.test(sourceUrl) && !isSocialOrProfileUrl(sourceUrl)) {
    return sourceUrl;
  }

  return "";
}

export async function approveResearchSource(input: ApprovalInput) {
  if (!input.proposal) {
    throw new Error("Approval proposal is required.");
  }

  const proposal = input.proposal;
  const action = getApprovalAction(proposal.action);
  const source = sourceFallback(input);
  let businessId = cleanText(proposal.businessId);

  if (action === "create_business") {
    const business = await createBusiness({
      name: businessNameFromProposal(proposal, source.name),
      website: approvedBusinessWebsite(proposal.businessUpdates?.website, source.detail),
      industry: cleanText(proposal.businessUpdates?.industry),
      country: cleanText(proposal.businessUpdates?.country),
      summary:
        cleanText(proposal.businessUpdates?.summary) ||
        cleanText(proposal.description) ||
        `Created from approved research source: ${source.name}.`,
    });

    businessId = business.id;
  }

  if (!businessId) {
    throw new Error("Choose a business before approving this source.");
  }

  if (action === "attach_to_business" && proposal.businessUpdates) {
    const current = await getBusinessById(businessId);

    if (current) {
      await updateBusiness(businessId, {
        name: cleanText(proposal.businessUpdates.name) || current.name,
        website: approvedBusinessWebsite(proposal.businessUpdates.website) || current.website || "",
        industry: cleanText(proposal.businessUpdates.industry) || current.industry || "",
        country: cleanText(proposal.businessUpdates.country) || current.country || "",
        summary: cleanText(proposal.businessUpdates.summary) || current.summary || "",
      });
    }
  }

  const personFirstName = cleanText(proposal.person?.firstName);
  const personLastName = cleanText(proposal.person?.lastName);
  let approvedPersonId = "";

  if (personFirstName && personLastName) {
    const approvedPerson = await addPersonToBusiness({
      businessId,
      firstName: personFirstName,
      lastName: personLastName,
      jobTitle: cleanText(proposal.person?.jobTitle),
      linkedinUrl: cleanText(proposal.person?.linkedinUrl),
      email: cleanText(proposal.person?.email),
      notes: cleanText(proposal.person?.notes),
    });
    approvedPersonId = approvedPerson.id;
  }

  const evidenceTitle = cleanText(proposal.evidenceTitle) || source.name;
  const evidenceContent = cleanText(proposal.evidenceContent) || source.content || source.name;

  await addEvidenceToBusiness({
    businessId,
    type: source.kind.toLowerCase(),
    title: evidenceTitle,
    content: evidenceContent,
    source: source.detail,
  });

  if (approvedPersonId) {
    await addEvidenceToPerson({
      personId: approvedPersonId,
      type: source.kind.toLowerCase(),
      title: evidenceTitle,
      content: evidenceContent,
      source: source.detail,
    });
  }
  const business = await getBusinessById(businessId);

  if (!business) {
    throw new Error("Approved source was saved, but the business could not be reloaded.");
  }

  return business;
}

