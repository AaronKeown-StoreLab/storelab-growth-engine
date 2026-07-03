import { Prompt } from "../types/prompt";

export const prompts: Prompt[] = [
  {
    id: "barbara-follow-up",
    accountId: "mondelez",
    title: "One Thing",
    prompt: "Did Barbara respond to your LinkedIn message?",
    type: "yesNo",
    priority: 100,
  },
  {
    id: "mars-influence",
    accountId: "mars",
    title: "One Thing",
    prompt: "Who else influences Virtual Research at Mars?",
    type: "text",
    priority: 90,
  },
  {
    id: "village-demo",
    accountId: "village",
    title: "One Thing",
    prompt: "How did the Village meeting go?",
    type: "text",
    priority: 80,
  },
];