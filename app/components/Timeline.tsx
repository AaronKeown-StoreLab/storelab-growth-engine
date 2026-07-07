import { RelationshipEvent } from "../types/event";

type Props = {
  events: RelationshipEvent[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function impactClass(impact: RelationshipEvent["impact"]) {
  if (impact === "Positive") return "border-emerald-300/30 text-emerald-200";
  if (impact === "Negative") return "border-red-300/30 text-red-200";

  return "border-amber-300/30 text-amber-200";
}

export default function Timeline({ events }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase text-gray-500">Account Timeline</p>
        <p className="text-sm text-gray-600">
          {events.length} event{events.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {events.length ? (
          events.map((event) => (
            <article key={event.id} className="border-l border-cyan-300/30 pl-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-cyan-300">
                  {formatDate(event.date)}
                </p>

                <span
                  className={`border px-2 py-1 text-xs ${impactClass(
                    event.impact
                  )}`}
                >
                  {event.impact}
                </span>
              </div>

              <h4 className="mt-2 text-base font-semibold text-white">
                {event.title}
              </h4>

              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {event.description}
              </p>

              <p className="mt-3 text-xs text-gray-600">Source: {event.source}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-gray-500">No relationship events captured yet.</p>
        )}
      </div>
    </section>
  );
}
