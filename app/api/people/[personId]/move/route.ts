import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;

    const body = await request.json();

    const newBusinessId = String(body.businessId || "").trim();
    const jobTitle = String(body.jobTitle || "").trim();

    if (!newBusinessId) {
      return NextResponse.json(
        { error: "Business is required." },
        { status: 400 }
      );
    }

    const currentEmployment = await prisma.employment.findFirst({
      where: {
        personId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      return NextResponse.json(
        { error: "Current employment not found." },
        { status: 404 }
      );
    }

    if (currentEmployment.businessId === newBusinessId) {
      return NextResponse.json(
        { error: "Person already works for this business." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.employment.update({
        where: {
          id: currentEmployment.id,
        },
        data: {
          isCurrent: false,
          endDate: new Date(),
        },
      });

      await tx.employment.create({
        data: {
          personId,
          businessId: newBusinessId,
          jobTitle: jobTitle || currentEmployment.jobTitle,
          startDate: new Date(),
          isCurrent: true,
        },
      });

      const person = await tx.person.findUnique({
        where: {
          id: personId,
        },
      });

      const oldBusiness = await tx.business.findUnique({
        where: {
          id: currentEmployment.businessId,
        },
      });

      const newBusiness = await tx.business.findUnique({
        where: {
          id: newBusinessId,
        },
      });

      const fullName = `${person?.firstName} ${person?.lastName}`;

      await tx.timelineEvent.create({
        data: {
          businessId: currentEmployment.businessId,
          personId,
          eventType: "employment_left",
          summary: `${fullName} left ${oldBusiness?.name}.`,
        },
      });

      await tx.timelineEvent.create({
        data: {
          businessId: newBusinessId,
          personId,
          eventType: "employment_joined",
          summary: `${fullName} joined ${newBusiness?.name}.`,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not move person.",
      },
      {
        status: 500,
      }
    );
  }
}