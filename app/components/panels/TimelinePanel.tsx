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

export default function TimelinePanel({ business }: Props) {
  return (
    <section className="mt-8 border border-white/10 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
        Timeline
      </p>

      <div className="mt-5 space-y-4">
        {business.timeline.length ? (
          business.timeline.map((event) => (
            <div key={event.id} className="border-l border-cyan-300/30 pl-4">
              <p className="text-sm text-cyan-300">
                {formatDate(event.occurredAt)}
              </p>

              <p className="mt-1 text-sm text-gray-300">{event.summary}</p>

              <p className="mt-1 text-xs text-gray-600">{event.eventType}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No timeline activity captured yet.
          </p>
        )}
      </div>
    </section>
  );
}