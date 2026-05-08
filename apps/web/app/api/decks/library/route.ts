import { NextResponse } from "next/server";
import type { EditableDeck } from "@netgrid/decks";
import { readDeckLibrary, writeDeckLibrary } from "../library-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await readDeckLibrary();
    return NextResponse.json({ decks: result.decks, storagePath: result.storagePath });
  } catch {
    return NextResponse.json({ error: { code: "deck_library_read_failed", message: "Lokale Deckbibliothek konnte nicht gelesen werden." } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: { decks?: EditableDeck[] };
  try {
    body = (await request.json()) as { decks?: EditableDeck[] };
  } catch {
    return NextResponse.json({ error: { code: "deck_library_payload_invalid", message: "Deckbibliothek konnte nicht gelesen werden." } }, { status: 400 });
  }
  if (!Array.isArray(body.decks)) return NextResponse.json({ error: { code: "deck_library_missing", message: "Deckliste fehlt." } }, { status: 400 });

  try {
    const result = await writeDeckLibrary(body.decks);
    return NextResponse.json({ decks: result.decks, storagePath: result.storagePath });
  } catch {
    return NextResponse.json({ error: { code: "deck_library_write_failed", message: "Deckbibliothek konnte nicht gespeichert werden." } }, { status: 500 });
  }
}
