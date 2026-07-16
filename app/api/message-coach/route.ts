import { NextResponse } from "next/server";
import { getOpenAIClient } from "../../brain/ai/openai";

function cleanText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanJsonResult(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normaliseMessages(value: unknown) {
  if (!value || typeof value !== "object" || !("messages" in value)) return [];

  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];

  return messages
    .map((message) => cleanText(message))
    .filter(Boolean)
    .slice(0, 3);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Add OPENAI_API_KEY to .env.local, then restart StoreLab OS." }, { status: 501 });
    }

    const body = await request.json();
    const fields = body.fields && typeof body.fields === "object" ? body.fields : {};
    const prompt = `
You are StoreLab OS Message Coach for Aaron, founder/operator of StoreLab.

Write short, natural LinkedIn or email messages that help Aaron build a relationship and progress toward a StoreLab demo.
This is not a CRM and not generic sales automation. Sound like a real person.

Rules:
- Use Aaron's direction as instruction/context, never paste it verbatim unless it is already a polished draft. Interpret shorthand like "he is new to the job", "his mate Aaron works there too", "already know them", or "cc'd on email" into a natural relationship-aware message.
- If the note says they are new to the job or recently moved role, congratulate them and keep it soft. Give them room to settle.
- If Aaron already knows them, has been copied on email, or is working with them, write like there is existing familiarity.
- Avoid hype, buzzwords, "hope this finds you well", and pushy demo language.
- Keep each option under 55 words unless the action is an email body.
- Return three meaningfully different options: one warm/direct, one softer/light-touch, and one practical/business-focused.

Context:
Action: ${cleanText(body.actionId)}
Draft mode: ${cleanText(body.draftMode)}
Person: ${cleanText((fields as Record<string, unknown>).name)}
Business: ${cleanText((fields as Record<string, unknown>).business)}
Role: ${cleanText((fields as Record<string, unknown>).role)}
Location: ${cleanText((fields as Record<string, unknown>).location)}
Demo type: ${cleanText((fields as Record<string, unknown>).demoType)}
Aaron's direction/context: ${cleanText(body.messageDirection)}
Aaron's rough draft, if improving: ${cleanText(body.roughDraft)}
Previous sent message to reference: ${cleanText(body.messageReference)}
Current draft currently shown to Aaron: ${cleanText(body.currentMessage)}

If there is a current draft and Aaron gives direction, revise that draft. Do not ignore the existing draft unless Aaron asks for a fresh version. If Aaron gives a rough context note rather than prose, infer the useful relationship signal and write a proper message from scratch.
If Aaron says things like "shorter", "warmer", "less salesy", "mention new role", or "I already know them", apply that instruction to the current draft.

Return ONLY JSON:
{"messages":["option one","option two","option three"]}
`;

    const response = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messages = normaliseMessages(JSON.parse(cleanJsonResult(response.output_text)));

    if (!messages.length) {
      return NextResponse.json({ error: "No message options returned." }, { status: 502 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Message Coach fallback used:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate messages." },
      { status: 500 }
    );
  }
}

