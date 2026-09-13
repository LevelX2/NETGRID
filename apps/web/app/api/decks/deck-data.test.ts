import { afterEach, describe, expect, it } from "vitest";
import {
  deckSnapshotsResponse,
  deckTemplatesResponse,
  deckValidationResponse,
} from "./deck-data";
import type { DeckValidationResult, EditableDeck } from "@netgrid/decks";

const previousTestCardSetting = process.env.NETGRID_ENABLE_TEST_CARDS;

afterEach(() => {
  if (previousTestCardSetting === undefined)
    delete process.env.NETGRID_ENABLE_TEST_CARDS;
  else process.env.NETGRID_ENABLE_TEST_CARDS = previousTestCardSetting;
});

describe("deck test-card availability", () => {
  it.each(["netgrid_private_local_v1", "unknown-profile"])(
    "transports structured validation issues through JSON for %s",
    (formatProfileId) => {
      const deck: EditableDeck = {
        deckId: "invalid-probe",
        deckVersion: "test",
        name: "Own deck",
        side: "corp",
        identityCardId: "corp_identity_001",
        cardPoolSnapshotId: "card-snapshot-0.8",
        formatProfileId,
        cards: [{ cardId: "unknown-card", quantity: 45 }],
        createdAt: "2026-09-13",
        updatedAt: "2026-09-13",
      };
      const response = deckValidationResponse(deck).body as {
        validation: DeckValidationResult;
      };
      const validation = JSON.parse(JSON.stringify(response))
        .validation as DeckValidationResult;
      expect(validation.ok).toBe(false);
      if (formatProfileId === "unknown-profile")
        expect(validation.issues).toEqual([
          { code: "format_profile_unsupported", severity: "error", params: {} },
        ]);
      else {
        expect(validation.issues).toContainEqual({
          code: "unknown_card",
          severity: "error",
          params: { cardId: "unknown-card" },
        });
        expect(validation.issues).toContainEqual({
          code: "agenda_points_too_low",
          severity: "error",
          params: { actual: 0, cards: 45, minimum: 20, maximum: 21 },
        });
      }
    },
  );
  it("omits test-card snapshots and templates by default", () => {
    delete process.env.NETGRID_ENABLE_TEST_CARDS;

    const snapshotPayload = deckSnapshotsResponse().body as {
      snapshots: Array<{ deckSnapshotId: string }>;
    };
    const templatePayload = deckTemplatesResponse().body as {
      templates: Array<{ templateId: string }>;
    };

    expect(
      snapshotPayload.snapshots.some((snapshot) =>
        snapshot.deckSnapshotId.startsWith("demo_runner_00"),
      ),
    ).toBe(false);
    expect(
      templatePayload.templates.some((template) =>
        template.templateId.startsWith("demo_runner_00"),
      ),
    ).toBe(false);
  });

  it("returns the test fixtures only after explicit backend activation", () => {
    process.env.NETGRID_ENABLE_TEST_CARDS = "true";

    const payload = deckSnapshotsResponse().body as {
      snapshots: Array<{ deckSnapshotId: string }>;
    };
    expect(
      payload.snapshots.some(
        (snapshot) =>
          snapshot.deckSnapshotId === "demo_runner_008_snapshot_v0_8",
      ),
    ).toBe(true);
  });
});
