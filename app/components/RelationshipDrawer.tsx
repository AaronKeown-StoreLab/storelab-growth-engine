"use client";

import { useEffect, useState } from "react";
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

function shorten(value: string, maxLength = 220) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) return compact;

  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

export default function RelationshipDrawer({
  business,
  employment,
  open,
  onClose,
  onChanged,
}: Props) {
  const [showInteraction, setShowInteraction] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [interactionType, setInteractionType] = useState("note");
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const [editFirstName, setEditFirstName] = useState(
    employment?.person.firstName ?? ""
  );
  const [editLastName, setEditLastName] = useState(
    employment?.person.lastName ?? ""
  );
  const [editJobTitle, setEditJobTitle] = useState(employment?.jobTitle ?? "");
  const [editLinkedInUrl, setEditLinkedInUrl] = useState(
    employment?.person.linkedinUrl ?? ""
  );
  const [editEmail, setEditEmail] = useState(employment?.person.email ?? "");
  const [editNotes, setEditNotes] = useState(employment?.person.notes ?? "");
  const [targetBusinessId, setTargetBusinessId] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [moveJobTitle, setMoveJobTitle] = useState(employment?.jobTitle ?? "");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadBusinesses() {
      const response = await fetch("/api/businesses");
      const data = (await response.json()) as Business[];

      if (!cancelled) {
        setBusinesses(data);
      }
    }

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!employment) return null;

  const person = employment.person;
  const fullName = `${person.firstName} ${person.lastName}`;
  const health = thinkAboutRelationship(business, employment);
  const otherBusinesses = businesses.filter((item) => item.id !== business.id);

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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save interaction.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePerson() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/people/${person.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          firstName: editFirstName,
          lastName: editLastName,
          jobTitle: editJobTitle,
          linkedinUrl: editLinkedInUrl,
          email: editEmail,
          notes: editNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update person.");
      }

      setShowEdit(false);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update person.");
    } finally {
      setIsSaving(false);
    }
  }

  async function movePerson() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/people/${person.id}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: newBusinessName.trim() ? "" : targetBusinessId,
          newBusinessName,
          jobTitle: moveJobTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not move person.");
      }

      setShowMove(false);
      onClose();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not move person.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removePerson() {
    const confirmed = window.confirm(`Remove ${fullName} from ${business.name}?`);

    if (!confirmed) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/people/${person.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not remove person.");
      }

      onClose();
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove person.");
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

            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold text-white">{fullName}</h3>

              <p className="mt-2 text-sm text-gray-400">
                {employment.jobTitle || "Role not captured yet"}
              </p>

              <p className="mt-4 text-sm text-cyan-300">
                {health.status} relationship | {health.score}%
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button
              onClick={() => setShowEdit((current) => !current)}
              className="border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-cyan-300/50 hover:text-cyan-300"
            >
              Edit
            </button>
            <button
              onClick={() => setShowMove((current) => !current)}
              className="border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-cyan-300/50 hover:text-cyan-300"
            >
              Move Business
            </button>
            <button
              onClick={removePerson}
              disabled={isSaving}
              className="border border-white/10 px-3 py-2 text-xs text-gray-500 hover:border-red-300/50 hover:text-red-200 disabled:opacity-40"
            >
              Remove
            </button>
          </div>

          {showEdit && (
            <div className="mt-5 border border-cyan-300/20 bg-cyan-300/5 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={editFirstName}
                  onChange={(event) => setEditFirstName(event.target.value)}
                  placeholder="First name"
                  className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                />
                <input
                  value={editLastName}
                  onChange={(event) => setEditLastName(event.target.value)}
                  placeholder="Last name"
                  className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                />
                <input
                  value={editJobTitle}
                  onChange={(event) => setEditJobTitle(event.target.value)}
                  placeholder="Role / title"
                  className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                />
                <input
                  value={editLinkedInUrl}
                  onChange={(event) => setEditLinkedInUrl(event.target.value)}
                  placeholder="LinkedIn URL"
                  className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                />
                <input
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  placeholder="Email"
                  className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                />
              </div>
              <textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                placeholder="Relationship notes"
                className="mt-3 min-h-24 w-full resize-none border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-gray-600"
              />
              <button
                onClick={savePerson}
                disabled={isSaving || !editFirstName.trim() || !editLastName.trim()}
                className="mt-4 border border-cyan-300 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-300 hover:text-black disabled:opacity-40"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {showMove && (
            <div className="mt-5 border border-cyan-300/20 bg-cyan-300/5 p-4">
              <select
                value={targetBusinessId}
                onChange={(event) => setTargetBusinessId(event.target.value)}
                disabled={Boolean(newBusinessName.trim())}
                className="w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
              >
                <option value="">Choose an existing business</option>
                {otherBusinesses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <input
                value={newBusinessName}
                onChange={(event) => setNewBusinessName(event.target.value)}
                placeholder="Or create a new business"
                className="mt-3 w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
              />

              <input
                value={moveJobTitle}
                onChange={(event) => setMoveJobTitle(event.target.value)}
                placeholder="New role / title"
                className="mt-3 w-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
              />

              <button
                onClick={movePerson}
                disabled={isSaving || (!targetBusinessId && !newBusinessName.trim())}
                className="mt-4 border border-cyan-300 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-300 hover:text-black disabled:opacity-40"
              >
                {isSaving ? "Moving..." : "Move Relationship"}
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
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
                {reason}
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
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              StoreLab Summary
            </p>
            {person.evidence?.length ? (
              <p className="text-xs text-gray-600">
                {person.evidence.length} source{person.evidence.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          <div className="mt-4 rounded-none border border-white/10 bg-white/[0.02] p-4">
            {person.evidence?.length ? (
              <div className="space-y-3">
                {person.evidence.slice(0, 3).map((item) => (
                  <div key={item.id} className="border-l border-cyan-300/30 pl-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">
                        {item.title || "Relationship signal"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(item.capturedAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">
                      {shorten(item.content)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Add articles, posts, screenshots, or notes as sources to build the useful background for this person.
              </p>
            )}
          </div>
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
