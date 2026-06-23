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
  handleHiddenZoneTriggerExecution,
  type HiddenZoneTriggerExecutionHost,
} from "./hidden-zone-trigger-execution";

const MYSTERY_BOX_ID = "mystery_box";

describe("hidden zone trigger execution", () => {
  it("returns unhandled for actions outside the hidden-zone trigger boundary", () => {
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

    expect(
      handleHiddenZoneTriggerExecution(testHost(state, action), action),
    ).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("starts the same Mystery Box top-5 install choice without rebuilding choice handling", () => {
    const sourceId = "mystery_box_1" as CardInstanceId;
    const programId = "stack_program" as CardInstanceId;
    const resourceId = "stack_resource" as CardInstanceId;
    const state = baseState();
    state.run = {
      runId: "run_1",
      attackedServerId: "rd",
      hiddenStackInstallUsedSourceIdsThisRun: [],
    } as any;
    state.runner.rig.programs = [sourceId];
    state.runner.stack = [programId, resourceId];
    state.cardInstances[sourceId] = instance(
      sourceId,
      MYSTERY_BOX_ID,
      "runner",
    );
    state.cardInstances[programId] = instance(programId, "program_a", "runner");
    state.cardInstances[resourceId] = instance(
      resourceId,
      "resource_a",
      "runner",
    );
    const action = triggerAction(state, {
      cardId: sourceId,
      v1915RunnerProgramAbility: "top5_program_install",
    });

    expect(
      handleHiddenZoneTriggerExecution(testHost(state, action), action),
    ).toEqual({
      handled: true,
      actionType: "trigger_ability",
    });

    expect(state.run?.hiddenStackInstallUsedSourceIdsThisRun).toEqual([sourceId]);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      kind: "select_cards",
      visibility: "public",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.pendingChoice?.source).toContain("v1915.mystery_box");
    expect(state.pendingChoice?.options.map((option) => option.value)).toEqual([
      programId,
    ]);
    expect(action.payload).toMatchObject({
      v1915RunnerProgramAbility: "top5_program_install",
      cardId: sourceId,
      programFound: true,
      choiceVisibility: "public",
    });
  });

  it("preserves Mystery Box no-program payload and shuffle purpose", () => {
    const sourceId = "mystery_box_1" as CardInstanceId;
    const resourceId = "stack_resource" as CardInstanceId;
    const state = baseState();
    state.randomCounter = 4;
    state.run = {
      runId: "run_1",
      attackedServerId: "rd",
      hiddenStackInstallUsedSourceIdsThisRun: [],
    } as any;
    state.runner.rig.programs = [sourceId];
    state.runner.stack = [resourceId];
    state.cardInstances[sourceId] = instance(
      sourceId,
      MYSTERY_BOX_ID,
      "runner",
    );
    state.cardInstances[resourceId] = instance(
      resourceId,
      "resource_a",
      "runner",
    );
    const shuffledPurposes: string[] = [];
    const action = triggerAction(state, {
      cardId: sourceId,
      v1915RunnerProgramAbility: "top5_program_install",
    });

    handleHiddenZoneTriggerExecution(
      testHost(state, action, {
        shuffleRunnerStack: (purpose) => {
          shuffledPurposes.push(purpose);
          state.randomCounter += 1;
        },
      }),
      action,
    );

    expect(state.pendingChoice).toBeUndefined();
    expect(shuffledPurposes).toEqual([
      `v1915.mystery_box.shuffle.no_program.${sourceId}.run_1`,
    ]);
    expect(action.payload).toMatchObject({
      programFound: false,
      installedProgramCount: 0,
      randomCounterAfter: 5,
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./hidden-zone-trigger-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});

type HostOptions = {
  shuffleRunnerStack?: (purpose: string) => void;
};

function baseState(): GameState {
  const state = createGame({
    seed: "arch-74-hidden-zone-trigger",
    setupMode: "completed",
  });
  state.runner.rig.programs = [];
  state.runner.stack = [];
  state.cardInstances = {};
  delete state.pendingChoice;
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
  legalAction: LegalAction,
  options: HostOptions = {},
): HiddenZoneTriggerExecutionHost {
  return {
    state,
    legalAction,
    constants: {
      aujourdOuiResourceCardId: "aujourd_oui",
      mysteryBoxId: MYSTERY_BOX_ID,
      selfModifyingCodeId: "self_modifying_code",
      shortCircuitResourceCardId: "short_circuit",
      sneakPreviewId: "sneak_preview",
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      isUniqueRunnerDefinitionInstalled: () => false,
    },
    install: {
      canInstallRunnerProgramFromZone: () => true,
    },
    runnerMemoryLimit: () => state.runner.memoryLimit,
    shuffleRunnerStack:
      options.shuffleRunnerStack ??
      ((purpose) => {
        void purpose;
        state.randomCounter += 1;
      }),
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
  const type =
    card.definitionId.startsWith("program") ||
    card.definitionId === MYSTERY_BOX_ID
      ? "program"
      : "resource";
  return {
    id: card.definitionId,
    title: card.definitionId,
    side: "runner",
    type,
    mechanics: [],
  } as unknown as CardDefinition;
}
