interface Props {
  title: string;
  value: string;
}

export default function MetricCard({
  title,
  value,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-cyan-300">
        {value}
      </p>
    </div>
  );
}