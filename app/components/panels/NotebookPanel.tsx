"use client";

import { useState } from "react";
import { Business } from "../../types/business";

type Props = {
  business: Business;
  onChanged: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function NotebookPanel({ business, onChanged }: Props) {
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveNote() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/businesses/${business.id}/notebook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: noteContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save note.");
      }

      setNoteContent("");
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-8 border border-white/10 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
        Notes
      </p>

      <textarea
        value={noteContent}
        onChange={(event) => setNoteContent(event.target.value)}
        placeholder="Capture a thought, meeting note, reminder or observation..."
        className="mt-5 min-h-32 w-full resize-none border border-white/10 bg-black/30 p-4 text-sm text-white outline-none placeholder:text-gray-600"
      />

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          onClick={saveNote}
          disabled={isSaving || !noteContent.trim()}
          className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-300 hover:text-black disabled:opacity-40"
        >
          {isSaving ? "Saving..." : "Save Note"}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {business.notebookEntries.length ? (
          business.notebookEntries.map((entry) => (
            <div key={entry.id} className="border border-white/10 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                {entry.content}
              </p>

              <p className="mt-3 text-xs text-gray-600">
                {formatDate(entry.createdAt)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No notebook entries captured yet.
          </p>
        )}
      </div>
    </section>
  );
}