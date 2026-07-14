import { NextResponse } from "next/server";
import { approveLinkedInPursuit } from "../../../services/pursuitCaptureService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pursuit = await approveLinkedInPursuit(body);

    return NextResponse.json({ pursuit });
  } catch (error) {
    console.error("Could not approve pursuit:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save LinkedIn pursuit.",
      },
      { status: 400 }
    );
  }
}
