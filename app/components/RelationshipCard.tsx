import { AccountRecommendation } from "../types/accountRecommendation";

interface Props {
  recommendation: AccountRecommendation;
  index: number;
  onOpen: () => void;
  selected: boolean;
}

function getRelationshipLabel(score: number) {
  if (score >= 80) return "Trusted relationship";
  if (score >= 60) return "Warm relationship";
  if (score >= 40) return "Needs attention";
  return "Cooling relationship";
}

export default function RelationshipCard({
  recommendation,
  onOpen,
  selected,
}: Props) {
  const leadContact = recommendation.contacts[0];

  const healthScore = Math.round(
    (recommendation.signals.priority +
      recommendation.signals.momentum +
      recommendation.signals.opportunity) /
      3
  );

  const relationshipLabel = getRelationshipLabel(healthScore);

  return (
    <div
      onClick={onOpen}
      className={`cursor-pointer border p-6 transition-all duration-200 ${
        selected
          ? "border-white bg-white/[0.06]"
          : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/[0.04]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
        {recommendation.company.name}
      </p>

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-2xl font-bold leading-tight">
          {leadContact
            ? `Call ${leadContact.firstName} ${leadContact.lastName}`
            : recommendation.goal?.title ?? "Review relationship"}
        </h3>

        {leadContact && (
          <p className="mt-2 text-sm text-gray-400">
            {leadContact.role}
          </p>
        )}

        <p className="mt-4 text-sm text-green-300">
          {relationshipLabel}
        </p>
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