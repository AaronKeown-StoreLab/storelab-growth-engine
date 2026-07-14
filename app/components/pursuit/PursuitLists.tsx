"use client";

import { PursuitListItem } from "../../types/pursuit";

type Props = {
  pursuits: PursuitListItem[];
  loading: boolean;
};

const todayStages = new Set(["Found", "Connected", "Replied", "Demo Proposed"]);
const waitingStages = new Set(["Connection Sent", "Follow-up Sent", "Email / Time Requested"]);

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

  return (
    <article className="border-b border-white/10 py-4 last:border-b-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold text-white">{personName(pursuit)}</h3>
            <span className="text-sm text-slate-500">{pursuit.business.name}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {pursuit.nextAction || pursuit.currentStatus || latest?.summary || "No next action yet."}
          </p>
          {pursuit.storeLabAngle && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Angle: {pursuit.storeLabAngle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
          <span className="border border-white/10 px-2 py-1">{pursuit.stage}</span>
          {pursuit.nextActionDueAt && <span>{formatDate(pursuit.nextActionDueAt)}</span>}
        </div>
      </div>
    </article>
  );
}

function PursuitSection({
  title,
  empty,
  pursuits,
}: {
  title: string;
  empty: string;
  pursuits: PursuitListItem[];
}) {
  return (
    <section className="border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">{title}</h2>
        <span className="text-sm text-slate-500">{pursuits.length}</span>
      </div>
      {pursuits.length ? (
        <div>
          {pursuits.map((pursuit) => (
            <PursuitRow key={pursuit.id} pursuit={pursuit} />
          ))}
        </div>
      ) : (
        <p className="py-5 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

export default function PursuitLists({ pursuits, loading }: Props) {
  const today = pursuits.filter((pursuit) => todayStages.has(pursuit.stage)).slice(0, 5);
  const waiting = pursuits.filter((pursuit) => waitingStages.has(pursuit.stage)).slice(0, 5);
  const recent = pursuits.slice(0, 6);

  if (loading) {
    return (
      <div className="border border-white/10 bg-white/[0.025] p-6 text-sm text-slate-500">
        Loading pursuit memory...
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="space-y-5">
        <PursuitSection
          title="Today"
          empty="Nothing urgent yet. Capture the next LinkedIn moment above."
          pursuits={today}
        />
        <PursuitSection
          title="Waiting"
          empty="No one is waiting on LinkedIn right now."
          pursuits={waiting}
        />
      </div>

      <PursuitSection
        title="Recent"
        empty="Saved LinkedIn activity will appear here."
        pursuits={recent}
      />
    </div>
  );
}
