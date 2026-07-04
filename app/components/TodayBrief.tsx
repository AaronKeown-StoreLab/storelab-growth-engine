import { useState } from "react";
import AccountWorkspace from "./AccountWorkspace";
import InboxPanel from "./InboxPanel";
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
    useState<AccountRecommendation | null>(recommendations[0] ?? null);

  const { currentPrompt, answerCurrent, askLater, hasPrompt } = useOneThing();

  return (
    <section className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {hasPrompt && currentPrompt && (
        <div className="mb-6">
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
        </div>
      )}

      <div className="border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          Today
        </p>

        <div className="mt-4 space-y-3">
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

      <div className="mt-6 grid min-h-0 flex-1 gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="no-scrollbar min-h-0 space-y-5 overflow-y-auto pr-2">
          {recommendations.map((recommendation, index) => (
            <RelationshipCard
              key={recommendation.company.id}
              recommendation={recommendation}
              index={index}
              selected={selectedAccount?.company.id === recommendation.company.id}
              onOpen={() =>
                setSelectedAccount((current) =>
                  current?.company.id === recommendation.company.id
                    ? null
                    : recommendation
                )
              }
            />
          ))}
        </div>

        <div className="no-scrollbar min-h-0 overflow-y-auto border-l border-white/10 pl-8">
          {selectedAccount ? (
            <AccountWorkspace recommendation={selectedAccount} />
          ) : (
            <InboxPanel />
          )}
        </div>
      </div>
    </section>
  );
}