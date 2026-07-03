interface Props {
  recommendation: string;
  confidence: number;
}

export default function ChiefOfStaff({
  recommendation,
  confidence,
}: Props) {
  return (
    <div className="rounded-sm border border-amber-400/20 bg-amber-400/5 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
        Chief of Staff
      </p>

      <h3 className="mt-3 text-2xl font-semibold">
        If I were you today...
      </h3>

      <p className="mt-5 text-lg leading-relaxed text-gray-200">
        {recommendation}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Confidence
        </span>

        <span className="font-bold text-amber-300">
          {confidence}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-sm bg-amber-300 transition-all duration-500"
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}