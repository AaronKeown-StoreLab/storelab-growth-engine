"use client";

import { ChangeEvent, useState } from "react";
import { PursuitCaptureAnalysis, PursuitStage } from "../../types/pursuit";

type Props = {
  analysis: PursuitCaptureAnalysis;
  saving: boolean;
  stages: readonly PursuitStage[];
  onChange: (analysis: PursuitCaptureAnalysis) => void;
  onIgnore: () => void;
  onSave: (analysis: PursuitCaptureAnalysis) => Promise<void>;
};

type EditableField =
  | "firstName"
  | "lastName"
  | "role"
  | "business"
  | "nextAction"
  | "suggestedMessage"
  | "whyRelevant"
  | "storeLabAngle";

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase text-slate-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-2 w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/60"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60"
        />
      )}
    </label>
  );
}

export default function PursuitPreview({
  analysis,
  saving,
  stages,
  onChange,
  onIgnore,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const personName = `${analysis.person.firstName} ${analysis.person.lastName ?? ""}`.trim();

  function update(path: EditableField, value: string) {
    if (path === "business") {
      onChange({
        ...analysis,
        business: {
          ...analysis.business,
          name: value,
        },
      });
      return;
    }

    if (path === "firstName" || path === "lastName" || path === "role") {
      onChange({
        ...analysis,
        person: {
          ...analysis.person,
          [path]: value,
        },
      });
      return;
    }

    onChange({
      ...analysis,
      [path]: value,
    });
  }

  function updateStage(event: ChangeEvent<HTMLSelectElement>) {
    const stage = event.target.value as PursuitStage;
    onChange({
      ...analysis,
      stage,
    });
  }

  return (
    <div className="mt-3 border border-white/10 bg-white/[0.025] p-3">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase text-cyan-300">
            Review before saving
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white">
            {personName || "New person"} at {analysis.business.name || "new company"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">
            {analysis.whatChanged}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="h-9 border border-white/10 px-3 text-xs text-slate-200 hover:border-white/25"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onIgnore}
            className="h-9 border border-white/10 px-3 text-xs text-slate-500 hover:border-white/25 hover:text-white"
          >
            Ignore
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Field label="First name" value={analysis.person.firstName} onChange={(value) => update("firstName", value)} />
          <Field label="Last name" value={analysis.person.lastName ?? ""} onChange={(value) => update("lastName", value)} />
          <Field label="Role" value={analysis.person.role ?? ""} onChange={(value) => update("role", value)} />
          <Field label="Company" value={analysis.business.name} onChange={(value) => update("business", value)} />
          <label className="block">
            <span className="text-[10px] font-medium uppercase text-slate-500">
              Stage
            </span>
            <select
              value={analysis.stage}
              onChange={updateStage}
              className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60"
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <Field label="StoreLab angle" value={analysis.storeLabAngle ?? ""} onChange={(value) => update("storeLabAngle", value)} />
          <Field label="Why this matters" value={analysis.whyRelevant ?? ""} onChange={(value) => update("whyRelevant", value)} multiline />
          <Field label="Next action" value={analysis.nextAction} onChange={(value) => update("nextAction", value)} multiline />
          <div className="md:col-span-2">
            <Field label="Draft message" value={analysis.suggestedMessage ?? ""} onChange={(value) => update("suggestedMessage", value)} multiline />
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase text-slate-500">Stage</p>
            <p className="mt-2 text-sm font-medium text-white">{analysis.stage}</p>
          </div>
          <div className="border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase text-slate-500">Next action</p>
            <p className="mt-2 text-sm leading-6 text-white">{analysis.nextAction}</p>
          </div>
          <div className="border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase text-slate-500">Why it matters</p>
            <p className="mt-2 text-sm leading-6 text-white">{analysis.whyRelevant || analysis.storeLabAngle || "Not known yet"}</p>
          </div>
        </div>
      )}

      {analysis.suggestedMessage && !editing && (
        <div className="mt-4 border border-cyan-300/15 bg-cyan-300/5 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Suggested message</p>
          <p className="mt-2 text-sm leading-6 text-slate-100">{analysis.suggestedMessage}</p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(analysis)}
          className="h-9 border border-cyan-300 bg-cyan-300 px-4 text-xs font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save to memory"}
        </button>
      </div>
    </div>
  );
}
