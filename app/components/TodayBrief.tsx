import { useState } from "react";
import AccountWorkspace from "./AccountWorkspace";
import QuickQuestion from "./QuickQuestion";
import RelationshipCard from "./RelationshipCard";
import { getAccountRecommendations } from "../engine/accountRecommendationEngine";
import { getSinceYesterdayChanges } from "../engine/changeEngine";
import { AccountRecommendation } from "../types/accountRecommendation";
import { useOneThing } from "../../hooks/useOneThing";

const recommendations = getAccountRecommendations();
const changes = getSinceYesterdayChanges();

export default function TodayBrief() {
  const [selectedAccount, setSelectedAccount] =
    useState<AccountRecommendation | null>(null);

  const { currentPrompt, answerCurrent, askLater, hasPrompt } = useOneThing();

  return (
    <section className="space-y-8">
      {hasPrompt && currentPrompt && (
        <QuickQuestion
          question={currentPrompt.prompt}
          options={
            currentPrompt.type === "yesNo"
              ? ["Yes", "No", "Not sure"]
              : ["Capture note", "Skip for now"]
          }
          onAnswer={answerCurrent}
          onLater={askLater}
        />
      )}

      <div className="border-b border-white/10 pb-6">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          Today
        </p>

        <div className="mt-5 space-y-3">
          {changes.map((change) => (
            <div key={change.id} className="flex items-start gap-4 text-sm">
              <span className="mt-0.5 text-cyan-300">
                {change.impact === "Positive"
                  ? "↑"
                  : change.impact === "Negative"
                    ? "↓"
                    : "→"}
              </span>

              <div>
                <p className="font-medium text-white">{change.title}</p>
                <p className="text-gray-500">{change.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {recommendations.map((recommendation, index) => {
          const selected =
            selectedAccount?.company.id === recommendation.company.id;

          return (
            <div key={recommendation.company.id} className="space-y-4">
              <RelationshipCard
                recommendation={recommendation}
                index={index}
                selected={selected}
                onOpen={() =>
                  setSelectedAccount((current) =>
                    current?.company.id === recommendation.company.id
                      ? null
                      : recommendation
                  )
                }
              />

              {selected && (
                <div className="border-l border-cyan-300/30 pl-6">
                  <AccountWorkspace recommendation={recommendation} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}