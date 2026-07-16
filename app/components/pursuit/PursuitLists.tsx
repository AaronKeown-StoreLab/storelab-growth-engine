"use client";

import { type ReactNode, useMemo, useState } from "react";
import { PursuitListItem } from "../../types/pursuit";

type Props = {
  pursuits: PursuitListItem[];
  loading: boolean;
};

const activeStages = new Set(["Found", "Message Drafted", "Connection Sent", "Connected", "Follow-up Sent", "Demo Proposed", "Demo Accepted", "Email / Time Requested", "Email Captured", "Email Sent", "Calendar Sent", "Demo Booked"]);
const successfulStages = new Set(["Successful Connection"]);
const staleAfterDays = 90;
const archiveStages = new Set(["Parked"]);
const statusSortOrder = [
  "Message needed",
  "Request sent",
  "Connected",
  "Follow-up sent",
  "Demo proposed",
  "Demo accepted",
  "Email requested",
  "Email captured",
  "Email sent",
  "Calendar sent",
  "Demo booked",
  "Wins",
  "Need tactic",
  "Archived",
  "Not relevant",
  "Found",
];

const actionOptions = [
  ["request-sent", "Request sent"],
  ["connected", "Connected"],
  ["demo-proposed", "Demo proposed"],
  ["demo-accepted", "Demo accepted"],
  ["email-received", "Email received"],
  ["email-sent", "Email sent"],
  ["calendar-sent", "Calendar sent"],
  ["booked", "Booked"],
  ["successful-connection", "Wins"],
  ["need-tactic", "Need tactic"],
];

function personName(pursuit: PursuitListItem) {
  return `${pursuit.person.firstName} ${pursuit.person.lastName}`.trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(stage: string) {
  const labels: Record<string, string> = {
    Found: "Found",
    "Message Drafted": "Message needed",
    "Connection Sent": "Request sent",
    Connected: "Connected",
    "Follow-up Sent": "Follow-up sent",
    "Demo Proposed": "Demo proposed",
    "Demo Accepted": "Demo accepted",
    "Email / Time Requested": "Email requested",
    "Email Captured": "Email captured",
    "Email Sent": "Email sent",
    "Calendar Sent": "Calendar sent",
    "Demo Booked": "Demo booked",
    "Successful Connection": "Wins",
    "Gone Quiet": "Need tactic",
    Parked: "Archived",
    "Not Relevant": "Not relevant",
  };

  return labels[stage] ?? stage;
}

function displayStatus(pursuit: PursuitListItem) {
  return statusLabel(pursuit.stage);
}

function defaultProjectAction(stage: string) {
  if (stage === "Found" || stage === "Message Drafted" || stage === "Connection Sent") return "request-sent";
  if (stage === "Connected" || stage === "Follow-up Sent") return "connected";
  if (stage === "Demo Proposed") return "demo-proposed";
  if (stage === "Demo Accepted") return "demo-accepted";
  if (stage === "Email / Time Requested" || stage === "Email Captured") return "email-received";
  if (stage === "Email Sent") return "email-sent";
  if (stage === "Calendar Sent") return "calendar-sent";
  if (stage === "Demo Booked") return "booked";
  if (stage === "Successful Connection") return "successful-connection";
  if (stage === "Gone Quiet") return "need-tactic";
  if (stage === "Parked") return "need-tactic";

  return "request-sent";
}

function nextActionForStage(stage: string) {
  if (stage === "Found") return "Draft a short, personal connection request.";
  if (stage === "Message Drafted") return "Review the suggested connection message, then send the LinkedIn request.";
  if (stage === "Connection Sent") return "Monitor for the connection request to be accepted.";
  if (stage === "Connected") return "Send a warm follow-up and decide whether to softly mention StoreLab.";
  if (stage === "Follow-up Sent") return "Monitor for a reply, then follow up lightly if they go quiet.";
  if (stage === "Demo Proposed") return "Monitor for their reply to the demo suggestion.";
  if (stage === "Demo Accepted") return "Ask for their email address and say you will lock in time by email.";
  if (stage === "Email / Time Requested") return "Monitor for their email address or availability.";
  if (stage === "Email Captured") return "Send an email to confirm day, time, and Teams or onsite Pymble.";
  if (stage === "Email Sent") return "Send the calendar booking once the time is agreed.";
  if (stage === "Calendar Sent") return "Monitor for the calendar booking to be accepted.";
  if (stage === "Demo Booked") return "Prepare the StoreLab demo brief and best angle.";
  if (stage === "Successful Connection") return "Keep this relationship warm and watch for the next useful business signal.";
  if (stage === "Gone Quiet") return "Try a different angle, channel, or timing before giving up.";
  if (stage === "Parked") return "Leave parked until a stronger signal appears.";

  return "Review this relationship and decide the next outreach step.";
}

function restoreStageFor(pursuit: PursuitListItem) {
  if (!archiveStages.has(pursuit.stage)) return "Connected";

  const archiveInteraction = pursuit.interactions.find((interaction) => /Previous status:/i.test(interaction.summary));
  const match = archiveInteraction?.summary.match(/Previous status:\s*([^.;]+)/i);
  const previousStage = match?.[1]?.trim();

  return previousStage && activeStages.has(previousStage) ? previousStage : "Connected";
}
function olderThanDays(value: string, days: number) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > days * 24 * 60 * 60 * 1000;
}

