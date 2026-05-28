import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
  SpecialZoneState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { RunnerAccessActionHost } from "./access-actions";
import {
  advanceArchivesBreachPastNonDecisionCards,
  handleAccessExecution,
  type AccessFlowHost,
} from "./access-flow";

function definition(
  id: string,
  type: CardDefinition["type"],
  trashCost = 0,
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title: id,
    type,
    ...(trashCost > 0 ? { trashCost } : {}),
  } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone,
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
  } as unknown as CardInstance;
}

function makeHost(options: {
  run?: GameState["run"] | null;
  definitions?: Record<string, CardDefinition>;
  instances?: Record<string, CardInstance>;
  servers?: CorpServer[];
  corpRd?: string[];
  corpHq?: string[];
  corpArchives?: string[];
  runnerScoreArea?: string[];
  runnerCredits?: number;
} = {}): {
  host: AccessFlowHost;
  state: GameState;
  effects: CardInstanceId[];
  finishedRuns: boolean[];
  spentRunnerCredits: number[];
  trashPayments: Array<{ amount: number; cardId: CardInstanceId }>;
  trashedCards: CardInstanceId[];
} {
  const definitions = options.definitions ?? {
    agenda: definition("agenda_def", "agenda"),
    asset: definition("asset_def", "asset", 3),
    ice: definition("ice_def", "ice"),
  };
  const servers =
    options.servers ??
    ([
      { id: "remote_1", ice: [], root: ["asset"] },
      { id: "rd", ice: [], root: [] },
      { id: "hq", ice: [], root: [] },
      { id: "archives", ice: [], root: [] },
    ] as unknown as CorpServer[]);
  const instances =
    options.instances ??
    ({
      asset: instance("asset", "asset_def", {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1",
      } as CardInstance["zone"]),
      agenda: instance("agenda", "agenda_def", {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1",
      } as CardInstance["zone"]),
      ice: instance("ice", "ice_def", {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1",
      } as CardInstance["zone"]),
    } satisfies Record<string, CardInstance>);
  const state = {
    stateVersion: 1,
    timingPoint: "access.resolve_card",
    activeSide: "runner",
    runner: {
      credits: options.runnerCredits ?? 10,
      scoreArea: options.runnerScoreArea ?? [],
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      rd: options.corpRd ?? [],
      hq: options.corpHq ?? [],
      archives: options.corpArchives ?? [],
      servers,
    },
    cardInstances: instances,
  } as unknown as GameState;
  if (options.run === undefined) {
    state.run = {
      runId: "run_1",
      attackedServerId: "remote_1",
    } as unknown as NonNullable<GameState["run"]>;
  } else if (options.run) {
    state.run = options.run;
  }
  const effects: CardInstanceId[] = [];
  const finishedRuns: boolean[] = [];
  const spentRunnerCredits: number[] = [];
  const trashPayments: Array<{ amount: number; cardId: CardInstanceId }> = [];
  const trashedCards: CardInstanceId[] = [];

  const accessActions: RunnerAccessActionHost = {
    state,
    cards: {
      definitionFor: (cardId) => {
        const found = instances[cardId]?.definitionId;
        const resolved = Object.values(definitions).find(
          (candidate) => candidate.id === found,
        );
        if (!resolved) throw new Error(`missing definition for ${cardId}`);
        return resolved;
      },
      cardInstanceFor: (cardId) => instances[cardId]!,
      cardHasSubtype: () => false,
    },
    servers: {
      mustServer: (serverId) => {
        const server = servers.find((candidate) => candidate.id === serverId);
        if (!server) throw new Error(`missing server ${serverId}`);
        return server;
      },
    },
    actions: {
      buildLegalAction: () => ({}) as LegalAction,
    },
    payment: {
      hostedPaymentCredits: () => 0,
      restrictedHostedCreditSourceIds: () => [],
      isRestrictedHostedCreditSource: () => false,
    },
    counters: {
      cardCounter: () => 0,
    },
    callbacks: {
      successfulRunProgramActions: () => [],
      runnerDuringRunCardImplementationLegalActions: () => [],
      mysteryBoxRunActions: () => [],
    },
  };

  const host: AccessFlowHost = {
    state,
    accessActions,
    cards: {
      definitionFor: accessActions.cards.definitionFor,
      cardInstanceFor: accessActions.cards.cardInstanceFor,
      cardHasSubtype: () => false,
    },
    servers: {
      mustServer: accessActions.servers.mustServer,
      randomHqAccess: () => state.corp.hq[0],
    },
    effects: {
      executeAccessEffects: (cardId) => {
        effects.push(cardId);
      },
      archivesAccessRequiresDecisionOrEffect: (cardId) =>
        accessActions.cards.definitionFor(cardId).type === "agenda",
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
    },
    zones: {
      removeFromAllZones: (cardId) => {
        state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
        state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
        state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
        state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
        for (const server of state.corp.servers) {
          server.root = server.root.filter((id) => id !== cardId);
          server.ice = server.ice.filter((id) => id !== cardId);
        }
      },
      ensureSpecialZones: () => {
        state.specialZones ??= { setAside: [], removedFromGame: [] };
        return state.specialZones as SpecialZoneState;
      },
    },
    payment: {
      spendRunnerCredits: (amount) => {
        spentRunnerCredits.push(amount);
        state.runner.credits -= amount;
      },
      spendRunnerAccessTrashCredits: (amount, cardId) => {
        trashPayments.push({ amount, cardId });
        state.runner.credits -= amount;
        return { recurringSpent: 0, runnerCreditsSpent: amount };
      },
    },
    steal: {
      agendaPointsForScoredCard: () => 2,
      snapshotPersistentStealCostModifiersForSource: () => undefined,
    },
    trash: {
      trashCorpInstalledCardToArchives: (cardId) => {
        trashedCards.push(cardId);
        state.corp.archives.push(cardId);
      },
    },
    run: {
      finishRun: (successful) => {
        finishedRuns.push(successful);
        delete state.run;
      },
      startExpertScheduleAnalyzerPostAccessChoice: () => false,
    },
    access: {
      installedRevealHelperCount: () => 0,
    },
  };
  return {
    host,
    state,
    effects,
    finishedRuns,
    spentRunnerCredits,
    trashPayments,
    trashedCards,
  };
}

