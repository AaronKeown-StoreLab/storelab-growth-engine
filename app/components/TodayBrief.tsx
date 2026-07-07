"use client";

import { useEffect, useMemo, useState } from "react";
import InboxPanel from "./InboxPanel";
import QuickQuestion from "./QuickQuestion";
import ResearchWorkspace from "./ResearchWorkspace";
import AddBusinessPanel from "./AddBusinessPanel";
import BusinessCard from "./BusinessCard";
import BusinessWorkspace from "./BusinessWorkspace";
import DailyAssistantPanel from "./DailyAssistantPanel";
import { useOneThing } from "../../hooks/useOneThing";
import { Business } from "../types/business";

export default function TodayBrief() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");

  const { currentPrompt, answerCurrent, askLater, hasPrompt } = useOneThing();

  function handleBusinessApproved(business: Business) {
    setBusinesses((current) => {
      const withoutExisting = current.filter((item) => item.id !== business.id);
      return [...withoutExisting, business].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    setSelectedBusiness(business);
    setBusinessSearch("");
  }

  function handleBusinessDeleted() {
    const deletedId = selectedBusiness?.id;

    if (!deletedId) return;

    setBusinesses((current) => current.filter((business) => business.id !== deletedId));
    setSelectedBusiness(null);
  }

  async function refreshBusinesses() {
    const response = await fetch("/api/businesses");
    const data = (await response.json()) as Business[];

    setBusinesses(data);

    if (selectedBusiness) {
      const updatedSelected = data.find(
        (business) => business.id === selectedBusiness.id
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
        business.website,
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
    let cancelled = false;

    async function loadBusinesses() {
      const response = await fetch("/api/businesses");
      const data = (await response.json()) as Business[];

      if (cancelled) return;

      setBusinesses(data);
      setSelectedBusiness(data[0] ?? null);
    }

    void loadBusinesses();

    return () => {
      cancelled = true;
    };
  }, []);

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
          <DailyAssistantPanel
            businesses={businesses}
            onOpenBusiness={(business) => {
              setSelectedBusiness(business);
              setBusinessSearch("");
            }}
          />

          <ResearchWorkspace
            business={selectedBusiness}
            businesses={businesses}
            onBusinessApproved={handleBusinessApproved}
          />

          <div className="sticky top-0 z-10 border border-white/10 bg-[#05080D]/95 p-4 backdrop-blur">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
              <div className="min-w-0 flex-1">
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

              <AddBusinessPanel onCreated={handleBusinessApproved} />
            </div>
          </div>

          {filteredBusinesses.length ? (
            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1 no-scrollbar">
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
          ) : (
            <div className="border border-white/10 p-6 text-sm text-gray-500">
              No businesses match this search.
            </div>
          )}
        </div>

        <div className="min-h-0 border-l border-white/10 pl-8">
          {selectedBusiness ? (
            <BusinessWorkspace
              business={selectedBusiness}
              onChanged={refreshBusinesses}
              onDeleted={handleBusinessDeleted}
            />
          ) : (
            <InboxPanel />
          )}
        </div>
      </div>
    </section>
  );
}

