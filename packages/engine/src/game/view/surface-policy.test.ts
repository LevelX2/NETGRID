import { describe, expect, it } from "vitest";
import {
  sanitizeChoiceViewForSurface,
  sanitizeEventPayloadForSurface,
  sanitizeForSurface,
} from "./surface-policy";

describe("surface policy", () => {
  it("allows actor-private choice metadata on actor-private surfaces", () => {
    expect(
      sanitizeForSurface(
        {
          hiddenHqCardIds: "corp_card_1,corp_card_2",
          actorPrivateLabel: "Archer",
        },
        "actor_private",
      ),
    ).toEqual({
      hiddenHqCardIds: "corp_card_1,corp_card_2",
      actorPrivateLabel: "Archer",
    });
  });

  it.each(["opponent_view", "public_event", "replay_public"] as const)(
    "rejects hidden card lists on %s surfaces",
    (surfaceKind) => {
      expect(() =>
        sanitizeForSurface({ hiddenHqCardIds: "corp_card_1" }, surfaceKind),
      ).toThrow(/hidden card data/);
    },
  );

  it.each(["opponent_view", "public_event", "replay_public"] as const)(
    "rejects actor-private labels on %s surfaces",
    (surfaceKind) => {
      expect(() =>
        sanitizeForSurface({ actorPrivateLabel: "Archer" }, surfaceKind),
      ).toThrow(/actor-private labels/);
    },
  );

  it("allows developer trace to keep diagnostic primitive fields", () => {
    expect(
      sanitizeForSurface(
        {
          hiddenHqCardIds: "corp_card_1",
          actorPrivateLabel: "Archer",
          step: "select_hq_cards",
        },
        "developer_trace",
      ),
    ).toEqual({
      hiddenHqCardIds: "corp_card_1",
      actorPrivateLabel: "Archer",
      step: "select_hq_cards",
    });
  });

  it("allows event payload arrays while enforcing hidden key policy", () => {
    expect(
      sanitizeEventPayloadForSurface(
        {
          knownHqDefinitionIds: ["agenda_def"],
          knownHqCardCount: 1,
        },
        "public_event",
      ),
    ).toEqual({
      knownHqDefinitionIds: ["agenda_def"],
      knownHqCardCount: 1,
    });
    expect(() =>
      sanitizeEventPayloadForSurface(
        { hqCardIds: ["secret_card"] },
        "public_event",
      ),
    ).toThrow(/hidden card data/i);
  });

  it("rejects actor-private choice labels on public-like choice surfaces", () => {
    const choice = {
      choiceId: "choice_1",
      side: "corp",
      source: "test",
      prompt: "Test",
      kind: "select_option",
      options: [{ id: "secret", label: "Secret HQ card" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 1,
      visibility: "hidden_info_barrier",
    } as NonNullable<import("@netgrid/shared").PlayerView["pendingChoice"]>;

    expect(() =>
      sanitizeChoiceViewForSurface(choice, "opponent_view"),
    ).toThrow(/actor-private labels/i);
    expect(sanitizeChoiceViewForSurface(choice, "actor_private")).toEqual(
      choice,
    );
  });
});
