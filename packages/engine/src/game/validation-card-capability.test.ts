import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "./create-game";
import { validateGameState } from "./validation";

describe("persisted card capability identity validation", () => {
  it("accepts one canonical identity and rejects malformed continuations", () => {
    const state = createGame({
      seed: "card-capability-continuation-validation",
      setupMode: "completed",
    });
    const drawnCardId = state.corp.rd.shift()!;
    const specialZones = (state.specialZones ??= {
      setAside: [],
      removedFromGame: [],
    });
    specialZones.setAside.push(drawnCardId);
    state.cardInstances[drawnCardId]!.zone = {
      side: "special",
      zone: "set_aside",
      visibility: "side_private",
      visibilitySide: "corp",
      returnZone: { side: "corp", zone: "hq" },
    };
    const continuation = {
      kind: "card_effect_activated" as const,
      sourceCardId: "source" as CardInstanceId,
      sourceDefinitionId: "test_card",
      sourceAbilityId: "test_card:draw",
      drawEffectIndex: 0,
      nextEffectIndex: 1,
      creditGainOrdinal: 0,
      originalActionPayload: {},
    };
    state.pendingCorpDraw = {
      transactionId: "draw:capability",
      baseDrawCount: 1,
      replacementDrawCount: 0,
      drawnCardIds: [drawnCardId],
      continuation,
    };
    expect(validateGameState(state).ok).toBe(true);

    const errorsFor = (overrides: Record<string, unknown>) => {
      const candidate = structuredClone(state) as GameState;
      candidate.pendingCorpDraw!.continuation = {
        ...continuation,
        ...overrides,
      } as never;
      return validateGameState(candidate).errors.join(" ");
    };
    expect(errorsFor({ sourceAbilityId: undefined })).toMatch(
      /capability identity is invalid/,
    );
    expect(errorsFor({ sourceAbilityId: "Bad/Id" })).toMatch(/invalid/);
    expect(errorsFor({ sourceAbilityId: "other_card:draw" })).toMatch(
      /another definition/,
    );
  });
});
