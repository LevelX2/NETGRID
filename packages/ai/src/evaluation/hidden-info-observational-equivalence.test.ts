import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  CARD_DEFINITIONS_BY_ID,
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import { chooseAiAction } from "../index";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { resetPlanPortfolioMemory } from "../plans/plan-portfolio-memory";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { RealEngineFixtureBuilder } from "./real-engine-fixture-builder";

const RUNNER_DECK = withCards(
  DEMO_DECKS.demo_runner_001,
  "hidden-equivalence-runner",
  ["onr_v1_154_broker", "onr_v1_161_fall-guy"],
);
const CORP_DECK = withCards(
  DEMO_DECKS.demo_corp_001,
  "hidden-equivalence-corp",
  [],
);

describe("hidden-info observational equivalence", () => {
  beforeEach(resetAllAiMemory);

  it("ignores different Corp HQ contents and future R&D order from the Runner perspective", () => {
    const left = runnerMainState("hidden-equivalence-corp-hand-rd");
    const right = structuredClone(left);
    const hqCardId = required(left.corp.hq[0], "Corp HQ card");
    const rdCardId = required(left.corp.rd[0], "Corp R&D card");

    right.corp.hq[0] = rdCardId;
    right.corp.rd[0] = hqCardId;
    right.cardInstances[hqCardId] = {
      ...right.cardInstances[hqCardId]!,
      zone: { side: "corp", zone: "rd" },
    };
    right.cardInstances[rdCardId] = {
      ...right.cardInstances[rdCardId]!,
      zone: { side: "corp", zone: "hq" },
    };

    expectEquivalentDecision(left, right, "runner");
  });

  it("ignores different unrezzed ICE identities from the Runner perspective", () => {
    const left = runnerMainState("hidden-equivalence-unrezzed-ice");
    const iceDefinitions = ownedDefinitionsOfType(left, "corp", "ice");
    const installedDefinition = required(
      iceDefinitions[0],
      "first Corp ICE definition",
    );
    RealEngineFixtureBuilder.forState(left).withCorpIceOnServer(
      "hq",
      installedDefinition,
    );
    const installedId = required(
      left.corp.servers.find((server) => server.id === "hq")?.ice.at(-1),
      "installed HQ ICE",
    );
    const hiddenOtherId = required(
      hiddenOwnedCardIds(left, "corp").find(
        (cardId) =>
          cardId !== installedId &&
          CARD_DEFINITIONS_BY_ID[left.cardInstances[cardId]!.definitionId]
            ?.type === "ice" &&
          left.cardInstances[cardId]!.definitionId !== installedDefinition,
      ),
      "second hidden Corp ICE",
    );
    const right = structuredClone(left);
    swapDefinitions(right, installedId, hiddenOtherId);

    expectEquivalentDecision(left, right, "runner");
  });

  it("ignores different facedown remote identities from the Runner perspective", () => {
    const left = runnerMainState("hidden-equivalence-remote-root");
    const remoteDefinition = required(
      ownedDefinitionsOfType(left, "corp", "asset")[0] ??
        ownedDefinitionsOfType(left, "corp", "agenda")[0],
      "Corp remote-root definition",
    );
    RealEngineFixtureBuilder.forState(left).withCorpRemoteRoot(
      "remote_1",
      remoteDefinition,
    );
    const remoteId = required(
      left.corp.servers.find((server) => server.id === "remote_1")?.root[0],
      "facedown remote card",
    );
    const hiddenOtherId = required(
      hiddenOwnedCardIds(left, "corp").find(
        (cardId) =>
          cardId !== remoteId &&
          left.cardInstances[cardId]!.definitionId !== remoteDefinition,
      ),
      "second hidden Corp card",
    );
    const right = structuredClone(left);
    swapDefinitions(right, remoteId, hiddenOtherId);

    expectEquivalentDecision(left, right, "runner");
  });

  it("ignores different hidden Runner grip, facedown resource, and future stack from the Corp perspective", () => {
    const hiddenDefinitionIds = [
      "onr_v1_154_broker",
      "onr_v1_161_fall-guy",
    ];
    const originals = new Map(
      hiddenDefinitionIds.map((definitionId) => [
        definitionId,
        CARD_DEFINITIONS_BY_ID[definitionId],
      ]),
    );
    try {
      for (const definitionId of hiddenDefinitionIds) {
        const definition = required(
          CARD_DEFINITIONS_BY_ID[definitionId],
          definitionId,
        );
        CARD_DEFINITIONS_BY_ID[definitionId] = {
          ...definition,
          subtypes: [...new Set([...(definition.subtypes ?? []), "hidden"])],
        };
      }

      const left = corpMainState("hidden-equivalence-runner-private");
      const resourceDefinition = required(
        ownedDefinitionsOfType(left, "runner", "resource").find(
          (definitionId) => hiddenDefinitionIds.includes(definitionId),
        ),
        "Runner resource definition",
      );
      RealEngineFixtureBuilder.forState(left).withRunnerResourceInstalled(
        resourceDefinition,
      );
      const resourceId = required(
        left.runner.rig.resources.at(-1),
        "installed Runner resource",
      );
      left.cardInstances[resourceId] = {
        ...left.cardInstances[resourceId]!,
        faceup: false,
        rezzed: false,
      };

      const right = structuredClone(left);
      const hiddenOtherId = required(
        hiddenOwnedCardIds(right, "runner").find(
          (cardId) =>
            cardId !== resourceId &&
            hiddenDefinitionIds.includes(
              right.cardInstances[cardId]!.definitionId,
            ) &&
            right.cardInstances[cardId]!.definitionId !== resourceDefinition,
        ),
        "second hidden Runner resource",
      );
      swapDefinitions(right, resourceId, hiddenOtherId);

      const gripCardId = required(right.runner.grip[0], "Runner grip card");
      const stackCardId = required(right.runner.stack[0], "Runner stack card");
      right.runner.grip[0] = stackCardId;
      right.runner.stack[0] = gripCardId;
      right.cardInstances[gripCardId] = {
        ...right.cardInstances[gripCardId]!,
        zone: { side: "runner", zone: "stack" },
      };
      right.cardInstances[stackCardId] = {
        ...right.cardInstances[stackCardId]!,
        zone: { side: "runner", zone: "grip" },
      };

      expectEquivalentDecision(left, right, "corp");
    } finally {
      for (const [definitionId, definition] of originals) {
        if (definition) CARD_DEFINITIONS_BY_ID[definitionId] = definition;
      }
    }
  });
});

