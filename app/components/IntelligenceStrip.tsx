import { inbox } from "../data/inbox";
import { peopleMoves } from "../data/peopleMoves";

export default function IntelligenceStrip() {
  const firstMove = peopleMoves[0];
  const firstSignal = inbox.find((item) => item.status === "Pending");

  return (
    <div className="grid gap-6 border-b border-white/10 pb-6 md:grid-cols-2">
      {firstMove && (
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            People Move
          </p>

          <p className="mt-3 font-semibold text-white">
            {firstMove.person}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            {firstMove.fromCompany} → {firstMove.toCompany}
          </p>

          <p className="mt-3 text-sm text-cyan-300">
            {firstMove.action}
          </p>
        </div>
      )}

      {firstSignal && (
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Signal
          </p>

          <p className="mt-3 font-semibold text-white">
            {firstSignal.title}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            {firstSignal.description}
          </p>

          <p className="mt-3 text-sm text-cyan-300">
            Review relationship
          </p>
        </div>
      )}
    </div>
  );
}