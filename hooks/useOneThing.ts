import { useMemo, useState } from "react";
import { prompts } from "../app/data/prompts";
import {
  getAvailablePrompts,
  savePromptAnswer,
  snoozePrompt,
} from "../utils/promptStorage";

export function useOneThing() {
  const [refreshKey, setRefreshKey] = useState(0);

  const queue = useMemo(() => {
    return getAvailablePrompts(prompts);
  }, [refreshKey]);

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