import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyResolvedSearchToGripMove,
  applySearchToGripMoveIntent,
  buildSearchToGripResolvedPayload,
  createSearchToGripMoveIntent,
} from "./search-choice-move-intents";

const sourceDefinitionId = "source_definition" as CardDefinitionId;
const selectedDefinitionId = "selected_definition" as CardDefinitionId;

function removeFromZone(
  zone: CardInstanceId[],
): (cardId: CardInstanceId) => void {
  return (cardId) => {
    const index = zone.indexOf(cardId);
    if (index >= 0) zone.splice(index, 1);
  };
}

describe("hidden-zone search choice move intents", () => {
  it("moves a stack selection to grip and keeps reveal/shuffle metadata", () => {
    const selectedCardId = "stack_program" as CardInstanceId;
    const stack = [selectedCardId, "stack_other" as CardInstanceId];
    const grip = ["grip_card" as CardInstanceId];

    const intent = createSearchToGripMoveIntent({
      selectedCardId,
      sourceCardIds: stack,
      sourceZone: "stack",
      sourceDefinitionId,
      selectedCardDefinitionId: selectedDefinitionId,
      revealToCorp: true,
      shuffleNeeded: true,
    });
    const result = applySearchToGripMoveIntent(intent, {
      removeFromAllZones: removeFromZone(stack),
      addToGrip: (cardId) => grip.push(cardId),
    });

    expect(stack).toEqual(["stack_other"]);
    expect(grip).toEqual(["grip_card", selectedCardId]);
    expect(result).toEqual({
      movedCardId: selectedCardId,
      sourceZone: "runner_stack",
      destinationZone: "runner_grip",
      sourceDefinitionId,
      selectedCardDefinitionId: selectedDefinitionId,
      revealToCorp: true,
      shuffleNeeded: true,
    });
    expect(buildSearchToGripResolvedPayload(result)).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      sourceDefinitionId,
      searchedZone: "runner_stack",
      selectedCount: 1,
      movedCardCount: 1,
      searchDestination: "runner_grip",
      shufflePerformed: true,
      shuffled: true,
      cardDefinitionId: selectedDefinitionId,
      publicRevealKind: "reveal",
      publicRevealDefinitionId: selectedDefinitionId,
      revealedCardDefinitionIds: selectedDefinitionId,
      revealedCount: 1,
    });
  });

  it("moves a trash selection to grip and reveals it without shuffle", () => {
    const selectedCardId = "heap_program" as CardInstanceId;
    const heap = ["heap_other" as CardInstanceId, selectedCardId];
    const grip: CardInstanceId[] = [];

    const result = applySearchToGripMoveIntent(
      createSearchToGripMoveIntent({
        selectedCardId,
        sourceCardIds: heap,
        sourceZone: "heap",
        sourceDefinitionId,
        selectedCardDefinitionId: selectedDefinitionId,
        revealToCorp: false,
        shuffleNeeded: false,
      }),
      {
        removeFromAllZones: removeFromZone(heap),
        addToGrip: (cardId) => grip.push(cardId),
      },
    );

    expect(heap).toEqual(["heap_other"]);
    expect(grip).toEqual([selectedCardId]);
    expect(buildSearchToGripResolvedPayload(result)).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      sourceDefinitionId,
      searchedZone: "runner_heap",
      selectedCount: 1,
      movedCardCount: 1,
      searchDestination: "runner_grip",
      shufflePerformed: false,
      shuffled: false,
      cardDefinitionId: selectedDefinitionId,
      publicRevealKind: "reveal",
      publicRevealDefinitionId: selectedDefinitionId,
      revealedCardDefinitionIds: selectedDefinitionId,
      revealedCount: 1,
    });
  });

  it("rejects selections that are not in the provided source zone", () => {
    expect(() =>
      createSearchToGripMoveIntent({
        selectedCardId: "missing_card" as CardInstanceId,
        sourceCardIds: ["other_card" as CardInstanceId],
        sourceZone: "stack",
        sourceDefinitionId,
        selectedCardDefinitionId: selectedDefinitionId,
        revealToCorp: false,
        shuffleNeeded: true,
      }),
    ).toThrow("Die gewaehlte Hidden-Zone-Karte liegt nicht in der Quellzone.");
  });

  it("applies resolved search selections to card instances without changing payload shape", () => {
    const selectedCardId = "stack_program" as CardInstanceId;
    const stack = [selectedCardId];
    const grip: CardInstanceId[] = [];
    const cardInstances: Record<CardInstanceId, CardInstance> = {
      [selectedCardId]: {
        instanceId: selectedCardId,
        definitionId: selectedDefinitionId,
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "stack" },
        faceup: false,
        rezzed: false,
        advancementCounters: 0,
        strengthModifier: 0,
        counters: {},
      },
    };

    const applied = applyResolvedSearchToGripMove({
      selection: {
        sourceCardId: "source_card" as CardInstanceId,
        sourceDefinitionId,
        filter: "program",
        sourceZone: "stack",
        selectedCardId,
        revealToCorp: false,
        shuffleNeeded: true,
      },
      sourceCardIds: stack,
      sourceDefinition: {
        id: sourceDefinitionId,
        type: "hardware",
      },
      selectedCardDefinitionId: selectedDefinitionId,
      installedRunnerResourceIds: [],
      cardInstances,
      removeFromAllZones: removeFromZone(stack),
      addToGrip: (cardId) => grip.push(cardId),
    });

    expect(stack).toEqual([]);
    expect(grip).toEqual([selectedCardId]);
    expect(cardInstances[selectedCardId]?.zone).toEqual({
      side: "runner",
      zone: "grip",
    });
    expect(applied.payload).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      sourceDefinitionId,
      searchedZone: "runner_stack",
      selectedCount: 1,
      movedCardCount: 1,
      searchDestination: "runner_grip",
      shufflePerformed: true,
      shuffled: true,
    });
  });
});
