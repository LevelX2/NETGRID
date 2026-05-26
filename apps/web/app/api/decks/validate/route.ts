import { NextResponse } from "next/server";
import { deckValidationResponse } from "../deck-data";
import type { EditableDeck } from "@netgrid/decks";

export async function POST(request: Request) {
  const body = (await request.json()) as { deck?: EditableDeck; matchCardPool?: "originalset" | "originalset_proteus" };
  if (!body.deck) return NextResponse.json({ error: { code: "deck_missing", message: "Deck fehlt." } }, { status: 400 });
  const response = deckValidationResponse(body.deck, body.matchCardPool ? { matchCardPool: body.matchCardPool } : {});
  return NextResponse.json(response.body, { status: response.status });
}
