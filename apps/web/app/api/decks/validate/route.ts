import { NextResponse } from "next/server";
import { deckValidationResponse } from "../deck-data";
import type { EditableDeck } from "@netrunner/decks";

export async function POST(request: Request) {
  const body = (await request.json()) as { deck?: EditableDeck };
  if (!body.deck) return NextResponse.json({ error: { code: "deck_missing", message: "Deck fehlt." } }, { status: 400 });
  const response = deckValidationResponse(body.deck);
  return NextResponse.json(response.body, { status: response.status });
}
