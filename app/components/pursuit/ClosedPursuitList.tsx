"use client";

import { PursuitListItem } from "../../types/pursuit";
import { PursuitRow } from "./PursuitLists";

type Props = {
  title: string;
  eyebrow: string;
  empty: string;
  pursuits: PursuitListItem[];
  tone?: "win" | "stale";
};

export default function ClosedPursuitList({ title, eyebrow, empty, pursuits, tone = "win" }: Props) {
  const accent = tone === "win" ? "emerald" : "amber";
  const accentText = accent === "emerald" ? "text-emerald-200" : "text-amber-200";
  const accentBox = accent === "emerald" ? "border-emerald-300/25 bg-emerald-300/[0.06]" : "border-amber-300/25 bg-amber-300/[0.06]";

  return (
    <section className="w-full min-w-0 overflow-hidden border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-semibold uppercase ${accentText}`}>{eyebrow}</p>
          <h2 className="mt-0.5 text-xs font-semibold uppercase text-slate-300">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">Closed by default, still readable, and can be reopened when needed.</p>
        </div>
        <div className={`grid h-10 w-14 shrink-0 place-items-center border text-center ${accentBox}`}>
          <div>
            <div className="text-base font-semibold leading-none text-white">{pursuits.length}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">Total</div>
          </div>
        </div>
      </div>

      {pursuits.length ? (
        <div className="mt-2 min-w-0 border-t border-white/10 pt-1">
          {pursuits.map((pursuit) => (
            <PursuitRow key={pursuit.id} pursuit={pursuit} />
          ))}
        </div>
      ) : (
        <p className="border-t border-white/10 py-4 text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}