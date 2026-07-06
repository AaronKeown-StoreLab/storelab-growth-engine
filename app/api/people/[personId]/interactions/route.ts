import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const body = await request.json();

    const businessId = String(body.businessId || "").trim();
    const type = String(body.type || "note").trim();
    const summary = String(body.summary || "").trim();

    if (!businessId) {
      return NextResponse.json(
        { error: "Business is required." },
        { status: 400 }
      );
    }

    if (!summary) {
      return NextResponse.json(
        { error: "Summary is required." },
        { status: 400 }
      );
    }

    const interaction = await prisma.contactInteraction.create({
      data: {
        personId,
        businessId,
        type,
        summary,
      },
    });

    const person = await prisma.person.findUnique({
      where: { id: personId },
    });

    const fullName = person
      ? `${person.firstName} ${person.lastName}`
      : "A relationship";

    await prisma.timelineEvent.create({
      data: {
        businessId,
        personId,
        eventType: `interaction_${type}`,
        summary: `${fullName}: ${summary}`,
      },
    });

    return NextResponse.json(interaction);
  } catch (error) {
    console.error("Could not create interaction:", error);

    return NextResponse.json(
      { error: "Could not create interaction." },
      { status: 500 }
    );
  }
}