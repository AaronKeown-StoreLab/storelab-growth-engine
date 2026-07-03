import { inbox } from "../data/inbox";
import PeopleMoves from "./PeopleMoves";

export default function InboxPanel() {
  const pendingItems = inbox.filter((item) => item.status === "Pending");

  return (
    <aside className="space-y-8">
      <PeopleMoves />

      <section className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Signals
          </p>

          <span className="text-sm text-gray-500">{pendingItems.length}</span>
        </div>

        <div className="mt-5 space-y-6">
          {pendingItems.map((item) => (
            <div key={item.id} className="border-b border-white/10 pb-6 last:border-b-0">
              <p className="text-base font-semibold text-white">
                {item.title}
              </p>

              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {item.description}
              </p>

              <p className="mt-4 text-sm text-cyan-300">
                Suggested action: Review this relationship
              </p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}