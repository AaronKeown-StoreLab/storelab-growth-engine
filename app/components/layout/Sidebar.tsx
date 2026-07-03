const navItems = [
  "Today",
  "Accounts",
  "Relationships",
  "Dream 100",
  "Timeline",
  "Insights",
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl lg:block">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">
          StoreLab
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Growth Engine
        </h1>
      </div>

      <nav className="mt-14 space-y-2">
        {navItems.map((item) => (
          <button
            key={item}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
              item === "Today"
                ? "bg-cyan-400/10 text-cyan-300"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Focus
        </p>

        <p className="mt-3 text-sm text-gray-300">
          Build one meaningful relationship today.
        </p>
      </div>
    </aside>
  );
}