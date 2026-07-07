type HeroCardProps = {
  company: string;
  health: number;
  person: string;
  title: string;
  recommendation: string;
};

export default function HeroCard({
  company,
  health,
  person,
  title,
  recommendation,
}: HeroCardProps) {
  return (
   <div className="group relative overflow-hidden rounded-3xl border border-cyan-400/10 bg-white/5 p-10 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-cyan-400/30">
    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-700 group-hover:bg-cyan-400/20"></div>
      <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs">
        {company}
      </p>

      <div className="mt-8">
        <p className="text-gray-400 text-sm">Relationship Health</p>

        <h2 className="text-6xl font-bold mt-2 text-cyan-400">
          {health}%
        </h2>
      </div>

      <div className="mt-12">
        <p className="text-gray-500 uppercase tracking-widest text-xs">
          Today&apos;s Focus
        </p>

        <h3 className="text-3xl font-semibold mt-3">
          {person}
        </h3>

        <p className="text-gray-400 mt-2">
          {title}
        </p>
      </div>

      <div className="mt-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 p-5">
        <p className="text-cyan-300 text-sm uppercase tracking-widest">
          Recommended Action
        </p>

        <p className="mt-2 text-lg">
          {recommendation}
        </p>
      </div>
    </div>
  );
}
