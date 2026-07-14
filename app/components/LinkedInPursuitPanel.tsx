"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PursuitCaptureAnalysis,
  PursuitListItem,
  pursuitPriorities,
  pursuitStages,
} from "../types/pursuit";

type Props = {
  onSaved: () => void;
};

function fullName(pursuit: PursuitListItem) {
  return `${pursuit.person.firstName} ${pursuit.person.lastName}`.trim();
}

function isDue(value?: string | null) {
  if (!value) return false;

  const due = new Date(value).getTime();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return due <= today.getTime();
}

function formatDate(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function fieldClass(extra = "") {
  return `border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70 ${extra}`;
}

function buttonClass(tone: "primary" | "quiet" = "quiet") {
  return tone === "primary"
    ? "min-h-11 border border-cyan-300 bg-cyan-300 px-4 text-sm font-semibold text-black transition hover:bg-transparent hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
    : "min-h-11 border border-white/10 px-4 text-sm text-gray-400 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
}

function updatePerson(
  analysis: PursuitCaptureAnalysis,
  patch: Partial<PursuitCaptureAnalysis["person"]>
): PursuitCaptureAnalysis {
  return {
    ...analysis,
    person: {
      ...analysis.person,
      ...patch,
    },
  };
}

function updateBusiness(
  analysis: PursuitCaptureAnalysis,
  patch: Partial<PursuitCaptureAnalysis["business"]>
): PursuitCaptureAnalysis {
  return {
    ...analysis,
    business: {
      ...analysis.business,
      ...patch,
    },
  };
}

export default function LinkedInPursuitPanel({ onSaved }: Props) {
  const [note, setNote] = useState("");
  const [analysis, setAnalysis] = useState<PursuitCaptureAnalysis | null>(null);
  const [pursuits, setPursuits] = useState<PursuitListItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const reviewInFlightRef = useRef(false);
  const saveInFlightRef = useRef(false);

  async function loadPursuits() {
    const response = await fetch("/api/pursuits");
    const data = (await response.json()) as PursuitListItem[] | { error?: string };

    if (!response.ok || !Array.isArray(data)) {
      throw new Error("Could not load LinkedIn pursuits.");
    }

    setPursuits(data);
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPursuits().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const today = useMemo(
    () =>
      pursuits.filter(
        (pursuit) =>
          isDue(pursuit.nextActionDueAt) ||
          ["Connected", "Replied", "Demo Proposed", "Gone Quiet"].includes(pursuit.stage)
      ),
    [pursuits]
  );

  const waiting = useMemo(
    () =>
      pursuits.filter(
        (pursuit) =>
          ["Connection Sent", "Follow-up Sent", "Email / Time Requested"].includes(pursuit.stage) &&
          !isDue(pursuit.nextActionDueAt)
      ),
    [pursuits]
  );

  const recent = pursuits.slice(0, 5);

  async function reviewNote() {
    if (reviewInFlightRef.current) return;

    const trimmed = note.trim() || noteRef.current?.value.trim() || "";

    if (!trimmed) {
      setNotice("Tell StoreLab what happened on LinkedIn first.");
      return;
    }

    reviewInFlightRef.current = true;
    setIsReviewing(true);
    setNotice(null);

    try {
      const response = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: trimmed }),
      });
      const data = (await response.json()) as PursuitCaptureAnalysis | { error?: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Could not review that LinkedIn note.");
      }

      const nextAnalysis = data as PursuitCaptureAnalysis;
      setAnalysis(nextAnalysis);
      setNotice("Preview ready. Check the details below, then save only if it is right.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not review that LinkedIn note.");
    } finally {
      reviewInFlightRef.current = false;
      setIsReviewing(false);
    }
  }

  async function saveAnalysis() {
    if (!analysis || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetch("/api/pursuits/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysis }),
      });
      const data = (await response.json()) as { pursuit?: PursuitListItem; error?: string };

      if (!response.ok || data.error || !data.pursuit) {
        throw new Error(data.error || "Could not save this LinkedIn pursuit.");
      }

      setPursuits((current) => [data.pursuit!, ...current.filter((item) => item.id !== data.pursuit!.id)]);
      setAnalysis(null);
      setNote("");
      setNotice("Saved. StoreLab has added this relationship memory.");
      onSaved();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save this LinkedIn pursuit.");
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <section className="border border-cyan-300/25 bg-cyan-300/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-cyan-300">LinkedIn Pursuit</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Capture a LinkedIn relationship</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Paste a profile line, screenshot text, or a rough note. StoreLab will analyse it and show a preview. Nothing is saved until you approve it.
          </p>
        </div>
        <div className="border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-lg font-semibold text-white">{pursuits.length}</p>
          <p className="text-xs text-gray-600">Pursuits</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_12rem]">
        <textarea
          ref={noteRef}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Example: Stefan Veljanoski is Marketing Manager at 7-Eleven Australia in Melbourne. Worth reviewing for a StoreLab demo."
          className="resize-none border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
        />
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            void reviewNote();
          }}
          onClick={() => void reviewNote()}
          disabled={isReviewing}
          className={buttonClass("primary")}
        >
          {isReviewing ? "Analysing..." : "Analyse & preview"}
        </button>
      </div>

      {notice && (
        <div className="mt-3 border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
          {notice}
        </div>
      )}

      {analysis && (
        <div className="mt-4 border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase text-cyan-300">Preview only - not saved yet</p>
              <h3 className="mt-1 text-lg font-semibold text-white">StoreLab found this relationship</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{analysis.whatChanged}</p>
            </div>
            <span className="border border-white/10 px-2 py-1 text-xs text-gray-500">
              {analysis.confidence} confidence
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={analysis.person.firstName}
              onChange={(event) => setAnalysis(updatePerson(analysis, { firstName: event.target.value }))}
              placeholder="First name"
              className={fieldClass()}
            />
            <input
              value={analysis.person.lastName ?? ""}
              onChange={(event) => setAnalysis(updatePerson(analysis, { lastName: event.target.value }))}
              placeholder="Last name"
              className={fieldClass()}
            />
            <input
              value={analysis.business.name}
              onChange={(event) => setAnalysis(updateBusiness(analysis, { name: event.target.value }))}
              placeholder="Company"
              className={fieldClass()}
            />
            <input
              value={analysis.person.role ?? ""}
              onChange={(event) => setAnalysis(updatePerson(analysis, { role: event.target.value }))}
              placeholder="Role / title"
              className={fieldClass()}
            />
            <select
              value={analysis.stage}
              onChange={(event) => setAnalysis({ ...analysis, stage: event.target.value as PursuitCaptureAnalysis["stage"] })}
              className={fieldClass()}
            >
              {pursuitStages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <select
              value={analysis.priority}
              onChange={(event) => setAnalysis({ ...analysis, priority: event.target.value as PursuitCaptureAnalysis["priority"] })}
              className={fieldClass()}
            >
              {pursuitPriorities.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <textarea
              value={analysis.nextAction}
              onChange={(event) => setAnalysis({ ...analysis, nextAction: event.target.value })}
              rows={2}
              className={fieldClass("resize-none leading-relaxed")}
              placeholder="Next action"
            />
            <textarea
              value={analysis.storeLabAngle ?? ""}
              onChange={(event) => setAnalysis({ ...analysis, storeLabAngle: event.target.value })}
              rows={2}
              className={fieldClass("resize-none leading-relaxed")}
              placeholder="StoreLab angle"
            />
          </div>

          {analysis.suggestedMessage && (
            <textarea
              value={analysis.suggestedMessage}
              onChange={(event) => setAnalysis({ ...analysis, suggestedMessage: event.target.value })}
              rows={3}
              className={fieldClass("mt-3 w-full resize-none leading-relaxed text-gray-200")}
              placeholder="Suggested message"
            />
          )}

          <label className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={analysis.teaserVideoSent}
              onChange={(event) => setAnalysis({ ...analysis, teaserVideoSent: event.target.checked })}
              className="h-4 w-4 accent-cyan-300"
            />
            Teaser video sent or referenced
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                void saveAnalysis();
              }}
              onClick={() => void saveAnalysis()}
              disabled={isSaving}
              className={buttonClass("primary")}
            >
              {isSaving ? "Saving..." : "Approve & save"}
            </button>
            <button type="button" onClick={() => setAnalysis(null)} disabled={isSaving} className={buttonClass()}>
              Ignore preview
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        <PursuitColumn title="Today" empty="Nothing needs attention." pursuits={today.slice(0, 5)} />
        <PursuitColumn title="Waiting" empty="No LinkedIn threads waiting." pursuits={waiting.slice(0, 5)} />
        <PursuitColumn title="Recent" empty="No pursuit memory yet." pursuits={recent} />
      </div>
    </section>
  );
}

function PursuitColumn({
  title,
  empty,
  pursuits,
}: {
  title: string;
  empty: string;
  pursuits: PursuitListItem[];
}) {
  return (
    <div className="border border-white/10 bg-black/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
        <p className="text-xs text-gray-600">{pursuits.length}</p>
      </div>

      <div className="mt-3 space-y-2">
        {pursuits.length ? (
          pursuits.map((pursuit) => (
            <article key={pursuit.id} className="border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{fullName(pursuit) || "Unknown person"}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{pursuit.business.name}</p>
                </div>
                <span className="shrink-0 border border-cyan-300/25 px-2 py-1 text-xs text-cyan-200">
                  {pursuit.stage}
                </span>
              </div>
              {pursuit.nextAction && (
                <p className="mt-3 text-xs leading-relaxed text-gray-400">{pursuit.nextAction}</p>
              )}
              {pursuit.nextActionDueAt && (
                <p className="mt-2 text-xs text-gray-600">Due {formatDate(pursuit.nextActionDueAt)}</p>
              )}
            </article>
          ))
        ) : (
          <p className="py-4 text-sm text-gray-600">{empty}</p>
        )}
      </div>
    </div>
  );
}



