"use client";

type BusinessOption = {
  id: string;
  name: string;
  peopleCount: number;
  pursuitCount: number;
  opportunityCount: number;
};

type Props = {
  businesses: BusinessOption[];
  locations: string[];
  onPreview: () => void;
  onSaved: (analysis: never) => Promise<void>;
};

type ActionField = "name" | "business" | "role" | "location" | "email" | "demoType" | "sourcePath" | "sourceContext";

type CaptureAction = {
  id: string;
  label: string;
  fields: ActionField[];
};

const actions: CaptureAction[] = [
  { id: "found", label: "Found", fields: ["name", "business", "role", "location", "sourcePath"] },
  { id: "request-sent", label: "Request sent", fields: ["name"] },
  { id: "re-engage", label: "Re-engage existing", fields: ["name", "business", "role"] },
  { id: "request-received", label: "Request received", fields: ["name", "business", "role"] },
];

export default function PursuitCapture({ businesses, locations }: Props) {
  return (
    <section data-quick-capture data-capture-state="collapsed" className="border border-l-2 border-white/10 border-l-cyan-300/25 bg-white/[0.035] p-3 transition data-[capture-state=expanded]:border-cyan-300/25 data-[capture-state=expanded]:border-l-cyan-300/80 data-[capture-state=expanded]:bg-cyan-300/[0.035]">
      <form data-capture-form>
        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="block">
              <span className="sr-only">Quick capture</span>
              <select
                data-action-select
                defaultValue=""
                className="h-9 w-full border border-white/10 bg-black px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              >
                <option value="">Lets start the hunt,,,,,,,</option>
                {actions.map((action) => (
                  <option key={action.id} value={action.id}>{action.label}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              data-capture-collapse
              data-capture-expanded
              className="hidden h-8 border border-white/10 bg-black/20 px-3 text-[11px] text-slate-400 transition hover:border-cyan-300/50 hover:text-cyan-100"
            >
              Collapse
            </button>
          </div>

          <div data-smart-fields data-capture-expanded className="hidden grid gap-3" />
        </div>

        <section data-capture-expanded className="mt-3 hidden border border-white/10 bg-black/15 p-3">
          <div>
            <p className="text-[10px] font-medium uppercase text-cyan-300">Source notes</p>
            <p className="mt-0.5 text-xs text-slate-600">Optional context to help the pursuit.</p>
          </div>
          <div className="mt-3 grid gap-2">
            <label className="min-w-0 border border-white/10 bg-black/20 px-2.5 py-2 focus-within:border-cyan-300/60">
              <span className="text-[9px] font-medium uppercase text-slate-600">LinkedIn URL / HTML</span>
              <textarea
                data-capture-linkedin-html
                rows={2}
                placeholder="Drop or paste LinkedIn URL / profile HTML..."
                className="mt-0.5 w-full resize-none bg-transparent p-0 text-xs leading-5 text-slate-100 outline-none placeholder:text-slate-700"
              />
            </label>
            <label className="min-w-0 border border-white/10 bg-black/20 px-2.5 py-2 focus-within:border-cyan-300/60">
              <span className="text-[9px] font-medium uppercase text-slate-600">Notes</span>
              <textarea
                data-capture-notes
                rows={2}
                placeholder="Anything useful you noticed..."
                className="mt-0.5 w-full resize-none bg-transparent p-0 text-xs leading-5 text-slate-100 outline-none placeholder:text-slate-700"
              />
            </label>
          </div>
        </section>

        <div data-message-coach data-capture-expanded className="mt-3 hidden border border-cyan-300/15 bg-cyan-300/[0.04] p-3" />

        <div data-capture-expanded className="mt-4 hidden flex justify-center">
          <button
            type="submit"
            data-capture-review
            className="h-10 w-full max-w-56 border border-emerald-300/70 bg-emerald-300/12 px-6 text-xs font-semibold text-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.16)] transition hover:border-emerald-200 hover:bg-emerald-300/20 hover:shadow-[0_0_24px_rgba(52,211,153,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start pursuit
          </button>
        </div>
      </form>

      <datalist id="business-suggestions">
        {businesses.map((business) => (
          <option
            key={business.id}
            value={business.name}
            data-business-id={business.id}
            data-people-count={business.peopleCount}
            data-pursuit-count={business.pursuitCount}
            data-opportunity-count={business.opportunityCount}
          />
        ))}
      </datalist>

      <datalist id="location-suggestions">
        {locations.map((location) => (
          <option key={location} value={location} />
        ))}
      </datalist>

      <div data-pursuit-error role="alert" aria-live="assertive" className="mt-3 hidden border border-red-400/40 bg-red-400/15 px-4 py-3 text-sm font-semibold text-red-50 shadow-[0_0_0_1px_rgba(248,113,113,0.14)]" />
      <div data-pursuit-preview />
    </section>
  );
}


