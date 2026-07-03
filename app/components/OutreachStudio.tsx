import { useState } from "react";
import { AccountRecommendation } from "../types/accountRecommendation";
import OutreachDraft from "./OutreachDraft";

interface Props {
  recommendation: AccountRecommendation;
}

export default function OutreachStudio({ recommendation }: Props) {
  const [format, setFormat] = useState("LinkedIn Message");
  const [showDraft, setShowDraft] = useState(false);

  const formats = [
    "LinkedIn Message",
    "Email",
    "Meeting Agenda",
    "Call Talking Points",
  ];

  return (
    <div className="mt-10 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
        Outreach Studio
      </p>

      <h3 className="mt-3 text-2xl font-bold">
        Generate outreach for {recommendation.company.name}
      </h3>

      <p className="mt-2 text-sm text-gray-400">
        Objective: {recommendation.goal?.title}
      </p>

      <div className="mt-6 grid gap-3">
        {formats.map((item) => (
          <button
            key={item}
            onClick={() => {
              setFormat(item);
              setShowDraft(false);
            }}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              format === item
                ? "border-cyan-300 bg-cyan-300/10 text-cyan-200"
                : "border-white/10 bg-black/20 text-gray-400 hover:bg-white/5"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowDraft(true)}
        className="mt-6 rounded-full bg-cyan-300 px-5 py-3 font-semibold text-black transition hover:scale-105"
      >
        Generate {format}
      </button>

      {showDraft && (
        <OutreachDraft
          recommendation={recommendation}
          format={format}
        />
      )}
    </div>
  );
}