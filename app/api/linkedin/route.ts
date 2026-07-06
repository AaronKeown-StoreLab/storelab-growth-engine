import { NextResponse } from "next/server";
import { analyseLinkedInProspect } from "../../brain/ai/linkedinVision";

function fileToBase64(file: File) {
  return file.arrayBuffer().then((bytes) => ({
    base64: Buffer.from(bytes).toString("base64"),
    mimeType: file.type || "image/png",
  }));
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

    const result = await analyseLinkedInProspect(screenshots);

    return NextResponse.json({ result });
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