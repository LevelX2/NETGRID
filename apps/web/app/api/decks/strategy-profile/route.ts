import { NextResponse } from "next/server";
import { deckStrategyProfileViewerResponse } from "./strategy-profile-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { deck?: unknown };
  try {
    body = (await request.json()) as { deck?: unknown };
  } catch {
    return NextResponse.json(
      {
        schemaVersion: "ai007-deck-strategy-viewer-response-v1",
        taskId: "AI007",
        status: "unavailable",
        reason: "Deckprofil konnte nicht berechnet werden",
      },
      { status: 200 },
    );
  }

  return NextResponse.json(deckStrategyProfileViewerResponse(body.deck), { status: 200 });
}
