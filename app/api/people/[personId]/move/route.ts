import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const body = await request.json();

    const requestedBusinessId = cleanText(body.businessId);
    const newBusinessName = cleanText(body.newBusinessName);
    const jobTitle = cleanText(body.jobTitle);

    if (!requestedBusinessId && !newBusinessName) {
      return NextResponse.json(
        { error: "Choose or create a business." },
        { status: 400 }
      );
    }

    const currentEmployment = await prisma.employment.findFirst({
      where: {
        personId,
        isCurrent: true,
      },
      include: {
        person: true,
        business: true,
      },
    });

    if (!currentEmployment) {
      return NextResponse.json(
        { error: "Current employment not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const targetBusiness = requestedBusinessId
        ? await tx.business.findUnique({ where: { id: requestedBusinessId } })
        : await tx.business.create({
            data: {
              name: newBusinessName,
              timeline: {
                create: {
                  eventType: "business_added",
                  summary: "Business added from a relationship move.",
                },
              },
            },
          });

      if (!targetBusiness) {
        throw new Error("Target business not found.");
      }

      const fullName = `${currentEmployment.person.firstName} ${currentEmployment.person.lastName}`;

      if (currentEmployment.businessId === targetBusiness.id) {
        await tx.employment.update({
          where: { id: currentEmployment.id },
          data: { jobTitle: jobTitle || currentEmployment.jobTitle },
        });

        await tx.timelineEvent.create({
          data: {
            businessId: targetBusiness.id,
            personId,
            eventType: "role_updated",
            summary: `${fullName}'s role was updated${jobTitle ? ` to ${jobTitle}` : ""}.`,
          },
        });

        return;
      }

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
          businessId: targetBusiness.id,
          jobTitle: jobTitle || currentEmployment.jobTitle,
          startDate: new Date(),
          isCurrent: true,
        },
      });

      await tx.timelineEvent.create({
        data: {
          businessId: currentEmployment.businessId,
          personId,
          eventType: "employment_left",
          summary: `${fullName} left ${currentEmployment.business.name}.`,
        },
      });

      await tx.timelineEvent.create({
        data: {
          businessId: targetBusiness.id,
          personId,
          eventType: "employment_joined",
          summary: `${fullName} joined ${targetBusiness.name}.`,
        },
      });
    });

    return NextResponse.json({ success: true });
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