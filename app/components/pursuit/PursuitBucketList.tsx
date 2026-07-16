import { PursuitListItem } from "../../types/pursuit";

type Props = {
  title: string;
  eyebrow: string;
  empty: string;
  pursuits: PursuitListItem[];
  tone?: "win" | "stale";
};

function personName(pursuit: PursuitListItem) {
  return `${pursuit.person.firstName} ${pursuit.person.lastName}`.trim() || "Unknown person";
}

function formatDate(value?: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function lastHistory(pursuit: PursuitListItem) {
  return pursuit.interactions[0]?.summary || pursuit.currentStatus || pursuit.nextAction || "No history yet.";
}

export default function PursuitBucketList({ title, eyebrow, empty, pursuits, tone = "win" }: Props) {
  const accent = tone === "win" ? "emerald" : "amber";
  const accentText = accent === "emerald" ? "text-emerald-200" : "text-amber-200";
  const accentBox = accent === "emerald" ? "border-emerald-300/25 bg-emerald-300/[0.06]" : "border-amber-300/25 bg-amber-300/[0.06]";

  return (
    <section className="w-full min-w-0 overflow-hidden border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-semibold uppercase ${accentText}`}>{eyebrow}</p>
          <h2 className="mt-0.5 text-xs font-semibold uppercase text-slate-300">{title}</h2>
        </div>
        <div className={`grid h-10 w-14 shrink-0 place-items-center border text-center ${accentBox}`}>
          <div>
            <div className="text-base font-semibold leading-none text-white">{pursuits.length}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">Total</div>
          </div>
        </div>
      </div>

      {pursuits.length ? (
        <div className="border-t border-white/10">
          {pursuits.map((pursuit) => (
            <a
              key={pursuit.id}
              href={`/#pursuit-${pursuit.id}`}
              className="block min-w-0 border-b border-white/10 px-2 py-3 transition hover:bg-cyan-300/[0.04] last:border-b-0"
            >
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_7rem] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h3 className="truncate text-sm font-semibold text-white">{personName(pursuit)}</h3>
                    <span className="truncate text-xs text-slate-600">{pursuit.person.role ?? ""}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{pursuit.business.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-400">{lastHistory(pursuit)}</p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-slate-500">
                  <div>{formatDate(pursuit.updatedAt)}</div>
                  <div className="mt-1 text-cyan-100/70">Open</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="border-t border-white/10 py-4 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}