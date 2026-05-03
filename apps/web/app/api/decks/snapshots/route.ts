import { NextResponse } from "next/server";
import { deckSnapshotsResponse } from "../deck-data";

export function GET() {
  const response = deckSnapshotsResponse();
  return NextResponse.json(response.body, { status: response.status });
}
