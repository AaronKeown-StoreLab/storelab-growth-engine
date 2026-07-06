import { Business } from "../../types/business";
import { buildChiefOfStaffBrief } from "../../engine/chiefOfStaffEngine";

type Props = {
  business: Business;
};

export default function BusinessHeader({ business }: Props) {
  const brief = buildChiefOfStaffBrief(business);

  return (
    <div className="border-b border-white/10 pb-6">
      <h1 className="text-5xl font-bold tracking-tight">{business.name}</h1>

      <p className="mt-3 text-gray-400">
        {[business.industry, business.country].filter(Boolean).join(" • ")}
      </p>

      {business.summary && (
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-gray-400">
          {business.summary}
        </p>
      )}

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
                • {priority}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}