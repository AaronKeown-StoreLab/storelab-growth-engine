import { NextResponse } from "next/server";
import { listLinkedInPursuits } from "../../services/pursuitCaptureService";

export async function GET() {
  try {
    const pursuits = await listLinkedInPursuits();

    return NextResponse.json(pursuits);
  } catch (error) {
    console.error("Could not load pursuits:", error);

    return NextResponse.json(
      {
        error: "Could not load LinkedIn pursuits.",
      },
      { status: 500 }
    );
  }
}
