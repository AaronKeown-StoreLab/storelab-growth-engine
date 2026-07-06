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

function activityLabel(type: string) {
  if (type === "notebook_entry") return "Note";
  if (type === "person_added") return "Relationship";
  if (type === "employment_left") return "Employment";
  if (type === "employment_joined") return "Employment";
  if (type === "relationship_note") return "Relationship";
  return "Activity";
}

export default function TimelinePanel({ business }: Props) {
  return (
    <section className="mt-8 border border-white/10 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
        Activity
      </p>

      <div className="mt-5 space-y-5">
        {business.timeline.length ? (
          business.timeline.map((event) => (
            <div key={event.id} className="border-l border-cyan-300/30 pl-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-cyan-300">
                  {activityLabel(event.eventType)}
                </p>

                <p className="text-xs text-gray-600">
                  {formatDate(event.occurredAt)}
                </p>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-gray-300">
                {event.summary}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No activity captured yet.
          </p>
        )}
      </div>
    </section>
  );
}