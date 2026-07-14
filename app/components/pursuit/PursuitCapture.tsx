"use client";

import { FormEvent, useState } from "react";
import { pursuitStages, PursuitCaptureAnalysis } from "../../types/pursuit";
import PursuitPreview from "./PursuitPreview";

type Props = {
  onPreview: () => void;
  onSaved: (analysis: PursuitCaptureAnalysis) => Promise<void>;
};

const quickCaptures = [
  {
    label: "Found",
    note: 'Found "Joe Blogs" from "7Eleven Australia" with role "Marketing Mgr". Message needed.',
  },
  {
    label: "Request sent",
    note: 'Connection request sent to "Joe Blogs" with message: ',
  },
  {
    label: "Connected",
    note: 'Connection accepted with "Joe Blogs".',
  },
  {
    label: "Demo proposed",
    note: 'Follow up message back to "Joe Blogs" with demo proposed sent.',
  },
  {
    label: "Demo accepted",
    note: 'Demo accepted by "Joe Blogs". Message needed to confirm email address and advise we will lock in time and date via email.',
  },
  {
    label: "Email received",
    note: '"Joe Blogs" replied on LinkedIn with their email address: ',
  },
  {
    label: "Email sent",
    note: 'Email sent to "Joe Blogs" to confirm day and time for either Teams or onsite Pymble.',
  },
  {
    label: "Calendar sent",
    note: 'Calendar booking for Teams sent to "Joe Blogs".',
  },
  {
    label: "Booked",
    note: 'Calendar booking accepted by "Joe Blogs" and demo is locked in.',
  },
];

export default function PursuitCapture({ onPreview, onSaved }: Props) {
  const [note, setNote] = useState("");
  const [analysis, setAnalysis] = useState<PursuitCaptureAnalysis | null>(null);
  const [status, setStatus] = useState<"idle" | "thinking" | "saving">("idle");
  const [error, setError] = useState("");

  async function analyse(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const cleanNote = note.trim();
    if (!cleanNote) {
      setError("Type what happened on LinkedIn first.");
      return;
    }

    setStatus("thinking");
    setError("");
    onPreview();

    try {
      const response = await fetch("/api/pursuits/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: cleanNote }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not read that note.");
      }

      setAnalysis((await response.json()) as PursuitCaptureAnalysis);
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Could not read that note.");
    } finally {
      setStatus("idle");
    }
  }

  async function saveDraft(draft: PursuitCaptureAnalysis) {
    setStatus("saving");
    setError("");

    try {
      await onSaved(draft);
      setAnalysis(null);
      setNote("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this pursuit.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="border border-cyan-300/20 bg-[#071014] p-3 shadow-xl shadow-black/20 sm:p-4">
      <form onSubmit={analyse}>
        <label htmlFor="linkedin-note" className="text-sm font-medium text-white">
          Quick capture
        </label>
        <textarea
          id="linkedin-note"
          data-pursuit-note
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder='Example: Found "Joe Blogs" from "7Eleven Australia" with role "Marketing Mgr". Message needed.'
          className="mt-2 w-full resize-none border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
        />

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {quickCaptures.map((capture) => (
              <button
                key={capture.label}
                type="button"
                data-pursuit-example={capture.note}
                onClick={() => setNote(capture.note)}
                className="border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
              >
                {capture.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              data-pursuit-review
              onClick={() => void analyse()}
              disabled={status !== "idle"}
              className="border border-cyan-300 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "thinking" ? "Reading..." : "Review"}
            </button>
          </div>
        </div>
      </form>

      <div data-pursuit-error className="mt-3 hidden border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100" />
      <div data-pursuit-preview />

      {error && (
        <div className="mt-4 border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {analysis && (
        <PursuitPreview
          analysis={analysis}
          saving={status === "saving"}
          stages={pursuitStages}
          onChange={setAnalysis}
          onIgnore={() => setAnalysis(null)}
          onSave={saveDraft}
        />
      )}
    </section>
  );
}

