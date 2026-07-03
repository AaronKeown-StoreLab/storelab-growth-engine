type AnalysisPanelProps = {
  open: boolean;
  onClose: () => void;
};

const detectedPeople = [
  {
    name: "Elaine Chalon",
    title: "Head of Customer Strategy ANZ",
    priority: "A+",
  },
  {
    name: "Fiona Hinton",
    title: "Head of Category, Strategy & Planning ANZ",
    priority: "A+",
  },
  {
    name: "Eliane Woolley",
    title: "Shopper Marketing Lead",
    priority: "A",
  },
];

export default function AnalysisPanel({ open, onClose }: AnalysisPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/10 bg-[#0B1016]/95 p-8 text-white shadow-2xl backdrop-blur-2xl">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full border border-white/10 px-3 py-1 text-sm text-gray-400 hover:text-white"
      >
        Close
      </button>

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
        AI Analysis
      </p>

      <h2 className="mt-6 text-3xl font-bold">
        Screenshot received
      </h2>

      <p className="mt-3 text-gray-400">
        Growth Engine has prepared this LinkedIn screenshot for analysis.
      </p>

      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
        <p className="text-sm text-cyan-300">Scanning screenshot...</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-3/4 rounded-full bg-cyan-300"></div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {detectedPeople.map((person) => (
          <div
            key={person.name}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{person.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{person.title}</p>
              </div>

              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
                {person.priority}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-8 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-semibold text-black hover:bg-cyan-300">
        Import selected stakeholders
      </button>
    </div>
  );
}