describe("access flow execution", () => {
  it("does not handle access actions without an active run", () => {
    const { host } = makeHost({ run: null });

    expect(
      handleAccessExecution(host, {
        side: "runner",
        type: "access_card",
        actionId: "runner.access_card",
        label: "Access",
        source: "run",
      } as LegalAction),
    ).toEqual({ handled: false });
  });

  it("accesses the current remote card and delegates access effects", () => {
    const { host, state, effects } = makeHost();
    const legalAction = {
      side: "runner",
      type: "access_card",
      actionId: "runner.access_card",
      label: "Access",
      source: "run",
    } as unknown as LegalAction;

    const result = handleAccessExecution(host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      accessedCardId: "asset",
      serverId: "remote_1",
      stateChanged: true,
    });
    expect(state.run?.accessedCardId).toBe("asset");
    expect(state.cardInstances.asset!.faceup).toBe(true);
    expect(effects).toEqual(["asset"]);
    expect(legalAction.payload).toMatchObject({
      accessedCardId: "asset",
      serverId: "remote_1",
    });
  });

  it("steals an accessed agenda after spending the legal action credit cost", () => {
    const { host, state, spentRunnerCredits, finishedRuns } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "remote_1",
        accessedCardId: "agenda",
      } as unknown as NonNullable<GameState["run"]>,
      servers: [
        { id: "remote_1", ice: [], root: ["agenda"] },
        { id: "rd", ice: [], root: [] },
        { id: "hq", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
      ] as unknown as CorpServer[],
    });

    const result = handleAccessExecution(host, {
      side: "runner",
      type: "steal_agenda",
      actionId: "runner.steal_agenda.agenda",
      label: "Steal",
      source: "agenda",
      costs: [{ credits: 2 }],
    } as LegalAction);

    expect(result).toMatchObject({
      handled: true,
      stolenAgendaId: "agenda",
      paidCredits: 2,
      runFinished: true,
    });
    expect(spentRunnerCredits).toEqual([2]);
    expect(state.runner.scoreArea).toEqual(["agenda"]);
    expect(state.cardInstances.agenda!.zone).toEqual({
      side: "runner",
      zone: "scoreArea",
    });
    expect(finishedRuns).toEqual([true]);
  });

  it("trashes an accessed card through the existing trash payment and lifecycle callbacks", () => {
    const { host, state, trashPayments, trashedCards, finishedRuns } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "remote_1",
        accessedCardId: "asset",
      } as unknown as NonNullable<GameState["run"]>,
    });
    const legalAction = {
      side: "runner",
      type: "trash_accessed_card",
      actionId: "runner.trash_accessed_card.asset.3",
      label: "Trash",
      source: "asset",
    } as unknown as LegalAction;

    const result = handleAccessExecution(host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      trashedCardId: "asset",
      runFinished: true,
    });
    expect(trashPayments).toEqual([{ amount: 3, cardId: "asset" }]);
    expect(trashedCards).toEqual(["asset"]);
    expect(state.corp.archives).toEqual(["asset"]);
    expect(legalAction.payload).toMatchObject({
      accessTrashBaseCost: 3,
      accessTrashCostModifier: 0,
      accessTrashTotalCost: 3,
    });
    expect(finishedRuns).toEqual([true]);
  });

  it("revalidates Mercenary-style hidden resource current-access trash and pays its source cost", () => {
    const definitions = {
      operation: definition("operation_def", "operation"),
      mercenary: definition(
        "onr_proteus_145_mercenary-subcontract",
        "resource",
      ),
      boltHole: definition("onr_proteus_132_bolt-hole", "resource"),
      agenda: definition("agenda_def", "agenda"),
    };
    const { host, state, spentRunnerCredits, trashPayments, trashedCards } =
      makeHost({
        run: {
          runId: "run_1",
          attackedServerId: "rd",
          accessedCardId: "operation",
        } as unknown as NonNullable<GameState["run"]>,
        definitions,
        instances: {
          operation: instance("operation", "operation_def", {
            side: "corp",
            zone: "rd",
          }),
          mercenary: {
            id: "mercenary" as CardInstanceId,
            instanceId: "mercenary" as CardInstanceId,
            definitionId: "onr_proteus_145_mercenary-subcontract",
            owner: "runner",
            controller: "runner",
            zone: { side: "runner", zone: "rig" },
            faceup: true,
            rezzed: true,
            tapped: false,
            advancementCounters: 0,
          } as unknown as CardInstance,
          bolt: {
            id: "bolt" as CardInstanceId,
            instanceId: "bolt" as CardInstanceId,
            definitionId: "onr_proteus_132_bolt-hole",
            owner: "runner",
            controller: "runner",
            zone: { side: "runner", zone: "rig" },
            faceup: false,
            rezzed: false,
            tapped: false,
            advancementCounters: 0,
          } as unknown as CardInstance,
          agenda: instance("agenda", "agenda_def", {
            side: "corp",
            zone: "rd",
          }),
        },
        corpRd: ["operation"],
      });
    state.runner.rig.resources = ["mercenary" as CardInstanceId];

    const legalAction = {
      side: "runner",
      type: "trash_accessed_card",
      actionId: "runner.trash_accessed_card.operation.mercenary",
      label: "Mercenary",
      source: "operation",
      costs: [{ credits: 4 }],
      payload: {
        cardId: "operation",
        accessTrashCostOverride: 0,
        freeAccessTrash: true,
        hiddenResourceCurrentAccessTrash: true,
        hiddenResourceSourceCardId: "mercenary",
        hiddenResourceSourceDefinitionId:
          "onr_proteus_145_mercenary-subcontract",
      },
    } as unknown as LegalAction;

    const result = handleAccessExecution(host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      trashedCardId: "operation",
      runFinished: true,
    });
    expect(spentRunnerCredits).toEqual([4]);
    expect(trashPayments).toEqual([{ amount: 0, cardId: "operation" }]);
    expect(trashedCards).toEqual(["operation"]);
    expect(state.runner.credits).toBe(6);
    expect(state.cardInstances.mercenary?.tapped).toBe(true);
    expect(state.cardInstances.mercenary?.faceup).toBe(true);
    expect(legalAction.payload).toMatchObject({
      sourceTapped: true,
      hiddenZoneAction: "proteus_hidden_current_access_free_trash",
    });

    const wrongKindAction = structuredClone(legalAction);
    wrongKindAction.payload = {
      ...wrongKindAction.payload,
      hiddenResourceSourceCardId: "bolt",
    };
    const wrongKind = makeHost({
      run: {
        runId: "run_2",
        attackedServerId: "rd",
        accessedCardId: "operation",
      } as unknown as NonNullable<GameState["run"]>,
      definitions,
      instances: {
        operation: instance("operation", "operation_def", {
          side: "corp",
          zone: "rd",
        }),
        bolt: {
          id: "bolt" as CardInstanceId,
          instanceId: "bolt" as CardInstanceId,
          definitionId: "onr_proteus_132_bolt-hole",
          owner: "runner",
          controller: "runner",
          zone: { side: "runner", zone: "rig" },
          faceup: false,
          rezzed: false,
          tapped: false,
          advancementCounters: 0,
        } as unknown as CardInstance,
      },
      corpRd: ["operation"],
    });
    wrongKind.state.runner.rig.resources = ["bolt" as CardInstanceId];
    expect(() =>
      handleAccessExecution(wrongKind.host, wrongKindAction),
    ).toThrow("Die Hidden-Resource-Faehigkeit passt nicht zur Quelle.");

    const agendaState = makeHost({
      run: {
        runId: "run_3",
        attackedServerId: "rd",
        accessedCardId: "agenda",
      } as unknown as NonNullable<GameState["run"]>,
      definitions,
      instances: {
        agenda: instance("agenda", "agenda_def", {
          side: "corp",
          zone: "rd",
        }),
        mercenary: {
          id: "mercenary" as CardInstanceId,
          instanceId: "mercenary" as CardInstanceId,
          definitionId: "onr_proteus_145_mercenary-subcontract",
          owner: "runner",
          controller: "runner",
          zone: { side: "runner", zone: "rig" },
          faceup: false,
          rezzed: false,
          tapped: false,
          advancementCounters: 0,
        } as unknown as CardInstance,
      },
      corpRd: ["agenda"],
    });
    agendaState.state.runner.rig.resources = ["mercenary" as CardInstanceId];
    const agendaAction = structuredClone(legalAction);
    agendaAction.payload = { ...agendaAction.payload, cardId: "agenda" };
    expect(() =>
      handleAccessExecution(agendaState.host, agendaAction),
    ).toThrow("Agendas koennen nicht als Hidden-Resource-Trash-Ziel");

    const poorState = makeHost({
      run: {
        runId: "run_4",
        attackedServerId: "rd",
        accessedCardId: "operation",
      } as unknown as NonNullable<GameState["run"]>,
      definitions,
      instances: {
        operation: instance("operation", "operation_def", {
          side: "corp",
          zone: "rd",
        }),
        mercenary: {
          id: "mercenary" as CardInstanceId,
          instanceId: "mercenary" as CardInstanceId,
          definitionId: "onr_proteus_145_mercenary-subcontract",
          owner: "runner",
          controller: "runner",
          zone: { side: "runner", zone: "rig" },
          faceup: false,
          rezzed: false,
          tapped: false,
          advancementCounters: 0,
        } as unknown as CardInstance,
      },
      corpRd: ["operation"],
      runnerCredits: 3,
    });
    poorState.state.runner.rig.resources = ["mercenary" as CardInstanceId];
    expect(() => handleAccessExecution(poorState.host, legalAction)).toThrow(
      "Runner kann die Hidden-Resource-Kosten nicht bezahlen.",
    );
  });

  it("adds Highlighter access context to each breached R&D access", () => {
    const breach = {
      breachId: "run_1.breach",
      serverId: "rd" as Exclude<ServerId, "new_remote">,
      accessMode: "multi" as const,
      queue: [
        {
          entryId: "entry_0",
          cardInstanceId: "asset" as CardInstanceId,
          serverId: "rd" as Exclude<ServerId, "new_remote">,
          zone: "rd" as const,
          status: "accessed" as const,
          hiddenInfo: true,
        },
        {
          entryId: "entry_1",
          cardInstanceId: "asset_2" as CardInstanceId,
          serverId: "rd" as Exclude<ServerId, "new_remote">,
          zone: "rd" as const,
          status: "pending" as const,
          hiddenInfo: true,
        },
        {
          entryId: "entry_2",
          cardInstanceId: "asset_3" as CardInstanceId,
          serverId: "rd" as Exclude<ServerId, "new_remote">,
          zone: "rd" as const,
          status: "pending" as const,
          hiddenInfo: true,
        },
      ],
      currentIndex: 1,
      completed: false,
      accessedSummaries: [],
    };
    const { host, state } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "rd",
        breach,
      } as unknown as NonNullable<GameState["run"]>,
      instances: {
        asset: instance("asset", "asset_def", { side: "corp", zone: "rd" }),
        asset_2: instance("asset_2", "asset_def", { side: "corp", zone: "rd" }),
        asset_3: instance("asset_3", "asset_def", { side: "corp", zone: "rd" }),
      },
      corpRd: ["asset", "asset_2", "asset_3"],
    });
    state.purgeableRunnerVirusCounters = { corp: { highlighter: 3 } };
    const legalAction = {
      side: "runner",
      type: "access_card",
      actionId: "runner.access_card",
      label: "Access",
      source: "run",
    } as unknown as LegalAction;

    handleAccessExecution(host, legalAction);

    expect(legalAction.payload).toMatchObject({
      accessedCardId: "asset_2",
      accessIndex: 1,
      baseAccessCount: 1,
      installedAccessBonus: 2,
      highlighterCounterCount: 3,
      highlighterAccessBonus: 2,
      effectiveAccessCount: 3,
    });
  });

  it("spends Garbage counters when Proteus free trash is used", () => {
    const breach = {
      breachId: "run_1.breach",
      serverId: "rd" as Exclude<ServerId, "new_remote">,
      accessMode: "single" as const,
      queue: [
        {
          entryId: "entry_0",
          cardInstanceId: "operation" as CardInstanceId,
          serverId: "rd" as Exclude<ServerId, "new_remote">,
          zone: "rd" as const,
          status: "accessed" as const,
          hiddenInfo: true,
        },
      ],
      currentIndex: 0,
      completed: false,
      accessedSummaries: [],
    };
    const { host, state, trashPayments, trashedCards } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "rd",
        accessedCardId: "operation",
        breach,
      } as unknown as NonNullable<GameState["run"]>,
      definitions: {
        operation: definition("operation_def", "operation"),
      },
      instances: {
        operation: instance("operation", "operation_def", {
          side: "corp",
          zone: "rd",
        }),
      },
      corpRd: ["operation"],
    });
    state.purgeableRunnerVirusCounters = { corp: { garbage: 3 } };
    const legalAction = {
      side: "runner",
      type: "trash_accessed_card",
      actionId: "runner.trash_accessed_card.operation.0",
      label: "Trash",
      source: "operation",
      payload: {
        accessTrashCostOverride: 0,
        freeAccessTrash: true,
        proteusRunnerVirusFreeTrashCounterType: "garbage",
      },
    } as unknown as LegalAction;

    const result = handleAccessExecution(host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      trashedCardId: "operation",
      runFinished: true,
    });
    expect(trashPayments).toEqual([{ amount: 0, cardId: "operation" }]);
    expect(trashedCards).toEqual(["operation"]);
    expect(state.purgeableRunnerVirusCounters?.corp?.garbage).toBe(1);
    expect(legalAction.payload).toMatchObject({
      proteusRunnerVirusFreeTrashCounterType: "garbage",
      garbageCountersSpent: 2,
      garbageCountersAfter: 1,
    });
  });

  it("advances breach queue on decline without finishing the run", () => {
    const breach = {
      breachId: "run_1.breach",
      serverId: "remote_1" as Exclude<ServerId, "new_remote">,
      accessMode: "multi" as const,
      queue: [
        {
          entryId: "entry_0",
          cardInstanceId: "asset" as CardInstanceId,
          serverId: "remote_1" as Exclude<ServerId, "new_remote">,
          zone: "remote_root" as const,
          status: "accessed" as const,
          hiddenInfo: false,
        },
        {
          entryId: "entry_1",
          cardInstanceId: "agenda" as CardInstanceId,
          serverId: "remote_1" as Exclude<ServerId, "new_remote">,
          zone: "remote_root" as const,
          status: "pending" as const,
          hiddenInfo: false,
        },
      ],
      currentIndex: 0,
      completed: false,
      accessedSummaries: [],
    };
    const { host, state, finishedRuns } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "remote_1",
        accessedCardId: "asset",
        breach,
      } as unknown as NonNullable<GameState["run"]>,
    });

    const result = handleAccessExecution(host, {
      side: "runner",
      type: "decline_trash",
      actionId: "runner.decline_trash.asset",
      label: "Decline",
      source: "asset",
    } as LegalAction);

    expect(result).toMatchObject({
      handled: true,
      breachQueueAdvanced: true,
      stateChanged: true,
    });
    expect(state.run?.breach?.queue[0]?.status).toBe("declined");
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(state.activeSide).toBe("runner");
    expect(finishedRuns).toEqual([]);
  });

  it("auto-advances archives breach cards that need no decision", () => {
    const breach = {
      breachId: "run_1.breach",
      serverId: "archives" as Exclude<ServerId, "new_remote">,
      accessMode: "multi" as const,
      queue: [
        {
          entryId: "entry_0",
          cardInstanceId: "ice" as CardInstanceId,
          serverId: "archives" as Exclude<ServerId, "new_remote">,
          zone: "archives" as const,
          status: "pending" as const,
          hiddenInfo: true,
        },
        {
          entryId: "entry_1",
          cardInstanceId: "agenda" as CardInstanceId,
          serverId: "archives" as Exclude<ServerId, "new_remote">,
          zone: "archives" as const,
          status: "pending" as const,
          hiddenInfo: true,
        },
      ],
      currentIndex: 0,
      completed: false,
      accessedSummaries: [],
    };
    const { host, state, finishedRuns } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "archives",
        breach,
      } as unknown as NonNullable<GameState["run"]>,
      corpArchives: ["ice", "agenda"],
    });
    const legalAction = {
      side: "runner",
      type: "access_card",
      actionId: "runner.access_card",
      label: "Access",
      source: "run",
    } as LegalAction;

    advanceArchivesBreachPastNonDecisionCards(host, legalAction);

    expect(state.run?.breach?.queue[0]?.status).toBe("accessed");
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.run?.breach?.accessedSummaries).toEqual([
      {
        entryId: "entry_0",
        status: "accessed",
        cardDefinitionId: "ice_def",
      },
    ]);
    expect(legalAction.payload).toEqual({ archivesAutoAccessedCount: 1 });
    expect(finishedRuns).toEqual([]);
  });
});
