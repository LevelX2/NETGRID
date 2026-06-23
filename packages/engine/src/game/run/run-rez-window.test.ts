import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import {
  buildCorpApproachActions,
  buildCorpRunRootRezWindowActions,
  handleRunRootRezPostRez,
  passCorpRunRootRezWindow,
  resolveCorpRootRezEffect,
  resolveSpeedTrapRezInterruptChoice,
  startSpeedTrapRezInterruptChoice,
  type RunRezWindowHost,
} from "./run-rez-window";

function instance(
  id: string,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverRoot", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? false,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function definition(
  id: string,
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title: options.title ?? id,
    side: options.side ?? "corp",
    type: options.type ?? "upgrade",
    rezCost: options.rezCost ?? 0,
    ...options,
  } as CardDefinition;
}

function makeState(
  options: {
    iceRezzed?: boolean;
    rootDefinitionId?: string;
    rootRezzed?: boolean;
    runnerProgramDefinitionId?: string;
    timingPoint?: GameState["timingPoint"];
    activeSide?: GameState["activeSide"];
    positionKind?: "ice" | "server";
  } = {},
): GameState {
  const iceId = "ice_1" as CardInstanceId;
  const rootId = "root_1" as CardInstanceId;
  const programId = "program_1" as CardInstanceId;
  const cardInstances: Record<CardInstanceId, CardInstance> = {
    [iceId]: instance(iceId, "simple_barrier_ice", {
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      rezzed: options.iceRezzed ?? false,
    }),
    [rootId]: instance(rootId, options.rootDefinitionId ?? "simple_upgrade", {
      rezzed: options.rootRezzed ?? false,
    }),
  };
  const runnerPrograms: CardInstanceId[] = [];
  if (options.runnerProgramDefinitionId) {
    runnerPrograms.push(programId);
    cardInstances[programId] = instance(
      programId,
      options.runnerProgramDefinitionId,
      {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        rezzed: true,
      },
    );
  }
  return {
    stateVersion: 11,
    activeSide: options.activeSide ?? "corp",
    phase: "run",
    timingPoint: options.timingPoint ?? "run.jack_out_window",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: runnerPrograms, hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: [iceId],
          root: [rootId],
        },
      ],
    },
    cardInstances,
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "movement",
      position:
        options.positionKind === "server"
          ? { kind: "server", serverId: "rd" }
          : { kind: "ice", serverId: "rd", iceIndex: 0 },
      approachedIceId: iceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definitionsFor(state: GameState): Record<string, CardDefinition> {
  const definitions: Record<string, CardDefinition> = {
    simple_barrier_ice: definition("simple_barrier_ice", {
      title: "Simple Barrier ICE",
      type: "ice",
      rezCost: 3,
    }),
    simple_upgrade: definition("simple_upgrade", {
      title: "Simple Upgrade",
      type: "upgrade",
      rezCost: 1,
    }),
    simple_economy_asset: definition("simple_economy_asset", {
      title: "Simple Economy Asset",
      type: "asset",
      rezCost: 0,
    }),
    "onr_v1_067_speed-trap": definition("onr_v1_067_speed-trap", {
      title: "Speed Trap",
      side: "runner",
      type: "program",
    }),
  };
  for (const card of Object.values(state.cardInstances)) {
    definitions[card.definitionId] ??= definition(card.definitionId);
  }
  return definitions;
}

function hostFor(state: GameState): {
  host: RunRezWindowHost;
  calls: {
    continued: LegalAction[];
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
    trashed: CardInstanceId[];
  };
} {
  const definitions = definitionsFor(state);
  const calls: {
    continued: LegalAction[];
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
    trashed: CardInstanceId[];
  } = { continued: [], finish: [], trashed: [] };
  return {
    calls,
    host: {
      state,
      cards: {
        definitionFor: (cardId) =>
          definitions[state.cardInstances[cardId]!.definitionId]!,
        cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
        runnerInstalledProgramIds: () => state.runner.rig.programs,
      },
      servers: {
        mustServer: (serverId) => {
          const server = state.corp.servers.find(
            (candidate) => candidate.id === serverId,
          );
          if (!server) throw new Error(`Server fehlt: ${serverId}`);
          return server as CorpServer;
        },
        publicServerLabel: () => "R&D",
      },
      fortPass: {
        state,
        cards: {
          definitionFor: (cardId) =>
            definitions[state.cardInstances[cardId]!.definitionId]!,
          cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
          publicInstalledCorpCardIdentityKnown: (cardId) =>
            Boolean(
              state.cardInstances[cardId]?.faceup ||
                state.cardInstances[cardId]?.rezzed,
            ),
        },
        servers: {
          mustServer: (serverId) => {
            const server = state.corp.servers.find(
              (candidate) => candidate.id === serverId,
            );
            if (!server) throw new Error(`Server fehlt: ${serverId}`);
            return server as CorpServer;
          },
        },
        payment: {
          spendCorpCredits: (amount) => {
            state.corp.credits -= amount;
          },
        },
      },
      choices: {
        selectedChoiceIds: (selectedChoices) => {
          const raw = selectedChoices?.selectedOptionIds;
          return Array.isArray(raw)
            ? raw.filter((value): value is string => typeof value === "string")
            : [];
        },
      },
      callbacks: {
        canReplaceFortCardsFromHq: () => true,
        continueAfterRootRez: (legalAction) => {
          if (legalAction) calls.continued.push(legalAction);
        },
        finishRun: (successful, legalAction) => {
          calls.finish.push({
            successful,
            ...(legalAction ? { legalAction } : {}),
          });
          delete state.run;
        },
        trashCorpInstalledCardToArchives: (cardId) => {
          calls.trashed.push(cardId);
          state.cardInstances[cardId] = {
            ...state.cardInstances[cardId]!,
            zone: { side: "corp", zone: "archives" },
          };
        },
        activeObligationCount: () =>
          Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0)),
        addActiveObligation: (amount) => {
          state.activeObligationDebtCount =
            Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0)) +
            amount;
        },
      },
    },
  };
}

