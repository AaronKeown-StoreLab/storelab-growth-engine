import { openai } from "./openai";

type ScreenshotInput = {
  base64: string;
  mimeType: string;
  purpose: "profile" | "activity";
};

export async function analyseLinkedInProspect(
  screenshots: ScreenshotInput[]
) {
  const content: any[] = [
    {
      type: "input_text",
      text: `
You are StoreLab OS, Aaron Keown's Business Development Intelligence Engine.

Help Aaron decide whether this person is worth pursuing.

StoreLab helps brands and retailers with:
- virtual retail environments
- shopper research
- store concept development
- planogramming and range review
- growth centres and retail storytelling
- field compliance tools

Analyse the supplied LinkedIn screenshots.

Return ONLY valid JSON. No markdown. No code block.

{
  "fullName": "",
  "jobTitle": "",
  "company": "",
  "currentEmployer": "",
  "location": "",
  "aboutSummary": "",
  "targetingDecision": "connect | maybe | avoid",
  "opportunityScore": 0,
  "relationshipValue": "low | medium | high",
  "seniorityFit": "low | medium | high",
  "storeLabRelevance": "low | medium | high",
  "whyThisPersonMatters": "",
  "whyConnectOrAvoid": "",
  "storeLabAngle": "",
  "linkedinActivityLevel": "unknown | none | low | medium | high",
  "visibleActivitySummary": "",
  "topicsTheyEngageWith": [],
  "linkedinEngagementLikelihood": "unknown | low | medium | high",
  "bestApproach": "",
  "suggestedConnectionMessage": "",
  "suggestedFollowUp": "",
  "nextAction": "",
  "profilePhotoVisible": false,
  "profilePhotoDescription": "",
  "missingContext": [],
  "confidence": "low | medium | high"
}

Rules:
- Do not guess facts.
- You may make careful business development judgement based on visible evidence.
- If activity is not visible, say that clearly.
- Keep the suggested message short, warm, human and not salesy.
- Do not say "AI".
`,
    },
  ];

  for (const screenshot of screenshots) {
    content.push({
      type: "input_text",
      text: `Screenshot purpose: ${screenshot.purpose}`,
    });

    content.push({
      type: "input_image",
      image_url: `data:${screenshot.mimeType};base64,${screenshot.base64}`,
      detail: "high",
    });
  }

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content,
      },
    ],
  });

  return response.output_text;
}