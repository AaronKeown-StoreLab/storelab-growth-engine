"use client";

type Props = {
  onPreview: () => void;
  onSaved: (analysis: never) => Promise<void>;
};

type ActionField = "name" | "business" | "role" | "location" | "email" | "demoType";

type CaptureAction = {
  id: string;
  label: string;
  fields: ActionField[];
  needsMessage?: boolean;
};

const actions: CaptureAction[] = [
  { id: "found", label: "Found", fields: ["name", "business", "role", "location"], needsMessage: true },
  { id: "request-sent", label: "Request sent", fields: ["name"] },
  { id: "connected", label: "Connected", fields: ["name"], needsMessage: true },
  { id: "demo-proposed", label: "Demo proposed", fields: ["name", "business"], needsMessage: true },
  { id: "demo-accepted", label: "Demo accepted", fields: ["name"], needsMessage: true },
  { id: "email-received", label: "Email received", fields: ["name", "email"] },
  { id: "email-sent", label: "Email sent", fields: ["name", "demoType"], needsMessage: true },
  { id: "calendar-sent", label: "Calendar sent", fields: ["name", "demoType"] },
  { id: "booked", label: "Booked", fields: ["name"] },
  { id: "parked", label: "Parked", fields: ["name"] },
];

const fieldLabels: Record<ActionField, string> = {
  name: "Name",
  business: "Business",
  role: "Role",
  location: "Location",
  email: "Email",
  demoType: "Demo type",
};

const defaults: Record<ActionField, string> = {
  name: "Joe Blogs",
  business: "7Eleven Australia",
  role: "Marketing Mgr",
  location: "",
  email: "",
  demoType: "Teams",
};

function SmartField({ field }: { field: ActionField }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{fieldLabels[field]}</span>
      <input
        data-smart-field={field}
        defaultValue={defaults[field]}
        placeholder={fieldLabels[field]}
        className="mt-1 w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60"
      />
    </label>
  );
}

export default function PursuitCapture(props: Props) {
  void props;
  const initialAction = actions[0];

  return (
    <section data-quick-capture className="border border-cyan-300/20 bg-[#071014] p-3 shadow-xl shadow-black/20 sm:p-4">
      <form data-capture-form>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block sm:w-48">
            <span className="text-sm font-medium text-white">Quick capture</span>
            <select
              data-action-select
              defaultValue={initialAction.id}
              className="mt-2 w-full border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/60"
            >
              {actions.map((action) => (
                <option key={action.id} value={action.id}>{action.label}</option>
              ))}
            </select>
          </label>

          <div data-smart-fields className="grid flex-1 gap-2 sm:grid-cols-2">
            {initialAction.fields.map((field) => (
              <SmartField key={field} field={field} />
            ))}
          </div>
        </div>

        <div className="mt-3 border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Sentence preview</p>
          <p data-sentence-preview className="mt-1 text-sm leading-6 text-slate-300">
            Found &quot;Joe Blogs&quot; from &quot;7Eleven Australia&quot; with role &quot;Marketing Mgr&quot;. Message needed.
          </p>
        </div>

        <div data-message-coach className="mt-3 border border-cyan-300/15 bg-cyan-300/[0.04] p-3" />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            data-capture-review
            className="border border-cyan-300 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review with AI
          </button>
        </div>
      </form>

      <div data-pursuit-error className="mt-3 hidden border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100" />
      <div data-pursuit-preview />
    </section>
  );
}


