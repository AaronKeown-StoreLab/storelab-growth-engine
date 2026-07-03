import { RelationshipEvent } from "../types/event";

interface Props {
  events: RelationshipEvent[];
}

export default function Timeline({ events }: Props) {
  return (
    <div className="mt-10">
      <h3 className="text-sm uppercase tracking-[0.3em] text-gray-500">
        Timeline
      </h3>

      <div className="mt-5 space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border-l-2 border-cyan-300/30 pl-5">
            <p className="text-sm text-cyan-300">{event.date}</p>
            <p className="mt-1 font-medium">{event.title}</p>
            <p className="text-sm text-gray-400">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}