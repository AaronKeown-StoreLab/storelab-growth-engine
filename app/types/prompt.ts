export type PromptType = "text" | "yesNo";

export interface Prompt {
  id: string;
  accountId?: string;

  title: string;
  prompt: string;

  type: PromptType;

  priority: number;

  answer?: string;
  answered?: boolean;
}