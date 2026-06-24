import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction } from "../turn/action-builders";
import {
  handleCreditEconomyExecution,
  type CreditEconomyExecutionHost,
  type CreditEconomyRunnerDrawSummary,
} from "./credit-economy-execution";

describe("credit economy execution", () => {
  it("returns unhandled for actions outside the credit economy boundary", () => {
    const state = createGame({
      seed: "arch-69-credit-economy-unhandled",
      setupMode: "completed",
    });
    const before = JSON.stringify(state);
    const action = buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    );

    expect(handleCreditEconomyExecution(testHost(state), action)).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("executes basic Corp gain credit with click payment", () => {
    const state = createGame({
      seed: "arch-69-credit-economy-corp-basic",
      setupMode: "completed",
    });
    state.corp.clicks = 3;
    state.corp.credits = 5;
    const action = gainCreditAction(state, "corp");

    expect(handleCreditEconomyExecution(testHost(state), action)).toMatchObject(
      {
        handled: true,
        actionType: "gain_credit",
      },
    );

    expect(state.corp.clicks).toBe(2);
    expect(state.corp.credits).toBe(6);
    expect(action.payload).toBeUndefined();
  });

  it("preserves Runner draw-after payload through delegated draw callbacks", () => {
    const state = createGame({
      seed: "arch-69-credit-economy-runner-draw-after",
      setupMode: "completed",
    });
    state.runner.clicks = 4;
    state.runner.credits = 0;
    const action = gainCreditAction(state, "runner", { drawCardAfter: true });

    handleCreditEconomyExecution(testHost(state), action);

    expect(state.runner.clicks).toBe(3);
    expect(state.runner.credits).toBe(1);
    expect(action.payload).toMatchObject({
      drawCardAfter: true,
      drawnCount: 1,
      drawTaxSourceCount: 0,
    });
  });

  it("resolves crying-counter removal without changing PendingChoice markers", () => {
    const state = createGame({
      seed: "arch-69-credit-economy-crying-counter",
      setupMode: "completed",
    });
    state.runner.clicks = 4;
    state.runner.credits = 4;
    const identity = state.runner.identity;
    state.cardInstances[identity] = {
      ...state.cardInstances[identity]!,
      counters: { crying: 1 },
    };
    const action = gainCreditAction(state, "runner", {
      runnerAbility: "remove_crying_counter",
      cardId: identity,
      removeCounterAmount: 1,
      counterRemoveCreditCost: 2,
    });

    handleCreditEconomyExecution(testHost(state), action);

    expect(state.runner.clicks).toBe(3);
    expect(state.runner.credits).toBe(2);
    expect(state.cardInstances[identity]?.counters).toBeUndefined();
    expect(action.payload).toMatchObject({
      runnerAbility: "remove_crying_counter",
      removedCounterAmount: 1,
      remainingCounters: 0,
      runnerCreditsAfter: 2,
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./credit-economy-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});

function gainCreditAction(
  state: GameState,
  side: Side,
  payload?: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(
    state,
    side,
    "gain_credit",
    "1 Credit nehmen",
    "basic_action",
    [{ clicks: 1 }],
    payload,
  );
}

type TestHostOptions = {
  rezzedRootCardIds?: CardInstanceId[];
  trashCorpInstalledCardToArchives?: (cardId: CardInstanceId) => void;
};

function testHost(
  state: GameState,
  options: TestHostOptions = {},
): CreditEconomyExecutionHost {
  return {
    state,
    actions: {
      spendClick: (stateToMutate, side) => {
        if (side === "corp") stateToMutate.corp.clicks -= 1;
        else stateToMutate.runner.clicks -= 1;
      },
    },
    cards: {
      definitionFor: (stateToRead, cardId) =>
        definitionFor(stateToRead, cardId),
      mustInstance: (source, cardId) => mustInstance(source, cardId),
      publicServerLabelForCard: () => undefined,
      hasCardImplementationForDefinition: () => false,
      hasCorpUtilityKind: () => false,
      uniqueDirectLongtailImplementationForCard: () => undefined,
    },
    credits: {
      gain: (stateToMutate, side, amount) => {
        if (side === "corp") stateToMutate.corp.credits += amount;
        else stateToMutate.runner.credits += amount;
      },
      spend: (stateToMutate, side, amount) => {
        if (side === "corp") stateToMutate.corp.credits -= amount;
        else stateToMutate.runner.credits -= amount;
      },
    },
    counters: {
      cardCounter: (stateToRead, cardId, counterType) =>
        mustInstance(stateToRead.cardInstances, cardId).counters?.[
          counterType
        ] ?? 0,
      addCardCounter: (stateToMutate, cardId, counterType, amount) => {
        setCardCounter(
          stateToMutate,
          cardId,
          counterType,
          cardCounter(stateToMutate, cardId, counterType) + amount,
        );
      },
      spendCardCounter: (stateToMutate, cardId, counterType, amount) => {
        setCardCounter(
          stateToMutate,
          cardId,
          counterType,
          cardCounter(stateToMutate, cardId, counterType) - amount,
        );
      },
      visibleVirusCounterTargetIds: () => [],
    },
    runner: {
      installedCardIds: () => [
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ],
      trashInstalledCardToHeap: () => undefined,
      forfeitAgendaForPointCost: () => undefined,
      drawCards: () => runnerDrawSummary(),
      applyDrawSummaryPayload: (_stateToMutate, action, summary) => {
        action.payload = {
          ...(action.payload ?? {}),
          drawnCount: summary.drawnCount,
          drawTaxSourceCount: summary.drawTaxSourceCount,
          drawTaxCreditsPaid: summary.drawTaxCreditsPaid,
          drawTaxTagsAdded: summary.drawTaxTagsAdded,
        };
      },
      ensureTurnFlags: (stateToMutate) =>
        (stateToMutate.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
          stolenAgendaAdvancementCountersThisTurn: 0,
          stolenAgendaAdvancementCountersLastTurn: 0,
          runnerReceivedTagThisTurn: false,
          stoleResearchAgendaThisTurn: false,
          stoleGrayOpsAgendaThisTurn: false,
          stoleBlackOpsAgendaThisTurn: false,
          runAttemptsThisTurn: 0,
          runAttemptsLastTurn: 0,
          successfulHqRunThisTurn: false,
          successfulRunThisTurn: false,
          damagePreventionUsage: {},
          runnerActionsTakenThisTurn: 0,
          abilityUsedSourceIdsByLimitKey: {},
          startOfTurnFloatingCreditsApplied: false,
          bonusRunPending: false,
        }),
    },
    corp: {
      rezzedRootCardIds: () => options.rezzedRootCardIds ?? [],
      installedCardIds: () => options.rezzedRootCardIds ?? [],
      publicInstalledCardIdentityKnown: () => false,
      uninstallInstalledCardToHq: () => undefined,
      trashInstalledCardToArchives: (_stateToMutate, cardId) =>
        options.trashCorpInstalledCardToArchives?.(cardId),
    },
    hiddenZone: {
      resolveV1911RunnerHiddenZoneAbility: () => undefined,
      resolveScoredAgendaCorpRdTopReveal: () => undefined,
      revealRunnerStackTop: () => undefined,
      revealCorpRdTop: () => undefined,
      resolveReschedulerHqShuffleDraw: () => undefined,
      startCorpAssetRdTopReorderChoice: () => undefined,
    },
    delegates: {
      shouldOpenCorpInstalledEconomyCreditChoice: () => false,
      startCorpInstalledEconomyCreditChoice: () => undefined,
      resolveCorpInstalledEconomyAction: () => false,
      handleTraceOrchestrationAction: () => ({ handled: false }),
      handleCorpSpecialDamageAbilityAction: () => ({ handled: false }),
      handleScoredAgendaActivatedAbilityAction: () => ({ handled: false }),
    },
    random: {
      nextRandom: (stateToMutate) => {
        stateToMutate.randomCounter += 1;
        return 0;
      },
    },
    constants: {
      COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID: "stack_reveal",
      CORP_HQ_SHUFFLE_DRAW_CARD_ID: "rescheduler",
      COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID: "cowboy_sysop",
      DISINFECTANT_VIRUS_COUNTER_ASSET_ID: "disinfectant",
      COUNTER_UPGRADE_CARD_IDS: new Set(["counter_upgrade"]),
      RUNNER_RANDOM_PROGRAM_CARD_IDS: new Set(["random_program"]),
      QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID: "quest_for_cattekin",
      FAIT_ACCOMPLI_COUNTER_PROGRAM_ID: "fait_accompli",
    },
  };
}

function runnerDrawSummary(): CreditEconomyRunnerDrawSummary {
  return {
    drawnCount: 1,
    drawnCardIds: ["drawn_card" as CardInstanceId],
    drawTaxSourceCount: 0,
    drawTaxCreditsPaid: 0,
    drawTaxTagsAdded: 0,
  };
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  owner: Side,
  advancementCounters = 0,
): CardInstance {
  return {
    id,
    instanceId: id,
    definitionId,
    owner,
    controller: owner,
    faceup: true,
    rezzed: true,
    advancementCounters,
    strengthModifier: 0,
    zone: { side: owner, zone: owner === "corp" ? "serverRoot" : "rig" },
  } as unknown as CardInstance;
}

function definitionFor(
  state: GameState,
  cardId: CardInstanceId,
): CardDefinition {
  const card = mustInstance(state.cardInstances, cardId);
  return {
    id: card.definitionId,
    title: card.definitionId,
    side: card.owner,
    type: card.owner === "corp" ? "asset" : "resource",
  } as CardDefinition;
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  cardId: CardInstanceId,
): CardInstance {
  const card = source[cardId];
  if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
  return card;
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

function setCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  const card = mustInstance(state.cardInstances, cardId);
  const counters = { ...(card.counters ?? {}) };
  if (amount <= 0) delete counters[counterType];
  else counters[counterType] = amount;
  const { counters: _counters, ...withoutCounters } = card;
  void _counters;
  state.cardInstances[cardId] =
    Object.keys(counters).length > 0
      ? { ...withoutCounters, counters }
      : withoutCounters;
}
