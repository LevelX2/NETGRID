import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildCorpEncounterCardImplementationActions,
  buildRunnerDuringRunCardImplementationActions,
  type RunCardImplementationActionHost,
} from "./card-implementation-run-actions";

function definition(id: string, title: string): CardDefinition {
  return {
    id,
    title,
    side: "runner",
    type: "program",
  } as CardDefinition;
}

function makeState(options: { activeRun?: boolean } = {}): GameState {
  return {
    stateVersion: 3,
    activeSide: "runner",
    phase: options.activeRun === false ? "runner_action_phase" : "run",
    timingPoint:
      options.activeRun === false ? "runner_action.main" : "run.encounter_ice",
    runner: {
      credits: 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {},
    ...(options.activeRun === false
      ? {}
      : {
          run: {
            runId: "run_1",
            attackedServerId: "rd",
            phase: "encounter_ice",
            position: { kind: "ice", serverId: "rd", iceIndex: 0 },
          },
        }),
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function action(
  source: CardInstanceId,
  payload: NonNullable<LegalAction["payload"]>,
): LegalAction {
  return {
    id: `runner:activated_card_ability:${source}:during_run`,
    side: "runner",
    type: "activated_card_ability",
    label: "Use run ability",
    source,
    payload,
  } as unknown as LegalAction;
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverIce", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

describe("runner during-run CardImplementation actions", () => {
  it("returns no actions and does not touch runtime without an active run", () => {
    const state = makeState({ activeRun: false });
    let runtimeCalls = 0;
    const host: RunCardImplementationActionHost = {
      state,
      cards: {
        cardInstanceFor: () => undefined,
        definitionFor: () => definition("unused", "Unused"),
        runnerInstalledCardIds: () => ["program_b" as CardInstanceId],
      },
      runtime: {
        pushActivatedActionsForTiming: () => {
          runtimeCalls += 1;
        },
      },
    };

    const result = buildRunnerDuringRunCardImplementationActions(host);

    expect(result).toEqual({ handled: true, legalActions: [] });
    expect(runtimeCalls).toBe(0);
  });

  it("delegates installed runner cards in stable sorted source order", () => {
    const state = makeState();
    const calls: string[] = [];
    const definitions: Record<string, CardDefinition> = {
      program_a: definition("program_a_definition", "Program A"),
      program_b: definition("program_b_definition", "Program B"),
    };
    const host: RunCardImplementationActionHost = {
      state,
      cards: {
        cardInstanceFor: () => undefined,
        definitionFor: (cardId) => definitions[cardId]!,
        runnerInstalledCardIds: () => [
          "program_b" as CardInstanceId,
          "program_a" as CardInstanceId,
        ],
      },
      runtime: {
        pushActivatedActionsForTiming: (
          legalActions,
          side,
          sourceCardId,
          cardDefinition,
          timing,
        ) => {
          calls.push(
            `${side}:${sourceCardId}:${cardDefinition.id}:${timing}`,
          );
          legalActions.push(
            action(sourceCardId, {
              sourceDefinitionId: cardDefinition.id,
              cardImplementationAbilityTiming: timing,
            }),
          );
        },
      },
    };

    const result = buildRunnerDuringRunCardImplementationActions(host);

    expect(calls).toEqual([
      "runner:program_a:program_a_definition:during_run",
      "runner:program_b:program_b_definition:during_run",
    ]);
    expect(result.legalActions.map((legalAction) => legalAction.source)).toEqual([
      "program_a",
      "program_b",
    ]);
    expect(result.legalActions[0]?.payload).toEqual({
      sourceDefinitionId: "program_a_definition",
      cardImplementationAbilityTiming: "during_run",
    });
  });

  it("does not mutate host state while building actions", () => {
    const state = makeState();
    const before = JSON.stringify(state);
    const host: RunCardImplementationActionHost = {
      state,
      cards: {
        cardInstanceFor: () => undefined,
        definitionFor: () => definition("program_a_definition", "Program A"),
        runnerInstalledCardIds: () => ["program_a" as CardInstanceId],
      },
      runtime: {
        pushActivatedActionsForTiming: (
          legalActions,
          _side,
          sourceCardId,
        ) => {
          legalActions.push(
            action(sourceCardId, {
              sourceDefinitionId: "program_a_definition",
            }),
          );
        },
      },
    };

    const result = buildRunnerDuringRunCardImplementationActions(host);

    expect(result.legalActions).toHaveLength(1);
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe("corp encounter CardImplementation actions", () => {
  it("returns no actions outside the encounter timing point", () => {
    const state = makeState();
    state.timingPoint = "runner_action.main";
    const host: RunCardImplementationActionHost = {
      state,
      cards: {
        cardInstanceFor: () =>
          instance("ice_1" as CardInstanceId, "ice_definition"),
        definitionFor: () => definition("ice_definition", "Encounter ICE"),
        runnerInstalledCardIds: () => [],
      },
      runtime: {
        pushActivatedActionsForTiming: () => {
          throw new Error("runtime should not be called");
        },
      },
    };

    expect(buildCorpEncounterCardImplementationActions(host)).toEqual({
      handled: true,
      legalActions: [],
    });
  });

  it("delegates rezzed corp encountered ICE with corp_encounter timing", () => {
    const iceId = "ice_1" as CardInstanceId;
    const state = makeState();
    state.run = {
      ...state.run!,
      encounteredIceId: iceId,
      phase: "encounter_ice",
    };
    const calls: string[] = [];
    const host: RunCardImplementationActionHost = {
      state,
      cards: {
        cardInstanceFor: () => instance(iceId, "ice_definition"),
        definitionFor: () => definition("ice_definition", "Encounter ICE"),
        runnerInstalledCardIds: () => [],
      },
      runtime: {
        pushActivatedActionsForTiming: (
          legalActions,
          side,
          sourceCardId,
          cardDefinition,
          timing,
        ) => {
          calls.push(`${side}:${sourceCardId}:${cardDefinition.id}:${timing}`);
          legalActions.push(
            action(sourceCardId, {
              sourceDefinitionId: cardDefinition.id,
              cardImplementationAbilityTiming: timing,
            }),
          );
        },
      },
    };

    const result = buildCorpEncounterCardImplementationActions(host);

    expect(calls).toEqual(["corp:ice_1:ice_definition:corp_encounter"]);
    expect(result.legalActions).toHaveLength(1);
  });
});
