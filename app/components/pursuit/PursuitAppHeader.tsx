import PursuitTopNav from "./PursuitTopNav";

type ActiveTab = "dashboard" | "overview" | "wins" | "tactic";

type Props = {
  active: ActiveTab;
  stats: {
    today: number;
    saved: number;
    tactic?: number;
  };
};

export default function PursuitAppHeader({ active, stats }: Props) {
  return (
    <header className="border-b border-white/10 pb-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-semibold uppercase text-cyan-300/80">
            StoreLab OS
          </p>
          <h1 className="truncate text-[22px] font-semibold leading-none text-white">
            LinkedIn sidecar
          </h1>
        </div>

        <div className="grid shrink-0 grid-cols-2 overflow-hidden border border-white/10 bg-white/[0.025] text-center">
          <div className="min-w-14 px-2 py-2">
            <div className="text-base font-semibold leading-none text-white">{stats.today}</div>
            <div className="mt-1 text-[10px] text-slate-500">Today</div>
          </div>
          <div className="min-w-14 border-l border-white/10 px-2 py-2">
            <div className="text-base font-semibold leading-none text-white">{stats.saved}</div>
            <div className="mt-1 text-[10px] text-slate-500">Saved</div>
          </div>
        </div>
      </div>
      <PursuitTopNav active={active} />
    </header>
  );
}