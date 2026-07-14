"use client";

import { FormEvent, useState } from "react";
import { pursuitStages, PursuitCaptureAnalysis } from "../../types/pursuit";
import PursuitPreview from "./PursuitPreview";

type Props = {
  onPreview: () => void;
  onSaved: (analysis: PursuitCaptureAnalysis) => Promise<void>;
};

const examples = [
  "Sent Chris Allan at Lion AU a connection request mentioning our Lion NZ history.",
  "Rebecca from Mondelez accepted my connection. Need a warm follow-up with teaser video.",
  "Demo booked with Rebecca next Wednesday.",
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
    <section className="border border-cyan-300/20 bg-[#071014] p-4 shadow-2xl shadow-black/20 sm:p-6">
      <form onSubmit={analyse}>
        <label htmlFor="linkedin-note" className="text-sm font-medium text-white">
          What happened on LinkedIn?
        </label>
        <textarea
          id="linkedin-note"
          data-pursuit-note
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={5}
          placeholder="Example: Rebecca from Mondelez accepted my connection. Need a warm follow-up with teaser video."
          className="mt-3 w-full resize-none border border-white/10 bg-black/20 p-4 text-base leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                data-pursuit-example={example}
                onClick={() => setNote(example)}
                className="border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-white/25 hover:text-white"
              >
                Use example
              </button>
            ))}
          </div>

          <button
            type="button"
            data-pursuit-review
            onClick={() => void analyse()}
            disabled={status !== "idle"}
            className="border border-cyan-300 bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "thinking" ? "Reading..." : "Review"}
          </button>
        </div>
      </form>

      <div data-pursuit-error className="mt-4 hidden border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100" />
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
