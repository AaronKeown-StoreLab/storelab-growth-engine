"use client";

import { useState } from "react";

interface Props {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  onLater: () => void;
}

export default function QuickQuestion({
  question,
  options,
  onAnswer,
  onLater,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleAnswer(answer: string) {
    setSelected(answer);

    // Small delay makes the interaction feel more polished.
    setTimeout(() => {
      onAnswer(answer);
    }, 180);
  }

  return (
    <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/5 p-6 transition-all duration-300">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
        ✨ One Thing
      </p>

      <h3 className="mt-3 text-xl font-bold">
        {question}
      </h3>

      <div className="mt-5 grid gap-3">
        {options.map((option) => {
          const active = selected === option;

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-cyan-300 bg-cyan-300/20 text-white"
                  : "border-white/10 bg-black/20 text-gray-200 hover:border-cyan-300/40 hover:bg-cyan-300/10"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <button
        onClick={onLater}
        className="mt-4 text-sm text-gray-500 transition hover:text-gray-300"
      >
        Ask me later
      </button>
    </div>
  );
}