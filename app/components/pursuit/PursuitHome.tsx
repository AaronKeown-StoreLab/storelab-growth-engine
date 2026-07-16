"use client";

import { useCallback, useMemo, useState } from "react";
import { PursuitCaptureAnalysis, PursuitListItem } from "../../types/pursuit";
import PursuitCapture from "./PursuitCapture";
import PursuitLists from "./PursuitLists";
import PursuitAppHeader from "./PursuitAppHeader";

const activeStages = new Set(["Found", "Message Drafted", "Connection Sent", "Connected", "Follow-up Sent", "Demo Proposed", "Demo Accepted", "Email / Time Requested", "Email Captured", "Email Sent", "Calendar Sent", "Demo Booked"]);
const staleAfterDays = 90;

function olderThanDays(value: string, days: number) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > days * 24 * 60 * 60 * 1000;
}
type BusinessOption = {
  id: string;
  name: string;
  peopleCount: number;
  pursuitCount: number;
  opportunityCount: number;
};

function sortByAttention(a: PursuitListItem, b: PursuitListItem) {
  const aDate = a.nextActionDueAt ? new Date(a.nextActionDueAt).getTime() : Number.MAX_SAFE_INTEGER;
  const bDate = b.nextActionDueAt ? new Date(b.nextActionDueAt).getTime() : Number.MAX_SAFE_INTEGER;

  if (aDate !== bDate) return aDate - bDate;

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default function PursuitHome({ initialPursuits, initialBusinesses }: { initialPursuits: PursuitListItem[]; initialBusinesses: BusinessOption[] }) {
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
    const todayStages = new Set(["Found", "Message Drafted", "Connected", "Demo Accepted", "Email Captured", "Email Sent", "Demo Booked"]);

    return {
      today: pursuits.filter((pursuit) => todayStages.has(pursuit.stage)).length,
      saved: pursuits.length,
      tactic: pursuits.filter((pursuit) => pursuit.stage === "Gone Quiet" || (activeStages.has(pursuit.stage) && olderThanDays(pursuit.updatedAt, staleAfterDays))).length,
    };
  }, [pursuits]);

  const orderedPursuits = useMemo(() => [...pursuits].sort(sortByAttention), [pursuits]);
  const locationOptions = useMemo(
    () => Array.from(new Set(pursuits.map((pursuit) => pursuit.person.location).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)),
    [pursuits]
  );

  return (
    <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full min-w-0 max-w-[430px] flex-col gap-3">
      <PursuitAppHeader active="dashboard" stats={stats} />

      {notice && (
        <div className="border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-100">
          {notice}
        </div>
      )}

      <PursuitCapture
        businesses={initialBusinesses}
        locations={locationOptions}
        onPreview={() => setNotice("")}
        onSaved={handleSave}
      />

      <PursuitLists pursuits={orderedPursuits} loading={loading} />
    </section>
  );
}