function expectEquivalentDecision(
  left: GameState,
  right: GameState,
  side: Side,
): void {
  expect(right).not.toEqual(left);
  expect(right.seed).toBe(left.seed);
  expect(right.randomCounter).toBe(left.randomCounter);
  expect(right.randomDrawRecords).toEqual(left.randomDrawRecords);

  const leftInput = decisionInput(left, side);
  const rightInput = decisionInput(right, side);
  expect(rightInput.playerView).toEqual(leftInput.playerView);
  expect(rightInput.legalActions).toEqual(leftInput.legalActions);
  expect(rightInput.eventTail).toEqual(leftInput.eventTail);

  resetAllAiMemory();
  const leftDecision = chooseAiAction(leftInput, {
    persistTacticalPlanMemory: false,
  });
  resetAllAiMemory();
  const rightDecision = chooseAiAction(rightInput, {
    persistTacticalPlanMemory: false,
  });
  expect(rightDecision).toEqual(leftDecision);
}

function decisionInput(state: GameState, side: Side) {
  return buildAiDecisionInput(state, side, {
    decisionId: `hidden-equivalence:${side}`,
    profileId: `hidden-equivalence-${side}`,
    ownDeckSnapshot: deckSnapshot(
      side === "runner" ? RUNNER_DECK : CORP_DECK,
    ),
  });
}

function runnerMainState(seed: string): GameState {
  let state = corpMainState(seed);
  state = apply(state, "corp", (action) => action.type === "end_turn");
  while (state.pendingChoice?.side === "corp") {
    state = apply(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
  }
  return state;
}

function corpMainState(seed: string): GameState {
  return apply(
    createGameAfterSetup({
      seed,
      agendaPointsToWin: 7,
      runnerDeck: RUNNER_DECK,
      corpDeck: CORP_DECK,
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) {
    throw new Error(
      `Missing ${side} fixture action. Legal=${getLegalActions(state, side)
        .map((candidate) => candidate.type)
        .join(",")}`,
    );
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(action.type === "resolve_choice" && state.pendingChoice
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice.choiceId,
            selectedOptionIds: [String(state.pendingChoice.options[0]?.id)],
          },
        }
      : {}),
    idempotencyKey: `${side}:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function ownedDefinitionsOfType(
  state: GameState,
  side: Side,
  type: "agenda" | "asset" | "ice" | "resource",
): string[] {
  return [
    ...new Set(
      Object.values(state.cardInstances).flatMap((card) =>
        card.zone.side === side &&
        CARD_DEFINITIONS_BY_ID[card.definitionId]?.type === type
          ? [card.definitionId]
          : [],
      ),
    ),
  ];
}

function hiddenOwnedCardIds(state: GameState, side: Side): string[] {
  const zones =
    side === "corp"
      ? new Set(["hq", "rd"])
      : new Set(["grip", "stack"]);
  return Object.entries(state.cardInstances).flatMap(([cardId, card]) =>
    card.zone.side === side && zones.has(card.zone.zone) ? [cardId] : [],
  );
}

function swapDefinitions(
  state: GameState,
  leftId: string,
  rightId: string,
): void {
  const leftDefinition = state.cardInstances[leftId]!.definitionId;
  const rightDefinition = state.cardInstances[rightId]!.definitionId;
  state.cardInstances[leftId] = {
    ...state.cardInstances[leftId]!,
    definitionId: rightDefinition,
  };
  state.cardInstances[rightId] = {
    ...state.cardInstances[rightId]!,
    definitionId: leftDefinition,
  };
}

function resetAllAiMemory(): void {
  resetResidentPlanPortfolioMemory();
  resetPlanPortfolioMemory();
  resetResidentPlanPortfolioMemory();
  resetRunnerRunPlanMemory();
  resetStrategicIntentMemory();
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing ${label}`);
  return value;
}

function withCards(
  base: DeckDefinition,
  id: string,
  additions: string[],
): DeckDefinition {
  return {
    ...base,
    id,
    name: id,
    cards: [
      ...base.cards,
      ...additions.map((cardId) => ({ id: cardId, quantity: 1 })),
    ],
  };
}

function deckSnapshot(
  deckDefinition: DeckDefinition,
): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deckDefinition.id}-snapshot`,
    side: deckDefinition.side,
    cards: deckDefinition.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}
