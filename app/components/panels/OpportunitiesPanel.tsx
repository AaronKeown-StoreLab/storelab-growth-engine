import { Business } from "../../types/business";

type Props = {
  business: Business;
};

export default function OpportunitiesPanel({ business }: Props) {
  return (
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
          <p className="text-sm text-gray-500">No opportunities captured yet.</p>
        )}
      </div>
    </section>
  );
}