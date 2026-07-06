import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { analyseLinkedInProspect } from "../../brain/ai/linkedinVision";

function cleanJsonResult(result: string) {
  return result
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer();

  return {
    base64: Buffer.from(bytes).toString("base64"),
    mimeType: file.type || "image/png",
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const profileFile = formData.get("profile");
    const activityFile = formData.get("activity");

    const screenshots = [];

    if (profileFile instanceof File) {
      const image = await fileToBase64(profileFile);

      screenshots.push({
        ...image,
        purpose: "profile" as const,
      });
    }

    if (activityFile instanceof File) {
      const image = await fileToBase64(activityFile);

      screenshots.push({
        ...image,
        purpose: "activity" as const,
      });
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: "No screenshots uploaded" },
        { status: 400 }
      );
    }

    const rawResult = await analyseLinkedInProspect(screenshots);
    const cleanedResult = cleanJsonResult(rawResult);
    const prospect = JSON.parse(cleanedResult);

    const titleParts = [
      prospect.fullName,
      prospect.company || prospect.currentEmployer,
    ].filter(Boolean);

    const inboxItem = await prisma.inboxItem.create({
      data: {
        type: "linkedin_prospect",
        status: "pending",
        title: titleParts.length
          ? titleParts.join(" - ")
          : "LinkedIn prospect",
        summary:
          prospect.whyConnectOrAvoid ||
          prospect.whyThisPersonMatters ||
          prospect.nextAction ||
          "LinkedIn prospect captured for review.",
        payload: JSON.stringify(prospect),
      },
    });

    return NextResponse.json({
      result: prospect,
      inboxItemId: inboxItem.id,
    });
  } catch (error) {
    console.error("LinkedIn prospect analysis failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not analyse LinkedIn prospect.",
      },
      { status: 500 }
    );
  }
}