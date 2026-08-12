import type { PublicGameEvent } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { chronicleCardTooltipContentMode } from "../chronicle/chronicle-card-tooltip-model";
import { publicChronicleCardDefinitionIds } from "../chronicle/chronicle-public-card-ids";

const SYSTEMATIC_LAYOFFS = "onr_v1_304_systematic-layoffs";
const replayPageSource = readFileSync(
  new URL("../../app/replays/page.tsx", import.meta.url),
  "utf8",
);
const replayBoardSource = readFileSync(
  new URL("./ReplayBoard.tsx", import.meta.url),
  "utf8",
);

describe("replay chronicle card tooltips", () => {
  it("loads only definition identities present in the public replay payload", () => {
    const event = replayEvent({
      sourceDefinitionId: SYSTEMATIC_LAYOFFS,
      targetCardDefinitionIds: "public_target_a,public_target_b",
      resolvedEffects: [
        { sourceDefinitionId: "public_effect_source" },
        { hiddenTargetCardId: "private_instance_must_not_be_loaded" },
      ],
    });

    expect(publicChronicleCardDefinitionIds(event)).toEqual([
      SYSTEMATIC_LAYOFFS,
      "public_target_a",
      "public_target_b",
      "public_effect_source",
    ]);
  });

  it("binds public replay references through catalog details into the chronicle", () => {
    expect(replayPageSource).toContain(
      "(replay?.publicEvents ?? []).flatMap(publicChronicleCardDefinitionIds)",
    );
    expect(replayPageSource).toContain(
      "`/api/cards/catalog/${encodeURIComponent(cardId)}`",
    );
    expect(replayPageSource).toContain("cardDetailsById={cardDetailsById}");
    expect(replayBoardSource).toContain(
      "cardDetailsById: Record<string, CatalogCardDetail>",
    );
    expect(replayBoardSource).toMatch(
      /<ChroniclePanel[\s\S]*?cardDetailsById=\{cardDetailsById\}/,
    );
    expect(replayBoardSource).not.toContain("EMPTY_CARD_DETAILS");
  });

  it("keeps image mode on the card image and both text modes on card text", () => {
    expect(chronicleCardTooltipContentMode("image", true, true)).toBe("image");
    expect(chronicleCardTooltipContentMode("simple", true, true)).toBe("text");
    expect(chronicleCardTooltipContentMode("enhanced", true, true)).toBe(
      "text",
    );
    expect(chronicleCardTooltipContentMode("image", false, true)).toBe("text");
  });
});

function replayEvent(
  payload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId: "evt_replay_systematic_layoffs",
    type: "play_operation",
    stateVersionBefore: 4,
    stateVersionAfter: 5,
    stateHashAfter: "fnv1a:73fe4ee3",
    publicPayload: {
      actor: "corp",
      actionType: "play_operation",
      label: "Korp spielt eine Operation.",
      ...payload,
    },
  };
}
