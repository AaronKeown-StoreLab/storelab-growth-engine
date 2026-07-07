"use client";

import { Business } from "../types/business";
import BusinessHeader from "./panels/BusinessHeader";
import PeoplePanel from "./panels/PeoplePanel";
import NotebookPanel from "./panels/NotebookPanel";
import OpportunitiesPanel from "./panels/OpportunitiesPanel";
import IntelligencePanel from "./panels/IntelligencePanel";
import TimelinePanel from "./panels/TimelinePanel";

type Props = {
  business: Business;
  onChanged: () => void;
  onDeleted: () => void;
};

export default function BusinessWorkspace({ business, onChanged, onDeleted }: Props) {
  return (
    <div className="h-full overflow-y-auto pr-2 no-scrollbar">
      <BusinessHeader
        key={business.id}
        business={business}
        onChanged={onChanged}
        onDeleted={onDeleted}
      />

      <PeoplePanel business={business} onChanged={onChanged} />

      <NotebookPanel business={business} onChanged={onChanged} />

      <OpportunitiesPanel business={business} />

      <IntelligencePanel business={business} />

      <TimelinePanel business={business} />
    </div>
  );
}