"use client";

import { useMemo, useState } from "react";
import { Business } from "../types/business";

type AssistantAction = {
  id: string;
  priority: "High" | "Medium" | "Low";
  type: "Follow-up" | "Role change" | "Opportunity";
  title: string;
  reason: string;
  business: Business;
  personName?: string;
  lastTouch?: string;
  drafts: string[];
};

type Props = {
  businesses: Business[];
  onOpenBusiness: (business: Business) => void;
};

function daysSince(value: string) {
  const then = new Date(value).getTime();
  const now = Date.now();

  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

function latestInteractionForPerson(business: Business, personId: string) {
  return business.interactions
    .filter((interaction) => interaction.personId === personId)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )[0];
}

function firstName(fullName: string) {
  return fullName.split(" ")[0] || fullName;
}

function followUpDrafts(input: {
  personName: string;
  businessName: string;
  jobTitle?: string | null;
  lastTouch?: string;
}) {
  const name = firstName(input.personName);
  const role = input.jobTitle ? ` in your ${input.jobTitle} role` : "";
  const lastTouch = input.lastTouch ? ` since ${input.lastTouch}` : " recently";

  return [
    `Hey ${name}, I was thinking about ${input.businessName} and realised we have not spoken${lastTouch}. Keen to hear what is on your radar${role}, especially around store growth and customer engagement. Worth a quick catch-up next week?`,
    `Hi ${name}, hope you are well. I wanted to reconnect because ${input.businessName} feels like a strong fit for what StoreLab is helping retailers solve. Would it be useful if I sent a short note or booked 15 minutes to compare priorities?`,
    `Hey ${name}, quick one. If improving retail execution or growth planning is still relevant at ${input.businessName}, I think there is a practical conversation here. Want me to send through a couple of ideas?`,
  ];
}

function opportunityDrafts(business: Business) {
  const opportunity = business.opportunities[0];
  const nextAction = opportunity?.nextAction || "compare priorities and next steps";

  return [
    `Hey, circling back on ${business.name}. The next useful step might be to ${nextAction}. Should we lock in 20 minutes and work out if there is a demo worth running?`,
    `Hi, I was reviewing where things are up to with ${business.name}. I think the clean next move is ${nextAction}. Are you open to a short working session this week?`,
    `Hey, rather than let this drift, should we put a quick time in to decide whether StoreLab is useful for ${business.name} now or better parked for later?`,
  ];
}

function roleChangeDrafts(title: string, business: Business) {
  const match = title.match(/^(.+?) joined /i);
  const person = match?.[1] || "this contact";
  const name = firstName(person);

  return [
    `Hey ${name}, saw the move to ${business.name}. Congratulations. Once you have found your feet, I would love to hear what you are focused on and whether StoreLab could be useful in the new role.`,
    `Hi ${name}, congrats on the new role at ${business.name}. No pitch from me today, just wanted to say well done. When timing is right, I would be keen to compare notes on what you are trying to improve there.`,
    `Hey ${name}, noticed you are now at ${business.name}. That feels worth a fresh chat when you have settled in. Want me to send a couple of thoughts relevant to the new role?`,
  ];
}

