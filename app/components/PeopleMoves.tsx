import { peopleMoves } from "../data/peopleMoves";

export default function PeopleMoves() {
  return (
    <section className="border-t border-white/10 pt-6">
      <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
        People Moves
      </p>

      <div className="mt-5 space-y-6">
        {peopleMoves.map((move) => (
          <div key={move.id} className="border-b border-white/10 pb-6 last:border-b-0">
            <p className="text-base font-semibold text-white">
              {move.person}
            </p>

            <p className="mt-2 text-sm text-gray-400">
              {move.fromCompany} → {move.toCompany}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {move.relationship}
            </p>

            <p className="mt-4 text-sm text-cyan-300">
              {move.action}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}