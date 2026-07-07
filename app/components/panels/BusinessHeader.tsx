"use client";

import { useState } from "react";
import { Business } from "../../types/business";
import { buildChiefOfStaffBrief } from "../../engine/chiefOfStaffEngine";

type Props = {
  business: Business;
  onChanged: () => void;
  onDeleted: () => void;
};

export default function BusinessHeader({ business, onChanged, onDeleted }: Props) {
  const brief = buildChiefOfStaffBrief(business);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(business.name);
  const [website, setWebsite] = useState(business.website ?? "");
  const [industry, setIndustry] = useState(business.industry ?? "");
  const [country, setCountry] = useState(business.country ?? "");
  const [summary, setSummary] = useState(business.summary ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function saveBusiness() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          website,
          industry,
          country,
          summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update business.");
      }

      setIsEditing(false);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update business.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBusiness() {
    const confirmed = window.confirm(`Delete ${business.name} from active businesses?`);

    if (!confirmed) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not delete business.");
      }

      onDeleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete business.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="border-b border-white/10 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full border border-white/10 bg-black/20 px-3 py-2 text-3xl font-bold text-white outline-none focus:border-cyan-300/70"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="Website"
                  className="border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
                />
                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="Industry"
                  className="border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
                />
                <input
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder="Country"
                  className="border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
                />
              </div>

              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={4}
                placeholder="Summary"
                className="w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/70"
              />
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-bold tracking-tight">{business.name}</h1>

              <p className="mt-3 text-gray-400">
                {[business.industry, business.country].filter(Boolean).join(" | ")}
              </p>

              {business.website && (
                <p className="mt-2 truncate text-sm text-cyan-300">{business.website}</p>
              )}

              {business.summary && (
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-gray-400">
                  {business.summary}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                onClick={saveBusiness}
                disabled={isSaving}
                className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:opacity-40"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/30 hover:text-white"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-cyan-300/50 hover:text-cyan-300"
              >
                Edit
              </button>
              <button
                onClick={deleteBusiness}
                disabled={isSaving}
                className="border border-white/10 px-4 py-2 text-sm text-gray-500 transition hover:border-red-300/50 hover:text-red-200 disabled:opacity-40"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-8 border border-cyan-300/20 bg-cyan-300/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
          {brief.headline}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-gray-200">
          {brief.summary}
        </p>

        {brief.priorities.length > 0 && (
          <div className="mt-5 space-y-2">
            {brief.priorities.map((priority) => (
              <p key={priority} className="text-sm text-gray-400">
                {priority}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}