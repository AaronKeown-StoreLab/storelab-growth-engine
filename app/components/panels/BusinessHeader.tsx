import { Business } from "../../types/business";

type Props = {
  business: Business;
};

export default function BusinessHeader({ business }: Props) {
  return (
    <div className="border-b border-white/10 pb-6">
      <h1 className="text-5xl font-bold tracking-tight">{business.name}</h1>

      <p className="mt-3 text-gray-400">
        {[business.industry, business.country].filter(Boolean).join(" • ")}
      </p>

      {business.summary && (
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-gray-400">
          {business.summary}
        </p>
      )}
    </div>
  );
}