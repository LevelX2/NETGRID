import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  CounterType,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  clearEncounterTemporaryTraceCredits,
  handleRunEndCleanup,
  recordDupreBreakUsage,
  resolvePattelsVirusCounterChoice,
  type RunEndCleanupHost,
} from "./run-end-cleanup";

function definition(id: string, type: CardDefinition["type"]): CardDefinition {
  return { id: id as CardDefinitionId, title: id, type } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: options.owner ?? (zone.side === "runner" ? "runner" : "corp"),
    controller: options.controller ?? (zone.side === "runner" ? "runner" : "corp"),
    zone,
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    counters: options.counters,
    selectedServerId: options.selectedServerId,
    ...options,
  } as CardInstance;
}

function makeHost(options: {
  run?: GameState["run"];
  runnerPrograms?: CardInstanceId[];
  corpRoot?: CardInstanceId[];
  instances?: Record<string, CardInstance>;
  definitions?: Record<string, CardDefinition>;
  tokyoSourceIds?: CardInstanceId[];
  tokyoAmount?: number;
  dupreSourceIds?: CardInstanceId[];
} = {}): {
  host: RunEndCleanupHost;
  state: GameState;
  legalAction: LegalAction;
  damageCalls: Array<{ sourceDefinitionId: CardDefinitionId; amount: number }>;
  resetBreakerStrengthCount: () => number;
  cleanupDelayedCount: () => number;
} {
  const definitions: Record<string, CardDefinition> = {
    ice_def: definition("ice_def", "ice"),
    dupre_def: definition("dupre_def", "program"),
    tokyo_def: definition("tokyo_def", "upgrade"),
    lucidrine_def: definition("lucidrine_def", "operation"),
    ...(options.definitions ?? {}),
  };
  const instances: Record<string, CardInstance> = {
    ice_1: instance(
      "ice_1",
      "ice_def",
      { side: "corp", zone: "serverIce", serverId: "remote_1" } as CardInstance["zone"],
      { rezzed: true, faceup: true },
    ),
    dupre: instance(
      "dupre",
      "dupre_def",
      { side: "runner", zone: "rig" },
      { counters: { power: 2 }, selectedServerId: "remote_0" },
    ),
    tokyo: instance(
      "tokyo",
      "tokyo_def",
      { side: "corp", zone: "serverRoot", serverId: "remote_1" } as CardInstance["zone"],
      { rezzed: true, faceup: true },
    ),
    ...(options.instances ?? {}),
  };
  const servers = [
    {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: ["ice_1"],
      root: options.corpRoot ?? ["tokyo"],
    },
    { id: "hq", kind: "hq", ice: [], root: [] },
    { id: "rd", kind: "rd", ice: [], root: [] },
    { id: "archives", kind: "archives", ice: [], root: [] },
  ] as unknown as CorpServer[];
  const state = {
    stateVersion: 7,
    phase: "run",
    timingPoint: "run.successful",
    activeSide: "runner",
    runner: {
      credits: 5,
      tags: 0,
      rig: {
        programs: options.runnerPrograms ?? ["dupre"],
        hardware: [],
        resources: [],
      },
      scoreArea: [],
    },
    corp: {
      credits: 4,
      hq: [],
      rd: [],
      archives: [],
      servers,
    },
    cardInstances: instances,
    run:
      options.run ??
      ({
        runId: "run_1",
        attackedServerId: "remote_1",
        phase: "movement",
        position: { kind: "server", serverId: "remote_1" },
      } as unknown as NonNullable<GameState["run"]>),
  } as unknown as GameState;
  let resetBreakerStrengthCount = 0;
  let cleanupDelayedCount = 0;
  const damageCalls: Array<{ sourceDefinitionId: CardDefinitionId; amount: number }> = [];
  const legalAction = { payload: {} } as LegalAction;
  const tokyoSourceIds = new Set(options.tokyoSourceIds ?? ["tokyo"]);
  const dupreSourceIds = new Set(options.dupreSourceIds ?? ["dupre"]);
  const host: RunEndCleanupHost = {
    state,
    cards: {
      definitionFor: (cardId) => {
        const found = definitions[instances[cardId]?.definitionId ?? ""];
        if (!found) throw new Error(`missing definition ${cardId}`);
        return found;
      },
      cardInstanceFor: (cardId) => {
        const found = instances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
      withoutVariableIceState: (card) => {
        const { variableIceState: _ignored, ...rest } =
          card as CardInstance & { variableIceState?: unknown };
        return rest as CardInstance;
      },
    },
    servers: {
      mustServer: (serverId) => {
        const found = servers.find((server) => server.id === serverId);
        if (!found) throw new Error(`missing server ${serverId}`);
        return found;
      },
      publicServerLabel: (serverId) =>
        servers.find((server) => server.id === serverId)?.label,
    },
    runner: {
      ensureTurnFlags: () => {
        state.runnerTurnFlags ??= {
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
        } as NonNullable<GameState["runnerTurnFlags"]>;
        return state.runnerTurnFlags;
      },
      consumeFutureActionDebt: () => undefined,
    },
    choices: {
      selectedChoiceIds: (selectedChoices) => {
        const raw = (selectedChoices as { selectedOptionIds?: unknown } | undefined)
          ?.selectedOptionIds;
        return Array.isArray(raw)
          ? raw.filter((value): value is string => typeof value === "string")
          : [];
      },
    },
    credits: {
      gainRunner: (amount) => {
        state.runner.credits += amount;
      },
      gainCorp: (amount) => {
        state.corp.credits += amount;
      },
    },
    damage: {
      dealUnpreventableCoreDamage: (_run, sourceDefinitionId, amount) => {
        damageCalls.push({ sourceDefinitionId, amount });
        return {
          damageType: "core",
          amount,
          cardsTrashed: 0,
          flatline: false,
          coreDamageAfter: amount,
          runnerMaxHandSizeAfter: 5 - amount,
        };
      },
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        Math.max(0, Math.floor(instances[cardId]?.counters?.[counterType] ?? 0)),
      setCardCounter: (cardId, counterType, amount) => {
        instances[cardId] = {
          ...instances[cardId]!,
          counters: {
            ...(instances[cardId]?.counters ?? {}),
            [counterType]: amount,
          },
        };
        state.cardInstances[cardId] = instances[cardId]!;
      },
      addCardCounter: (cardId, counterType, amount) => {
        const current =
          Math.max(0, Math.floor(instances[cardId]?.counters?.[counterType] ?? 0));
        instances[cardId] = {
          ...instances[cardId]!,
          counters: {
            ...(instances[cardId]?.counters ?? {}),
            [counterType]: current + amount,
          },
        };
        state.cardInstances[cardId] = instances[cardId]!;
      },
      addVirusCounterWithDisinfectantPrevention: (cardId, amount) => {
        host.counters.addCardCounter(cardId, "virus" as CounterType, amount);
        return amount;
      },
      preventOneVirusCounterWithDisinfectant: () => ({
        prevented: false,
        creditsPaid: 0,
      }),
      poxCountersForServer: () => 0,
    },
    ice: {
      icebreakerHasSpecial: (breakerId) => dupreSourceIds.has(breakerId),
    },
    virus: {
      installedRunnerVirusSourceIds: () => [],
      virusCounterImplementationForCard: () => undefined,
    },
    aftermath: {
      tokyoUnsuccessfulRunAmountForCard: (cardId) =>
        tokyoSourceIds.has(cardId) ? (options.tokyoAmount ?? 2) : undefined,
      isTokyoUnsuccessfulRunSource: (cardId) => tokyoSourceIds.has(cardId),
    },
    followups: {
      applyBodyweightDataCrecheSuccessfulRun: () => ({ handled: false }),
      cleanupDelayedSuccessfulRunTemporaryIce: () => {
        cleanupDelayedCount += 1;
      },
    },
    cleanup: {
      cleanupEmptyRemotes: () => {
        resetBreakerStrengthCount += 1;
      },
    },
  };
  return {
    host,
    state,
    legalAction,
    damageCalls,
    resetBreakerStrengthCount: () => resetBreakerStrengthCount,
    cleanupDelayedCount: () => cleanupDelayedCount,
  };
}

describe("run end cleanup", () => {
  it("returns run temporary credits and applies Lucidrine-style run-end core damage", () => {
    const fixture = makeHost({
      run: {
        runId: "run_lucidrine",
        attackedServerId: "remote_1",
        phase: "movement",
        position: { kind: "server", serverId: "remote_1" },
        runnerRunTemporaryCredits: {
          amount: 9,
          remaining: 4,
          returnUnusedAtRunEnd: true,
          sourceDefinitionId: "lucidrine_def",
        },
        unpreventableCoreDamageAtRunEnd: {
          amount: 1,
          sourceDefinitionId: "lucidrine_def",
        },
      } as unknown as NonNullable<GameState["run"]>,
    });

    const result = handleRunEndCleanup(fixture.host, false, fixture.legalAction);

    expect(result).toMatchObject({
      handled: true,
      returnedTemporaryCredits: 4,
      damageAmount: 1,
      damageType: "core",
      unpreventableDamage: true,
      stateChanged: true,
    });
    expect(fixture.damageCalls).toEqual([
      { sourceDefinitionId: "lucidrine_def", amount: 1 },
    ]);
    expect(fixture.legalAction.payload).toMatchObject({
      temporaryRunCreditsReturned: 4,
      temporaryRunCreditsRemaining: 0,
      damageCannotBePrevented: true,
      damageResolved: true,
      damageType: "core",
      damageAmount: 1,
      coreDamageAfter: 1,
    });
    expect(fixture.state.run).toBeUndefined();
    expect(fixture.state.phase).toBe("runner_action_phase");
    expect(fixture.state.timingPoint).toBe("runner_action.main");
  });

  it("starts the All-Nighter post-run bridge after successful or unsuccessful runs", () => {
    for (const successful of [true, false]) {
      const fixture = makeHost({
        run: {
          runId: `run_all_nighter_${successful}`,
          attackedServerId: "remote_1",
          phase: "movement",
          position: { kind: "server", serverId: "remote_1" },
          grantAllNighterBonusRunOnFinish: true,
        } as unknown as NonNullable<GameState["run"]>,
      });

      const result = handleRunEndCleanup(
        fixture.host,
        successful,
        fixture.legalAction,
      );

      expect(result.followupRunChoiceStarted).toBe(true);
      expect(fixture.state.runnerTurnFlags?.allNighterBonusRunPending).toBe(true);
    }
  });

  it("derezzes Olivia Salazar temporary rezzed ICE at run end", () => {
    const fixture = makeHost({
      run: {
        runId: "run_olivia",
        attackedServerId: "remote_1",
        phase: "movement",
        position: { kind: "server", serverId: "remote_1" },
        oliviaSalazarTemporaryRezzedIceIds: ["ice_1"],
      } as unknown as NonNullable<GameState["run"]>,
    });

    const result = handleRunEndCleanup(fixture.host, false, fixture.legalAction);

    expect(result.derezCardIds).toEqual(["ice_1"]);
    expect(fixture.state.cardInstances.ice_1?.rezzed).toBe(false);
    expect(fixture.state.cardInstances.ice_1?.faceup).toBe(false);
    expect(fixture.legalAction.payload).toMatchObject({
      oliviaSalazarRunEndDerez: true,
      derezzedCount: 1,
    });
  });

  it("applies Dupré run-end counters and resets fort binding on fort change", () => {
    const fixture = makeHost({
      run: {
        runId: "run_dupre",
        attackedServerId: "remote_1",
        phase: "movement",
        position: { kind: "server", serverId: "remote_1" },
        dupreUsedBreakerIdsThisRun: ["dupre"],
      } as unknown as NonNullable<GameState["run"]>,
    });

    const result = handleRunEndCleanup(fixture.host, false, fixture.legalAction);

    expect(result.placedCounters).toBe(1);
    expect(fixture.state.cardInstances.dupre?.selectedServerId).toBe("remote_1");
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(1);
  });

  it("records Dupré usage during the run and resolves Pattel's Virus choices through stable pending-choice fields", () => {
    const fixture = makeHost({
      run: {
        runId: "run_dupre_record",
        attackedServerId: "remote_1",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      } as unknown as NonNullable<GameState["run"]>,
    });

    recordDupreBreakUsage(fixture.host, "dupre");

    expect(fixture.state.run?.dupreUsedBreakerIdsThisRun).toEqual(["dupre"]);
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(0);

    fixture.state.pendingChoice = {
      choiceId: "v181_pattels_virus_8",
      side: "runner",
      source: "v181.pattels_virus:ice_1:8:amount=2",
      prompt: "Pattel's Virus: ICE für Virus-Counter wählen.",
      kind: "select_cards",
      options: [
        {
          id: "card_ice_1",
          label: "ice_def",
          publicLabel: "Gebrochenes ICE",
          value: "ice_1",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 8,
      visibility: "public",
    };

    resolvePattelsVirusCounterChoice(
      fixture.host,
      fixture.legalAction,
      {
        side: "runner",
        actionId: "runner.resolve_choice",
        type: "resolve_choice",
        selectedChoices: { selectedOptionIds: ["card_ice_1"] },
      } as unknown as Parameters<typeof resolvePattelsVirusCounterChoice>[2],
    );

    expect(fixture.state.pendingChoice).toBeUndefined();
    expect(fixture.state.cardInstances.ice_1?.counters?.virus).toBe(2);
    expect(fixture.legalAction.payload).toMatchObject({
      v181RunnerProgramAbility: "pattels_virus_counter",
      pattelsVirusCounterAdded: 2,
      targetCardDefinitionId: "ice_def",
      remainingCounters: 2,
      choiceVisibility: "public",
    });
  });

  it("applies Tokyo-Chiba unsuccessful-run aftermath without successful-run flags", () => {
    const fixture = makeHost({ tokyoAmount: 3 });

    const result = handleRunEndCleanup(fixture.host, false, fixture.legalAction);

    expect(result.gainedCredits).toBe(3);
    expect(fixture.state.corp.credits).toBe(7);
    expect(fixture.state.runnerTurnFlags?.successfulRunThisTurn).toBeUndefined();
    expect(fixture.legalAction.payload).toMatchObject({
      tokyoChibaInfightingBonus: true,
      sourceDefinitionId: "tokyo_def",
      serverId: "remote_1",
      corpCreditsGained: 3,
      corpCreditsAfter: 7,
      sourceCardId: "tokyo",
    });
  });

  it("clears encounter temporary trace credits with the existing payload fields", () => {
    const run = {
      runId: "run_trace",
      attackedServerId: "remote_1",
      encounterTemporaryTraceCredits: {
        remaining: 2,
        sourceDefinitionId: "trace_pool_def",
      },
    } as unknown as NonNullable<GameState["run"]>;
    const legalAction = { payload: {} } as LegalAction;

    clearEncounterTemporaryTraceCredits(run, legalAction);

    expect(run.encounterTemporaryTraceCredits).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      temporaryCreditsReturned: 2,
      temporaryTraceCreditsSourceDefinitionId: "trace_pool_def",
    });
  });
});
