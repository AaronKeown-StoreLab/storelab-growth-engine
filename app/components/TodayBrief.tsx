"use client";

import { useState } from "react";
import AccountWorkspace from "./AccountWorkspace";
import InboxPanel from "./InboxPanel";
import QuickQuestion from "./QuickQuestion";
import RelationshipCard from "./RelationshipCard";
import LinkedInDropzone from "./LinkedInDropzone";
import { getAccountRecommendations } from "../engine/accountRecommendationEngine";
import { getSinceYesterdayChanges } from "../engine/changeEngine";
import { AccountRecommendation } from "../types/accountRecommendation";
import { useOneThing } from "../../hooks/useOneThing";

const recommendations = getAccountRecommendations();
const changes = getSinceYesterdayChanges();

type ProspectIntelligence = {
  fullName: string;
  jobTitle: string;
  company: string;
  currentEmployer: string;
  location: string;
  aboutSummary: string;

  targetingDecision: "connect" | "maybe" | "avoid";
  opportunityScore: number;
  relationshipValue: "low" | "medium" | "high";
  seniorityFit: "low" | "medium" | "high";
  storeLabRelevance: "low" | "medium" | "high";

  whyThisPersonMatters: string;
  whyConnectOrAvoid: string;
  storeLabAngle: string;

  linkedinActivityLevel: "unknown" | "none" | "low" | "medium" | "high";
  visibleActivitySummary: string;
  topicsTheyEngageWith: string[];
  linkedinEngagementLikelihood: "unknown" | "low" | "medium" | "high";

  bestApproach: string;
  suggestedConnectionMessage: string;
  suggestedFollowUp: string;
  nextAction: string;

  profilePhotoVisible: boolean;
  profilePhotoDescription: string;

  missingContext: string[];
  confidence: "low" | "medium" | "high";
};

function cleanJsonResult(result: unknown) {
  if (typeof result !== "string") return result;

  return JSON.parse(
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
  );
}

function decisionLabel(decision?: string) {
  if (decision === "connect") return "Recommended";
  if (decision === "avoid") return "Avoid for now";
  return "Maybe";
}

