import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const body = await request.json();
    const businessId = cleanText(body.businessId);
    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const jobTitle = cleanText(body.jobTitle);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    await prisma.person.update({
      where: { id: personId },
      data: {
        firstName,
        lastName,
        linkedinUrl: cleanText(body.linkedinUrl) || null,
        email: cleanText(body.email) || null,
        phone: cleanText(body.phone) || null,
        notes: cleanText(body.notes) || null,
      },
    });

    if (businessId) {
      const employment = await prisma.employment.findFirst({
        where: {
          personId,
          businessId,
          isCurrent: true,
        },
      });

      if (employment) {
        await prisma.employment.update({
          where: { id: employment.id },
          data: { jobTitle: jobTitle || null },
        });

        await prisma.timelineEvent.create({
          data: {
            businessId,
            personId,
            eventType: "role_updated",
            summary: `${firstName} ${lastName}'s role was updated${jobTitle ? ` to ${jobTitle}` : ""}.`,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not update person:", error);

    return NextResponse.json(
      { error: "Could not update person." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const body = await request.json();
    const businessId = cleanText(body.businessId);

    if (!businessId) {
      return NextResponse.json(
        { error: "Business is required." },
        { status: 400 }
      );
    }

    const employment = await prisma.employment.findFirst({
      where: {
        personId,
        businessId,
        isCurrent: true,
      },
      include: {
        person: true,
        business: true,
      },
    });

    if (!employment) {
      return NextResponse.json(
        { error: "Current relationship not found." },
        { status: 404 }
      );
    }

    await prisma.employment.update({
      where: { id: employment.id },
      data: {
        isCurrent: false,
        endDate: new Date(),
      },
    });

    await prisma.timelineEvent.create({
      data: {
        businessId,
        personId,
        eventType: "person_removed",
        summary: `${employment.person.firstName} ${employment.person.lastName} was removed from ${employment.business.name}.`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not remove person:", error);

    return NextResponse.json(
      { error: "Could not remove person." },
      { status: 500 }
    );
  }
}