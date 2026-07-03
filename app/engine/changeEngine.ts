import { events } from "../data/events";

export function getSinceYesterdayChanges() {
  return events.map((event) => {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      impact: event.impact,
    };
  });
}