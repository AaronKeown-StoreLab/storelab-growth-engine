type BusinessCardProps = {
  business: {
    id: string;
    name: string;
    industry?: string | null;
    country?: string | null;
    summary?: string | null;
    opportunities?: {
      id: string;
      title: string;
      nextAction?: string | null;
      summary?: string | null;
    }[];
    employments?: {
      id: string;
      jobTitle?: string | null;
      person: {
        firstName: string;
        lastName: string;
      };
    }[];
  };
  selected: boolean;
  onOpen: () => void;
};

export default function BusinessCard({
  business,
  selected,
  onOpen,
}: BusinessCardProps) {
  const primaryOpportunity = business.opportunities?.[0];
  const primaryRelationship = business.employments?.[0];

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
        {business.name}
      </p>

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-2xl font-bold leading-tight">
          {primaryOpportunity?.title ?? "Review business"}
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          {[business.industry, business.country].filter(Boolean).join(" • ") ||
            "Business intelligence"}
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-lg leading-relaxed text-white">
          {primaryOpportunity?.nextAction ||
            business.summary ||
            "No recommended action yet."}
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <ul className="space-y-2 text-sm leading-relaxed text-gray-400">
          {primaryRelationship && (
            <li>
              • Relationship: {primaryRelationship.person.firstName}{" "}
              {primaryRelationship.person.lastName}
            </li>
          )}

          {primaryOpportunity?.summary && (
            <li>• {primaryOpportunity.summary}</li>
          )}

          {!primaryRelationship && !primaryOpportunity?.summary && (
            <li>• No relationship intelligence captured yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}