export default function TodayBrief() {
  const [selectedAccount, setSelectedAccount] =
    useState<AccountRecommendation | null>(recommendations[0] ?? null);

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [activityImage, setActivityImage] = useState<File | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [prospect, setProspect] = useState<ProspectIntelligence | null>(null);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  const { currentPrompt, answerCurrent, askLater, hasPrompt } = useOneThing();

  async function analyseProspect() {
    if (!profileImage && !activityImage) {
      setLinkedinError("Paste at least one LinkedIn screenshot first.");
      return;
    }

    setIsAnalysing(true);
    setLinkedinError(null);
    setProspect(null);

    try {
      const formData = new FormData();

      if (profileImage) formData.append("profile", profileImage);
      if (activityImage) formData.append("activity", activityImage);

      const response = await fetch("/api/linkedin", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prospect analysis failed");
      }

      setProspect(cleanJsonResult(data.result) as ProspectIntelligence);
    } catch (error) {
      console.error(error);
      setLinkedinError(
        error instanceof Error
          ? error.message
          : "Could not analyse this prospect."
      );
    } finally {
      setIsAnalysing(false);
    }
  }

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

      <div className="mt-6 grid min-h-0 flex-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="no-scrollbar min-h-0 space-y-5 overflow-y-auto pr-2">
          <div className="border border-cyan-300/30 bg-cyan-300/5 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
              Prospect Intelligence
            </p>

            <h1 className="mt-3 text-2xl font-semibold text-white">
              Research someone before you reach out
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Paste a LinkedIn profile screenshot, then optionally paste their
              activity. StoreLab OS will assess whether they are worth pursuing,
              why they matter, and how to approach them.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <LinkedInDropzone
                title="1. Profile Screenshot"
                description="Paste the LinkedIn profile header/about section."
                onImageSelected={(file) => {
                  setProfileImage(file);
                  setProspect(null);
                  setLinkedinError(null);
                }}
              />

              <LinkedInDropzone
                title="2. Activity Screenshot"
                description="Optional, but important. Paste posts, comments or reactions."
                onImageSelected={(file) => {
                  setActivityImage(file);
                  setProspect(null);
                  setLinkedinError(null);
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={analyseProspect}
                disabled={isAnalysing || (!profileImage && !activityImage)}
                className="border border-cyan-300 px-5 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalysing ? "Building intelligence..." : "Analyse Prospect"}
              </button>

              <button
                onClick={() => {
                  setProfileImage(null);
                  setActivityImage(null);
                  setProspect(null);
                  setLinkedinError(null);
                }}
                className="border border-white/10 px-5 py-2 text-sm text-gray-400 transition hover:border-white/30 hover:text-white"
              >
                Reset
              </button>

              <p className="text-sm text-gray-500">
                Profile: {profileImage ? "ready" : "missing"} · Activity:{" "}
                {activityImage ? "ready" : "not supplied"}
              </p>
            </div>

            {linkedinError && (
              <p className="mt-4 text-sm text-red-300">{linkedinError}</p>
            )}

            {prospect && (
              <div className="mt-6 border border-white/10 bg-black/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                      Prospect Assessment
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      {prospect.fullName || "Name not visible"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-300">
                      {prospect.jobTitle || "Role not visible"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {prospect.company ||
                        prospect.currentEmployer ||
                        "Company not visible"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Decision
                    </p>
                    <p className="mt-2 text-xl font-semibold text-cyan-300">
                      {decisionLabel(prospect.targetingDecision)}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Opportunity score: {prospect.opportunityScore}/100
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      StoreLab Fit
                    </p>
                    <p className="mt-2 text-lg text-white">
                      {prospect.storeLabRelevance}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Seniority
                    </p>
                    <p className="mt-2 text-lg text-white">
                      {prospect.seniorityFit}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      LinkedIn Activity
                    </p>
                    <p className="mt-2 text-lg text-white">
                      {prospect.linkedinActivityLevel}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Why this person matters
                    </p>
                    <p className="mt-2 text-gray-300">
                      {prospect.whyThisPersonMatters ||
                        "Not enough visible evidence yet."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Connect or avoid?
                    </p>
                    <p className="mt-2 text-gray-300">
                      {prospect.whyConnectOrAvoid ||
                        "No clear recommendation yet."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Activity read
                    </p>
                    <p className="mt-2 text-gray-300">
                      {prospect.visibleActivitySummary ||
                        "No activity visible. Paste an Activity screenshot to improve this assessment."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Topics they engage with
                    </p>
                    <p className="mt-2 text-gray-300">
                      {prospect.topicsTheyEngageWith?.length
                        ? prospect.topicsTheyEngageWith.join(", ")
                        : "No clear topics visible."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Best approach
                    </p>
                    <p className="mt-2 text-gray-300">
                      {prospect.bestApproach || prospect.storeLabAngle}
                    </p>
                  </div>

                  <div className="border border-cyan-300/20 bg-cyan-300/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                      Suggested connection message
                    </p>
                    <p className="mt-3 text-gray-200">
                      {prospect.suggestedConnectionMessage ||
                        "No message generated."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Next action
                    </p>
                    <p className="mt-2 text-gray-300">
                      {prospect.nextAction ||
                        "Capture more context before deciding."}
                    </p>
                  </div>

                  {prospect.missingContext?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                        Missing context
                      </p>
                      <p className="mt-2 text-gray-300">
                        {prospect.missingContext.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="border border-cyan-300 px-4 py-2 text-sm text-cyan-300 opacity-50">
                    Continue
                  </button>
                  <button
                    onClick={() => setProspect(null)}
                    className="border border-white/10 px-4 py-2 text-sm text-gray-400 hover:border-white/30 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

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