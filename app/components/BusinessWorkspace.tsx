"use client";

import { useState } from "react";
import { Business } from "../types/business";

type Props = {
  business: Business;
  onChanged: () => void;
};

export default function BusinessWorkspace({ business, onChanged }: Props) {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPerson() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/businesses/${business.id}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          jobTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add person.");
      }

      setFirstName("");
      setLastName("");
      setJobTitle("");
      setShowAddPerson(false);
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add person.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-5xl font-bold tracking-tight">{business.name}</h1>

        <p className="mt-3 text-gray-400">
          {[business.industry, business.country].filter(Boolean).join(" • ")}
        </p>
      </div>

      <section className="mt-8 border border-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            People
          </p>

          <button
            onClick={() => setShowAddPerson((current) => !current)}
            className="border border-cyan-300 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-300 hover:text-black"
          >
            + Add Person
          </button>
        </div>

        {showAddPerson && (
          <div className="mt-5 border border-cyan-300/20 bg-cyan-300/5 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
              />

              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
              />

              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Role / title"
                className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
              />
            </div>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            <div className="mt-4 flex gap-3">
              <button
                onClick={addPerson}
                disabled={isSaving}
                className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-300 hover:text-black disabled:opacity-40"
              >
                {isSaving ? "Saving..." : "Save Person"}
              </button>

              <button
                onClick={() => setShowAddPerson(false)}
                className="border border-white/10 px-4 py-2 text-sm text-gray-400 hover:border-white/30 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {business.employments.length ? (
            business.employments.map((employment) => (
              <div key={employment.id} className="border border-white/10 p-4">
                <p className="font-semibold text-white">
                  {employment.person.firstName} {employment.person.lastName}
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  {employment.jobTitle || "Role not captured yet"}
                </p>

                <p className="mt-3 text-xs text-cyan-300">
                  Current relationship
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No people captured yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          AI Brief
        </p>

        <p className="mt-4 text-gray-300">
          {business.summary || "No business intelligence summary captured yet."}
        </p>
      </section>

      <section className="mt-8 border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Opportunities
        </p>

        <div className="mt-5 space-y-4">
          {business.opportunities.length ? (
            business.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="border border-white/10 p-4">
                <p className="font-semibold text-white">{opportunity.title}</p>

                <p className="mt-2 text-sm text-gray-400">
                  {opportunity.nextAction ||
                    opportunity.summary ||
                    "No next action captured."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No opportunities captured yet.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8 border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Intelligence
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Captured LinkedIn, email, meeting and research intelligence will appear
          here.
        </p>
      </section>

      <section className="mt-8 border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Timeline
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Relationship history and business activity will appear here.
        </p>
      </section>
    </div>
  );
}