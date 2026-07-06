import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const jobTitle = String(body.jobTitle || "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: {
        firstName,
        lastName,
      },
    });

    await prisma.employment.create({
      data: {
        personId: person.id,
        businessId,
        jobTitle: jobTitle || null,
        isCurrent: true,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        businessId,
        personId: person.id,
        eventType: "person_added",
        summary: `${firstName} ${lastName} was added to this business.`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not add person:", error);

    return NextResponse.json(
      { error: "Could not add person." },
      { status: 500 }
    );
  }
}