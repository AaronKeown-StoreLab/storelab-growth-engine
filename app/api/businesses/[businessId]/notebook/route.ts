import { NextResponse } from "next/server";
import { createNotebookEntry } from "../../../../services/businessService";

export async function POST(
  request: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const body = await request.json();

    const note = await createNotebookEntry(
      businessId,
      String(body.content || "")
    );

    return NextResponse.json(note);
  } catch (error) {
    console.error("Could not create notebook entry:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create notebook entry.",
      },
      { status: 500 }
    );
  }
}