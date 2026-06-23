import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction } from "../turn/action-builders";
import {
  handleTriggerAbilityExecution,
  type TriggerAbilityExecutionHost,
} from "./trigger-ability-execution";

describe("trigger ability execution", () => {
  it("returns unhandled for actions outside the trigger ability boundary", () => {
    const state = createGame({
      seed: "arch-70-trigger-ability-unhandled",
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

    expect(handleTriggerAbilityExecution(testHost(state), action)).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("trashes an installed runner resource through a declared corp source ability", () => {
    const state = createGame({
      seed: "arch-70-trigger-ability-code-viral-cache",
      setupMode: "completed",
    });
    const sourceCardId = "code_viral_cache" as CardInstanceId;
    state.runner.rig.resources.push(sourceCardId);
    state.cardInstances[sourceCardId] = instance(
      sourceCardId,
      "code_viral_cache_definition",
      "runner",
    );
    state.corp.clicks = 3;
    state.corp.credits = 6;
    const trashed: CardInstanceId[] = [];
    const action = triggerAction(state, "corp", {
      corpAbility: "trash_installed_runner_resource_source",
      abilityKind: "corp_trash_installed_runner_resource",
      cardId: sourceCardId,
    });

    expect(
      handleTriggerAbilityExecution(
        testHost(state, {
          trashRunnerInstalledCardToHeap: (cardId) => trashed.push(cardId),
        }),
        action,
      ),
    ).toMatchObject({ handled: true, actionType: "trigger_ability" });

    expect(state.corp.clicks).toBe(2);
    expect(state.corp.credits).toBe(1);
    expect(trashed).toEqual([sourceCardId]);
    expect(action.payload).toMatchObject({
      corpAbility: "trash_installed_runner_resource_source",
      abilityKind: "corp_trash_installed_runner_resource",
      cardId: sourceCardId,
      trashedCardDefinitionId: "code_viral_cache_definition",
      sourceDefinitionId: "code_viral_cache_definition",
      trashCostPaid: 5,
      corpCreditsAfter: 1,
    });
  });

  it("delegates runner-special triggers without importing the engine index", () => {
    const state = createGame({
      seed: "arch-70-trigger-ability-runner-special-delegate",
      setupMode: "completed",
    });
    const calls: string[] = [];
    const action = triggerAction(state, "runner", {
      v1911HiddenZoneAbility: "hidden_stack_program_install",
    });

    handleTriggerAbilityExecution(
      testHost(state, {
        handleRunnerSpecialTriggerExecution: () => {
          calls.push("runner-special");
          return { handled: true };
        },
      }),
      action,
    );

    expect(calls).toEqual(["runner-special"]);
  });

  it("keeps the legacy generic-trigger error for unsupported triggers", () => {
    const state = createGame({
      seed: "arch-70-trigger-ability-unsupported",
      setupMode: "completed",
    });
    const action = triggerAction(state, "runner", {
      runnerAbility: "unknown_trigger",
    });

    expect(() =>
      handleTriggerAbilityExecution(testHost(state), action),
    ).toThrow(
      "Generische Abilities sind vorbereitet, aber in V0.93 nicht sichtbar freigeschaltet.",
    );
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./trigger-ability-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});

function triggerAction(
  state: GameState,
  side: Side,
  payload?: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(
    state,
    side,
    "trigger_ability",
    "Trigger ausloesen",
    "card",
    [],
    payload,
  );
}

type TestHostOptions = {
  remainingReplacementKind?: string;
  corpTrashInstalledRunnerSource?: false;
  trashRunnerInstalledCardToHeap?: (cardId: CardInstanceId) => void;
  handleCounterUtilityTriggerExecution?: (legalAction: LegalAction) => {
    handled: boolean;
    actionType?: LegalAction["type"];
  };
  handleRunnerSpecialTriggerExecution?: (legalAction: LegalAction) => {
    handled: boolean;
    actionType?: LegalAction["type"];
  };
  handleRunFortTriggerExecution?: (legalAction: LegalAction) => {
    handled: boolean;
    actionType?: LegalAction["type"];
  };
  handleHiddenZoneTriggerExecution?: (legalAction: LegalAction) => {
    handled: boolean;
    actionType?: LegalAction["type"];
  };
};

function testHost(
  state: GameState,
  options: TestHostOptions = {},
): TriggerAbilityExecutionHost {
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
      remainingReplacementLongtailKindForCard: () =>
        options.remainingReplacementKind,
      cardImplementationForDefinitionId: () => ({
        ...(options.corpTrashInstalledRunnerSource === false
          ? {}
          : {
              corpTrashInstalledRunnerSource: {
                kind: "corp_trash_installed_runner_resource",
                timing: "corp_main",
                cost: { clicks: 1, credits: 5 },
                target: "source",
                visibility: "public",
              },
            }),
      }),
    },
    credits: {
      spend: (stateToMutate, side, amount) => {
        if (side === "corp") stateToMutate.corp.credits -= amount;
        else stateToMutate.runner.credits -= amount;
      },
    },
    runner: {
      trashInstalledCardToHeap: (_stateToMutate, cardId) =>
        options.trashRunnerInstalledCardToHeap?.(cardId),
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
          allNighterBonusRunPending: false,
        }),
    },
    corp: {
      acmeSavingsAndLoanObligationCount: () => 0,
      removeAcmeSavingsAndLoanObligation: () => undefined,
    },
    runnerSpecial: {
      handleRunnerSpecialTriggerExecution:
        options.handleRunnerSpecialTriggerExecution ??
        (() => ({ handled: false })),
    },
    runFort: {
      handleRunFortTriggerExecution:
        options.handleRunFortTriggerExecution ?? (() => ({ handled: false })),
    },
    counterUtility: {
      handleCounterUtilityTriggerExecution:
        options.handleCounterUtilityTriggerExecution ??
        (() => ({ handled: false })),
    },
    hiddenZone: {
      handleHiddenZoneTriggerExecution:
        options.handleHiddenZoneTriggerExecution ??
        (() => ({ handled: false })),
    },
  };
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  owner: Side,
): CardInstance {
  return {
    id,
    instanceId: id,
    definitionId,
    owner,
    controller: owner,
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
    zone: { side: owner, zone: owner === "corp" ? "serverRoot" : "rig" },
  } as unknown as CardInstance;
}

function definitionFor(
  state: GameState,
  cardId: CardInstanceId,
): CardDefinition {
  const card = state.cardInstances[cardId];
  if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
  return {
    id: card.definitionId,
    title: card.definitionId,
    side: card.owner,
    type: card.owner === "corp" ? "asset" : "resource",
  } as CardDefinition;
}
