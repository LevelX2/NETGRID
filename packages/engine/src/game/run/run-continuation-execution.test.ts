import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
  SubroutineDefinition,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import { encounterResolutionHost } from "./encounter-resolution";
import type { EncounterPrintedEffectHost } from "./encounter-printed-effects";
import type { EncounterPrintedNonTraceHost } from "./encounter-printed-nontrace-effects";
import type { EncounterSpecialWindowHost } from "./encounter-special-windows";
import {
  continueRun,
  type RunContinuationExecutionHost,
} from "./run-continuation-execution";
import type { RunMovementHost } from "./run-movement";
import type { SuccessfulRunInterventionHost } from "./successful-run-interventions";

const ICE_ID = "ice_outer" as CardInstanceId;
const INNER_ICE_ID = "ice_inner" as CardInstanceId;
const BARTMOSS_BREAKER_ID = "bartmoss_breaker" as CardInstanceId;

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

function definitionForId(
  id: string,
  subroutines: readonly SubroutineDefinition[] = [],
): CardDefinition {
  return {
    id,
    title: id,
    side: id.startsWith("runner") ? "runner" : "corp",
    type: id.includes("ice") ? "ice" : "program",
    subroutines,
  } as CardDefinition;
}

function makeState(
  subroutines: readonly SubroutineDefinition[],
  options: {
    phase?: NonNullable<GameState["run"]>["phase"];
    iceIds?: CardInstanceId[];
    positionIceIndex?: number;
    brokenSubroutineIndexes?: number[];
    bartmossUsedBreakerIdsThisEncounter?: CardInstanceId[];
  } = {},
): GameState {
  const iceIds = options.iceIds ?? [ICE_ID];
  const server: CorpServer = {
    id: "hq",
    kind: "hq",
    label: "HQ",
    ice: iceIds,
    root: [],
  } as CorpServer;
  return {
    stateVersion: 7,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 2,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: {
        programs: [BARTMOSS_BREAKER_ID],
        hardware: [],
        resources: [],
      },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [server],
    },
    cardInstances: {
      [ICE_ID]: instance(ICE_ID, "outer_ice"),
      [INNER_ICE_ID]: instance(INNER_ICE_ID, "inner_ice"),
      [BARTMOSS_BREAKER_ID]: instance(BARTMOSS_BREAKER_ID, "runner_bartmoss", {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
      }),
    },
    run: {
      runId: "run_8",
      attackedServerId: "hq",
      phase: options.phase ?? "encounter_ice",
      position:
        options.phase === "access"
          ? { kind: "server", serverId: "hq" }
          : {
              kind: "ice",
              serverId: "hq",
              iceIndex: options.positionIceIndex ?? iceIds.length - 1,
            },
      approachedIceId: ICE_ID,
      encounteredIceId:
        options.phase === "access" ? undefined : ICE_ID,
      brokenSubroutineIndexes: options.brokenSubroutineIndexes ?? [],
      resolvedSubroutineIndexes: [],
      bartmossUsedBreakerIdsThisEncounter:
        options.bartmossUsedBreakerIdsThisEncounter ?? [],
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState & {
    currentSubroutines?: readonly SubroutineDefinition[];
  };
}

function action(): LegalAction {
  return buildLegalAction(
    { stateVersion: 7, timingPoint: "run.encounter_ice" } as GameState,
    "runner",
    "continue_run",
    "Continue",
    "game_rule",
    [],
    {},
  );
}

function hostFor(
  state: GameState,
  subroutines: readonly SubroutineDefinition[],
): {
  host: RunContinuationExecutionHost;
  calls: string[];
} {
  const calls: string[] = [];
  const cardInstanceFor = (cardId: CardInstanceId): CardInstance => {
    const card = state.cardInstances[cardId];
    if (!card) throw new Error(`Card fehlt: ${cardId}`);
    return card;
  };
  const mustServer = (serverId: Exclude<ServerId, "new_remote"> | string) => {
    const server = state.corp.servers.find((candidate) => candidate.id === serverId);
    if (!server) throw new Error(`Server fehlt: ${serverId}`);
    return server;
  };
  const resolutionHost = () => encounterResolutionHost(state);
  const specialWindowHost = (): EncounterSpecialWindowHost => ({ state });
  const printedNonTraceHost = (): EncounterPrintedNonTraceHost => ({
    state,
    cards: {
      definitionFor: (cardId) =>
        definitionForId(cardInstanceFor(cardId).definitionId, subroutines),
    },
    encounter: {
      resolutionHost: resolutionHost(),
    },
    trash: {
      openRunnerInstalledTrashPreventionWindow: () => false,
      trashRunnerInstalledProgram: (cardId) =>
        calls.push(`trashProgram:${cardId}`),
    },
    choices: {
      revealCorpRdTop: () => calls.push("revealCorpRdTop"),
      startCorpRdArrangeChoice: () => calls.push("startCorpRdArrangeChoice"),
    },
  });
  const movementHost = (): RunMovementHost => ({
    state,
    cards: {
      definitionFor: (cardId) =>
        definitionForId(cardInstanceFor(cardId).definitionId, subroutines),
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
      encounterResolutionHost: resolutionHost,
      encounterSpecialWindowHost: specialWindowHost,
      beginEncounter: (iceId) => calls.push(`beginEncounter:${iceId}`),
    },
    access: {
      startAccessFromSuccessfulRun: () => calls.push("access"),
    },
    cleanup: {
      finishRun: (successful) => calls.push(`finishRun:${successful}`),
    },
  });

  return {
    calls,
    host: {
      state,
      cards: {
        definitionFor: (cardId) =>
          definitionForId(cardInstanceFor(cardId).definitionId, subroutines),
      },
      encounter: {
        currentSubroutines: () => subroutines,
        resolutionHost,
        printedEffectHost: () => ({ state } as EncounterPrintedEffectHost),
        printedNonTraceHost,
        specialWindowHost,
        successfulRunInterventionHost: () =>
          ({ state }) as SuccessfulRunInterventionHost,
      },
      movement: {
        host: movementHost,
      },
      damage: {
        dealDamage: () => ({
          damageType: "net",
          amount: 0,
          cardsTrashed: 0,
          flatline: false,
        }),
        setDamagePayload: () => calls.push("setDamagePayload"),
      },
      cleanup: {
        resetBreakerStrength: () => calls.push("resetBreakerStrength"),
      },
      callbacks: {
        finishRun: (successful) => calls.push(`finishRun:${successful}`),
        icebreakerHasBartmossPostEncounterSelfTrashCheck: () => true,
        rollDeterministicDie: () => 1,
        trashRunnerInstalledProgram: (breakerId) =>
          calls.push(`trashRunnerInstalledProgram:${breakerId}`),
      },
    },
  };
}

describe("run-continuation-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./run-continuation-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("finishes a run successfully when continuation is requested during access", () => {
    const subroutines: SubroutineDefinition[] = [];
    const state = makeState(subroutines, { phase: "access" });
    const { host, calls } = hostFor(state, subroutines);

    continueRun(host, action());

    expect(calls).toEqual(["finishRun:true"]);
  });

  it("resolves an unbroken end-the-run subroutine through existing nontrace handling", () => {
    const subroutines: SubroutineDefinition[] = [
      { id: "etr", type: "end_the_run" } as SubroutineDefinition,
    ];
    const state = makeState(subroutines);
    const legalAction = action();
    const { host, calls } = hostFor(state, subroutines);

    continueRun(host, legalAction);

    expect(calls).toEqual(["resetBreakerStrength", "finishRun:false"]);
    expect(legalAction.resolvedEffects).toBeDefined();
  });

  it("moves past fully handled ICE and keeps Bartmoss post-encounter behavior", () => {
    const subroutines: SubroutineDefinition[] = [
      { id: "etr", type: "end_the_run" } as SubroutineDefinition,
    ];
    const state = makeState(subroutines, {
      brokenSubroutineIndexes: [0],
      bartmossUsedBreakerIdsThisEncounter: [BARTMOSS_BREAKER_ID],
    });
    const legalAction = action();
    const { host, calls } = hostFor(state, subroutines);

    continueRun(host, legalAction);

    expect(state.run).toMatchObject({
      phase: "movement",
      position: { kind: "server", serverId: "hq" },
    });
    expect(calls).toEqual([
      "resetBreakerStrength",
      `trashRunnerInstalledProgram:${BARTMOSS_BREAKER_ID}`,
    ]);
    expect(legalAction.payload).toMatchObject({
      bartmossPostEncounterChecked: true,
      bartmossPostEncounterOutcomes: `${BARTMOSS_BREAKER_ID}:1:trashed`,
    });
  });

  it("fails clearly when required host groups are absent", () => {
    expect(() =>
      continueRun({} as RunContinuationExecutionHost),
    ).toThrow("RunContinuationExecutionHost missing group: state");
  });
});