function latestActivityDate(pursuit: PursuitListItem) {
  const latestInteraction = pursuit.interactions[0]?.occurredAt;
  return latestInteraction && new Date(latestInteraction).getTime() > new Date(pursuit.updatedAt).getTime()
    ? latestInteraction
    : pursuit.updatedAt;
}

function ageInDays(pursuit: PursuitListItem) {
  const timestamp = new Date(latestActivityDate(pursuit)).getTime();
  if (Number.isNaN(timestamp)) return 0;

  return Math.max(0, Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000)));
}

function sourcePathLabel(source?: string | null) {
  return /email|referral|cc|thread/i.test(source ?? "") ? "Existing relationship / email cc" : "LinkedIn / cold";
}

function statusRank(pursuit: PursuitListItem) {
  const index = statusSortOrder.indexOf(displayStatus(pursuit));
  return index === -1 ? statusSortOrder.length : index;
}

function NoteTimeline({ pursuit }: { pursuit: PursuitListItem }) {
  const notes = pursuit.interactions.filter((interaction) => interaction.type === "note");
  const latest = notes[0];

  return (
    <section className="mt-3 border border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase text-cyan-300">Notes</p>
          <p className="mt-0.5 text-xs text-slate-600">Latest note visible. Expand to add or review more.</p>
        </div>
        <span className="grid h-7 min-w-7 place-items-center border border-white/10 px-2 text-xs text-slate-500">{notes.length}</span>
      </div>

      {latest ? (
        <div className="mt-2 border border-white/10 bg-black/20 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
            <span>{formatDateTime(latest.occurredAt)}</span>
            <span>{latest.aiNotes || "Status not recorded"}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-300">{latest.summary}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No notes yet.</p>
      )}

      <details className="mt-2 border border-white/10 bg-black/10 p-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10px] font-medium uppercase text-slate-500">
          <span>More notes / add note</span>
          <span>{notes.length}</span>
        </summary>
        <div className="mt-2 space-y-2">
          {notes.length ? (
            notes.map((note) => (
              <article key={note.id} className="border border-white/10 bg-black/20 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
                  <span>{formatDateTime(note.occurredAt)}</span>
                  <span>{note.aiNotes || "Status not recorded"}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-300">{note.summary}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">Add the first note below.</p>
          )}
        </div>

        <div className="mt-3 grid gap-2 border border-white/10 bg-black/10 p-2.5">
          <label className="block">
            <span className="text-[10px] font-medium uppercase text-slate-500">New note</span>
            <textarea
              data-project-note
              rows={2}
              placeholder="Add a note..."
              className="mt-1 w-full resize-none border border-white/10 bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60"
            />
          </label>
          <button type="button" data-project-add-note className="h-10 border border-white/10 px-3 text-xs text-slate-200 transition hover:border-cyan-300/50 hover:text-white">
            Save note
          </button>
        </div>
      </details>
    </section>
  );
}
export function PursuitRow({ pursuit, selectable = false, selected = false, onToggle }: { pursuit: PursuitListItem; selectable?: boolean; selected?: boolean; onToggle?: (id: string) => void }) {
  const latest = pursuit.interactions[0];
  const status = pursuit.currentStatus ?? latest?.summary ?? "";
  const name = personName(pursuit);
  const isArchived = archiveStages.has(pursuit.stage);
  const isSuccessful = successfulStages.has(pursuit.stage);
  const isClosed = isArchived || isSuccessful;
  const restoreLabel = isSuccessful ? "Reopen" : "Restore";
  const ageDays = ageInDays(pursuit);
  const pathLabel = sourcePathLabel(pursuit.source);

  return (
    <details
      id={`pursuit-${pursuit.id}`}
      data-entry-card
      data-active-row
      data-project-card
      data-pursuit-id={pursuit.id}
      data-current-stage={pursuit.stage}
      data-status-label={displayStatus(pursuit)}
      data-person-name={name}
      data-business-name={pursuit.business.name}
      data-person-role={pursuit.person.role ?? ""}
      data-person-location={pursuit.person.location ?? ""}
      data-person-linkedin-url={pursuit.person.linkedinUrl ?? ""}
      data-pursuit-source={pursuit.source}
      data-active-status={displayStatus(pursuit)}
      data-active-updated-at={pursuit.updatedAt}
      data-active-search={`${name} ${pursuit.business.name} ${pursuit.person.role ?? ""} ${pursuit.person.location ?? ""} ${pathLabel} ${displayStatus(pursuit)} ${pursuit.currentStatus ?? ""} ${pursuit.nextAction ?? ""}`.toLowerCase()}
      data-restore-stage={restoreStageFor(pursuit)}
      className={`group my-1 w-full min-w-0 overflow-hidden border border-l-2 px-2 py-3 transition odd:border-l-cyan-300/25 odd:bg-white/[0.035] even:border-l-slate-400/20 even:bg-cyan-300/[0.055] hover:border-white/20 hover:bg-cyan-300/[0.07] open:border-cyan-300/50 open:border-l-cyan-300/80 open:bg-cyan-300/[0.085] open:shadow-[0_0_0_1px_rgba(103,232,249,0.25)] ${selected ? "bg-cyan-300/[0.08]" : ""} ${isSuccessful ? "border-emerald-300/20 bg-white/[0.015] opacity-75 open:opacity-100" : "border-white/10"}`}
    >
      <summary className="cursor-pointer list-none">
        <div className={`grid min-w-0 ${selectable ? "grid-cols-[1.25rem_minmax(0,1fr)]" : "grid-cols-1"} gap-2`}>
          {selectable && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggle?.(pursuit.id);
              }}
              aria-pressed={selected}
              aria-label={`${selected ? "Deselect" : "Select"} ${name}`}
              className={`flex size-5 shrink-0 items-center justify-center border transition ${selected ? "border-cyan-300/60 bg-cyan-300/[0.08] shadow-[0_0_0_1px_rgba(103,232,249,0.12)]" : "border-white/20 bg-black/40 hover:border-cyan-300/60 hover:bg-cyan-300/[0.08]"}`}
            >
              {selected ? <span className="h-2 w-1.5 rotate-45 border-b border-r border-cyan-100" /> : null}
            </button>
          )}

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 data-summary-name className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{name}</h3>
              <span className="shrink-0 text-[10px] font-medium text-slate-500">{ageDays}d</span>
              <button
                type="button"
                data-edit-credentials
                aria-label="Toggle credential editing"
                className="h-7 min-w-12 shrink-0 border border-white/10 px-2 text-[10px] font-medium text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
              >
                Edit
              </button>
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-4">
              <span data-summary-business className="max-w-full truncate text-sm font-semibold text-white">{pursuit.business.name}</span>
              <span className="text-slate-700">/</span>
              <span data-summary-role className="max-w-full truncate text-xs font-medium text-slate-400">{pursuit.person.role ?? ""}</span>
            </div>
            <p data-summary-next className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">
              {pursuit.nextAction || status || "No next action yet."}
            </p>
            {pursuit.storeLabAngle && (
              <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">
                {pursuit.storeLabAngle}
              </p>
            )}
          </div>

          <div className={`${selectable ? "col-span-2" : ""} flex shrink-0 items-center justify-end`}>
            <select
              data-summary-stage
              data-quick-project-action
              defaultValue={defaultProjectAction(pursuit.stage)}
              aria-label={`Update status for ${name}`}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              className="grid h-9 w-full cursor-pointer appearance-none place-items-center whitespace-nowrap border border-cyan-300/50 bg-cyan-300/[0.12] px-3 text-center text-[11px] font-semibold leading-none text-cyan-50 outline-none shadow-[0_0_0_1px_rgba(103,232,249,0.10)] transition hover:border-cyan-300 focus:border-cyan-200"
            >
              {actionOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </summary>

      <div className="mt-3 min-w-0 overflow-hidden border border-cyan-300/15 bg-cyan-300/[0.03] p-3">
        <div className="grid gap-3">
          <label className="block">
            <span className="text-[10px] font-medium uppercase text-cyan-300">Project update</span>
            <select
              data-project-action
              defaultValue={defaultProjectAction(pursuit.stage)}
              className="mt-1 h-10 w-full border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-cyan-300/60"
            >
              {actionOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase text-cyan-300">Next action</span>
            <textarea
              data-entry-field="nextAction"
              defaultValue={pursuit.nextAction ?? nextActionForStage(pursuit.stage)}
              rows={2}
              className="mt-1 w-full resize-none border border-white/10 bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none focus:border-cyan-300/60"
            />
          </label>
        </div>

        <div data-project-fields className="mt-3 grid gap-2" />
        <details className="mt-3 border border-white/10 bg-black/15 p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[10px] font-medium uppercase text-slate-500">
            <span>Relationship history</span>
            <span className="text-slate-600">{pursuit.interactions.length}</span>
          </summary>
          <div className="mt-3 space-y-2">
            {pursuit.interactions.length ? (
              pursuit.interactions.map((interaction) => (
                <article key={interaction.id} className="border border-white/10 bg-black/20 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">{formatDateTime(interaction.occurredAt)}</span>
                    <span className="text-[10px] uppercase text-slate-600">{interaction.channel}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-300">{interaction.summary}</p>
                  {interaction.aiNotes && <p className="mt-1 text-[10px] text-slate-600">{interaction.aiNotes}</p>}
                  {interaction.messageText && <p className="mt-2 whitespace-pre-wrap border-l border-cyan-300/20 pl-3 text-xs leading-5 text-slate-500">{interaction.messageText}</p>}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recorded history yet.</p>
            )}
          </div>
        </details>

        <NoteTimeline pursuit={pursuit} />

        <div data-project-message-coach className="mt-3 border border-cyan-300/15 bg-cyan-300/[0.04] p-3" />

        <label className="mt-3 block border border-white/10 bg-black/20 p-3">
          <span className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-medium uppercase text-cyan-300">Sent message</span>
            <span className="text-[10px] text-slate-600">Required before save</span>
          </span>
          <textarea
            data-project-sent-message
            rows={3}
            placeholder="Use a generated message, or paste/type the message you actually sent..."
            className="mt-2 w-full resize-none border border-white/10 bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-[10px] font-medium uppercase text-slate-500">Last action</span>
          <textarea
            data-entry-field="currentStatus"
            defaultValue={status}
            rows={2}
            className="mt-1 w-full resize-none border border-white/10 bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none focus:border-cyan-300/60"
          />
        </label>

        <p className="mt-3 text-[10px] leading-4 text-slate-600">
          Captured {formatDateTime(pursuit.createdAt)} <span className="text-slate-700">/</span> <span data-summary-updated-detail>Updated {formatDateTime(pursuit.updatedAt)}</span>
        </p>

        <div data-entry-error className="mt-3 hidden border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100" />

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button type="button" data-project-card-nav="previous" className="h-9 border border-white/10 px-3 text-xs text-slate-300 hover:border-white/25">Back</button>
          {isClosed ? (
            <button type="button" data-project-restore className="h-9 border border-cyan-300/40 px-3 text-xs text-cyan-100 hover:border-cyan-300">{restoreLabel}</button>
          ) : (
            <button type="button" data-project-archive className="h-9 border border-white/10 px-3 text-xs text-slate-400 hover:border-white/25">Archive</button>
          )}
          <button type="button" data-project-save className="h-9 border border-white/10 px-3 text-xs text-slate-100 hover:border-white/25">Save</button>
          <button type="button" data-project-card-nav="next" className="h-9 border border-cyan-300 bg-cyan-300 px-3 text-xs font-semibold text-black hover:bg-cyan-200">Next</button>
        </div>
      </div>
    </details>
  );
}

function PursuitSection({
  title,
  empty,
  pursuits,
  controls,
  selectable = false,
  selectedIds = [],
  onToggleSelected,
}: {
  title: string;
  empty: string;
  pursuits: PursuitListItem[];
  controls?: ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelected?: (id: string) => void;
}) {
  const isActive = title === "Active pursuits";

  return (
    <section data-active-pursuits={isActive ? true : undefined} className="border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-2 flex flex-col gap-2" data-active-header={isActive ? true : undefined}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase text-slate-300">{title}</h2>
          <span className="text-xs text-slate-500">{pursuits.length}</span>
        </div>
        <div data-active-controls={isActive ? true : undefined} className="grid gap-2">
          {controls}

        </div>
      </div>
      {pursuits.length ? (
        <>
          {isActive && (
            <div className={`grid ${selectable ? "grid-cols-[1.25rem_minmax(0,1fr)]" : "grid-cols-1"} gap-2 border-b border-white/10 py-2 text-[10px] font-medium uppercase text-slate-600`}>
              {selectable && <span aria-hidden="true" />}
              <span>Person</span>
            </div>
          )}
          <div data-pursuit-scroll-window={isActive ? true : undefined} className={isActive ? "no-scrollbar max-h-[448px] overflow-y-auto" : ""}>
            {pursuits.map((pursuit) => (
              <PursuitRow
                key={pursuit.id}
                pursuit={pursuit}
                selectable={selectable}
                selected={selectedIds.includes(pursuit.id)}
                onToggle={onToggleSelected}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="py-3 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function CollapsedPursuitSection({ title, empty, pursuits }: { title: string; empty: string; pursuits: PursuitListItem[] }) {
  return (
    <details data-pursuit-secondary-section className="border border-white/10 bg-white/[0.015] p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase text-slate-500">{title}</h2>
        <span className="text-xs text-slate-500">{pursuits.length}</span>
      </summary>
      <div className="mt-2 border-t border-white/10 pt-1">
        {pursuits.length ? (
          pursuits.map((pursuit) => (
            <PursuitRow key={pursuit.id} pursuit={pursuit} />
          ))
        ) : (
          <p className="py-3 text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </details>
  );
}

export default function PursuitLists({ pursuits, loading }: Props) {
  const [activeSearch, setActiveSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [sortMode, setSortMode] = useState<"business" | "person" | "status" | "age">("business");

  const stale = pursuits.filter((pursuit) => pursuit.stage === "Gone Quiet" || (activeStages.has(pursuit.stage) && olderThanDays(pursuit.updatedAt, staleAfterDays)));
  const staleIds = new Set(stale.map((pursuit) => pursuit.id));
  const activePool = pursuits.filter((pursuit) => activeStages.has(pursuit.stage) && !staleIds.has(pursuit.id));
  const businessOptions = useMemo(
    () => Array.from(new Set(activePool.map((pursuit) => pursuit.business.name).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [activePool]
  );
  const activeQuery = activeSearch.trim().toLowerCase();
  const active = useMemo(() => {
    const sorted = [...activePool].sort((a, b) => {
      if (sortMode === "person") return personName(a).localeCompare(personName(b));
      if (sortMode === "status") {
        const statusDelta = statusRank(a) - statusRank(b);
        if (statusDelta !== 0) return statusDelta;
        return personName(a).localeCompare(personName(b));
      }
      if (sortMode === "age") return ageInDays(b) - ageInDays(a);

      const business = a.business.name.localeCompare(b.business.name);
      if (business !== 0) return business;
      return personName(a).localeCompare(personName(b));
    });

    return sorted.filter((pursuit) => {
      if (businessFilter !== "all" && pursuit.business.name !== businessFilter) return false;
      if (!activeQuery) return true;

      return [
        personName(pursuit),
        pursuit.business.name,
        pursuit.person.role ?? "",
        pursuit.person.location ?? "",
        displayStatus(pursuit),
        pursuit.currentStatus ?? "",
        pursuit.nextAction ?? "",
      ].some((value) => value.toLowerCase().includes(activeQuery));
    }).slice(0, 30);
  }, [activePool, activeQuery, businessFilter, sortMode]);
  const archives = pursuits.filter((pursuit) => archiveStages.has(pursuit.stage)).slice(0, 10);

  const resetActiveFilters = () => {
    setActiveSearch("");
    setBusinessFilter("all");
    setSortMode("business");
  };

  if (loading) {
    return (
      <div className="border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">
        Loading pursuit memory...
      </div>
    );
  }

  const hasFilters = activeSearch.trim() || businessFilter !== "all" || sortMode !== "business";

  return (
    <div className="space-y-3">
      <PursuitSection
        title="Active pursuits"
        empty="No active pursuits match this view."
        pursuits={active}
        controls={(
          <div className="grid gap-2">
            <input
              type="search"
              value={activeSearch}
              onChange={(event) => setActiveSearch(event.target.value)}
              placeholder="Search active pursuits..."
              className="h-10 w-full border border-cyan-300/25 bg-black px-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/60"
            />
            <div className="grid grid-cols-2 items-center gap-2">
              <label className="inline-flex h-8 min-w-0 items-center border border-white/10 bg-black text-[11px] text-slate-400 focus-within:border-cyan-300/50">
                <span className="border-r border-white/10 px-2 text-[10px] uppercase text-slate-600">Business</span>
                <select
                  value={businessFilter}
                  onChange={(event) => setBusinessFilter(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-[11px] text-slate-300 outline-none"
                >
                  <option value="all">All businesses</option>
                  {businessOptions.map((business) => (
                    <option key={business} value={business}>{business}</option>
                  ))}
                </select>
              </label>
              <label className="inline-flex h-8 min-w-0 items-center border border-white/10 bg-black text-[11px] text-slate-400 focus-within:border-cyan-300/50">
                <span className="border-r border-white/10 px-2 text-[10px] uppercase text-slate-600">Sort</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-[11px] text-slate-300 outline-none"
                >
                  <option value="person">Person</option>
                  <option value="business">Business</option>
                  <option value="status">Status</option>
                  <option value="age">Age</option>
                </select>
              </label>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetActiveFilters}
                  className="col-span-2 h-8 border border-cyan-300/25 bg-cyan-300/[0.06] px-3 text-[11px] text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        )}
      />

      <CollapsedPursuitSection title="Needs tactic" empty="Stale pursuits will appear after 90 days without movement." pursuits={stale.slice(0, 10)} />
      <CollapsedPursuitSection title="Archives" empty="Archived pursuits will appear here." pursuits={archives} />
    </div>
  );
}


















