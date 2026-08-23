import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import {
  chronicleItemBelongsToSystemSetup,
  chronicleStartTurnEffectGroupFromEvent,
  formatChronicleEffectItems,
  formatChronicleEvent,
} from "./chronicle";

describe("chronicle system and start-turn grouping", () => {
  it("does not treat a public system-category start effect as setup", () => {
    const endTurn = event("end_turn", {
      actor: "corp",
      resolvedEffects: [
        {
          effectId: "runner.start.public-system-kind",
          kind: "public_start_effect",
          visibility: "public",
          side: "runner",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "public_start_card",
          sourceTitle: "Public Start Card",
        },
      ],
    });
    const [item] = formatChronicleEffectItems(endTurn, "runner");

    expect(item).toMatchObject({
      category: "system",
      visibility: "public",
      actor: "runner",
    });
    expect(item ? chronicleItemBelongsToSystemSetup(item) : null).toBe(false);
    expect(
      item ? chronicleStartTurnEffectGroupFromEvent(endTurn, 1, item) : null,
    ).toEqual({ label: "Zug 2 - Runner", kind: "runner" });
  });

  it("keeps mulligan setup decisions in the system group", () => {
    const mulligan = formatChronicleEvent(
      event("resolve_choice", {
        actor: "runner",
        setupStep: "mulligan",
        setupSide: "runner",
        setupDecision: "keep",
      }),
      "runner",
    );

    expect(mulligan).toMatchObject({
      category: "system",
      visibility: "system",
      groupLabel: "System",
    });
    expect(chronicleItemBelongsToSystemSetup(mulligan)).toBe(true);
  });
});

function event(
  actionType: string,
  payload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId: `evt_${actionType}`,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "fnv1a:test",
    visibilityClass: "public",
    publicPayload: { actionType, ...payload },
  };
}
