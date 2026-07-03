import { Prompt } from "../app/types/prompt";

const STORAGE_KEY = "storelab-one-thing-answers";
const SNOOZE_KEY = "storelab-one-thing-snoozed";

interface StoredAnswer {
  answer: string;
  answeredAt: string;
}

type StoredAnswers = Record<string, StoredAnswer>;
type SnoozedPrompts = Record<string, string>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getPromptAnswers(): StoredAnswers {
  return readJson<StoredAnswers>(STORAGE_KEY, {});
}

export function savePromptAnswer(promptId: string, answer: string) {
  const answers = getPromptAnswers();

  answers[promptId] = {
    answer,
    answeredAt: new Date().toISOString(),
  };

  writeJson(STORAGE_KEY, answers);
}

export function snoozePrompt(promptId: string) {
  const snoozed = readJson<SnoozedPrompts>(SNOOZE_KEY, {});

  snoozed[promptId] = new Date().toISOString();

  writeJson(SNOOZE_KEY, snoozed);
}

export function getAvailablePrompts(prompts: Prompt[]) {
  const answers = getPromptAnswers();
  const snoozed = readJson<SnoozedPrompts>(SNOOZE_KEY, {});

  return prompts
    .filter((prompt) => !answers[prompt.id])
    .filter((prompt) => !snoozed[prompt.id])
    .sort((a, b) => b.priority - a.priority);
}