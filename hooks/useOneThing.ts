import { useEffect, useState } from "react";
import { prompts } from "../app/data/prompts";
import {
  getAvailablePrompts,
  savePromptAnswer,
  snoozePrompt,
} from "../utils/promptStorage";

export function useOneThing() {
  const [mounted, setMounted] = useState(false);
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(timer);
  }, []);

  const queue = mounted ? getAvailablePrompts(prompts) : [];
  const currentPrompt = queue[0] ?? null;

  function answerCurrent(answer: string) {
    if (!currentPrompt) return;

    savePromptAnswer(currentPrompt.id, answer);
    setRefreshKey((key) => key + 1);
  }

  function askLater() {
    if (!currentPrompt) return;

    snoozePrompt(currentPrompt.id);
    setRefreshKey((key) => key + 1);
  }

  return {
    currentPrompt,
    answerCurrent,
    askLater,
    hasPrompt: Boolean(currentPrompt),
  };
}
