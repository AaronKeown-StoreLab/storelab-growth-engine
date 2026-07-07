import { NextResponse } from "next/server";
import { approveResearchSource } from "../../../services/researchApprovalService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const business = await approveResearchSource(body);

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Could not approve research source:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not approve research source.",
      },
      { status: 400 }
    );
  }
}