"use client";

import { Business } from "../types/business";
import { ResearchProposal } from "../types/research";

type PendingProposal = ResearchProposal & {
  id: string;
  sourceId: string;
};

type Props = {
  proposal: PendingProposal;
  businesses: Business[];
  isWorking: boolean;
  onApprove: (proposal: PendingProposal) => void;
  onDelete: (proposalId: string) => void;
  onChange: (proposal: PendingProposal) => void;
};

type BusinessUpdateKey = NonNullable<ResearchProposal["businessUpdates"]> extends infer T
  ? keyof T
  : never;

type PersonKey = NonNullable<ResearchProposal["person"]> extends infer T
  ? keyof T
  : never;

function confidenceLabel(value: ResearchProposal["confidence"]) {
  if (value === "high") return "High confidence";
  if (value === "medium") return "Medium confidence";

  return "Low confidence";
}

function normalise(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function personExistsInBusinesses(proposal: PendingProposal, businesses: Business[]) {
  const firstName = normalise(proposal.person?.firstName);
  const lastName = normalise(proposal.person?.lastName);
  const linkedinUrl = normalise(proposal.person?.linkedinUrl);
  const email = normalise(proposal.person?.email);

  return businesses.some((business) =>
    business.employments.some((employment) => {
      const person = employment.person;
      const sameLinkedIn = linkedinUrl && normalise(person.linkedinUrl) === linkedinUrl;
      const sameEmail = email && normalise(person.email) === email;
      const sameName =
        firstName &&
        lastName &&
        normalise(person.firstName) === firstName &&
        normalise(person.lastName) === lastName;

      return Boolean(sameLinkedIn || sameEmail || sameName);
    })
  );
}

export default function ResearchProposalCard({
  proposal,
  businesses,
  isWorking,
  onApprove,
  onDelete,
  onChange,
}: Props) {
  const isExistingPerson = personExistsInBusinesses(proposal, businesses);
  const isLinkedInPerson = Boolean(proposal.person?.linkedinUrl?.includes("linkedin.com"));
  const connectionAccepted = proposal.person?.connectionStatus === "accepted";
  const needsAcceptedConnection =
    isLinkedInPerson &&
    Boolean(proposal.person?.firstName && proposal.person?.lastName) &&
    !isExistingPerson &&
    !connectionAccepted;
  const canApprove = proposal.action !== "needs_more_context" && !needsAcceptedConnection;

  function updateProposal(patch: Partial<PendingProposal>) {
    onChange({
      ...proposal,
      ...patch,
    });
  }

  function updateBusinessField(key: BusinessUpdateKey, value: string) {
    const nextBusinessUpdates = {
      ...(proposal.businessUpdates ?? {}),
      [key]: value,
    };

    onChange({
      ...proposal,
      businessName: key === "name" ? value : proposal.businessName,
      businessUpdates: nextBusinessUpdates,
    });
  }

  function updatePersonField(key: PersonKey, value: string) {
    onChange({
      ...proposal,
      person: {
        ...(proposal.person ?? {}),
        [key]: value,
      },
    });
  }

  function markConnectionAccepted() {
    onChange({
      ...proposal,
      person: {
        ...(proposal.person ?? {}),
        connectionStatus: "accepted",
      },
    });
  }

  function selectBusiness(businessId: string) {
    if (!businessId) {
      onChange({
        ...proposal,
        action: "create_business",
        businessId: undefined,
      });
      return;
    }

    const business = businesses.find((item) => item.id === businessId);

    if (!business) return;

    const personName = [proposal.person?.firstName, proposal.person?.lastName]
      .filter(Boolean)
      .join(" ");

    onChange({
      ...proposal,
      action: "attach_to_business",
      businessId: business.id,
      businessName: business.name,
      title: personName
        ? `Add ${personName} to ${business.name}`
        : `Add source to ${business.name}`,
      businessUpdates: {
        ...(proposal.businessUpdates ?? {}),
        name: business.name,
        website: business.website ?? "",
        industry: business.industry ?? "",
        country: business.country ?? "",
        summary: proposal.businessUpdates?.summary ?? business.summary ?? "",
      },
    });
  }

  return (
    <div className="border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-white/10 px-2 py-1 text-xs text-gray-500">
              {proposal.action.replace(/_/g, " ")}
            </span>
            <span className="border border-white/10 px-2 py-1 text-xs text-gray-500">
              {confidenceLabel(proposal.confidence)}
            </span>
          </div>

          <input
            value={proposal.title}
            onChange={(event) => updateProposal({ title: event.target.value })}
            className="mt-3 w-full border border-white/10 bg-black/30 px-3 py-2 text-sm font-medium text-white outline-none focus:border-cyan-300/70"
          />

          <textarea
            value={proposal.description}
            onChange={(event) => updateProposal({ description: event.target.value })}
            rows={2}
            className="mt-2 w-full resize-none border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-gray-300 outline-none focus:border-cyan-300/70"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDelete(proposal.id)}
            className="min-h-10 border border-white/10 px-3 text-sm text-gray-500 transition hover:border-red-300/50 hover:text-red-200"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => onApprove(proposal)}
            disabled={isWorking || !canApprove}
            className="min-h-10 border border-cyan-300 px-4 text-sm font-medium text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {needsAcceptedConnection ? "Awaiting Accept" : !canApprove ? "Needs Source" : isWorking ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>


      {needsAcceptedConnection && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-amber-300/30 bg-amber-300/5 p-3">
          <p className="text-xs leading-relaxed text-amber-100">
            New LinkedIn prospect. Send the connection request first; add them as a customer after they accept.
          </p>
          <button
            type="button"
            onClick={markConnectionAccepted}
            className="border border-amber-200/60 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-200 hover:text-black"
          >
            Mark Accepted
          </button>
        </div>
      )}
      {proposal.action === "needs_more_context" && (
        <p className="mt-3 border-l border-amber-300/50 pl-3 text-xs text-amber-200">
          Add profile text, a screenshot, or a fuller webpage capture so the Brain can identify the employer before saving anything.
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs uppercase text-gray-600">Business Preview</p>

          <div className="mt-3 space-y-2">
            <select
              value={proposal.action === "attach_to_business" ? proposal.businessId ?? "" : ""}
              onChange={(event) => selectBusiness(event.target.value)}
              className="w-full border border-cyan-300/30 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/70"
            >
              <option value="">Create a new business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <input
              value={proposal.businessUpdates?.name ?? proposal.businessName ?? ""}
              onChange={(event) => updateBusinessField("name", event.target.value)}
              placeholder="Business name"
              className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={proposal.businessUpdates?.industry ?? ""}
                onChange={(event) => updateBusinessField("industry", event.target.value)}
                placeholder="Industry"
                className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
              />
              <input
                value={proposal.businessUpdates?.country ?? ""}
                onChange={(event) => updateBusinessField("country", event.target.value)}
                placeholder="Country"
                className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
              />
            </div>
            <textarea
              value={proposal.businessUpdates?.summary ?? ""}
              onChange={(event) => updateBusinessField("summary", event.target.value)}
              placeholder="Why this business matters"
              rows={3}
              className="w-full resize-none border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
            />
          </div>
        </section>

        <section className="border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs uppercase text-gray-600">Customer Preview</p>

          <div className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={proposal.person?.firstName ?? ""}
                onChange={(event) => updatePersonField("firstName", event.target.value)}
                placeholder="First name"
                className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
              />
              <input
                value={proposal.person?.lastName ?? ""}
                onChange={(event) => updatePersonField("lastName", event.target.value)}
                placeholder="Last name"
                className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
              />
            </div>
            <input
              value={proposal.person?.jobTitle ?? ""}
              onChange={(event) => updatePersonField("jobTitle", event.target.value)}
              placeholder="Role / title"
              className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
            />
            <input
              value={proposal.person?.linkedinUrl ?? ""}
              onChange={(event) => updatePersonField("linkedinUrl", event.target.value)}
              placeholder="Person LinkedIn URL"
              className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
            />
            <input
              value={proposal.person?.email ?? ""}
              onChange={(event) => updatePersonField("email", event.target.value)}
              placeholder="Email"
              className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
            />
            <textarea
              value={proposal.person?.notes ?? ""}
              onChange={(event) => updatePersonField("notes", event.target.value)}
              placeholder="Important StoreLab context"
              rows={3}
              className="w-full resize-none border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
            />
          </div>
        </section>
      </div>

      <section className="mt-4 border border-white/10 bg-white/[0.02] p-3">
        <p className="text-xs uppercase text-gray-600">Evidence Preview</p>
        <input
          value={proposal.evidenceTitle}
          onChange={(event) => updateProposal({ evidenceTitle: event.target.value })}
          className="mt-3 w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/70"
        />
        <textarea
          value={proposal.evidenceContent}
          onChange={(event) => updateProposal({ evidenceContent: event.target.value })}
          rows={3}
          className="mt-2 w-full resize-none border border-white/10 bg-black/30 px-3 py-2 text-sm leading-relaxed text-gray-300 outline-none focus:border-cyan-300/70"
        />
      </section>
    </div>
  );
}

