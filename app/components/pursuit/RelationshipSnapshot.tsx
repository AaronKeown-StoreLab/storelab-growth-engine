"use client";

import { useMemo, useState } from "react";
import { PursuitListItem } from "../../types/pursuit";

type Props = {
  pursuits: PursuitListItem[];
};

type SortMode = "person" | "business" | "status";

const hiddenDefaultStages = new Set(["Successful Connection", "Gone Quiet", "Parked", "Not Relevant"]);
const staleAfterDays = 90;

const statusLabels: Record<string, string> = {
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

function personName(pursuit: PursuitListItem) {
  return `${pursuit.person.firstName} ${pursuit.person.lastName}`.trim() || "Unknown person";
}


function olderThanDays(value: string | null | undefined, days: number) {
  if (!value) return false;
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

function pursuitUrl(pursuit: PursuitListItem) {
  return `/#pursuit-${pursuit.id}`;
}

function sourceLabel(source?: string | null) {
  if (/email|referral|cc|thread/i.test(source ?? "")) return "Email / referral";
  return "LinkedIn / cold";
}

function displayStatus(pursuit: PursuitListItem) {
  return statusLabels[pursuit.stage] || pursuit.stage;
}

function statusRank(pursuit: PursuitListItem) {
  const index = statusSortOrder.indexOf(displayStatus(pursuit));
  return index === -1 ? statusSortOrder.length : index;
}

function RelationshipRow({ pursuit, selected, onToggle }: { pursuit: PursuitListItem; selected: boolean; onToggle: (id: string) => void }) {
  const name = personName(pursuit);
  const statusLabel = displayStatus(pursuit);
  const pathLabel = sourceLabel(pursuit.source);
  const ageDays = ageInDays(pursuit);

  return (
    <div className={`grid grid-cols-[1.25rem_minmax(0,1fr)_6.75rem] items-center gap-3 border-b border-white/10 py-3 transition hover:bg-cyan-300/[0.04] last:border-b-0 ${selected ? "bg-cyan-300/[0.018]" : ""}`}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle(pursuit.id);
        }}
        aria-pressed={selected}
        aria-label={`${selected ? "Deselect" : "Select"} ${name}`}
        className={`flex size-5 shrink-0 items-center justify-center self-start border transition ${selected ? "border-cyan-300/60 bg-cyan-300/[0.08] shadow-[0_0_0_1px_rgba(103,232,249,0.12)]" : "border-white/20 bg-black/40 hover:border-cyan-300/60 hover:bg-cyan-300/[0.08]"}`}
      >
        {selected ? <span className="h-2 w-1.5 rotate-45 border-b border-r border-cyan-100" /> : null}
      </button>

      <a href={pursuitUrl(pursuit)} className="contents">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            <span>{pursuit.business.name || "Business not set"}</span>
            <span className="text-slate-700"> / </span>
            <span>{pursuit.person.role || "Role not set"}</span>
            <span className="text-slate-700"> / </span>
            <span>{pathLabel}</span>
            <span className="text-slate-700"> / </span>
            <span>{ageDays}d</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <span className="grid h-7 w-24 place-items-center border border-cyan-300/45 bg-cyan-300/[0.13] px-2 text-center text-[11px] font-semibold leading-4 text-cyan-50 shadow-[0_0_0_1px_rgba(103,232,249,0.10)]">{statusLabel}</span>
        </div>
      </a>
    </div>
  );
}