function legalAction(
  state: GameState,
  side: "corp" | "runner",
  type: LegalAction["type"],
  payload?: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(state, side, type, type, "game_rule", [], payload);
}

function choiceAction(selectedOptionId: string): PlayerAction {
  return {
    matchId: "match_1",
    side: "runner",
    actionId: "choice",
    clientKnownStateVersion: 11,
    selectedChoices: {
      choiceId: "choice",
      selectedOptionIds: [selectedOptionId],
    },
  };
}

describe("run rez window", () => {
  it("builds approach and root rez actions with stable payloads", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      rootRezzed: false,
    });
    const { host } = hostFor(state);

    const actions = buildCorpApproachActions(host);

    expect(actions.map((action) => action.type)).toEqual([
      "rez_ice",
      "decline_rez",
      "rez_ice",
    ]);
    expect(actions[0]?.payload).toMatchObject({
      cardId: "ice_1",
    });
    expect(actions[0]?.costs).toEqual([{ credits: 3 }]);
    expect(actions[1]?.payload).toBeUndefined();
    expect(actions[2]?.payload).toMatchObject({
      cardId: "root_1",
      rootRez: true,
      speedTrapInterruptEligible: true,
      serverId: "rd",
    });
  });

  it("opens and passes the root rez window without changing action ids or payload shape", () => {
    const state = makeState({ rootRezzed: false });
    const { host } = hostFor(state);

    const actions = buildCorpRunRootRezWindowActions(host);
    expect(actions.map((action) => action.type)).toEqual([
      "rez_ice",
      "decline_rez",
    ]);
    expect(actions[1]?.payload).toMatchObject({
      runRootRezPass: true,
      serverId: "rd",
      serverLabel: "R&D",
    });

    const result = passCorpRunRootRezWindow(host, actions[1]!);

    expect(result).toMatchObject({
      handled: true,
      continueAfterRez: true,
      serverId: "rd",
    });
    expect(state.activeSide).toBe("runner");
    expect(state.run?.rootRezWindowPassedKeys).toEqual(["run_1:ice:rd:0"]);
  });

  it("resolves simple root rez effects without generic rez or payment execution", () => {
    const state = makeState({
      rootDefinitionId: "simple_economy_asset",
      rootRezzed: true,
    });
    state.corp.credits = 4;
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_ice", {
      cardId: "root_1",
      rootRez: true,
    });

    const result = resolveCorpRootRezEffect(
      host,
      "root_1" as CardInstanceId,
      action,
    );

    expect(result).toMatchObject({
      handled: true,
      rootEffectResolved: true,
      rezzedCardId: "root_1",
      sourceDefinitionId: "simple_economy_asset",
    });
    expect(state.corp.credits).toBe(7);
    expect(calls.continued).toEqual([]);
    expect(calls.finish).toEqual([]);
  });

  it("continues after root rez when no root effect or Speed Trap window handles it", () => {
    const state = makeState({ rootRezzed: true });
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_ice", {
      cardId: "root_1",
      rootRez: true,
    });

    const result = handleRunRootRezPostRez(
      host,
      "root_1" as CardInstanceId,
      action,
    );

    expect(result).toMatchObject({
      handled: true,
      continueAfterRez: true,
      rezzedCardId: "root_1",
    });
    expect(calls.continued).toEqual([action]);
  });

  it("opens and resolves Speed Trap root-rez interrupt through the run rez window", () => {
    const state = makeState({
      runnerProgramDefinitionId: "onr_v1_067_speed-trap",
      rootRezzed: true,
      positionKind: "server",
    });
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_ice", {
      cardId: "root_1",
      rootRez: true,
    });

    const startResult = startSpeedTrapRezInterruptChoice(
      host,
      "root_1",
      action,
    );

    expect(startResult).toMatchObject({
      handled: true,
      speedTrapChoiceStarted: true,
      sourceDefinitionId: "onr_v1_067_speed-trap",
      sourceCardId: "program_1",
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("v1922.speed_trap:program_1:root_1"),
      kind: "select_option",
      visibility: "public",
    });
    expect(action.payload).toMatchObject({
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      sourceDefinitionId: "onr_v1_067_speed-trap",
      speedTrapSourceCardId: "program_1",
      rezzedCardDefinitionId: "simple_upgrade",
      speedTrapChoiceOpened: true,
    });

    const resolveAction = legalAction(state, "runner", "resolve_choice");
    const result = resolveSpeedTrapRezInterruptChoice(
      host,
      resolveAction,
      choiceAction("jack_out"),
    );

    expect(result).toMatchObject({
      handled: true,
      runnerJackedOut: true,
      speedTrapResolved: true,
      successfulRunWithoutAccess: true,
    });
    expect(calls.finish).toHaveLength(1);
    expect(calls.finish[0]?.successful).toBe(true);
    expect(resolveAction.payload).toMatchObject({
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt",
      speedTrapUsed: true,
      successfulRunWithoutAccess: true,
      rezzedCardDefinitionId: "simple_upgrade",
    });
  });
});
