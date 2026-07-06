"use client";

import { useEffect, useMemo, useState } from "react";
import InboxPanel from "./InboxPanel";
import QuickQuestion from "./QuickQuestion";
import LinkedInDropzone from "./LinkedInDropzone";
import BusinessCard from "./BusinessCard";
import BusinessWorkspace from "./BusinessWorkspace";
import { getSinceYesterdayChanges } from "../engine/changeEngine";
import { useOneThing } from "../../hooks/useOneThing";
import { Business } from "../types/business";

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

function decisionLabel(decision?: string) {
  if (decision === "connect") return "Recommended";
  if (decision === "avoid") return "Avoid for now";
  return "Maybe";
}

export default function TodayBrief() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");

  const [sources, setSources] = useState<File[]>([]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [prospect, setProspect] = useState<ProspectIntelligence | null>(null);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  const { currentPrompt, answerCurrent, askLater, hasPrompt } = useOneThing();

  function addSource(file: File) {
    setSources((current) => [...current, file]);
    setProspect(null);
    setLinkedinError(null);
  }

  function resetResearchSession() {
    setSources([]);
    setProspect(null);
    setLinkedinError(null);
  }

  async function refreshBusinesses() {
    const response = await fetch("/api/businesses");
    const data = await response.json();

    setBusinesses(data);

    if (selectedBusiness) {
      const updatedSelected = data.find(
        (business: Business) => business.id === selectedBusiness.id
      );

      setSelectedBusiness(updatedSelected ?? null);
    } else {
      setSelectedBusiness(data[0] ?? null);
    }
  }

  const filteredBusinesses = useMemo(() => {
    const query = businessSearch.trim().toLowerCase();

    if (!query) return businesses;

    return businesses.filter((business) => {
      const people =
        business.employments
          ?.map(
            (employment) =>
              `${employment.person.firstName} ${employment.person.lastName} ${
                employment.jobTitle ?? ""
              }`
          )
          .join(" ") ?? "";

      const opportunities =
        business.opportunities
          ?.map(
            (opportunity) =>
              `${opportunity.title} ${opportunity.summary ?? ""}`
          )
          .join(" ") ?? "";

      return [
        business.name,
        business.industry,
        business.country,
        business.summary,
        people,
        opportunities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [businessSearch, businesses]);

  useEffect(() => {
    refreshBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyseProspect() {
    if (sources.length === 0) {
      setLinkedinError("Add at least one source first.");
      return;
    }

    setIsAnalysing(true);
    setLinkedinError(null);
    setProspect(null);

    try {
      const formData = new FormData();

      // Temporary bridge: current API still expects profile/activity.
      // Next package will update /api/linkedin to accept unlimited sources.
      formData.append("profile", sources[0]);

      if (sources[1]) {
        formData.append("activity", sources[1]);
      }

      const response = await fetch("/api/linkedin", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Research analysis failed");
      }

      setProspect(data.result as ProspectIntelligence);
    } catch (error) {
      console.error(error);
      setLinkedinError(
        error instanceof Error
          ? error.message
          : "Could not analyse this research session."
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

      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="no-scrollbar min-h-0 space-y-5 overflow-y-auto pr-2">
          <div className="border border-cyan-300/30 bg-cyan-300/5 p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
              Research Session
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <LinkedInDropzone
                title="Source 1"
                description="Add a source of intelligence."
                onImageSelected={addSource}
              />

              <LinkedInDropzone
                title="Source 2"
                description="Add another source if required."
                onImageSelected={addSource}
              />
            </div>

            <div className="mt-5 border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Sources
              </p>

              {sources.length ? (
                <div className="mt-4 space-y-2">
                  {sources.map((source, index) => (
                    <div
                      key={`${source.name}-${source.lastModified}-${index}`}
                      className="flex items-center justify-between border border-white/10 px-3 py-2 text-sm"
                    >
                      <span className="text-gray-300">
                        Source {index + 1}
                      </span>

                      <span className="text-gray-600">
                        {source.type || "image"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  No sources added yet.
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={analyseProspect}
                disabled={isAnalysing || sources.length === 0}
                className="border border-cyan-300 px-5 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalysing ? "Building intelligence..." : "Analyse"}
              </button>

              <button
                onClick={resetResearchSession}
                className="border border-white/10 px-5 py-2 text-sm text-gray-400 transition hover:border-white/30 hover:text-white"
              >
                Reset
              </button>

              <p className="text-sm text-gray-500">
                {sources.length} source{sources.length === 1 ? "" : "s"} ready
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
                      Research Assessment
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

                <div className="mt-6 border border-cyan-300/20 bg-cyan-300/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                    Suggested connection message
                  </p>
                  <p className="mt-3 text-gray-200">
                    {prospect.suggestedConnectionMessage ||
                      "No message generated."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="sticky top-0 z-10 border border-white/10 bg-[#05080D]/95 p-4 backdrop-blur">
            <input
              value={businessSearch}
              onChange={(event) => setBusinessSearch(event.target.value)}
              placeholder="Search businesses, people, opportunities..."
              className="w-full bg-transparent text-lg text-white outline-none placeholder:text-gray-600"
            />

            <p className="mt-2 text-xs text-gray-600">
              {filteredBusinesses.length} business
              {filteredBusinesses.length === 1 ? "" : "es"} shown
            </p>
          </div>

          {filteredBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              selected={selectedBusiness?.id === business.id}
              onOpen={() =>
                setSelectedBusiness((current) =>
                  current?.id === business.id ? null : business
                )
              }
            />
          ))}
        </div>

        <div className="min-h-0 border-l border-white/10 pl-8">
          {selectedBusiness ? (
            <BusinessWorkspace
              business={selectedBusiness}
              onChanged={refreshBusinesses}
            />
          ) : (
            <InboxPanel />
          )}
        </div>
      </div>
    </section>
  );
}