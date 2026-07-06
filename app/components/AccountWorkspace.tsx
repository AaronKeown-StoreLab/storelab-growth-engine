import MetricCard from "./MetricCard";
import Timeline from "./Timeline";
import OutreachStudio from "./OutreachStudio";
import ChiefOfStaff from "./ChiefOfStaff";
import RelationshipTimeline from "./RelationshipTimeline";
import { AccountRecommendation } from "../types/accountRecommendation";
import { buildRelationshipMemory } from "../brain/relationshipMemory";

interface Props {
  recommendation: AccountRecommendation;
}

function getHealthLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Warm";
  if (score >= 40) return "Needs attention";
  return "Cooling";
}

export default function AccountWorkspace({ recommendation }: Props) {
  const memory = buildRelationshipMemory(recommendation);

  const healthScore = Math.round(
    (recommendation.signals.priority +
      recommendation.signals.momentum +
      recommendation.signals.opportunity) /
      3
  );

  const healthLabel = getHealthLabel(healthScore);

  return (
    <div className="border border-white/10 bg-black/20 p-8">
      <div className="border-b border-white/10 pb-6">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          Relationship Workspace
        </p>

        <h2 className="mt-3 text-4xl font-bold tracking-tight">
          {recommendation.company.name}
        </h2>

        <p className="mt-2 text-gray-400">
          {healthLabel} relationship • {healthScore}% health
        </p>
      </div>

      <div className="mt-6">
        <ChiefOfStaff
          recommendation={recommendation.recommendation}
          confidence={healthScore}
        />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-xs uppercase tracking-[0.4em] text-gray-500">
          Relationship Network
        </h3>

        <div className="mt-5 divide-y divide-white/10">
          {recommendation.contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between py-5"
            >
              <div>
                <p className="text-lg font-semibold">
                  {contact.firstName} {contact.lastName}
                </p>

                <p className="mt-1 text-sm text-gray-400">{contact.role}</p>
              </div>

              <p className="text-sm text-green-300">Warm</p>
            </div>
          ))}
        </div>
      </div>

      <RelationshipTimeline />

      <div className="mt-8 border-t border-white/10 pt-6">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          Relationship Memory
        </p>

        <pre className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
          {memory}
        </pre>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
        <MetricCard title="Priority" value={`${recommendation.signals.priority}%`} />
        <MetricCard title="Momentum" value={`${recommendation.signals.momentum}%`} />
        <MetricCard title="Opportunity" value={`${recommendation.signals.opportunity}%`} />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <Timeline events={recommendation.events} />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <OutreachStudio recommendation={recommendation} />
      </div>
    </div>
  );
}