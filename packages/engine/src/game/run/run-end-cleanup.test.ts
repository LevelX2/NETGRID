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
  recordFortBoundBreakerUsage,
  recordRunEndTrashBreakerUsage,
  resumeRunEndTrashUsedBreakers,
  resolveBrokenIceVirusCounterChoice,
  type RunEndCleanupHost,
} from "./run-end-cleanup";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";

function definition(
  id: number,
  type: CardDefinition["type"],
  title = String(id),
): CardDefinition {
  return { id: id as CardDefinitionId, title, type } as CardDefinition;
}

function instance(
  id: string,
  definitionId: number,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: options.owner ?? (zone.side === "runner" ? "runner" : "corp"),
    controller:
      options.controller ?? (zone.side === "runner" ? "runner" : "corp"),
    zone,
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    counters: options.counters,
    selectedServerId: options.selectedServerId,
    ...options,
  } as CardInstance;
}

function makeHost(
  options: {
    run?: GameState["run"];
    runnerPrograms?: CardInstanceId[];
    corpRoot?: CardInstanceId[];
    instances?: Record<string, CardInstance>;
    definitions?: Record<string, CardDefinition>;
    tokyoSourceIds?: CardInstanceId[];
    tokyoAmount?: number;
    dupreSourceIds?: CardInstanceId[];
    runEndTrashSourceIds?: CardInstanceId[];
    resolveRunnerInstalledProgramTrash?: (
      state: GameState,
      cardId: CardInstanceId,
      source: string,
      legalAction: LegalAction,
    ) => { suspended: boolean };
    virusImplementations?: Record<string, CardVirusCounterImplementation>;
  } = {},
): {
  host: RunEndCleanupHost;
  state: GameState;
  legalAction: LegalAction;
  damageCalls: Array<{ sourceDefinitionId: CardDefinitionId; amount: number }>;
  resetBreakerStrengthCount: () => number;
  cleanupDelayedCount: () => number;
} {
  const definitions: Record<string, CardDefinition> = {
    1663273972: definition(1663273972, "ice"),
    232: definition(232, "program"),
    1433344137: definition(1433344137, "upgrade", "tokyo_def"),
    932235382: definition(932235382, "operation"),
    ...(options.definitions ?? {}),
  };
  const instances: Record<string, CardInstance> = {
    ice_1: instance(
      "ice_1",
      1663273972,
      {
        side: "corp",
        zone: "serverIce",
        serverId: "r1",
      } as CardInstance["zone"],
      { rezzed: true, faceup: true },
    ),
    dupre: instance(
      "dupre",
      232,
      { side: "runner", zone: "rig" },
      { counters: { power: 2 }, selectedServerId: "r0" },
    ),
    tokyo: instance(
      "tokyo",
      1433344137,
      {
        side: "corp",
        zone: "serverRoot",
        serverId: "r1",
      } as CardInstance["zone"],
      { rezzed: true, faceup: true },
    ),
    ...(options.instances ?? {}),
  };
  const servers = [
    {
      id: "r1",
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
        runId: 1,
        attackedServerId: "r1",
        phase: "movement",
        position: { kind: "server", serverId: "r1" },
      } as unknown as NonNullable<GameState["run"]>),
  } as unknown as GameState;
  let resetBreakerStrengthCount = 0;
  let cleanupDelayedCount = 0;
  const damageCalls: Array<{
    sourceDefinitionId: CardDefinitionId;
    amount: number;
  }> = [];
  const legalAction = { payload: {} } as LegalAction;
  const tokyoSourceIds = new Set(options.tokyoSourceIds ?? ["tokyo"]);
  const dupreSourceIds = new Set(options.dupreSourceIds ?? ["dupre"]);
  const runEndTrashSourceIds = new Set(options.runEndTrashSourceIds ?? []);
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
        const { variableIceState: _ignored, ...rest } = card as CardInstance & {
          variableIceState?: unknown;
        };
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
          runnerActionOrdinal: 0,
        } as NonNullable<GameState["runnerTurnFlags"]>;
        return state.runnerTurnFlags;
      },
      consumeFutureActionDebt: () => undefined,
    },
    choices: {
      selectedChoiceIds: (selectedChoices) => {
        const raw = (
          selectedChoices as { selectedOptionIds?: unknown } | undefined
        )?.selectedOptionIds;
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
    tags: {
      addRunnerTagsWithPrevention: (_legalAction, amount) => {
        state.runner.tags += amount;
        host.runner.ensureTurnFlags().runnerReceivedTagThisTurn = true;
        return false;
      },
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        Math.max(
          0,
          Math.floor(instances[cardId]?.counters?.[counterType] ?? 0),
        ),
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
        const current = Math.max(
          0,
          Math.floor(instances[cardId]?.counters?.[counterType] ?? 0),
        );
        instances[cardId] = {
          ...instances[cardId]!,
          counters: {
            ...(instances[cardId]?.counters ?? {}),
            [counterType]: current + amount,
          },
        };
        state.cardInstances[cardId] = instances[cardId]!;
      },
      addVirusCounterWithCounterPrevention: (cardId, counterType, amount) => {
        host.counters.addCardCounter(cardId, counterType, amount);
        return amount;
      },
      preventOneVirusCounterWithCounterPrevention: () => ({
        prevented: false,
        creditsPaid: 0,
        preventionChargesSpent: 0,
      }),
      poxCountersForServer: () => 0,
    },
    ice: {
      icebreakerHasSpecial: (breakerId, special) =>
        special === "run_end_trash_source_if_used"
          ? runEndTrashSourceIds.has(breakerId)
          : dupreSourceIds.has(breakerId),
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
      applySuccessfulRunEndCreditTriggers: () => ({ handled: false }),
      applySuccessfulRunExtraRunFollowup: () => ({ handled: false }),
      cleanupDelayedSuccessfulRunTemporaryIce: () => {
        cleanupDelayedCount += 1;
      },
      resolveTestSpinRunEnd: () => ({ handled: false }),
    },
    cleanup: {
      cleanupEmptyRemotes: () => {
        resetBreakerStrengthCount += 1;
      },
      resolveRunnerInstalledProgramTrash: (cardId, source, legalAction) => {
        if (options.resolveRunnerInstalledProgramTrash)
          return options.resolveRunnerInstalledProgramTrash(
            state,
            cardId,
            source,
            legalAction,
          );
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (candidate) => candidate !== cardId,
        );
        state.runner.heap = [...(state.runner.heap ?? []), cardId];
        return { suspended: false };
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
  it("continues the sequence after an unsuccessful run and remembers the failure", () => {
    const { host, state, legalAction } = makeHost({
      run: {
        runId: 314974,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        activeSequence: {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1" as CardInstanceId,
          sourceDefinitionId: 174 as CardDefinitionId,
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: ["archives"],
          successfulServerIds: ["hq"],
          anyUnsuccessful: false,
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceAfterEachRun: true,
          resolveAfterAllRuns: true,
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

    expect(state.runnerTurnFlags?.forgoNextActionsPending ?? 0).toBe(0);
    expect(consumed).toBe(0);
    expect(state.runner.clicks).toBe(3);
    expect(state.runnerTurnFlags?.pendingSequences?.[0]).toMatchObject({
      pendingServerIds: ["archives"],
      successfulServerIds: ["hq"],
      anyUnsuccessful: true,
    });
    expect(legalAction.payload).toMatchObject({
      multiServerSuccessSequenceRunSuccessful: false,
      multiServerSuccessSequenceAnyUnsuccessful: true,
      multiServerSuccessSequencePendingServerCount: 1,
    });
  });

  it("adds exactly one future action debt only after the final run when any sequence run failed", () => {
    const { host, state, legalAction } = makeHost({
      run: {
        runId: 339289,
        attackedServerId: "archives",
        phase: "movement",
        position: { kind: "server", serverId: "archives" },
        activeSequence: {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1" as CardInstanceId,
          sourceDefinitionId: 174 as CardDefinitionId,
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: [],
          successfulServerIds: ["hq"],
          anyUnsuccessful: true,
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceAfterEachRun: true,
          resolveAfterAllRuns: true,
        },
      } as unknown as NonNullable<GameState["run"]>,
    });
    let awardedAgendaPoints = 0;
    host.runner.awardEventAgendaPoint = () => {
      awardedAgendaPoints += 1;
    };

    handleRunEndCleanup(host, true, legalAction);

    expect(state.runnerTurnFlags?.pendingSequences).toBeUndefined();
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);
    expect(awardedAgendaPoints).toBe(0);
    expect(legalAction.payload).toMatchObject({
      multiServerSuccessSequenceComplete: true,
      multiServerSuccessSequenceFailed: true,
      actionDebtAdded: 1,
    });
  });

  it("keeps the next sequence run pending without consuming existing debt after a successful partial run", () => {
    const { host, state, legalAction } = makeHost({
      run: {
        runId: 314974,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        activeSequence: {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1" as CardInstanceId,
          sourceDefinitionId: 174 as CardDefinitionId,
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: ["archives"],
          successfulServerIds: ["hq"],
          anyUnsuccessful: false,
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceAfterEachRun: true,
          resolveAfterAllRuns: true,
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
        runId: 428980,
        attackedServerId: "r1",
        phase: "movement",
        position: { kind: "server", serverId: "r1" },
        runnerRunTemporaryCredits: {
          amount: 9,
          remaining: 4,
          returnUnusedAtRunEnd: true,
          sourceDefinitionId: 932235382,
        },
        unpreventableCoreDamageAtRunEnd: {
          amount: 1,
          sourceDefinitionId: 932235382,
        },
      } as unknown as NonNullable<GameState["run"]>,
    });

    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result).toMatchObject({
      handled: true,
      returnedTemporaryCredits: 4,
      damageAmount: 1,
      damageType: "core",
      unpreventableDamage: true,
      stateChanged: true,
    });
    expect(fixture.damageCalls).toEqual([
      { sourceDefinitionId: 932235382, amount: 1 },
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
          attackedServerId: "r1",
          phase: "movement",
          position: { kind: "server", serverId: "r1" },
          grantBonusRunOnFinish: true,
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
        runId: 529758,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["highlighter"],
      instances: {
        highlighter: instance(
          "highlighter",
          148,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        148: definition(148, "program"),
      },
      virusImplementations: {
        highlighter: {
          counterKind: "highlighter",
          addOnSuccessfulRun: {
            server: "rd",
            counterScope: { kind: "shared_corp_pool" },
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
      runId: 529758,
      serverId: "rd",
      counterType: "highlighter",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: 148,
    });
  });

  it("adds Cascade as a Corp-bucket counter after successful R&D runs", () => {
    const fixture = makeHost({
      run: {
        runId: 192103,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["cascade"],
      instances: {
        cascade: instance(
          "cascade",
          222,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        222: definition(222, "program"),
      },
      virusImplementations: {
        cascade: {
          counterKind: "cascade",
          addOnSuccessfulRun: {
            server: "rd",
            counterScope: { kind: "shared_corp_pool" },
            amount: 1,
            visibility: "public",
          },
        },
      },
    });

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(
      fixture.state.cardInstances.cascade?.counters?.virus,
    ).toBeUndefined();
    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      cascade: 1,
    });
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      runId: 192103,
      serverId: "rd",
      counterType: "cascade",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: 222,
    });
    expect(fixture.legalAction.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "counter_change",
        side: "corp",
        counterType: "cascade",
        addedCounterAmount: 1,
        remainingCounters: 1,
        sourceDefinitionId: 222,
      }),
    );
  });

  it("adds Proteus access-trash counters after matching successful runs", () => {
    const fixture = makeHost({
      run: {
        runId: 623546,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["garbage"],
      instances: {
        garbage: instance(
          "garbage",
          147,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        147: definition(147, "program"),
      },
      virusImplementations: {
        garbage: {
          counterKind: "garbage",
          addOnSuccessfulRun: {
            server: "rd",
            counterScope: { kind: "shared_corp_pool" },
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
      sourceCardDefinitionId: 147,
    });
  });

  it("adds Scaldan purgeable counters after successful HQ runs", () => {
    const fixture = makeHost({
      run: {
        runId: 874571,
        attackedServerId: "hq",
        phase: "movement",
        position: { kind: "server", serverId: "hq" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["scaldan"],
      instances: {
        scaldan: instance(
          "scaldan",
          152,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        152: definition(152, "program"),
      },
      virusImplementations: {
        scaldan: {
          counterKind: "scaldan",
          addOnSuccessfulRun: {
            server: "hq",
            counterScope: { kind: "shared_corp_pool" },
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
      runId: 874571,
      serverId: "hq",
      counterType: "scaldan",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: 152,
    });
  });

  it("spends Superserum-style prevention charges before adding purgeable counters", () => {
    const fixture = makeHost({
      run: {
        runId: 246664,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["cascade", "highlighter", "garbage"],
      instances: {
        cascade: instance(
          "cascade",
          222,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
        highlighter: instance(
          "highlighter",
          148,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
        garbage: instance(
          "garbage",
          147,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        222: definition(222, "program"),
        148: definition(148, "program"),
        147: definition(147, "program"),
      },
      virusImplementations: {
        cascade: {
          counterKind: "cascade",
          addOnSuccessfulRun: {
            server: "rd",
            counterScope: { kind: "shared_corp_pool" },
            amount: 1,
            visibility: "public",
          },
        },
        highlighter: {
          counterKind: "highlighter",
          addOnSuccessfulRun: {
            server: "rd",
            counterScope: { kind: "shared_corp_pool" },
            amount: 1,
            visibility: "public",
          },
        },
        garbage: {
          counterKind: "garbage",
          addOnSuccessfulRun: {
            server: "rd",
            counterScope: { kind: "shared_corp_pool" },
            amount: 1,
            visibility: "public",
          },
        },
      },
    });
    fixture.state.corpRunnerVirusCounterPreventionCharges = 2;
    fixture.host.counters.preventOneVirusCounterWithCounterPrevention = () => {
      const remaining = Math.max(
        0,
        Math.floor(fixture.state.corpRunnerVirusCounterPreventionCharges ?? 0),
      );
      if (remaining <= 0)
        return { prevented: false, creditsPaid: 0, preventionChargesSpent: 0 };
      fixture.state.corpRunnerVirusCounterPreventionCharges = remaining - 1;
      return { prevented: true, creditsPaid: 0, preventionChargesSpent: 1 };
    };

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.corpRunnerVirusCounterPreventionCharges).toBe(0);
    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      garbage: 1,
    });
    expect(fixture.legalAction.payload).toMatchObject({
      virusCounterAvoided: 2,
      runnerVirusCounterPreventionChargesSpent: 2,
      corpRunnerVirusCounterPreventionChargesAfter: 0,
      counterType: "garbage",
      counterDelta: 1,
      counterTotalAfter: 1,
    });
  });

  it("adds a central socket counter without automatically converting a complete set", () => {
    const fixture = makeHost({
      run: {
        runId: 578057,
        attackedServerId: "archives",
        phase: "movement",
        position: { kind: "server", serverId: "archives" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["viral_pipeline"],
      instances: {
        viral_pipeline: instance(
          "viral_pipeline",
          157,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        157: definition(157, "program"),
      },
      virusImplementations: {
        viral_pipeline: {
          counterKind: "pipe",
          addOnSuccessfulRun: {
            server: "central",
            counterScope: { kind: "attacked_central_server_pool" },
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
      servers: {
        archives: { socket_archives: 1 },
        hq: { socket_hq: 1 },
        rd: { socket_rd: 1 },
      },
    });
    expect(fixture.state.purgeableRunnerVirusCounters?.corp?.pipe ?? 0).toBe(0);
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusCounter: true,
      runId: 578057,
      serverId: "archives",
      counterType: "socket_archives",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: 157,
    });
    expect(fixture.legalAction.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "counter_change",
          counterType: "socket_archives",
          addedCounterAmount: 1,
          reason: "runner_virus_successful_run",
          sourceDefinitionId: 157,
        }),
      ]),
    );
  });

  it("uses the semantic successful-run server for flags and virus triggers", () => {
    const fixture = makeHost({
      run: {
        runId: 379669,
        attackedServerId: "archives",
        successfulRunServerOverride: "hq",
        phase: "movement",
        position: { kind: "server", serverId: "archives" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["viral_pipeline"],
      instances: {
        viral_pipeline: instance(
          "viral_pipeline",
          157,
          { side: "runner", zone: "rig" },
          { faceup: true, rezzed: true },
        ),
      },
      definitions: {
        157: definition(157, "program"),
      },
      virusImplementations: {
        viral_pipeline: {
          counterKind: "pipe",
          addOnSuccessfulRun: {
            server: "central",
            counterScope: { kind: "attacked_central_server_pool" },
            amount: 1,
            visibility: "public",
          },
        },
      },
    });

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.runnerTurnFlags).toMatchObject({
      successfulRunThisTurn: true,
      successfulHqRunThisTurn: true,
      lastSuccessfulRunServerId: "hq",
    });
    expect(fixture.state.purgeableRunnerVirusCounters?.servers).toMatchObject({
      hq: { socket_hq: 1 },
    });
    expect(
      fixture.state.purgeableRunnerVirusCounters?.servers?.archives,
    ).toBeUndefined();
    expect(fixture.legalAction.payload).toMatchObject({
      serverId: "hq",
      counterType: "socket_hq",
      counterDelta: 1,
    });
  });

  it("removes Garbage counters once at run end after one or more free trashes", () => {
    const fixture = makeHost({
      run: {
        runId: 623546,
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        virusAccessTrashCounterUses: [
          {
            counterType: "garbage",
            removeAtRunEnd: 2,
            sourceDefinitionId: 147,
          },
        ],
      } as unknown as NonNullable<GameState["run"]>,
    });
    fixture.state.purgeableRunnerVirusCounters = { corp: { garbage: 3 } };

    handleRunEndCleanup(fixture.host, true, fixture.legalAction);

    expect(fixture.state.purgeableRunnerVirusCounters?.corp?.garbage).toBe(1);
    expect(fixture.legalAction.payload).toMatchObject({
      proteusRunnerVirusFreeTrashCounterType: "garbage",
      garbageCountersSpent: 2,
      garbageCountersAfter: 1,
      garbageCounterRemovalSourceDefinitionId: 147,
    });
  });

  it("derezzes Olivia Salazar temporary rezzed ICE at run end", () => {
    const fixture = makeHost({
      run: {
        runId: 707261,
        attackedServerId: "r1",
        phase: "movement",
        position: { kind: "server", serverId: "r1" },
        temporaryDiscountedRezzedIceIds: ["ice_1"],
      } as unknown as NonNullable<GameState["run"]>,
    });

    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result.derezCardIds).toEqual(["ice_1"]);
    expect(fixture.state.cardInstances.ice_1?.rezzed).toBe(false);
    expect(fixture.state.cardInstances.ice_1?.faceup).toBe(false);
    expect(fixture.legalAction.payload).toMatchObject({
      temporaryDiscountedRunEndDerez: true,
      derezzedCount: 1,
    });
  });

  it("applies Dupré run-end counters and resets fort binding on fort change", () => {
    const fixture = makeHost({
      run: {
        runId: 742965,
        attackedServerId: "r1",
        phase: "movement",
        position: { kind: "server", serverId: "r1" },
        runEndCounterAwardBreakerIds: ["dupre"],
      } as unknown as NonNullable<GameState["run"]>,
    });

    recordFortBoundBreakerUsage(fixture.host, "dupre", false);
    expect(fixture.state.cardInstances.dupre?.selectedServerId).toBe(
      "r1",
    );
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(0);

    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result.placedCounters).toBe(1);
    expect(fixture.state.cardInstances.dupre?.selectedServerId).toBe(
      "r1",
    );
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(1);
  });

  it("does not award a fort-bound breaker counter after pump-only use", () => {
    const fixture = makeHost({
      run: {
        runId: 734383,
        attackedServerId: "r1",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "r1", iceIndex: 0 },
      } as unknown as NonNullable<GameState["run"]>,
    });

    recordFortBoundBreakerUsage(fixture.host, "dupre", false);
    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result.placedCounters).toBeUndefined();
    expect(fixture.state.cardInstances.dupre?.selectedServerId).toBe(
      "r1",
    );
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(0);
  });

  it("awards each fort-bound breaker instance once after repeated successful breaks", () => {
    const fixture = makeHost({
      runnerPrograms: ["dupre", "dupre_2"],
      instances: {
        dupre_2: instance(
          "dupre_2",
          232,
          { side: "runner", zone: "rig" },
          { counters: { power: 0 } },
        ),
      },
      run: {
        runId: 190055,
        attackedServerId: "r1",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "r1", iceIndex: 0 },
      } as unknown as NonNullable<GameState["run"]>,
    });

    recordFortBoundBreakerUsage(fixture.host, "dupre", true);
    recordFortBoundBreakerUsage(fixture.host, "dupre", true);
    recordFortBoundBreakerUsage(fixture.host, "dupre_2", true);
    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result.placedCounters).toBe(2);
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(1);
    expect(fixture.state.cardInstances.dupre_2?.counters?.power).toBe(1);
  });

  it("records Dupré usage during the run and resolves Pattel's Virus choices through stable pending-choice fields", () => {
    const fixture = makeHost({
      run: {
        runId: 419019,
        attackedServerId: "r1",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "r1", iceIndex: 0 },
      } as unknown as NonNullable<GameState["run"]>,
    });

    recordFortBoundBreakerUsage(fixture.host, "dupre", true);

    expect(fixture.state.run?.runEndCounterAwardBreakerIds).toEqual(["dupre"]);
    expect(fixture.state.cardInstances.dupre?.counters?.power).toBe(0);

    fixture.state.pendingChoice = {
      choiceId: "broken_ice_virus_counter_8",
      side: "runner",
      source: "broken_ice.virus_counter:8",
      prompt: "Gebrochenes ICE fuer Virus-Counter waehlen.",
      kind: "select_option",
      options: [
        {
          id: "source_pattel_1_target_ice_1",
          label: "ice_def",
          publicLabel: "Gebrochenes ICE",
          value: "ice_1",
          metadata: {
            sourceCardInstanceId: "pattel_1",
            targetCardInstanceId: "ice_1",
          },
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 8,
      visibility: "public",
    };
    fixture.state.pendingBrokenIceVirusCounterChoice = {
      counterType: "pattel",
      sources: [{ sourceCardId: "pattel_1", amount: 2 }],
      targetIceIds: ["ice_1"],
    };

    resolveBrokenIceVirusCounterChoice(fixture.host, fixture.legalAction, {
      side: "runner",
      actionId: "rn",
      type: "resolve_choice",
      selectedChoices: {
        selectedOptionIds: ["source_pattel_1_target_ice_1"],
      },
    } as unknown as Parameters<typeof resolveBrokenIceVirusCounterChoice>[2]);

    expect(fixture.state.pendingChoice).toBeUndefined();
    expect(fixture.state.cardInstances.ice_1?.counters?.pattel).toBe(2);
    expect(fixture.state.cardInstances.ice_1?.counters?.virus).toBeUndefined();
    expect(fixture.legalAction.payload).toMatchObject({
      abilityId: "broken_ice_virus_counter",
      brokenIceVirusCounterAdded: 2,
      targetCardDefinitionId: 1663273972,
      remainingCounters: 2,
      choiceVisibility: "public",
    });
  });

  it("applies each Pattel source amount independently without double-counting a shared target", () => {
    const fixture = makeHost({
      instances: {
        pattel_1: instance(
          "pattel_1",
          2022055323,
          { side: "runner", zone: "rig" },
          { faceup: true },
        ),
        pattel_2: instance(
          "pattel_2",
          2022055323,
          { side: "runner", zone: "rig" },
          { faceup: true },
        ),
      },
      definitions: { 2022055323: definition(2022055323, "resource") },
    });
    fixture.state.pendingChoice = {
      choiceId: "broken_ice_virus_counter_8",
      side: "runner",
      source: "broken_ice.virus_counter:8",
      prompt: "Gebrochenes ICE fuer Virus-Counter waehlen.",
      presentationKey: "generic_select_option",
      kind: "select_option",
      options: ["pattel_1", "pattel_2"].map((sourceCardId) => ({
        id: `source_${sourceCardId}_target_ice_1`,
        label: "ice_def",
        publicLabel: "Gebrochenes ICE",
        value: "ice_1",
        metadata: {
          sourceCardInstanceId: sourceCardId as CardInstanceId,
          targetCardInstanceId: "ice_1" as CardInstanceId,
        },
      })),
      minSelections: 2,
      maxSelections: 2,
      stateVersion: 8,
      visibility: "public",
    };
    fixture.state.pendingBrokenIceVirusCounterChoice = {
      counterType: "pattel",
      sources: [
        { sourceCardId: "pattel_1", amount: 1 },
        { sourceCardId: "pattel_2", amount: 2 },
      ],
      targetIceIds: ["ice_1"],
    };

    resolveBrokenIceVirusCounterChoice(fixture.host, fixture.legalAction, {
      side: "runner",
      actionId: "rn",
      type: "resolve_choice",
      selectedChoices: {
        selectedOptionIds: [
          "source_pattel_1_target_ice_1",
          "source_pattel_2_target_ice_1",
        ],
      },
    } as unknown as Parameters<typeof resolveBrokenIceVirusCounterChoice>[2]);

    expect(fixture.state.cardInstances.ice_1?.counters?.pattel).toBe(3);
    expect(fixture.legalAction.payload).toMatchObject({
      brokenIceVirusCounterAdded: 3,
      brokenIceVirusCounterAssignmentCount: 2,
      remainingCounters: 3,
    });
  });

  it("records and trashes Rent-I-Con-style breakers used during the run", () => {
    const fixture = makeHost({
      run: {
        runId: 836004,
        attackedServerId: "r1",
        phase: "movement",
        position: { kind: "server", serverId: "r1" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["rent" as CardInstanceId],
      definitions: {
        4209413918: definition(4209413918, "program"),
      },
      instances: {
        rent: instance("rent", 4209413918, { side: "runner", zone: "rig" }),
      },
      dupreSourceIds: [],
      runEndTrashSourceIds: ["rent" as CardInstanceId],
    });

    recordRunEndTrashBreakerUsage(fixture.host, "rent");

    expect(fixture.state.run?.runEndTrashUsedBreakerIdsThisRun).toEqual([
      "rent",
    ]);

    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result.stateChanged).toBe(true);
    expect(fixture.state.runner.rig.programs).not.toContain("rent");
    expect(fixture.state.runner.heap).toContain("rent");
    expect(fixture.legalAction.payload).toMatchObject({
      v1922RunnerProgramAbility: "run_end_trash_used_breaker",
      trashedCount: 1,
      trashedCardDefinitionId: 4209413918,
      publicRevealDefinitionIds: "4209413918",
    });
  });

  it("keeps duplicate Rent-I-Con uses as sequential preventable run-end effects", () => {
    let trashResolutionCalls = 0;
    const fixture = makeHost({
      run: {
        runId: 436879,
        attackedServerId: "r1",
        phase: "movement",
        position: { kind: "server", serverId: "r1" },
      } as unknown as NonNullable<GameState["run"]>,
      runnerPrograms: ["rent" as CardInstanceId],
      definitions: {
        4209413918: definition(4209413918, "program"),
      },
      instances: {
        rent: instance("rent", 4209413918, { side: "runner", zone: "rig" }),
      },
      runEndTrashSourceIds: ["rent" as CardInstanceId],
      resolveRunnerInstalledProgramTrash: (state, cardId, source) => {
        trashResolutionCalls += 1;
        expect(source).toBe("run_end_trash_source_if_used:rent");
        if (trashResolutionCalls === 1) {
          state.pendingChoice = {
            choiceId: "rent_trash_prevention",
            side: "runner",
            source: "v120.event_modification.prevent",
            prompt: "Trash verhindern",
            kind: "select_option",
            options: [],
            minSelections: 1,
            maxSelections: 1,
            stateVersion: state.stateVersion + 1,
            visibility: "public",
          };
          return { suspended: true };
        }
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (candidate) => candidate !== cardId,
        );
        state.runner.heap = [...(state.runner.heap ?? []), cardId];
        return { suspended: false };
      },
    });

    recordRunEndTrashBreakerUsage(fixture.host, "rent" as CardInstanceId);
    recordRunEndTrashBreakerUsage(fixture.host, "rent" as CardInstanceId);
    expect(fixture.state.run?.runEndTrashUsedBreakerIdsThisRun).toEqual([
      "rent",
      "rent",
    ]);

    const initial = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );
    expect(initial.stateChanged).toBe(true);
    expect(fixture.state.run).toBeDefined();
    expect(fixture.state.runner.rig.programs).toContain("rent");
    expect(fixture.state.pendingRunEndTrashContinuation).toMatchObject({
      remainingSourceCardIds: ["rent"],
      activeSourceCardId: "rent",
      effectCount: 2,
    });

    delete fixture.state.pendingChoice;
    resumeRunEndTrashUsedBreakers(fixture.host, fixture.legalAction);

    expect(trashResolutionCalls).toBe(2);
    expect(fixture.state.run).toBeUndefined();
    expect(fixture.state.runner.rig.programs).not.toContain("rent");
    expect(fixture.state.runner.heap).toContain("rent");
    expect(fixture.state.pendingRunEndTrashContinuation).toBeUndefined();
    expect(fixture.legalAction.payload).toMatchObject({
      v1922RunnerProgramAbility: "run_end_trash_used_breaker",
      runEndTrashEffectCount: 2,
      runEndTrashPreventedOrReplacedCount: 1,
      trashedCount: 1,
      trashedCardDefinitionId: 4209413918,
    });
  });

  it("applies Tokyo-Chiba unsuccessful-run aftermath without successful-run flags", () => {
    const fixture = makeHost({ tokyoAmount: 3 });

    const result = handleRunEndCleanup(
      fixture.host,
      false,
      fixture.legalAction,
    );

    expect(result.gainedCredits).toBe(3);
    expect(fixture.state.corp.credits).toBe(7);
    expect(
      fixture.state.runnerTurnFlags?.successfulRunThisTurn,
    ).toBeUndefined();
    expect(fixture.legalAction.payload).toMatchObject({
      unsuccessfulRunCorpCreditBonus: true,
      sourceDefinitionId: 1433344137,
      serverId: "r1",
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
        sourceDefinitionId: 1433344137,
        sourceTitle: "tokyo_def",
        serverId: "r1",
        serverLabel: "Remote 1",
      }),
    );
  });

  it("clears encounter temporary trace credits with the existing payload fields", () => {
    const run = {
      runId: 773228,
      attackedServerId: "r1",
      encounterTemporaryTraceCredits: {
        remaining: 2,
        sourceDefinitionId: 3532417201,
      },
    } as unknown as NonNullable<GameState["run"]>;
    const legalAction = { payload: {} } as LegalAction;

    clearEncounterTemporaryTraceCredits(run, legalAction);

    expect(run.encounterTemporaryTraceCredits).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      temporaryCreditsReturned: 2,
      temporaryTraceCreditsSourceDefinitionId: 3532417201,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5])(
    "rejects invalid encounter temporary trace credit remainder %s before cleanup mutation",
    (remaining) => {
      const run = {
        runId: 773228,
        attackedServerId: "r1",
        encounterTemporaryTraceCredits: {
          remaining,
          sourceDefinitionId: 3532417201,
        },
      } as unknown as NonNullable<GameState["run"]>;
      const legalAction = {
        payload: { preserved: true },
      } as unknown as LegalAction;

      expect(() =>
        clearEncounterTemporaryTraceCredits(run, legalAction),
      ).toThrow("runtime_invalid_encounter_temporary_trace_credit_remainder");

      expect(run.encounterTemporaryTraceCredits?.remaining).toBe(remaining);
      expect(legalAction.payload).toEqual({ preserved: true });
    },
  );
});
