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
  handleRunFortTriggerExecution,
  hostedProgramIdsOnHardware,
  topHostedProgramOnHardware,
  type RunFortTriggerExecutionHost,
} from "./run-fort-trigger-execution";

const MICROTECH_BACKUP_DRIVE_ID = "microtech_backup_drive";

describe("run fort trigger execution", () => {
  it("returns unhandled for actions outside the run/fort trigger boundary", () => {
    const state = baseState();
    const before = JSON.stringify(state);
    const action = buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    );

    expect(handleRunFortTriggerExecution(testHost(state), action)).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("delegates successful-run followups through the run/fort boundary", () => {
    const state = baseState();
    const calls: string[] = [];
    const action = triggerAction(state, {
      v1922RunnerProgramAbility: "false_echo_force_rez",
    });

    expect(
      handleRunFortTriggerExecution(
        testHost(state, {
          resolveSuccessfulRunFollowupAbility: () => {
            calls.push("successful");
            return { handled: true };
          },
        }),
        action,
      ),
    ).toMatchObject({ handled: true, actionType: "trigger_ability" });
    expect(calls).toEqual(["successful"]);
  });

  it("delegates fort-window and HQ Ice Swap triggers without rebuilding run flow", () => {
    const state = baseState();
    const calls: string[] = [];
    const fortAction = triggerAction(state, {
      fortRunWindowAbility: "move_self_to_different_position_on_same_fort",
    });
    const singaporeAction = triggerAction(state, {
      v1918UpgradeAbility: "hq_ice_swap",
    });
    const host = testHost(state, {
      resolveStartRunIceRepositionWindow: () => calls.push("reposition"),
      startHqIceSwapChoice: () => calls.push("singapore"),
    });

    handleRunFortTriggerExecution(host, fortAction);
    handleRunFortTriggerExecution(host, singaporeAction);

    expect(calls).toEqual(["reposition", "singapore"]);
  });

  it("returns the top hosted Microtech program to grip with stable payload shape", () => {
    const microtechId = "microtech_1" as CardInstanceId;
    const olderHostedId = "hosted_old" as CardInstanceId;
    const topHostedId = "hosted_top" as CardInstanceId;
    const state = baseState();
    state.runner.clicks = 2;
    state.runner.rig.hardware = [microtechId];
    state.cardInstances[microtechId] = instance(
      microtechId,
      MICROTECH_BACKUP_DRIVE_ID,
      "runner",
      "rig",
    );
    state.cardInstances[olderHostedId] = {
      ...instance(olderHostedId, "old_program", "runner", "rig"),
      hostedOn: microtechId,
    } as CardInstance;
    state.cardInstances[topHostedId] = {
      ...instance(topHostedId, "top_program", "runner", "rig"),
      hostedOn: microtechId,
    } as CardInstance;
    const host = testHost(state, {
      [MICROTECH_BACKUP_DRIVE_ID]: definition(MICROTECH_BACKUP_DRIVE_ID, "hardware"),
      old_program: definition("old_program", "program"),
      top_program: definition("top_program", "program"),
    });
    const action = triggerAction(state, {
      cardId: microtechId,
      targetProgramId: topHostedId,
      v1922RunnerHardwareAbility: "return_top_hosted_program",
    });

    expect(hostedProgramIdsOnHardware(host, microtechId)).toEqual([
      olderHostedId,
      topHostedId,
    ]);
    expect(topHostedProgramOnHardware(host, microtechId)).toBe(topHostedId);
    handleRunFortTriggerExecution(host, action);

    expect(state.runner.clicks).toBe(1);
    expect(state.runner.grip).toEqual([topHostedId]);
    expect(state.cardInstances[topHostedId]?.hostedOn).toBeUndefined();
    expect(state.cardInstances[topHostedId]?.zone).toEqual({
      side: "runner",
      zone: "grip",
    });
    expect(action.payload).toMatchObject({
      v1922RunnerHardwareAbility: "return_top_hosted_program",
      sourceDefinitionId: MICROTECH_BACKUP_DRIVE_ID,
      returnedCardDefinitionId: "top_program",
      returnedToGrip: true,
      hostedProgramCountAfter: 1,
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./run-fort-trigger-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});

type HostOverrides = Partial<RunFortTriggerExecutionHost["run"]>;

function baseState(): GameState {
  const state = createGame({
    seed: "arch-72-run-fort-trigger",
    setupMode: "completed",
  });
  state.phase = "runner_action_phase";
  state.activeSide = "runner";
  state.runner.clicks = 0;
  state.runner.grip = [];
  state.runner.rig.programs = [];
  state.runner.rig.hardware = [];
  state.cardInstances = {};
  return state;
}

function triggerAction(
  state: GameState,
  payload: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "trigger_ability",
    "Trigger ausloesen",
    "card",
    [],
    payload,
  );
}

function testHost(
  state: GameState,
  definitionsOrOverrides:
    | Record<string, CardDefinition>
    | HostOverrides = {},
  maybeOverrides: HostOverrides = {},
): RunFortTriggerExecutionHost {
  const definitions =
    "resolveSuccessfulRunFollowupAbility" in definitionsOrOverrides ||
    "resolveStartRunIceRepositionWindow" in definitionsOrOverrides
      ? {}
      : (definitionsOrOverrides as Record<string, CardDefinition>);
  const overrides =
    definitions === definitionsOrOverrides
      ? maybeOverrides
      : (definitionsOrOverrides as HostOverrides);
  return {
    state,
    actions: {
      spendClick: (stateToMutate, side) => {
        if (side === "runner") stateToMutate.runner.clicks -= 1;
        else stateToMutate.corp.clicks -= 1;
      },
    },
    cards: {
      definitionFor: (stateToRead, cardId) => {
        const card = stateToRead.cardInstances[cardId];
        if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
        const cardDefinition = definitions[card.definitionId];
        if (!cardDefinition)
          throw new Error(`Definition fehlt: ${card.definitionId}`);
        return cardDefinition;
      },
      mustInstance: (source, cardId) => {
        const card = source[cardId];
        if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
        return card;
      },
    },
    zones: {
      removeFromAllZones,
    },
    run: {
      resolveSuccessfulRunFollowupAbility:
        overrides.resolveSuccessfulRunFollowupAbility ??
        (() => ({ handled: false })),
      resolveFullyBrokenPassedIceDerezAndEndRun:
        overrides.resolveFullyBrokenPassedIceDerezAndEndRun ??
        (() => undefined),
      resolveFullyBrokenPassedIceTrash:
        overrides.resolveFullyBrokenPassedIceTrash ?? (() => undefined),
      resolveFortPassAdvancementWindow:
        overrides.resolveFortPassAdvancementWindow ?? (() => undefined),
      resolveStartRunIceRepositionWindow:
        overrides.resolveStartRunIceRepositionWindow ?? (() => undefined),
      resolveApproachIceExposeAbility:
        overrides.resolveApproachIceExposeAbility ?? (() => undefined),
      resolveApproachIceExposeViewingDecision:
        overrides.resolveApproachIceExposeViewingDecision ?? (() => undefined),
      startHqIceSwapChoice:
        overrides.startHqIceSwapChoice ?? (() => undefined),
    },
    constants: {
      HOST_RETURN_HARDWARE_SOURCE:
        MICROTECH_BACKUP_DRIVE_ID,
    },
  };
}

function removeFromAllZones(state: GameState, cardId: CardInstanceId): void {
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  owner: Side,
  zone: "grip" | "rig",
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
    zone: { side: owner, zone },
  } as unknown as CardInstance;
}

function definition(
  id: string,
  type: CardDefinition["type"],
): CardDefinition {
  return {
    id,
    title: id,
    side: "runner",
    type,
    mechanics: [],
  } as unknown as CardDefinition;
}
