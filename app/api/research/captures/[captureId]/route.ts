import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ captureId: string }> }
) {
  try {
    const { captureId } = await context.params;

    await prisma.inboxItem.update({
      where: {
        id: captureId,
      },
      data: {
        status: "reviewed",
      },
    });

    return NextResponse.json(
      {
        success: true,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Could not clear browser capture:", error);

    return NextResponse.json(
      {
        error: "Could not clear browser capture.",
      },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }
}
