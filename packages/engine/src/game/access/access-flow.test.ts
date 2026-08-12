import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
  SpecialZoneState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { RunnerAccessActionHost } from "./access-actions";
import {
  advanceArchivesBreachPastNonDecisionCards,
  handleAccessExecution,
  resolveMercenaryCurrentAccessTrashChoice,
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

function makeHost(
  options: {
    run?: GameState["run"] | null;
    definitions?: Record<string, CardDefinition>;
    instances?: Record<string, CardInstance>;
    servers?: CorpServer[];
    corpRd?: string[];
    corpHq?: string[];
    corpArchives?: string[];
    runnerScoreArea?: string[];
    runnerCredits?: number;
  } = {},
): {
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
      heap: [],
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
      hiddenStackInstallRunActions: () => [],
    },
  };

  const host: AccessFlowHost = {
    state,
    accessActions,
    cards: {
      definitionFor: accessActions.cards.definitionFor,
      cardInstanceFor: accessActions.cards.cardInstanceFor,
      cardHasSubtype: () => false,
      runnerProgramUsesMemory: (cardId) =>
        state.runner.rig.programs.includes(cardId),
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
        state.runner.scoreArea = state.runner.scoreArea.filter(
          (id) => id !== cardId,
        );
        state.runner.rig.resources = state.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
        state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
        state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
        for (const server of state.corp.servers) {
          server.root = server.root.filter((id) => id !== cardId);
          server.ice = server.ice.filter((id) => id !== cardId);
        }
      },
      trashRunnerInstalledCardToHeap: (cardId) => {
        const card = state.cardInstances[cardId];
        if (!card) return;
        state.runner.rig.resources = state.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        state.runner.heap.push(cardId);
        state.cardInstances[cardId] = {
          ...card,
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "heap" },
        };
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
        host.zones.removeFromAllZones(cardId);
        state.corp.archives.push(cardId);
        const instance = state.cardInstances[cardId];
        if (instance)
          state.cardInstances[cardId] = {
            ...instance,
            faceup: true,
            rezzed: true,
            zone: { side: "corp", zone: "archives" },
          };
      },
    },
    run: {
      finishRun: (successful) => {
        finishedRuns.push(successful);
        delete state.run;
      },
      startPostAccessInstalledProgramChoice: () => false,
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
    expect(state.cardInstances.asset!.faceup).toBe(false);
    expect(effects).toEqual(["asset"]);
    expect(legalAction.payload).toMatchObject({
      accessedCardId: "asset",
      serverId: "remote_1",
      accessOrigin: "remote_root",
    });
  });

  it("publishes central root and HQ card access origins without card identity guesses", () => {
    const hqRoot = instance("hq_root", "asset_def", {
      side: "corp",
      zone: "serverRoot",
      serverId: "hq",
    } as CardInstance["zone"]);
    const hqCard = instance("hq_card", "ice_def", {
      side: "corp",
      zone: "hq",
    });
    const breach = {
      breachId: "run_hq.breach",
      serverId: "hq" as Exclude<ServerId, "new_remote">,
      accessMode: "multi" as const,
      queue: [
        {
          entryId: "root",
          cardInstanceId: "hq_root" as CardInstanceId,
          serverId: "hq" as Exclude<ServerId, "new_remote">,
          zone: "remote_root" as const,
          status: "pending" as const,
          hiddenInfo: false,
        },
        {
          entryId: "hq",
          cardInstanceId: "hq_card" as CardInstanceId,
          serverId: "hq" as Exclude<ServerId, "new_remote">,
          zone: "hq" as const,
          status: "pending" as const,
          hiddenInfo: true,
        },
      ],
      currentIndex: 0,
      completed: false,
      accessedSummaries: [],
    };
    const { host, state } = makeHost({
      run: {
        runId: "run_hq",
        attackedServerId: "hq",
        breach,
      } as unknown as NonNullable<GameState["run"]>,
      instances: { hq_root: hqRoot, hq_card: hqCard },
      corpHq: ["hq_card"],
      servers: [
        { id: "hq", ice: [], root: ["hq_root"] },
        { id: "rd", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
      ] as unknown as CorpServer[],
    });
    const rootAction = {
      side: "runner",
      type: "access_card",
      actionId: "runner.access.root",
      label: "Access",
      source: "run",
    } as unknown as LegalAction;
    handleAccessExecution(host, rootAction);
    expect(state.cardInstances.hq_root!.faceup).toBe(false);
    expect(rootAction.payload).toMatchObject({
      serverId: "hq",
      accessIndex: 0,
      accessOrigin: "central_root",
    });

    state.run!.accessedCardId = "hq_root" as CardInstanceId;
    const decline = {
      side: "runner",
      type: "decline_trash",
      actionId: "runner.decline.root",
      label: "Decline",
      source: "hq_root",
    } as LegalAction;
    handleAccessExecution(host, decline);
    expect(decline.payload).toMatchObject({
      accessIndex: 0,
      accessOrigin: "central_root",
    });

    const hqAction = {
      side: "runner",
      type: "access_card",
      actionId: "runner.access.hq",
      label: "Access",
      source: "run",
    } as unknown as LegalAction;
    handleAccessExecution(host, hqAction);
    expect(hqAction.payload).toMatchObject({
      serverId: "hq",
      accessIndex: 1,
      accessOrigin: "hq",
    });
  });

  it("exposes installed corp cards when Schematics Search Engine accesses HQ", () => {
    const { host, state, effects } = makeHost({
      run: {
        runId: "run_1",
        attackedServerId: "hq",
      } as unknown as NonNullable<GameState["run"]>,
      definitions: {
        hqCard: definition("hq_card_def", "operation"),
        asset: definition("asset_def", "asset", 3),
        ice: definition("ice_def", "ice"),
        schematics: definition(
          "onr_classic_032_schematics-search-engine",
          "program",
        ),
      },
      instances: {
        hq_card: instance("hq_card", "hq_card_def", {
          side: "corp",
          zone: "hq",
        }),
        asset: instance("asset", "asset_def", {
          side: "corp",
          zone: "serverRoot",
          serverId: "remote_1",
        } as CardInstance["zone"]),
        ice: instance("ice", "ice_def", {
          side: "corp",
          zone: "serverIce",
          serverId: "remote_1",
        } as CardInstance["zone"]),
        schematics: {
          id: "schematics" as CardInstanceId,
          instanceId: "schematics" as CardInstanceId,
          definitionId:
            "onr_classic_032_schematics-search-engine" as CardDefinitionId,
          owner: "runner",
          controller: "runner",
          zone: { side: "runner", zone: "rig" },
          faceup: true,
          rezzed: true,
          advancementCounters: 0,
        } as unknown as CardInstance,
      },
      corpHq: ["hq_card"],
      servers: [
        { id: "remote_1", ice: ["ice"], root: ["asset"] },
        { id: "rd", ice: [], root: [] },
        { id: "hq", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
      ] as unknown as CorpServer[],
    });
    state.runner.rig.programs = ["schematics" as CardInstanceId];
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
      accessedCardId: "hq_card",
      serverId: "hq",
      stateChanged: true,
    });
    expect(effects).toEqual(["hq_card"]);
    expect(legalAction.payload).toMatchObject({
      accessedCardId: "hq_card",
      serverId: "hq",
      runnerUtilityAbility: "hq_access_expose_all_installed_corp_cards",
      hiddenZoneAction:
        "schematics_search_engine_expose_installed_cards_review",
      publicRevealKind: "expose",
      sourceDefinitionId: "onr_classic_032_schematics-search-engine",
      revealedCount: 2,
      publicRevealDefinitionIds: "asset_def,ice_def",
      publicRevealTitles: "asset_def||ice_def",
      exposedServerLabels: "remote_1 root,remote_1 ICE 1",
      exposedCardInstanceIds: "asset,ice",
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      prompt: "Installierte Korp-Karten ansehen",
      kind: "select_option",
      options: [{ id: "done", label: "Ansehen beenden", value: "done" }],
      minSelections: 1,
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(state.pendingChoice?.source).toContain(
      "p3_36.expose_installed_cards_review:asset|ice:schematics:onr_classic_032_schematics-search-engine:",
    );
    expect(JSON.stringify(legalAction.payload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"hq"\s*:/,
    );
  });

  it("steals an accessed agenda after revalidating the current steal cost", () => {
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
      costs: [] as LegalAction["costs"],
    } as LegalAction);

    expect(result).toMatchObject({
      handled: true,
      stolenAgendaId: "agenda",
      paidCredits: 0,
      runFinished: true,
    });
    expect(spentRunnerCredits).toEqual([0]);
    expect(state.runner.scoreArea).toEqual(["agenda"]);
    expect(state.cardInstances.agenda!.zone).toEqual({
      side: "runner",
      zone: "scoreArea",
    });
    expect(finishedRuns).toEqual([true]);
  });

  it("trashes an accessed card through the existing trash payment and lifecycle callbacks", () => {
    const { host, state, trashPayments, trashedCards, finishedRuns } = makeHost(
      {
        run: {
          runId: "run_1",
          attackedServerId: "remote_1",
          accessedCardId: "asset",
        } as unknown as NonNullable<GameState["run"]>,
      },
    );
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

    expect(result).toMatchObject({ handled: true, stateChanged: true });
    expect(spentRunnerCredits).toEqual([4]);
    expect(trashPayments).toEqual([]);
    expect(trashedCards).toEqual([]);
    expect(state.pendingChoice).toMatchObject({
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.runner.credits).toBe(6);
    expect(state.runner.rig.resources).not.toContain("mercenary");
    expect(state.runner.heap).toContain("mercenary");
    expect(state.cardInstances.mercenary?.tapped).not.toBe(true);
    expect(state.cardInstances.mercenary?.faceup).toBe(true);
    expect(state.cardInstances.mercenary?.zone).toEqual({
      side: "runner",
      zone: "heap",
    });
    expect(legalAction.payload).toMatchObject({
      sourceTrashed: true,
      trashedCardDefinitionId: "onr_proteus_145_mercenary-subcontract",
      hiddenZoneAction: "proteus_hidden_current_access_free_trash_choice",
    });
    resolveMercenaryCurrentAccessTrashChoice(
      host,
      {
        side: "runner",
        type: "resolve_choice",
        actionId: "runner.resolve_choice",
        label: "Trash",
        source: "choice",
        payload: { choiceId: state.pendingChoice?.choiceId },
      } as unknown as LegalAction,
      {
        matchId: "match",
        side: "runner",
        actionId: "runner.resolve_choice",
        clientKnownStateVersion: state.pendingChoice!.stateVersion,
        selectedChoices: {
          choiceId: state.pendingChoice!.choiceId,
          selectedOptionIds: ["operation"],
        },
      } as PlayerAction,
    );
    expect(trashedCards).toEqual(["operation"]);
    expect(state.corp.archives).toEqual(["operation"]);
    expect(state.run).toBeUndefined();

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
          faceup: true,
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
          faceup: true,
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
    handleAccessExecution(agendaState.host, agendaAction);
    resolveMercenaryCurrentAccessTrashChoice(
      agendaState.host,
      {
        side: "runner",
        type: "resolve_choice",
        actionId: "runner.resolve_choice",
        label: "Trash agenda",
        source: "choice",
        payload: { choiceId: agendaState.state.pendingChoice?.choiceId },
      } as unknown as LegalAction,
      {
        matchId: "match",
        side: "runner",
        actionId: "runner.resolve_choice",
        clientKnownStateVersion: agendaState.state.pendingChoice!.stateVersion,
        selectedChoices: {
          choiceId: agendaState.state.pendingChoice!.choiceId,
          selectedOptionIds: ["agenda"],
        },
      } as PlayerAction,
    );
    expect(agendaState.trashedCards).toEqual(["agenda"]);

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
          faceup: true,
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

  it("lets Mercenary trash a paid subset of already revealed current-breach cards including agendas", () => {
    const definitions = {
      asset: definition("asset_def", "asset"),
      agenda: definition("agenda_def", "agenda"),
      mercenary: definition(
        "onr_proteus_145_mercenary-subcontract",
        "resource",
      ),
    };
    const run = {
      runId: "run_multi",
      attackedServerId: "rd",
      accessedCardId: "agenda",
      breach: {
        breachId: "run_multi.breach",
        serverId: "rd",
        accessMode: "multi",
        queue: [
          {
            entryId: "run_multi.breach.0",
            cardInstanceId: "asset",
            serverId: "rd",
            zone: "rd",
            status: "declined",
            hiddenInfo: true,
          },
          {
            entryId: "run_multi.breach.1",
            cardInstanceId: "agenda",
            serverId: "rd",
            zone: "rd",
            status: "accessed",
            hiddenInfo: true,
          },
        ],
        currentIndex: 1,
        completed: false,
        accessedSummaries: [
          {
            entryId: "run_multi.breach.0",
            status: "declined",
            cardDefinitionId: "asset_def",
          },
        ],
      },
    } as unknown as NonNullable<GameState["run"]>;
    const { host, state, spentRunnerCredits, trashedCards } = makeHost({
      run,
      definitions,
      instances: {
        asset: instance("asset", "asset_def", { side: "corp", zone: "rd" }),
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
      corpRd: ["asset", "agenda"],
    });
    state.cardInstances.mercenary = {
      ...state.cardInstances.mercenary!,
      faceup: true,
    };
    state.runner.rig.resources = ["mercenary" as CardInstanceId];
    const activation = {
      side: "runner",
      type: "trash_accessed_card",
      actionId: "runner.trash_accessed_card.agenda.mercenary",
      label: "Mercenary",
      source: "agenda",
      costs: [{ credits: 4 }],
      payload: {
        cardId: "agenda",
        accessTrashCostOverride: 0,
        freeAccessTrash: true,
        hiddenResourceCurrentAccessTrash: true,
        hiddenResourceSourceCardId: "mercenary",
        hiddenResourceSourceDefinitionId:
          "onr_proteus_145_mercenary-subcontract",
      },
    } as unknown as LegalAction;

    handleAccessExecution(host, activation);

    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "asset",
      "agenda",
    ]);
    expect(state.pendingChoice).toMatchObject({
      minSelections: 1,
      maxSelections: 2,
      visibility: "hidden_info_barrier",
    });
    const choice = state.pendingChoice!;
    const resolution = {
      side: "runner",
      type: "resolve_choice",
      actionId: "runner.resolve_choice",
      label: "Trash both",
      source: "choice",
      payload: { choiceId: choice.choiceId },
    } as unknown as LegalAction;
    resolveMercenaryCurrentAccessTrashChoice(host, resolution, {
      matchId: "match",
      side: "runner",
      actionId: resolution.actionId,
      clientKnownStateVersion: choice.stateVersion,
      selectedChoices: {
        choiceId: choice.choiceId,
        selectedOptionIds: ["asset", "agenda"],
      },
    });

    expect(spentRunnerCredits).toEqual([4]);
    expect(trashedCards).toEqual(["asset", "agenda"]);
    expect(state.corp.archives).toEqual(["asset", "agenda"]);
    expect(state.runner.heap).toEqual(["mercenary"]);
    expect(state.run).toBeUndefined();
    expect(resolution.payload).toMatchObject({
      currentAccessTrashCount: 2,
      currentAccessTrashDefinitionIds: "asset_def,agenda_def",
    });
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

  it("defers Garbage counter spending until the run ends", () => {
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
    expect(state.purgeableRunnerVirusCounters?.corp?.garbage).toBe(3);
    expect(legalAction.payload).toMatchObject({
      proteusRunnerVirusFreeTrashCounterType: "garbage",
      garbageCountersSpent: 0,
      garbageCountersAfter: 3,
      garbageCountersRemoveAtRunEnd: 2,
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
