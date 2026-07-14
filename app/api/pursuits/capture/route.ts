import { NextResponse } from "next/server";
import { analyseLinkedInPursuitNote } from "../../../services/pursuitCaptureService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const analysis = await analyseLinkedInPursuitNote(body);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Could not analyse pursuit note:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not analyse LinkedIn note.",
      },
      { status: 400 }
    );
  }
}
