"use client";

import { FormEvent, useState } from "react";
import { Business } from "../types/business";

type Props = {
  onCreated: (business: Business) => void;
};

export default function AddBusinessPanel({ onCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setName("");
    setWebsite("");
    setIndustry("");
    setCountry("");
    setSummary("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, website, industry, country, summary }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add business.");
      }

      onCreated(data as Business);
      resetForm();
      setIsOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not add business."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-11 border border-cyan-300/50 px-4 text-left text-sm transition hover:bg-cyan-300 hover:text-black"
      >
        <span className="block font-semibold text-cyan-300">+ Add target</span>
        <span className="mt-1 block text-xs text-gray-500">
          Create a business manually
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full border border-cyan-300/30 bg-cyan-300/5 p-4 xl:min-w-96"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-cyan-300">New Target Business</p>
          <p className="mt-1 text-xs text-gray-500">
            Create manually when the Brain has not found it yet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          className="h-8 w-8 border border-white/10 text-sm text-gray-500 transition hover:border-white/30 hover:text-white"
          aria-label="Close add business"
        >
          x
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Business name"
          className="min-h-11 border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/70 md:col-span-2"
          autoFocus
        />

        <input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="Website"
          className="min-h-11 border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/70 md:col-span-2"
        />

        <input
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          placeholder="Industry"
          className="min-h-11 border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/70"
        />

        <input
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="Country / market"
          className="min-h-11 border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/70"
        />

        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Why this business matters, what to watch, or where the opportunity might be"
          rows={4}
          className="resize-none border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/70 md:col-span-2"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="min-h-10 border border-cyan-300 px-4 text-sm font-medium text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Creating..." : "Create Business"}
        </button>

        <button
          type="button"
          onClick={resetForm}
          className="min-h-10 border border-white/10 px-4 text-sm text-gray-400 transition hover:border-white/30 hover:text-white"
        >
          Clear
        </button>
      </div>
    </form>
  );
}