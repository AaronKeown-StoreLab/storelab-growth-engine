interface Props {
  active: string;
  onChange: (tab: string) => void;
}

const tabs = [
  "Overview",
  "Timeline",
  "Outreach",
  "Notes",
];

export default function WorkspaceTabs({
  active,
  onChange,
}: Props) {
  return (
    <div className="mt-8 flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded-full px-4 py-2 text-sm transition
            ${
              active === tab
                ? "bg-cyan-300 text-black"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}