import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import {
  startRun,
  type RunCoreExecutionHost,
  type StartRunOptions,
} from "./run-core-execution";
import type { RunAccessTransitionHost } from "./run-access-transition";

const INNER_ICE_ID = "ice_inner" as CardInstanceId;
const OUTER_ICE_ID = "ice_outer" as CardInstanceId;

function instance(
  id: CardInstanceId,
  definitionId = id,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone:
      options.zone ?? { side: "corp", zone: "serverIce", serverId: "hq" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function definition(id: string): CardDefinition {
  return {
    id,
    title: id,
    side: id.startsWith("runner") ? "runner" : "corp",
    type: id.includes("ice") ? "ice" : "resource",
  } as CardDefinition;
}

function makeState(): GameState {
  const servers: CorpServer[] = [
    {
      id: "hq",
      kind: "hq",
      label: "HQ",
      ice: [INNER_ICE_ID, OUTER_ICE_ID],
      root: [],
    } as CorpServer,
    {
      id: "rd",
      kind: "rd",
      label: "R&D",
      ice: [OUTER_ICE_ID],
      root: [],
    } as CorpServer,
    {
      id: "remote_1",
      kind: "remote",
      label: "Data Fort 1",
      ice: [OUTER_ICE_ID],
      root: [],
    } as CorpServer,
  ];

  return {
    stateVersion: 41,
    activeSide: "runner",
    phase: "runner_main",
    timingPoint: "runner.main",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 3,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 6,
      badPublicity: 1,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers,
    },
    cardInstances: {
      [INNER_ICE_ID]: instance(INNER_ICE_ID, "inner_ice"),
      [OUTER_ICE_ID]: instance(OUTER_ICE_ID, "outer_ice"),
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function action(state: GameState): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "start_run",
    "Run",
    "game_rule",
    [],
    {},
  );
}

function hostFor(state: GameState): {
  host: RunCoreExecutionHost;
  calls: string[];
} {
  const calls: string[] = [];
  const mustServer = (
    serverId: Exclude<ServerId, "new_remote"> | string,
  ): CorpServer => {
    const server = state.corp.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) throw new Error(`Server fehlt: ${serverId}`);
    return server;
  };
  const cardInstanceFor = (cardId: CardInstanceId): CardInstance => {
    const card = state.cardInstances[cardId];
    if (!card) throw new Error(`Card fehlt: ${cardId}`);
    return card;
  };

  return {
    calls,
    host: {
      state,
      servers: {
        mustServer,
      },
      turn: {
        ensureRunnerTurnFlags: () => {
          state.runnerTurnFlags ??= { runAttemptsThisTurn: 0 } as NonNullable<
            GameState["runnerTurnFlags"]
          >;
          return state.runnerTurnFlags;
        },
      },
      access: {
        breachStateHost: () => ({
          state,
          cards: {
            definitionFor: (cardId) => definition(cardInstanceFor(cardId).definitionId),
            cardInstanceFor,
          },
          servers: {
            mustServer,
          },
          rng: {
            nextRandom: () => 0,
          },
        }),
        runAccessTransitionHost: () =>
          ({
            state,
          }) as RunAccessTransitionHost,
      },
      run: {
        movementHost: () => ({
          state,
          cards: {
            definitionFor: (cardId) => definition(cardInstanceFor(cardId).definitionId),
            cardInstanceFor,
          },
          servers: {
            mustServer,
            publicServerLabel: (serverId) => mustServer(serverId).label,
          },
          rules: {
            isV097OrLater: () => true,
            corpRunRootRezActionsAvailable: () => false,
            approachIceExposeCanBeOfferedForCurrentIce: () => false,
          },
          encounter: {
            encounterResolutionHost: () => ({}) as never,
            encounterSpecialWindowHost: () => ({}) as never,
            beginEncounter: (iceId) => {
              calls.push(`beginEncounter:${iceId}`);
              if (!state.run) throw new Error("Run fehlt.");
              state.run.phase = "encounter_ice";
              state.run.encounteredIceId = iceId;
              state.timingPoint = "run.encounter_ice";
            },
          },
          access: {
            startAccessFromSuccessfulRun: () => calls.push("access"),
          },
          cleanup: {
            finishRun: () => calls.push("finishRun"),
          },
        }),
      },
      rules: {
        isV099OrLater: () => true,
      },
      callbacks: {
        executeCardImplementationRunnerRunStartEffects: () =>
          calls.push("cardImplementationRunStart"),
        applyRunnerTraceCounterRunStartEffects: () =>
          calls.push("traceCounterRunStart"),
        applyAiBoonRunStart: () => calls.push("aiBoonRunStart"),
        openCorpStartOfRunRedirectWindow: () => false,
      },
    },
  };
}

describe("run-core-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./run-core-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it.each([
    ["hq" as const, 1],
    ["rd" as const, 0],
    ["remote_1" as Exclude<ServerId, "new_remote">, 0],
  ])("starts a run against %s at the outermost ICE", (serverId, iceIndex) => {
    const state = makeState();
    const { host, calls } = hostFor(state);
    const legalAction = action(state);

    startRun(host, serverId, undefined, 2, undefined, legalAction);

    expect(state.phase).toBe("run");
    expect(state.activeSide).toBe("runner");
    expect(state.runnerTurnFlags?.runAttemptsThisTurn).toBe(1);
    expect(state.run).toMatchObject({
      runId: "run_42",
      attackedServerId: serverId,
      phase: "encounter_ice",
      position: { kind: "ice", serverId, iceIndex },
      approachedIceId: OUTER_ICE_ID,
      encounteredIceId: OUTER_ICE_ID,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 2,
      badPublicityCredits: 1,
    });
    expect(legalAction.payload).toMatchObject({
      serverId,
      baseAccessCount: 2,
      installedAccessBonus: 0,
      effectiveAccessCount: 2,
    });
    expect(calls).toEqual([
      "cardImplementationRunStart",
      "traceCounterRunStart",
      "aiBoonRunStart",
      `beginEncounter:${OUTER_ICE_ID}`,
    ]);
  });

  it("preserves start-run option payload and cloned run-scoped credit markers", () => {
    const state = makeState();
    const { host } = hostFor(state);
    const legalAction = action(state);
    const temporaryCredits = {
      sourceDefinitionId: "runner_credit_source",
      remaining: 3,
      returnUnusedAtRunEnd: true,
    } as NonNullable<StartRunOptions["runnerRunTemporaryCredits"]>;
    const options: StartRunOptions = {
      successfulRunCreditLoss: 2,
      successfulRunRunnerCreditGain: 1,
      successfulRunSourceCardId: "source_card" as CardInstanceId,
      successfulRunSourceDefinitionId: "source_definition",
      successfulRunSourceTitle: "Source",
      runTraceLinkBonus: 2,
      runTraceLinkBonusSourceDefinitionId: "link_source",
      runnerRunTemporaryCredits: temporaryCredits,
    };

    startRun(host, "hq", 4, 1, options, legalAction);

    expect(state.run).toMatchObject({
      pendingSuccessBonusCredits: 4,
      successfulRunCreditLoss: 2,
      successfulRunRunnerCreditGain: 1,
      successfulRunSourceCardId: "source_card",
      successfulRunSourceDefinitionId: "source_definition",
      successfulRunSourceTitle: "Source",
      runTraceLinkBonus: 2,
      runTraceLinkBonusSourceDefinitionId: "link_source",
      runnerRunTemporaryCredits: temporaryCredits,
    });
    expect(state.run?.runnerRunTemporaryCredits).not.toBe(temporaryCredits);
  });

  it("fails clearly when required host groups are absent", () => {
    expect(() =>
      startRun({} as RunCoreExecutionHost, "hq"),
    ).toThrow("RunCoreExecutionHost missing group: state");
  });
});
