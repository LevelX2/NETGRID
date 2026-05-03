import { NextResponse } from "next/server";
import { deckTemplatesResponse } from "../deck-data";

export function GET() {
  const response = deckTemplatesResponse();
  return NextResponse.json(response.body, { status: response.status });
}
