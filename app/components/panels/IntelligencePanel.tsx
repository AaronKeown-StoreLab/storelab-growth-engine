import { Business } from "../../types/business";

type Props = {
  business: Business;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function IntelligencePanel({ business }: Props) {
  return (
    <section className="mt-8 border border-white/10 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase text-gray-500">Intelligence</p>
        <p className="text-sm text-gray-600">
          {business.evidence.length} source{business.evidence.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {business.evidence.length ? (
          business.evidence.map((item) => (
            <article key={item.id} className="border-l border-cyan-300/30 pl-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-cyan-300">
                  {item.title || item.type}
                </p>
                <p className="text-xs text-gray-600">{formatDate(item.capturedAt)}</p>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-400">
                {item.content}
              </p>

              {item.source && (
                <p className="mt-3 truncate text-xs text-gray-600">Source: {item.source}</p>
              )}
            </article>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            Approved research intelligence will appear here.
          </p>
        )}
      </div>
    </section>
  );
}