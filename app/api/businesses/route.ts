import { NextResponse } from "next/server";
import {
  createBusinessWorkspace,
  loadBusinesses,
} from "../../services/businessService";

export async function GET() {
  try {
    const businesses = await loadBusinesses();

    return NextResponse.json(businesses);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Could not load businesses.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const business = await createBusinessWorkspace(body);

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create business.",
      },
      {
        status: 400,
      }
    );
  }
}