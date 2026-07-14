"use client";

import { useCallback, useMemo, useState } from "react";
import { PursuitCaptureAnalysis, PursuitListItem } from "../../types/pursuit";
import PursuitCapture from "./PursuitCapture";
import PursuitLists from "./PursuitLists";

function sortByAttention(a: PursuitListItem, b: PursuitListItem) {
  const aDate = a.nextActionDueAt ? new Date(a.nextActionDueAt).getTime() : Number.MAX_SAFE_INTEGER;
  const bDate = b.nextActionDueAt ? new Date(b.nextActionDueAt).getTime() : Number.MAX_SAFE_INTEGER;

  if (aDate !== bDate) return aDate - bDate;

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default function PursuitHome({ initialPursuits }: { initialPursuits: PursuitListItem[] }) {
  const [pursuits, setPursuits] = useState<PursuitListItem[]>(initialPursuits);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const loadPursuits = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/pursuits", {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Could not load pursuits.");

      const data = (await response.json()) as PursuitListItem[];
      setPursuits(data);
    } catch {
      setNotice("I could not load the pursuit memory. Try refreshing once.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleSave(analysis: PursuitCaptureAnalysis) {
    const response = await fetch("/api/pursuits/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ analysis }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Could not save this pursuit.");
    }

    await loadPursuits();
    setNotice("Saved to pursuit memory.");
  }

  const stats = useMemo(() => {
    const needsActionStages = new Set(["Found", "Connected", "Replied", "Demo Proposed"]);
    const waitingStages = new Set(["Connection Sent", "Follow-up Sent", "Email / Time Requested"]);

    return {
      needsAction: pursuits.filter((pursuit) => needsActionStages.has(pursuit.stage)).length,
      waiting: pursuits.filter((pursuit) => waitingStages.has(pursuit.stage)).length,
      recent: pursuits.length,
    };
  }, [pursuits]);

  const orderedPursuits = useMemo(() => [...pursuits].sort(sortByAttention), [pursuits]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-cyan-300/80">
            StoreLab OS
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            LinkedIn pursuit memory
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Tell StoreLab what happened. It remembers the person, the company, the stage, and what you should do next.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-semibold">{stats.needsAction}</div>
            <div className="mt-1 text-xs text-slate-500">Today</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-semibold">{stats.waiting}</div>
            <div className="mt-1 text-xs text-slate-500">Waiting</div>
          </div>
          <div className="border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-semibold">{stats.recent}</div>
            <div className="mt-1 text-xs text-slate-500">Saved</div>
          </div>
        </div>
      </header>

      {notice && (
        <div className="border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">
          {notice}
        </div>
      )}

      <PursuitCapture
        onPreview={() => setNotice("")}
        onSaved={handleSave}
      />

      <PursuitLists pursuits={orderedPursuits} loading={loading} />
    </section>
  );
}
