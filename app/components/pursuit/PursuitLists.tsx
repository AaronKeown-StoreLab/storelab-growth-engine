"use client";

import { PursuitListItem } from "../../types/pursuit";

type Props = {
  pursuits: PursuitListItem[];
  loading: boolean;
};

const todayStages = new Set(["Found", "Message Drafted", "Connected", "Demo Accepted", "Email Captured", "Email Sent", "Demo Booked"]);
const waitingStages = new Set(["Connection Sent", "Follow-up Sent", "Demo Proposed", "Email / Time Requested", "Calendar Sent"]);

function personName(pursuit: PursuitListItem) {
  return `${pursuit.person.firstName} ${pursuit.person.lastName}`.trim();
}

function formatDate(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function PursuitRow({ pursuit }: { pursuit: PursuitListItem }) {
  const latest = pursuit.interactions[0];
  const status = pursuit.currentStatus ?? latest?.summary ?? "";

  return (
    <details data-entry-card data-pursuit-id={pursuit.id} data-current-stage={pursuit.stage} className="border-b border-white/10 py-3 last:border-b-0">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="truncate text-sm font-semibold text-white">{personName(pursuit)}</h3>
              <span className="truncate text-xs text-slate-500">{pursuit.business.name}</span>
              {pursuit.person.role && <span className="truncate text-xs text-slate-600">{pursuit.person.role}</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">
              {pursuit.nextAction || status || "No next action yet."}
            </p>
            {pursuit.storeLabAngle && (
              <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">
                {pursuit.storeLabAngle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-slate-500">
            <span className="border border-white/10 px-2 py-1">{pursuit.stage}</span>
            {pursuit.nextActionDueAt && <span>{formatDate(pursuit.nextActionDueAt)}</span>}
          </div>
        </div>
      </summary>

      <div className="mt-3 border border-cyan-300/15 bg-cyan-300/[0.03] p-3">
        <label className="block">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Status</span>
          <textarea
            data-entry-field="currentStatus"
            defaultValue={status}
            rows={2}
            className="mt-1 w-full resize-none border border-white/10 bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none focus:border-cyan-300/60"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Next action</span>
          <textarea
            data-entry-field="nextAction"
            defaultValue={pursuit.nextAction ?? ""}
            rows={2}
            className="mt-1 w-full resize-none border border-white/10 bg-black/20 px-2.5 py-2 text-sm leading-5 text-white outline-none focus:border-cyan-300/60"
          />
        </label>

        <div data-entry-error className="mt-3 hidden border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100" />

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button type="button" data-entry-action="back" className="border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/25">Back</button>
          <button type="button" data-entry-action="park" className="border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/25">Skip</button>
          <button type="button" data-entry-action="save" className="border border-white/10 px-3 py-2 text-xs text-slate-100 hover:border-white/25">Save</button>
          <button type="button" data-entry-action="next" className="border border-cyan-300 bg-cyan-300 px-3 py-2 text-xs font-semibold text-black hover:bg-cyan-200">Next</button>
        </div>
      </div>
    </details>
  );
}

function PursuitSection({ title, empty, pursuits }: { title: string; empty: string; pursuits: PursuitListItem[] }) {
  return (
    <section className="border border-white/10 bg-white/[0.025] p-3 sm:p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{title}</h2>
        <span className="text-xs text-slate-500">{pursuits.length}</span>
      </div>
      {pursuits.length ? (
        <div>
          {pursuits.map((pursuit) => (
            <PursuitRow key={pursuit.id} pursuit={pursuit} />
          ))}
        </div>
      ) : (
        <p className="py-3 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

export default function PursuitLists({ pursuits, loading }: Props) {
  const today = pursuits.filter((pursuit) => todayStages.has(pursuit.stage)).slice(0, 4);
  const waiting = pursuits.filter((pursuit) => waitingStages.has(pursuit.stage)).slice(0, 4);
  const activeIds = new Set([...today, ...waiting].map((pursuit) => pursuit.id));
  const recent = pursuits.filter((pursuit) => !activeIds.has(pursuit.id)).slice(0, 5);

  if (loading) {
    return (
      <div className="border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">
        Loading pursuit memory...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PursuitSection title="Today" empty="Nothing urgent yet. Capture the next LinkedIn moment above." pursuits={today} />
      <PursuitSection title="Waiting" empty="No one is waiting on LinkedIn right now." pursuits={waiting} />
      <PursuitSection title="Recent" empty="Saved LinkedIn activity will appear here." pursuits={recent} />
    </div>
  );
}
