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
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";

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
  virusImplementations?: Record<string, CardVirusCounterImplementation>;
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
  const virusImplementations = options.virusImplementations ?? {};
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
      addVirusCounterWithCounterPrevention: (cardId, amount) => {
        host.counters.addCardCounter(cardId, "virus" as CounterType, amount);
        return amount;
      },
      preventOneVirusCounterWithCounterPrevention: () => ({
        prevented: false,
        creditsPaid: 0,
      }),
      poxCountersForServer: () => 0,
    },
    ice: {
      icebreakerHasSpecial: (breakerId) => dupreSourceIds.has(breakerId),
    },
    virus: {
      installedRunnerVirusSourceIds: (predicate) =>
        (options.runnerPrograms ?? ["dupre"]).filter((cardId) => {
          const implementation = virusImplementations[cardId];
          return implementation && (!predicate || predicate(implementation));
        }),
      virusCounterImplementationForCard: (cardId) =>
        virusImplementations[cardId],
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
      resolveTestSpinRunEnd: () => ({ handled: false }),
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

describe("multi-server success sequence run-end cleanup", () => {
  it("adds one future action debt on an unsuccessful sequence run without consuming it in the same cleanup", () => {
    const { host, state, legalAction } = makeHost({
      run: {
        runId: "run_pirate",
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        activeSequence: {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1" as CardInstanceId,
          sourceDefinitionId: "onr_proteus_116_pirate-broadcast" as CardDefinitionId,
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: ["archives"],
          successfulServerIds: ["hq"],
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceOnSuccessfulRun: true,
          failOnUnsuccessfulRun: true,
        },
      } as unknown as NonNullable<GameState["run"]>,
    });
    state.runner.clicks = 3;
    let consumed = 0;
    host.runner.addFutureActionDebt = (amount) => {
      const flags = host.runner.ensureTurnFlags();
      flags.forgoNextActionsPending =
        Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + amount;
    };
    host.runner.consumeFutureActionDebt = () => {
      consumed += 1;
    };

    handleRunEndCleanup(host, false, legalAction);

    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);
    expect(consumed).toBe(0);
    expect(state.runner.clicks).toBe(3);
    expect(state.runnerTurnFlags?.pendingSequences).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      multiServerSuccessSequenceFailed: true,
      actionDebtAdded: 1,
    });
  });

  it("keeps the next sequence run pending without consuming existing debt after a successful partial run", () => {
    const { host, state, legalAction } = makeHost({
      run: {
        runId: "run_pirate",
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        activeSequence: {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1" as CardInstanceId,
          sourceDefinitionId: "onr_proteus_116_pirate-broadcast" as CardDefinitionId,
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: ["archives"],
          successfulServerIds: ["hq"],
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceOnSuccessfulRun: true,
          failOnUnsuccessfulRun: true,
        },
      } as unknown as NonNullable<GameState["run"]>,
    });
    state.runner.clicks = 3;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      forgoNextActionsPending: 1,
    } as NonNullable<GameState["runnerTurnFlags"]>;
    let consumed = 0;
    host.runner.consumeFutureActionDebt = () => {
      consumed += 1;
    };

    handleRunEndCleanup(host, true, legalAction);

    expect(consumed).toBe(0);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);
    expect(state.runnerTurnFlags?.pendingSequences?.[0]).toMatchObject({
      pendingServerIds: ["archives"],
      successfulServerIds: ["hq", "rd"],
    });
    expect(legalAction.payload).toMatchObject({
      multiServerSuccessSequenceRunSuccessful: true,
      multiServerSuccessSequencePendingServerCount: 1,
    });
  });
});

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
      expect(fixture.state.runnerTurnFlags?.bonusRunPending).toBe(true);
    }
  });

  it("adds Proteus purgeable Corp-bucket counters after successful central runs", () => {
    const fixture = makeHost({
      run: {
        runId: "run_highlighter",
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["highlighter"],
      instances: {
        highlighter: instance(
          "highlighter",
          "onr_proteus_090_highlighter",
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        onr_proteus_090_highlighter: definition(
          "onr_proteus_090_highlighter",
          "program",
        ),
      },
      virusImplementations: {
        highlighter: {
          counterKind: "highlighter",
          addOnSuccessfulRun: {
            server: "rd",
            target: "corp_purgeable_runner_virus_counter",
            amount: 1,
            visibility: "public",
          },
        },
      },
    });

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      highlighter: 1,
    });
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      runId: "run_highlighter",
      serverId: "rd",
      counterType: "highlighter",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: "onr_proteus_090_highlighter",
    });
  });

  it("adds Cascade as a Corp-bucket counter after successful R&D runs", () => {
    const fixture = makeHost({
      run: {
        runId: "run_cascade",
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["cascade"],
      instances: {
        cascade: instance(
          "cascade",
          "onr_v1_010_cascade",
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        onr_v1_010_cascade: definition("onr_v1_010_cascade", "program"),
      },
      virusImplementations: {
        cascade: {
          counterKind: "cascade",
          addOnSuccessfulRun: {
            server: "rd",
            target: "corp_purgeable_runner_virus_counter",
            amount: 1,
            visibility: "public",
          },
        },
      },
    });

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.cardInstances.cascade?.counters?.virus).toBeUndefined();
    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      cascade: 1,
    });
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      runId: "run_cascade",
      serverId: "rd",
      counterType: "cascade",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: "onr_v1_010_cascade",
    });
    expect(fixture.legalAction.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "counter_change",
        side: "corp",
        counterType: "cascade",
        addedCounterAmount: 1,
        remainingCounters: 1,
        sourceDefinitionId: "onr_v1_010_cascade",
      }),
    );
  });

  it("adds Proteus access-trash counters after matching successful runs", () => {
    const fixture = makeHost({
      run: {
        runId: "run_garbage",
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["garbage"],
      instances: {
        garbage: instance(
          "garbage",
          "onr_proteus_089_garbage-in",
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        "onr_proteus_089_garbage-in": definition(
          "onr_proteus_089_garbage-in",
          "program",
        ),
      },
      virusImplementations: {
        garbage: {
          counterKind: "garbage",
          addOnSuccessfulRun: {
            server: "rd",
            target: "corp_purgeable_runner_virus_counter",
            amount: 1,
            visibility: "public",
          },
        },
      },
    });

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      garbage: 1,
    });
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      serverId: "rd",
      counterType: "garbage",
      sourceCardDefinitionId: "onr_proteus_089_garbage-in",
    });
  });

  it("adds Scaldan purgeable counters after successful HQ runs", () => {
    const fixture = makeHost({
      run: {
        runId: "run_scaldan",
        attackedServerId: "hq",
        phase: "movement",
        position: { kind: "server", serverId: "hq" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["scaldan"],
      instances: {
        scaldan: instance(
          "scaldan",
          "onr_proteus_094_scaldan",
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        onr_proteus_094_scaldan: definition(
          "onr_proteus_094_scaldan",
          "program",
        ),
      },
      virusImplementations: {
        scaldan: {
          counterKind: "scaldan",
          addOnSuccessfulRun: {
            server: "hq",
            target: "corp_purgeable_runner_virus_counter",
            amount: 1,
            visibility: "public",
          },
        },
      },
    });

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      scaldan: 1,
    });
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      runId: "run_scaldan",
      serverId: "hq",
      counterType: "scaldan",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: "onr_proteus_094_scaldan",
    });
  });

  it("adds central socket counters and converts complete Viral Pipeline sets to Pipe", () => {
    const fixture = makeHost({
      run: {
        runId: "run_pipeline",
        attackedServerId: "archives",
        phase: "movement",
        position: { kind: "server", serverId: "archives" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["viral_pipeline"],
      instances: {
        viral_pipeline: instance(
          "viral_pipeline",
          "onr_proteus_099_viral-pipeline",
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        "onr_proteus_099_viral-pipeline": definition(
          "onr_proteus_099_viral-pipeline",
          "program",
        ),
      },
      virusImplementations: {
        viral_pipeline: {
          counterKind: "pipe",
          addOnSuccessfulRun: {
            server: "central",
            target: "central_server_socket_counters",
            amount: 1,
            visibility: "public",
          },
        },
      },
    });
    fixture.state.purgeableRunnerVirusCounters = {
      servers: {
        hq: { socket_hq: 1 },
        rd: { socket_rd: 1 },
      },
    };

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.purgeableRunnerVirusCounters).toMatchObject({
      corp: { pipe: 1 },
    });
    expect(fixture.state.purgeableRunnerVirusCounters?.servers).toBeUndefined();
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      runId: "run_pipeline",
      serverId: "archives",
      counterType: "socket_archives",
      counterDelta: 1,
      counterTotalAfter: 0,
      sourceCardDefinitionId: "onr_proteus_099_viral-pipeline",
      pipeCounterAdded: 1,
      pipeCounterTotalAfter: 1,
    });
    expect(fixture.legalAction.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "counter_change",
          counterType: "socket_archives",
          addedCounterAmount: 1,
          reason: "proteus_runner_virus_successful_run",
          sourceDefinitionId: "onr_proteus_099_viral-pipeline",
        }),
        expect.objectContaining({
          kind: "counter_change",
          counterType: "pipe",
          addedCounterAmount: 1,
          reason: "proteus_runner_virus_successful_run",
          sourceDefinitionId: "onr_proteus_099_viral-pipeline",
        }),
      ]),
    );
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
    expect(fixture.legalAction.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "gain_credits",
        visibility: "public",
        side: "corp",
        amount: 3,
        reason: "unsuccessful_run",
        sourceDefinitionId: "tokyo_def",
        sourceTitle: "tokyo_def",
        serverId: "remote_1",
        serverLabel: "Remote 1",
      }),
    );
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
