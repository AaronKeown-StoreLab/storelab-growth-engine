import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { analyseResearchSourceRequest } from "../../../services/researchAnalysisService";
import { ResearchAnalysis, ResearchSourceForAnalysis } from "../../../types/research";

type CapturePayload = {
  source: ResearchSourceForAnalysis;
  analysis: ResearchAnalysis;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function captureSource(body: Record<string, unknown>): ResearchSourceForAnalysis {
  const url = cleanText(body.url);
  const title = cleanText(body.title) || "LinkedIn profile capture";
  const content = cleanText(body.content);

  if (!content) {
    throw new Error("Visible profile text is required.");
  }

  return {
    name: title,
    kind: "Notes",
    detail: url || title,
    content: content.slice(0, 20000),
    detected: ["Browser capture", url.includes("linkedin.com") ? "LinkedIn profile" : "Visible page text"].filter(Boolean),
  };
}

function responseJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function needsAnalysisRepair(payload: CapturePayload) {
  const person = payload.analysis.proposals[0]?.person;

  return person?.firstName === "Person" && person.lastName === "LinkedIn";
}

async function captureForResponse(capture: Awaited<ReturnType<typeof prisma.inboxItem.findMany>>[number]) {
  let payload = JSON.parse(capture.payload) as CapturePayload;
  let title = capture.title;
  let summary = capture.summary;

  if (needsAnalysisRepair(payload)) {
    const analysis = await analyseResearchSourceRequest(payload.source);
    const firstProposal = analysis.proposals[0];

    payload = {
      ...payload,
      analysis,
    };
    title = firstProposal?.title || payload.source.name;
    summary = analysis.summary;

    await prisma.inboxItem.update({
      where: {
        id: capture.id,
      },
      data: {
        title,
        summary,
        payload: JSON.stringify(payload),
      },
    });
  }

  return {
    id: capture.id,
    title,
    summary,
    createdAt: capture.createdAt,
    payload,
  };
}

export async function GET() {
  const captures = await prisma.inboxItem.findMany({
    where: {
      type: "research_capture",
      status: "pending",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return responseJson(await Promise.all(captures.map(captureForResponse)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const source = captureSource(body);
    const analysis = await analyseResearchSourceRequest(source);
    const firstProposal = analysis.proposals[0];

    const capture = await prisma.inboxItem.create({
      data: {
        type: "research_capture",
        status: "pending",
        title: firstProposal?.title || source.name,
        summary: analysis.summary,
        payload: JSON.stringify({
          source,
          analysis,
        } satisfies CapturePayload),
      },
    });

    return responseJson({
      id: capture.id,
      title: capture.title,
      summary: capture.summary,
      analysis,
    });
  } catch (error) {
    console.error("Could not save browser capture:", error);

    return responseJson(
      {
        error: error instanceof Error ? error.message : "Could not save browser capture.",
      },
      { status: 400 }
    );
  }
}


export async function DELETE() {
  await prisma.inboxItem.updateMany({
    where: {
      type: "research_capture",
      status: "pending",
    },
    data: {
      status: "reviewed",
    },
  });

  return responseJson({ success: true });
}
