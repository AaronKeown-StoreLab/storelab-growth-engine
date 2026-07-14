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
      setNotice("I could not load pursuit memory. Refresh once.");
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
    setNotice("Saved.");
  }

  const stats = useMemo(() => {
    const needsActionStages = new Set(["Found", "Message Drafted", "Connected", "Demo Accepted", "Email Captured", "Email Sent", "Demo Booked"]);
    const waitingStages = new Set(["Connection Sent", "Follow-up Sent", "Demo Proposed", "Email / Time Requested", "Calendar Sent"]);

    return {
      needsAction: pursuits.filter((pursuit) => needsActionStages.has(pursuit.stage)).length,
      waiting: pursuits.filter((pursuit) => waitingStages.has(pursuit.stage)).length,
      recent: pursuits.length,
    };
  }, [pursuits]);

  const orderedPursuits = useMemo(() => [...pursuits].sort(sortByAttention), [pursuits]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col gap-3">
      <header className="border-b border-white/10 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-300/80">
              StoreLab OS
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
              LinkedIn sidecar
            </h1>
          </div>

          <div className="grid shrink-0 grid-cols-3 overflow-hidden border border-white/10 bg-white/[0.03] text-center">
            <div className="min-w-14 px-2 py-2">
              <div className="text-lg font-semibold">{stats.needsAction}</div>
              <div className="text-[10px] text-slate-500">Today</div>
            </div>
            <div className="min-w-14 border-x border-white/10 px-2 py-2">
              <div className="text-lg font-semibold">{stats.waiting}</div>
              <div className="text-[10px] text-slate-500">Wait</div>
            </div>
            <div className="min-w-14 px-2 py-2">
              <div className="text-lg font-semibold">{stats.recent}</div>
              <div className="text-[10px] text-slate-500">Saved</div>
            </div>
          </div>
        </div>
      </header>

      {notice && (
        <div className="border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-100">
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
