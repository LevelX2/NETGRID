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

  it("trashes Code Viral Cache through the trigger branch without payload changes", () => {
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
      corpAbility: "trash_code_viral_cache",
      cardId: sourceCardId,
    });

    expect(
      handleTriggerAbilityExecution(
        testHost(state, {
          codeViralCacheId: "code_viral_cache_definition",
          trashRunnerInstalledCardToHeap: (cardId) => trashed.push(cardId),
        }),
        action,
      ),
    ).toMatchObject({ handled: true, actionType: "trigger_ability" });

    expect(state.corp.clicks).toBe(2);
    expect(state.corp.credits).toBe(1);
    expect(trashed).toEqual([sourceCardId]);
    expect(action.payload).toMatchObject({
      corpAbility: "trash_code_viral_cache",
      cardId: sourceCardId,
      trashedCardDefinitionId: "code_viral_cache_definition",
      corpCreditsAfter: 1,
    });
  });

  it("resolves Wilson run-action trigger and preserves turn flag markers", () => {
    const state = createGame({
      seed: "arch-70-trigger-ability-wilson",
      setupMode: "completed",
    });
    state.phase = "runner_action_phase";
    state.activeSide = "runner";
    state.runner.clicks = 1;
    const sourceCardId = "wilson" as CardInstanceId;
    state.runner.rig.resources.push(sourceCardId);
    state.cardInstances[sourceCardId] = instance(
      sourceCardId,
      "wilson_definition",
      "runner",
    );
    const action = triggerAction(state, "runner", {
      runnerAbility: "wilson_gain_run_action",
      cardId: sourceCardId,
    });

    handleTriggerAbilityExecution(
      testHost(state, {
        remainingReplacementKind: "wilson_run_action_spending_cap",
      }),
      action,
    );

    expect(state.runner.clicks).toBe(2);
    expect(state.runnerTurnFlags?.wilsonUsedSourceIdsThisTurn).toEqual([
      sourceCardId,
    ]);
    expect(state.runnerTurnFlags?.wilsonRunOnlyActionsRemaining).toBe(1);
    expect(action.payload).toMatchObject({
      runnerAbility: "wilson_gain_run_action",
      wilsonRunOnlyActionsRemaining: 1,
      runnerClicksAfter: 2,
    });
  });

  it("delegates runner-special triggers without importing the engine index", () => {
    const state = createGame({
      seed: "arch-70-trigger-ability-runner-special-delegate",
      setupMode: "completed",
    });
    const calls: string[] = [];
    const action = triggerAction(state, "runner", {
      v1911HiddenZoneAbility: "self_modifying_code_install_program",
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
  codeViralCacheId?: string;
  remainingReplacementKind?: string;
  trashRunnerInstalledCardToHeap?: (cardId: CardInstanceId) => void;
  handleRunnerSpecialTriggerExecution?: (legalAction: LegalAction) => {
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
          brokerActionCardIdsThisTurn: [],
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
    delegates: {
      resolveCorpTrashNewDataFortCreationLockSource: () => undefined,
      resolveSuccessfulRunFollowupAbility: () => ({ handled: false }),
      resolveFullyBrokenPassedIceDerezAndEndRun: () => undefined,
      resolveStartupImmolatorTrashIce: () => undefined,
      handleMysteryBoxTopFiveProgramInstallActivation: () => undefined,
      resolveMicrotechBackupDriveReturnTopHosted: () => undefined,
      resolveFortPassAdvancementWindow: () => undefined,
      resolveStartRunIceRepositionWindow: () => undefined,
      resolvePreyingMantisGainAction: () => undefined,
      resolveCorpRemoveSpyCounter: () => undefined,
      resolveRemoveRunnerTraceCounter: () => undefined,
      resolveApproachIceExposeAbility: () => undefined,
      resolveApproachIceExposeViewingDecision: () => undefined,
      startSingaporeCityGridSwapChoice: () => undefined,
    },
    constants: {
      CODE_VIRAL_CACHE_ID: options.codeViralCacheId ?? "code_viral_cache",
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
