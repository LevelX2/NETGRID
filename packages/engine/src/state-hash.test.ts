import { CURRENT_RULES_BASELINE, type GameState } from "@netgrid/shared";
import { engineCardByDefinitionId } from "@netgrid/cards/engine";
import { describe, expect, it } from "vitest";
import {
  cardPoolSnapshotIdentityForState,
  hashStateSnapshot,
  hashStateSnapshotWithRulesContext,
  matchCardSpecDefinitionIdsForState,
  StateHashCardPoolError,
} from "./state-hash";
import { createCurrentCardRegistryRulesContext } from "./card-registry-rules-context";

describe("mechanical StateHash baseline", () => {
  it("ignores text provenance but retains mechanical schema versions", () => {
    const state = {
      baseline: { ...CURRENT_RULES_BASELINE },
      eventLog: [],
      stateVersion: 1,
      cardInstances: {},
    } as unknown as GameState;
    const textOnly = {
      ...state,
      baseline: {
        ...state.baseline,
        cardTextSource: "manual" as const,
        cardTextSnapshotId:
          "text-only-change" as typeof state.baseline.cardTextSnapshotId,
      },
    };
    expect(hashStateSnapshot(textOnly)).toBe(hashStateSnapshot(state));
    const engineChange = {
      ...state,
      baseline: {
        ...state.baseline,
        engineSchemaVersion: "mechanical-change",
      },
    } as unknown as GameState;
    expect(hashStateSnapshot(engineChange)).not.toBe(hashStateSnapshot(state));
    expect(hashStateSnapshotWithRulesContext(state, "primitives-v1")).not.toBe(
      hashStateSnapshotWithRulesContext(state, "primitives-v2"),
    );
  });

  it("keeps adversarial Corp and Runner snapshot IDs unambiguous", () => {
    const state = (corp: string, runner: string) =>
      ({
        baseline: CURRENT_RULES_BASELINE,
        eventLog: [],
        cardInstances: {},
        deckMetadata: {
          corp: { cardPoolSnapshotId: corp },
          runner: { cardPoolSnapshotId: runner },
        },
      }) as unknown as GameState;
    expect(cardPoolSnapshotIdentityForState(state("a|runner:b", "c"))).not.toBe(
      cardPoolSnapshotIdentityForState(state("a", "b|runner:c")),
    );
  });

  it("hashes canonical persisted capability identity deterministically", () => {
    const state = {
      baseline: CURRENT_RULES_BASELINE,
      eventLog: [],
      stateVersion: 3,
      cardInstances: {},
      pendingCorpDraw: {
        transactionId: "draw:capability",
        baseDrawCount: 1,
        replacementDrawCount: 0,
        drawnCardIds: ["drawn"],
        continuation: {
          kind: "card_effect_activated",
          sourceCardId: "source",
          sourceDefinitionId: "test_card",
          sourceAbilityId: "test_card:draw",
          drawEffectIndex: 0,
          nextEffectIndex: 1,
          creditGainOrdinal: 0,
          originalActionPayload: {},
        },
      },
    } as unknown as GameState;
    expect(hashStateSnapshot(structuredClone(state))).toBe(
      hashStateSnapshot(state),
    );
    const changed = structuredClone(state);
    changed.pendingCorpDraw!.continuation = {
      ...changed.pendingCorpDraw!.continuation,
      sourceAbilityId: "test_card:gain",
    } as never;
    expect(hashStateSnapshot(changed)).not.toBe(hashStateSnapshot(state));
  });

  it("selects only unique sorted CardSpec definitions for the match rules context", () => {
    const state = {
      baseline: CURRENT_RULES_BASELINE,
      eventLog: [],
      cardInstances: {
        z: { instanceId: "z", definitionId: "onr_v1_154_broker" },
        legacy: { instanceId: "legacy", definitionId: "simple_agenda" },
        a: { instanceId: "a", definitionId: "onr_v1_168_loan-from-chiba" },
        duplicate: {
          instanceId: "duplicate",
          definitionId: "onr_v1_154_broker",
        },
      },
    } as unknown as GameState;

    expect(matchCardSpecDefinitionIdsForState(state)).toEqual([
      "onr_v1_154_broker",
      "onr_v1_168_loan-from-chiba",
    ]);
    const reordered = structuredClone(state);
    reordered.cardInstances = Object.fromEntries(
      Object.entries(reordered.cardInstances).reverse(),
    );
    expect(matchCardSpecDefinitionIdsForState(reordered)).toEqual(
      matchCardSpecDefinitionIdsForState(state),
    );
  });

  it("keeps a legacy-only match outside the CardSpec rules slice", () => {
    const state = {
      baseline: CURRENT_RULES_BASELINE,
      eventLog: [],
      cardInstances: {
        legacy: { instanceId: "legacy", definitionId: "simple_agenda" },
      },
    } as unknown as GameState;
    expect(matchCardSpecDefinitionIdsForState(state)).toEqual([]);
  });

  it("binds a migrated match to its CardSpec rules fingerprint", () => {
    const snapshot = "state-hash-card-spec-test";
    const empty = createCurrentCardRegistryRulesContext({
      cardPoolSnapshotId: snapshot,
      matchCardPoolDefinitionIds: [],
    });
    const broker = createCurrentCardRegistryRulesContext({
      cardPoolSnapshotId: snapshot,
      matchCardPoolDefinitionIds: ["onr_v1_154_broker"],
    });
    expect(broker.matchCardDefinitionIds).toEqual(["onr_v1_154_broker"]);
    expect(
      engineCardByDefinitionId("onr_v1_154_broker")?.cardRulesFingerprint,
    ).toMatch(/^fnv1a64x2:card-rules-v1:/);
    expect(broker.cardRulesAggregateFingerprint).not.toBe(
      empty.cardRulesAggregateFingerprint,
    );
    expect(broker.fingerprint).not.toBe(empty.fingerprint);
  });

  it("fails closed when the state has no card-instance authority", () => {
    const state = {
      baseline: CURRENT_RULES_BASELINE,
      eventLog: [],
    } as unknown as GameState;
    expect(() => matchCardSpecDefinitionIdsForState(state)).toThrowError(
      StateHashCardPoolError,
    );
    try {
      matchCardSpecDefinitionIdsForState(state);
    } catch (error) {
      expect(error).toMatchObject({ code: "missing_card_instances" });
    }
  });
});
