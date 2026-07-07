import { NextResponse } from "next/server";
import { analyseResearchSourceRequest } from "../../../services/researchAnalysisService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const analysis = await analyseResearchSourceRequest(body.source, body.preferredBusinessId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Could not analyse research source:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not analyse research source.",
      },
      { status: 400 }
    );
  }
}