import { NextResponse } from "next/server";
import { loadBusinesses } from "../../services/businessService";

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