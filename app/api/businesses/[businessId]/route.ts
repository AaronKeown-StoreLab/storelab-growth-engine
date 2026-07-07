import { NextResponse } from "next/server";
import {
  deleteBusinessWorkspace,
  updateBusinessWorkspace,
} from "../../../services/businessService";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const body = await request.json();
    const business = await updateBusinessWorkspace(businessId, body);

    return NextResponse.json(business);
  } catch (error) {
    console.error("Could not update business:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update business.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    await deleteBusinessWorkspace(businessId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not delete business:", error);

    return NextResponse.json(
      { error: "Could not delete business." },
      { status: 500 }
    );
  }
}