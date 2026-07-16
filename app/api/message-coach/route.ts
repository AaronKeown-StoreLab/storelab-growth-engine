import { NextResponse } from "next/server";
import { getOpenAIClient } from "../../brain/ai/openai";

export async function POST(request: Request) {
  try {
    const { fields, messageDirection, currentMessage, chatHistory } = await request.json();
    const firstName = fields.firstName || fields.name?.split(' ')[0] || "there";

    const STORELAB_WISDOM = `
      - StoreLab helps retail and brand teams grow via shopper engagement and retail execution.
      - We focus on making retail space more productive and measurable.
      - Our tone is 'Elite but Human'. We are helpful experts, not salespeople.
      - We avoid "Hope you are well" or "Checking in".
    `;

    const prompt = `
      You are "Mate", Aaron's right-hand growth partner at StoreLab.
      Your vibe: Supportive, sharp, quintessential Australian/collaborative partner. 
      You don't act like a robot; you act like a colleague who's great at writing and obsessed with growth.
      
      KNOWLEDGE:
      ${STORELAB_WISDOM}

      CONTEXT:
      Aaron is talking to: ${firstName} at ${fields.business}
      
      HISTORY:
      ${chatHistory?.map((h: any) => `${h.role === 'user' ? 'Aaron' : 'Mate'}: ${h.text}`).join('\n')}

      LATEST REQUEST: "${messageDirection}"

      PLAYBOOK:
      1. Rewrite the draft to be punchy and personalized. 
      2. Always use first name: ${firstName}.
      3. In 'jeevsComment', talk to Aaron like a mate. Short, encouraging, explaining what you did.

      Return ONLY JSON:
      {
        "jeevsComment": "string",
        "updatedDraft": "string"
      }
    `;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return NextResponse.json({
      jeevsComment: result.jeevsComment,
      updatedDraft: result.updatedDraft,
      messages: [result.updatedDraft]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}