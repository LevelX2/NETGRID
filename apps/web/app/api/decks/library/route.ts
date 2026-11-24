import { NextResponse } from "next/server";
import {
  DeckLibraryMutationError,
  deleteLibraryDeck,
  readDeckLibrary,
  saveLibraryDeck,
} from "../library-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await readDeckLibrary();
    return NextResponse.json({
      decks: result.decks,
      storagePath: result.storagePath,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "deck_library_read_failed",
          message: "Lokale Deckbibliothek konnte nicht gelesen werden.",
        },
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  return mutate(request, "deck", saveLibraryDeck);
}

export async function DELETE(request: Request) {
  return mutate(request, "deckId", deleteLibraryDeck);
}

async function mutate(
  request: Request,
  key: "deck" | "deckId",
  apply: (value: unknown) => Promise<unknown>,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "deck_library_payload_invalid",
          message: "Deckbibliothek konnte nicht gelesen werden.",
        },
      },
      { status: 400 },
    );
  }
  try {
    const value =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)[key]
        : undefined;
    return NextResponse.json(await apply(value));
  } catch (error) {
    if (error instanceof DeckLibraryMutationError)
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.code === "deck_library_payload_invalid" ? 400 : 409 },
      );
    return NextResponse.json(
      {
        error: {
          code: "deck_library_write_failed",
          message: "Deckbibliothek konnte nicht gespeichert werden.",
        },
      },
      { status: 500 },
    );
  }
}
