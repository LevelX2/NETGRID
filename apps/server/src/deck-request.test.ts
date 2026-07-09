import { describe, expect, it } from "vitest";
import { deckSelectionFromBody } from "./deck-request";

describe("deck request parsing", () => {
  it("accepts only participant-scoped current deck selections", () => {
    expect(
      deckSelectionFromBody({
        aiDeckPolicy: "selected",
        participantADecks: {
          runnerDeckSnapshotId: "runner-current",
          corpDeckSnapshotId: "corp-current",
        },
      }),
    ).toEqual({
      aiDeckPolicy: "selected",
      participantADecks: {
        runnerDeckSnapshotId: "runner-current",
        corpDeckSnapshotId: "corp-current",
      },
    });
  });

  it("does not revive removed top-level deck compatibility fields", () => {
    expect(
      deckSelectionFromBody({
        runnerDeckSnapshotId: "runner-legacy",
        corpDeckSnapshotId: "corp-legacy",
      }),
    ).toEqual({});
  });
});
