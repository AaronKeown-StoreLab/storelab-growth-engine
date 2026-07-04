import { AccountRecommendation } from "../types/accountRecommendation";

interface Props {
  recommendation: AccountRecommendation;
  index: number;
  onOpen: () => void;
  selected: boolean;
}

export default function RelationshipCard({
  recommendation,
  onOpen,
  selected,
}: Props) {
  const lead = recommendation.contacts[0];

  return (
    <div
      onClick={onOpen}
      className={`cursor-pointer border p-6 transition-all duration-200 ${
        selected
          ? "border-cyan-300 bg-cyan-300/5"
          : "border-white/10 hover:border-white/30 hover:bg-white/[0.03]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
        {recommendation.company.name}
      </p>

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-2xl font-bold leading-tight">
          {lead
            ? `Call ${lead.firstName} ${lead.lastName}`
            : recommendation.goal?.title ?? "Review relationship"}
        </h3>

        {lead && (
          <p className="mt-2 text-sm text-gray-400">
            {lead.role}
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-lg leading-relaxed text-white">
          {recommendation.recommendation}
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <ul className="space-y-2 text-sm leading-relaxed text-gray-400">
          {recommendation.reasons.slice(0, 3).map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}