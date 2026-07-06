"use client";

import { useState } from "react";
import Drawer from "./Drawer";
import { Business } from "../types/business";
import { thinkAboutRelationship } from "../brain/relationshipHealth";

type Employment = Business["employments"][number];

type Props = {
  business: Business;
  employment: Employment | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function RelationshipDrawer({
  business,
  employment,
  open,
  onClose,
  onChanged,
}: Props) {
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionType, setInteractionType] = useState("note");
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!employment) return null;

  const person = employment.person;
  const fullName = `${person.firstName} ${person.lastName}`;
  const health = thinkAboutRelationship(business, employment);

  const interactions = business.interactions.filter(
    (interaction) => interaction.personId === person.id
  );

  async function saveInteraction() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/people/${person.id}/interactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          type: interactionType,
          summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save interaction.");
      }

      setSummary("");
      setInteractionType("note");
      setShowInteraction(false);
      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save interaction."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer open={open} title={fullName} onClose={onClose}>
      <div className="space-y-8">
        <section className="border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-lg font-semibold text-cyan-300">
              {getInitials(person.firstName, person.lastName)}
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-white">{fullName}</h3>

              <p className="mt-2 text-sm text-gray-400">
                {employment.jobTitle || "Role not captured yet"}
              </p>

              <p className="mt-4 text-sm text-cyan-300">
                {health.status} relationship · {health.score}%
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Relationship Health
          </p>

          <p className="mt-4 text-3xl font-semibold text-white">
            {health.score}%
          </p>

          <p className="mt-2 text-sm text-cyan-300">{health.status}</p>

          <div className="mt-5 space-y-2">
            {health.reasons.map((reason) => (
              <p key={reason} className="text-sm text-gray-400">
                • {reason}
              </p>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Activity
            </p>

            <button
              onClick={() => setShowInteraction((current) => !current)}
              className="border border-cyan-300 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-300 hover:text-black"
            >
              + Add Interaction
            </button>
          </div>

          {showInteraction && (
            <div className="mt-5 border border-cyan-300/20 bg-cyan-300/5 p-4">
              <select
                value={interactionType}
                onChange={(event) => setInteractionType(event.target.value)}
                className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="note">Note</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="linkedin">LinkedIn</option>
                <option value="demo">Demo</option>
              </select>

              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="What happened?"
                className="mt-3 min-h-28 w-full resize-none border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-gray-600"
              />

              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={saveInteraction}
                  disabled={isSaving || !summary.trim()}
                  className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-300 hover:text-black disabled:opacity-40"
                >
                  {isSaving ? "Saving..." : "Save Interaction"}
                </button>

                <button
                  onClick={() => setShowInteraction(false)}
                  className="border border-white/10 px-4 py-2 text-sm text-gray-400 hover:border-white/30 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {interactions.length ? (
              interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="border-l border-cyan-300/30 pl-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium capitalize text-cyan-300">
                      {interaction.type}
                    </p>

                    <p className="text-xs text-gray-600">
                      {formatDate(interaction.occurredAt)}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    {interaction.summary}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                No activity captured for this relationship yet.
              </p>
            )}
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Notes
          </p>

          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            {person.notes || "No relationship notes captured yet."}
          </p>
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Employment History
          </p>

          <div className="mt-4 border border-white/10 p-4">
            <p className="font-semibold text-white">{business.name}</p>

            <p className="mt-1 text-sm text-gray-400">
              {employment.jobTitle || "Role not captured yet"}
            </p>

            <p className="mt-3 text-xs text-cyan-300">Current</p>
          </div>
        </section>
      </div>
    </Drawer>
  );
}