import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyTopNTakeMatchingMoveIntent,
  buildTopNTakeMatchingResolvedPayload,
  createTopNTakeMatchingMoveIntent,
  type TopNSelectedCardMove,
} from "./topn-move-intents";

const sourceDefinitionId = "source_definition" as CardDefinitionId;

function card(id: string, type: TopNSelectedCardMove["type"]): TopNSelectedCardMove {
  return {
    cardId: id as CardInstanceId,
    definitionId: `${id}_definition` as CardDefinitionId,
    title: `${id} title`,
    type,
  };
}

function instance(id: CardInstanceId): CardInstance {
  return {
    instanceId: id,
    definitionId: `${id}_definition` as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "stack" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
    counters: {},
  };
}

function removeFromZone(
  zone: CardInstanceId[],
): (cardId: CardInstanceId) => void {
  return (cardId) => {
    const index = zone.indexOf(cardId);
    if (index >= 0) zone.splice(index, 1);
  };
}

describe("hidden-zone top-N move intents", () => {
  it("moves Aujourd'Oui-style program selections to grip and preserves payload metadata", () => {
    const selected = [card("program_a", "program"), card("program_b", "program")];
    const stack = [
      selected[0]!.cardId,
      "event_card" as CardInstanceId,
      selected[1]!.cardId,
    ];
    const grip = ["grip_card" as CardInstanceId];
    const cardInstances: Record<CardInstanceId, CardInstance> = {
      [selected[0]!.cardId]: instance(selected[0]!.cardId),
      [selected[1]!.cardId]: instance(selected[1]!.cardId),
    };

    const intent = createTopNTakeMatchingMoveIntent({
      selection: {
        sourceCardId: "source_card" as CardInstanceId,
        sourceDefinitionId,
        count: 5,
        allowedTypes: ["program"],
        costPerTaken: 1,
        selectedCardIds: selected.map((move) => move.cardId),
        paidCredits: 2,
        shuffleNeeded: true,
      },
      topCardIds: stack,
      sourceDefinition: {
        id: sourceDefinitionId,
        type: "resource",
      },
      installedRunnerResourceIds: ["source_card" as CardInstanceId],
      selectedCards: selected,
    });
    const result = applyTopNTakeMatchingMoveIntent(intent, {
      cardInstances,
      removeFromAllZones: removeFromZone(stack),
      addToGrip: (cardId) => grip.push(cardId),
    });

    expect(stack).toEqual(["event_card"]);
    expect(grip).toEqual(["grip_card", selected[0]!.cardId, selected[1]!.cardId]);
    expect(cardInstances[selected[0]!.cardId]?.zone).toEqual({
      side: "runner",
      zone: "grip",
    });
    expect(buildTopNTakeMatchingResolvedPayload(result, {
      runnerCreditsAfter: 8,
    })).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      sourceDefinitionId,
      privateLookCount: 3,
      searchedZone: "runner_stack",
      takenCardCount: 2,
      movedCardCount: 2,
      paidCredits: 2,
      runnerCreditsAfter: 8,
      shufflePerformed: true,
      shuffled: true,
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "program_a_definition,program_b_definition",
      publicRevealTitles: "program_a title||program_b title",
      revealedCardDefinitionIds: "program_a_definition,program_b_definition",
    });
  });

  it("accepts N.E.T.O.-style prep/resource selections and rejects programs", () => {
    const selected = [card("prep_card", "event"), card("resource_card", "resource")];
    const topCardIds = selected.map((move) => move.cardId);

    expect(createTopNTakeMatchingMoveIntent({
      selection: {
        sourceCardId: "source_card" as CardInstanceId,
        sourceDefinitionId,
        count: 4,
        allowedTypes: ["event", "resource"],
        costPerTaken: 1,
        selectedCardIds: topCardIds,
        paidCredits: 2,
        shuffleNeeded: true,
      },
      topCardIds,
      sourceDefinition: {
        id: sourceDefinitionId,
        type: "resource",
      },
      installedRunnerResourceIds: ["source_card" as CardInstanceId],
      selectedCards: selected,
    }).selectedCards.map((move) => move.cardId)).toEqual(topCardIds);

    expect(() =>
      createTopNTakeMatchingMoveIntent({
        selection: {
          sourceCardId: "source_card" as CardInstanceId,
          sourceDefinitionId,
          count: 4,
          allowedTypes: ["event", "resource"],
          costPerTaken: 1,
          selectedCardIds: ["program_card" as CardInstanceId],
          paidCredits: 1,
          shuffleNeeded: true,
        },
        topCardIds: ["program_card" as CardInstanceId],
        sourceDefinition: {
          id: sourceDefinitionId,
          type: "resource",
        },
        installedRunnerResourceIds: ["source_card" as CardInstanceId],
        selectedCards: [card("program_card", "program")],
      }),
    ).toThrow("Eine gewaehlte Stack-Karte ist fuer diesen Effekt nicht legal.");
  });

  it("accepts Ronin Around-style hardware selections", () => {
    const hardware = card("hardware_card", "hardware");

    const intent = createTopNTakeMatchingMoveIntent({
      selection: {
        sourceCardId: "source_card" as CardInstanceId,
        sourceDefinitionId,
        count: 5,
        allowedTypes: ["hardware"],
        costPerTaken: 1,
        selectedCardIds: [hardware.cardId],
        paidCredits: 1,
        shuffleNeeded: true,
      },
      topCardIds: [hardware.cardId, "program_card" as CardInstanceId],
      sourceDefinition: {
        id: sourceDefinitionId,
        type: "resource",
      },
      installedRunnerResourceIds: ["source_card" as CardInstanceId],
      selectedCards: [hardware],
    });

    expect(intent.allowedTypes).toEqual(["hardware"]);
    expect(intent.selectedCards).toEqual([hardware]);
  });
});
