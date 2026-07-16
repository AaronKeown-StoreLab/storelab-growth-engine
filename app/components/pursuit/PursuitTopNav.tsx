import Link from "next/link";

type Props = {
  active: "dashboard" | "overview" | "wins" | "tactic";
};

const items = [
  { id: "dashboard", href: "/", label: "Dashboard" },
  { id: "wins", href: "/wins", label: "Wins" },
  { id: "tactic", href: "/needs-tactic", label: "Needs tactic" },
] as const;

export default function PursuitTopNav({ active }: Props) {
  return (
    <nav className="mt-3 grid grid-cols-3 border border-white/10 bg-black/20 text-center text-[13px]">
      {items.map((item, index) => (
        <Link
          key={item.id}
          href={item.href}
          data-dashboard-reset={item.id === "dashboard" ? "true" : undefined}
          className={`${index > 0 ? "border-l border-white/10" : ""} grid h-9 place-items-center px-2 transition ${active === item.id ? "bg-cyan-300 text-black" : "text-slate-400 hover:bg-white/[0.035] hover:text-white"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}