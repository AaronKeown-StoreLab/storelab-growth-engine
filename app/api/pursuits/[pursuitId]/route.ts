import { NextResponse } from "next/server";
import { adjacentStage, updatePursuit } from "../../../repositories/pursuitRepository";
import { PursuitStage } from "../../../types/pursuit";

export async function PATCH(request: Request, context: RouteContext<"/api/pursuits/[pursuitId]">) {
  try {
    const { pursuitId } = await context.params;
    const body = await request.json();
    const direction = body.direction as "next" | "back" | "park" | undefined;
    const stage = direction
      ? adjacentStage(body.currentStage as PursuitStage, direction)
      : body.stage;

    const pursuit = await updatePursuit(pursuitId, {
      ...body,
      stage,
      note: body.note ?? (direction ? `Marked ${direction}.` : "Updated pursuit."),
    });

    return NextResponse.json({ pursuit });
  } catch (error) {
    console.error("Could not update pursuit:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update this pursuit.",
      },
      { status: 400 }
    );
  }
}
