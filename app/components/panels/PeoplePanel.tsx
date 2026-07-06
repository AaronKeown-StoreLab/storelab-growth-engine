"use client";

import { useState } from "react";
import { Business } from "../../types/business";
import RelationshipDrawer from "../RelationshipDrawer";

type Props = {
  business: Business;
  onChanged: () => void;
};

type Employment = Business["employments"][number];

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function PeoplePanel({ business, onChanged }: Props) {
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedEmployment, setSelectedEmployment] =
    useState<Employment | null>(null);

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
    <>
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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {business.employments.length ? (
            business.employments.map((employment) => (
              <button
                key={employment.id}
                onClick={() => setSelectedEmployment(employment)}
                className="group border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-semibold text-cyan-300">
                    {getInitials(
                      employment.person.firstName,
                      employment.person.lastName
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-white">
                      {employment.person.firstName} {employment.person.lastName}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {employment.jobTitle || "Role not captured yet"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-sm text-cyan-300">Warm relationship</p>

                  <p className="mt-2 text-xs text-gray-500">
                    Relationship workspace ready
                  </p>
                </div>

                <p className="mt-5 text-sm text-gray-400 transition group-hover:text-cyan-300">
                  Open workspace →
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No people captured yet.</p>
          )}
        </div>
      </section>

      <RelationshipDrawer
        employment={selectedEmployment}
        open={Boolean(selectedEmployment)}
        onClose={() => setSelectedEmployment(null)}
      />
    </>
  );
}