export default function RelationshipSnapshot({ pursuits }: Props) {
  const [query, setQuery] = useState("");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("business");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archiving, setArchiving] = useState(false);

  const businessOptions = useMemo(() => Array.from(new Set(pursuits.map((pursuit) => pursuit.business.name).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [pursuits]);

  const resetFilters = () => {
    setBusinessFilter("all");
  };

  const toggleSelected = (id: string) => {
    setArchiveError("");
    setConfirmArchive(false);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const rows = useMemo(() => {
    const cleaned = query.trim().toLowerCase();
    const sorted = [...pursuits].sort((a, b) => {
      if (sortMode === "person") return personName(a).localeCompare(personName(b));
      if (sortMode === "status") {
        const statusDelta = statusRank(a) - statusRank(b);
        if (statusDelta !== 0) return statusDelta;
        return personName(a).localeCompare(personName(b));
      }

      const business = a.business.name.localeCompare(b.business.name);
      if (business !== 0) return business;

      return personName(a).localeCompare(personName(b));
    });

    return sorted.filter((pursuit) => {
      const status = displayStatus(pursuit);

      if (hiddenDefaultStages.has(pursuit.stage) || olderThanDays(pursuit.updatedAt, staleAfterDays)) return false;
      if (businessFilter !== "all" && pursuit.business.name !== businessFilter) return false;
      if (!cleaned) return true;

      return [
        personName(pursuit),
        pursuit.business.name,
        pursuit.person.role || "",
        status,
        pursuit.stage,
        pursuit.currentStatus || "",
        pursuit.nextAction || "",
        sourceLabel(pursuit.source),
      ].join(" ").toLowerCase().includes(cleaned);
    });
  }, [pursuits, query, businessFilter, sortMode]);

  const visibleIds = rows.map((pursuit) => pursuit.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleVisibleSelection = () => {
    setArchiveError("");
    setConfirmArchive(false);
    setSelectedIds((current) => {
      const visible = new Set(visibleIds);
      if (allVisibleSelected) return current.filter((id) => !visible.has(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const archiveSelected = async () => {
    if (!selectedIds.length || archiving) return;

    setArchiving(true);
    setArchiveError("");

    try {
      const selectedPursuits = new Map(pursuits.map((pursuit) => [pursuit.id, pursuit]));
      const results = await Promise.all(selectedIds.map((id) => {
        const pursuit = selectedPursuits.get(id);
        const previousStage = pursuit?.stage || "Found";

        return fetch(`/api/pursuits/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: "Parked",
            currentStatus: "Archived from Overview.",
            nextAction: "Archived. Keep in memory until a useful signal appears.",
            note: `Archived from Overview. Previous status: ${previousStage}.`,
          }),
        });
      }));
      const failed = results.find((response) => !response.ok);
      if (failed) throw new Error("Could not archive one or more selected pursuits.");

      setSelectedIds([]);
      setConfirmArchive(false);
      window.location.reload();
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "Could not archive the selected pursuits.");
    } finally {
      setArchiving(false);
    }
  };

  const stats = useMemo(() => {
    const businesses = new Set(pursuits.map((pursuit) => pursuit.business.id));
    const statuses = pursuits.map((pursuit) => displayStatus(pursuit));

    return {
      needsMessage: statuses.filter((status) => status === "Message needed").length,
      connected: statuses.filter((status) => status === "Connected").length,
      demos: statuses.filter((status) => status.startsWith("Demo")).length,
      businesses: businesses.size,
    };
  }, [pursuits]);

  return (
    <section className="border border-white/10 bg-white/[0.025] p-3">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase text-slate-300">Overview</h2>
          <p className="mt-1 text-sm text-slate-500">Quick scan of people, businesses, status and recent movement.</p>
        </div>

      </div>

      <div className="grid grid-cols-4 border-b border-white/10 text-center text-xs text-slate-500">
        <div className="px-2 py-2.5"><span className="block text-base font-semibold leading-none text-white">{stats.needsMessage}</span>Needs message</div>
        <div className="border-l border-white/10 px-2 py-2.5"><span className="block text-base font-semibold leading-none text-white">{stats.businesses}</span>Businesses</div>
        <div className="border-l border-white/10 px-2 py-2.5"><span className="block text-base font-semibold leading-none text-white">{stats.connected}</span>Connected</div>
        <div className="border-l border-white/10 px-2 py-2.5"><span className="block text-base font-semibold leading-none text-white">{stats.demos}</span>Demos</div>
      </div>

      <div className="border-b border-white/10 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-7 w-full border border-white/10 bg-black px-2 text-[11px] text-slate-300 outline-none placeholder:text-slate-600 focus:border-cyan-300/50 sm:w-32"
          />

          <label className="inline-flex h-7 items-center border border-white/10 bg-black text-[11px] text-slate-400 transition focus-within:border-cyan-300/50">
            <span className="border-r border-white/10 px-2 text-[10px] uppercase tracking-[0.12em] text-slate-600">Business</span>
            <select
              value={businessFilter}
              onChange={(event) => setBusinessFilter(event.target.value)}
              className="h-full w-32 bg-transparent px-2 text-[11px] text-slate-300 outline-none"
            >
              <option value="all">All businesses</option>
              {businessOptions.map((business) => (
                <option key={business} value={business}>{business}</option>
              ))}
            </select>
          </label>

          <label className="ml-auto inline-flex h-7 items-center border border-white/10 bg-black text-[11px] text-slate-400 transition focus-within:border-cyan-300/50">
            <span className="border-r border-white/10 px-2 text-[10px] uppercase tracking-[0.12em] text-slate-600">Sort by</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-full w-24 bg-transparent px-2 text-[11px] text-slate-300 outline-none"
            >
              <option value="person">Person</option>
              <option value="business">Business</option>
              <option value="status">Status</option>
            </select>
          </label>

          <button
            type="button"
            hidden={businessFilter === "all"}
            onClick={resetFilters}
            className="h-7 border border-cyan-300/25 bg-cyan-300/[0.06] px-2 text-[11px] text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 px-1 py-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={!visibleIds.length}
            onClick={toggleVisibleSelection}
            className="border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-cyan-300/40 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-cyan-100">{selectedIds.length} selected</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setConfirmArchive(false);
                  setArchiveError("");
                }}
                className="border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-white/25 hover:text-slate-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmArchive(true)}
                className="border border-red-300/35 bg-red-300/[0.10] px-3 py-1.5 text-[11px] font-semibold text-red-100 transition hover:border-red-300/70 hover:bg-red-300/15"
              >
                Archive selected
              </button>
            </div>
          )}
        </div>

        {confirmArchive && selectedIds.length > 0 && (
          <div className="mt-2 border border-red-300/25 bg-red-300/[0.07] p-2 text-[11px] text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Archive {selectedIds.length} selected pursuit{selectedIds.length === 1 ? "" : "s"}?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={archiving}
                  onClick={archiveSelected}
                  className="border border-red-300/45 px-3 py-1 text-red-100 transition hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {archiving ? "Archiving..." : "Yes"}
                </button>
                <button
                  type="button"
                  disabled={archiving}
                  onClick={() => {
                    setConfirmArchive(false);
                    setArchiveError("");
                  }}
                  className="border border-white/10 px-3 py-1 text-slate-300 transition hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  No
                </button>
              </div>
            </div>
            {archiveError && <p className="mt-2 text-red-100">{archiveError}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_6.75rem] gap-3 border-b border-white/10 py-2 text-[10px] font-medium uppercase text-slate-600">
        <span aria-hidden="true" />
        <span>Person</span>
        <span className="text-right">Status</span>
      </div>

      {rows.length ? (
        <div className="no-scrollbar max-h-[390px] overflow-y-auto">
          {rows.map((pursuit) => <RelationshipRow key={pursuit.id} pursuit={pursuit} selected={selectedIds.includes(pursuit.id)} onToggle={toggleSelected} />)}
        </div>
      ) : (
        <p className="py-6 text-sm text-slate-500">No matching people yet.</p>
      )}
    </section>
  );
}