function buildActions(businesses: Business[]) {
  const actions: AssistantAction[] = [];

  for (const business of businesses) {
    for (const employment of business.employments) {
      const personName = `${employment.person.firstName} ${employment.person.lastName}`;
      const latestInteraction = latestInteractionForPerson(
        business,
        employment.person.id
      );
      const days = latestInteraction ? daysSince(latestInteraction.occurredAt) : null;

      const relationshipAge = daysSince(employment.createdAt);
      const personAge = daysSince(employment.person.createdAt);
      const isFreshlyAdded = Math.min(relationshipAge, personAge) < 14;
      const needsFollowUp = latestInteraction
        ? days !== null && days >= 21
        : !isFreshlyAdded && relationshipAge >= 30;

      if (needsFollowUp) {
        actions.push({
          id: `follow-${business.id}-${employment.person.id}`,
          priority: days === null || days >= 45 ? "High" : "Medium",
          type: "Follow-up",
          title: days !== null
            ? `You last heard from ${personName} ${days} days ago`
            : `${personName} has gone quiet`,
          reason: latestInteraction
            ? `Last ${latestInteraction.type}: ${latestInteraction.summary}`
            : `${personName} has been in the system for ${relationshipAge} days with no captured activity.`,
          business,
          personName,
          lastTouch: days !== null ? `${days} days ago` : undefined,
          drafts: followUpDrafts({
            personName,
            businessName: business.name,
            jobTitle: employment.jobTitle,
            lastTouch: days !== null ? `${days} days ago` : undefined,
          }),
        });
      }
    }

    const openOpportunity = business.opportunities.find(
      (opportunity) => opportunity.status !== "closed"
    );

    if (openOpportunity) {
      actions.push({
        id: `opp-${business.id}-${openOpportunity.id}`,
        priority: "High",
        type: "Opportunity",
        title: `Keep ${business.name} moving`,
        reason:
          openOpportunity.nextAction ||
          openOpportunity.summary ||
          "There is an open opportunity without a captured next move.",
        business,
        drafts: opportunityDrafts(business),
      });
    }

    for (const event of business.timeline.slice(0, 8)) {
      if (event.eventType !== "employment_joined") continue;

      actions.push({
        id: `move-${business.id}-${event.id}`,
        priority: "High",
        type: "Role change",
        title: event.summary,
        reason: "Role changes are warm timing moments. A light congratulations message is usually better than a hard sell.",
        business,
        drafts: roleChangeDrafts(event.summary, business),
      });
    }
  }

  return actions
    .sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 6);
}

export default function DailyAssistantPanel({ businesses, onOpenBusiness }: Props) {
  const actions = useMemo(() => buildActions(businesses), [businesses]);
  const [draftIndexes, setDraftIndexes] = useState<Record<string, number>>({});

  function currentDraft(action: AssistantAction) {
    const index = draftIndexes[action.id] ?? 0;

    return action.drafts[index % action.drafts.length];
  }

  function regenerate(action: AssistantAction) {
    setDraftIndexes((current) => ({
      ...current,
      [action.id]: ((current[action.id] ?? 0) + 1) % action.drafts.length,
    }));
  }

  if (!actions.length) {
    return (
      <section className="border border-white/10 bg-white/[0.02] p-5">
        <p className="text-xs uppercase text-cyan-300">Today&apos;s Assistant</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Nothing urgent yet</h2>
        <p className="mt-2 text-sm text-gray-500">
          Add conversations, opportunities, LinkedIn captures, and email/calendar signals here. StoreLab OS will turn them into daily actions.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-cyan-300/20 bg-cyan-300/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-cyan-300">Today&apos;s Assistant</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {actions.length} relationship move{actions.length === 1 ? "" : "s"}
          </h2>
        </div>
        <p className="border border-white/10 px-3 py-2 text-xs text-gray-400">
          Drafts ready
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {actions.map((action) => (
          <article key={action.id} className="border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200">
                    {action.type}
                  </span>
                  <span className="border border-white/10 px-2 py-1 text-xs text-gray-500">
                    {action.priority}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {action.reason}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenBusiness(action.business)}
                className="border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-cyan-300/50 hover:text-cyan-300"
              >
                Open
              </button>
            </div>

            <div className="mt-4 border-l border-cyan-300/40 bg-black/20 p-3">
              <p className="text-xs uppercase text-gray-600">Suggested reply</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-200">
                {currentDraft(action)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => regenerate(action)}
                className="border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-cyan-300/50 hover:text-cyan-300"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(currentDraft(action))}
                className="border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-cyan-300/50 hover:text-cyan-300"
              >
                Copy
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
