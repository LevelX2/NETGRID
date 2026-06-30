import { NextResponse } from "next/server";
import { deckValidationResponse } from "../deck-data";
import type { EditableDeck } from "@netgrid/decks";
import type { ApiMatchCardPool } from "@netgrid/shared";

export async function POST(request: Request) {
  const body = (await request.json()) as { deck?: EditableDeck; matchCardPool?: unknown };
  if (!body.deck) return NextResponse.json({ error: { code: "deck_missing", message: "Deck fehlt." } }, { status: 400 });
  const response = deckValidationResponse(body.deck, isApiMatchCardPool(body.matchCardPool) ? { matchCardPool: body.matchCardPool } : {});
  return NextResponse.json(response.body, { status: response.status });
}

function isApiMatchCardPool(value: unknown): value is ApiMatchCardPool {
  return value === "originalset" || value === "originalset_classic" || value === "originalset_proteus" || value === "originalset_classic_proteus";
}
