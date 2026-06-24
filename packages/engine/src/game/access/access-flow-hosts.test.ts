import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createAccessFlowAdapters,
  type AccessFlowCompositionHost,
} from "./access-flow-hosts";

const CARD_ID = "accessed_card" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 2,
    activeSide: "runner",
    phase: "run",
    timingPoint: "access.resolve_card",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 1,
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
      hq: [CARD_ID],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "hq",
          kind: "hq",
          label: "HQ",
          ice: [],
          root: [],
        } as CorpServer,
      ],
    },
    cardInstances: {
      [CARD_ID]: {
        id: CARD_ID,
        definitionId: "agenda",
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
        advancementCounters: 0,
      } as unknown as CardInstance,
    },
    run: {
      runId: "run_3",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definition(type: CardDefinition["type"] = "agenda"): CardDefinition {
  return {
    id: "agenda",
    title: "Agenda",
    side: "corp",
    type,
    subtypes: [],
    implementationStatus: "implemented",
    rulesText: "",
    mechanics: [],
  } as unknown as CardDefinition;
}

function hostFor(calls: string[]): AccessFlowCompositionHost {
  const fake = state();
  const server = fake.corp.servers[0] as CorpServer;

  return {
    cards: {
      definitionFor: () => definition(),
      cardInstanceFor: () => fake.cardInstances[CARD_ID] as CardInstance,
      cardHasSubtype: () => false,
      accessEffectsForDefinition: () => [],
      hiddenReplacementLongtailKindForDefinition: () => undefined,
    },
    servers: {
      mustServer: (_state, serverId) => {
        calls.push(`mustServer:${serverId}`);
        return server;
      },
      randomHqAccess: () => {
        calls.push("randomHqAccess");
        return CARD_ID;
      },
    },
    run: {
      finishRun: (_state, successful) => calls.push(`finishRun:${successful}`),
      successfulRunProgramActions: () => [],
      runnerDuringRunCardImplementationLegalActions: () => [],
      hiddenStackInstallRunActions: () => [],
      startPostAccessInstalledProgramChoice: () => false,
    },
    damage: {
      resolveDamageOperation: () => calls.push("resolveDamageOperation"),
      doDamage: () => ({
        damageType: "net",
        amount: 0,
        cardsTrashed: 0,
        flatline: false,
      }),
      setDamagePayload: () => calls.push("setDamagePayload"),
    },
    tags: {
      addRunnerTagsWithPrevention: () => calls.push("addRunnerTags"),
    },
    trace: {
      startTraceFromOperation: () => calls.push("startTrace"),
      traceSuccessEffectForCardImplementation: () => undefined,
    },
    payment: {
      spendCredits: (_state, side, amount) =>
        calls.push(`spendCredits:${side}:${amount}`),
      hostedPaymentCredits: () => 0,
      restrictedHostedCreditSourceIds: () => [],
      isRestrictedHostedCreditSource: () => false,
      spendRunnerAccessTrashCredits: () => ({
        recurringSpent: 0,
        runnerCreditsSpent: 0,
      }),
    },
    counters: {
      cardCounter: () => 0,
      addCardCounter: () => undefined,
      addCounterToAllInstalledRunnerIcebreakers: () => ({
        amount: 0,
        counterType: "virus",
        countersAfter: 0,
        publicPayload: {},
      }),
    },
    zones: {
      removeFromAllZones: () => calls.push("removeFromAllZones"),
      ensureSpecialZones: () =>
        ({ removedFromGame: [], setAside: [] }) as unknown as ReturnType<
          AccessFlowCompositionHost["zones"]["ensureSpecialZones"]
        >,
      trashCorpInstalledCardToArchives: () => calls.push("trashCorp"),
      trashRunnerInstalledCardToHeap: () => calls.push("trashRunner"),
      shuffleCorpCardIntoRd: () => ({ publicPayload: {} }),
      returnRunnerInstalledProgramsToGripForAccess: () => ({
        publicPayload: {},
      }),
    },
    choices: {
      openRunnerInstalledTrashPreventionWindow: () => false,
    },
    turn: {
      ensureRunnerTurnFlags: (targetState) => {
        calls.push("ensureRunnerTurnFlags");
        targetState.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
        };
        return targetState.runnerTurnFlags;
      },
    },
    random: {
      nextRandom: () => 0,
    },
    callbacks: {
      agendaPointsForScoredCard: () => 1,
      snapshotPersistentStealCostModifiersForSource: () =>
        calls.push("snapshotStealCost"),
      archivesAccessRequiresDecisionOrEffect: () => false,
      installedRevealHelperCount: () => 0,
    },
    constants: {
      setup: "setup",
      trap: "trap",
      crybaby: "crybaby",
      taggedRunnerMeatDamageUpgrade: "drt",
      accessNetDamageUpgrade: "dieter",
      oncePerRunAccessTraceUpgrade: "turbeau",
      hardwareTrashByAdvancementAsset: "shattered",
      programTrashByAdvancementAsset: "experimental",
      advancementCoreDamageAsset: "soulkiller",
      advancementNetDamageAsset: "virus",
      chimera: "chimera",
    },
  } as AccessFlowCompositionHost;
}

describe("access-flow-hosts", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./access-flow-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("creates the expected access composition adapters", () => {
    const adapters = createAccessFlowAdapters(hostFor([]));

    expect(Object.keys(adapters).sort()).toEqual([
      "accessEffectHandlerHost",
      "accessFlowHost",
      "breachStateHost",
      "runnerAccessActionHost",
    ]);
  });

  it("wires access flow, action, effect, and breach hosts through grouped callbacks", () => {
    const calls: string[] = [];
    const adapters = createAccessFlowAdapters(hostFor(calls));
    const targetState = state();
    const legalAction = { type: "access_card", payload: {} } as LegalAction;

    adapters.breachStateHost(targetState).servers.mustServer("hq");
    adapters.runnerAccessActionHost(targetState).servers.mustServer("hq");
    adapters.accessFlowHost(targetState).servers.randomHqAccess();
    adapters.accessFlowHost(targetState).runner.ensureTurnFlags();
    adapters.accessEffectHandlerHost(targetState, legalAction).payment.spendCorpCredits(2);

    expect(calls).toEqual([
      "mustServer:hq",
      "mustServer:hq",
      "randomHqAccess",
      "ensureRunnerTurnFlags",
      "spendCredits:corp:2",
    ]);
  });

  it("fails clearly when required host groups are absent", () => {
    expect(() => createAccessFlowAdapters({} as AccessFlowCompositionHost)).toThrow(
      "AccessFlowCompositionHost missing group: cards",
    );
  });
});
