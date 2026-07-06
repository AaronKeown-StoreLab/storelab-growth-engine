"use client";

import Drawer from "./Drawer";
import { Business } from "../types/business";

type Employment = Business["employments"][number];

type Props = {
  employment: Employment | null;
  open: boolean;
  onClose: () => void;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function RelationshipDrawer({
  employment,
  open,
  onClose,
}: Props) {
  if (!employment) return null;

  const person = employment.person;
  const fullName = `${person.firstName} ${person.lastName}`;

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

              <p className="mt-4 text-sm text-cyan-300">Warm relationship</p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Chief of Staff
          </p>

          <p className="mt-4 text-sm leading-relaxed text-gray-300">
            This relationship is now part of the StoreLab OS memory. As more
            interactions, notes and LinkedIn intelligence are captured, this
            panel will become the relationship briefing.
          </p>
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Relationship Health
          </p>

          <div className="mt-4 h-2 overflow-hidden bg-white/10">
            <div className="h-full w-[72%] bg-cyan-300" />
          </div>

          <p className="mt-3 text-sm text-cyan-300">
            Warm — based on current relationship data.
          </p>
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
            <p className="font-semibold text-white">Current business</p>

            <p className="mt-1 text-sm text-gray-400">
              {employment.jobTitle || "Role not captured yet"}
            </p>

            <p className="mt-3 text-xs text-cyan-300">Active</p>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Actions
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button className="border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/30">
              Edit
            </button>

            <button className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-300 hover:text-black">
              Move
            </button>

            <button className="border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/30">
              Add Interaction
            </button>
          </div>
        </section>
      </div>
    </Drawer>
  );
}