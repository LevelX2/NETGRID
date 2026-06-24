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
  CounterType,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureDamageCoreHost,
  resetDamageCoreHostForTests,
  type DamageCoreHost,
} from "../damage/damage-core";
import {
  applySuccessfulRunExtraRunFollowup,
  applyDirectSuccessfulRunTriggers,
  buildSuccessfulRunFollowupActions,
  finalizeDelayedSuccessfulRunAfterPassedIce,
  resolveSuccessfulRunFollowupAbility,
  resolveSuccessfulRunInterventionChoice,
  type SuccessfulRunInterventionHost,
} from "./successful-run-interventions";

afterEach(() => {
  resetDamageCoreHostForTests();
});

function definition(
  id: string,
  title: string,
  type: CardDefinition["type"],
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title,
    type,
    ...options,
  } as CardDefinition;
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
    controller:
      options.controller ?? (zone.side === "runner" ? "runner" : "corp"),
    zone,
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    ...options,
  } as CardInstance;
}

function makeHost(
  options: {
    sourceDefinitionId?: string;
    sourceTitle?: string;
    hqIceRezCost?: number;
    existingIceCount?: number;
  } = {},
): {
  state: GameState;
  host: SuccessfulRunInterventionHost;
  servers: CorpServer[];
  begunEncounters: CardInstanceId[];
  approachedIce: CardInstanceId[];
  startedAccessCount: number;
  trashedCorpIds: CardInstanceId[];
  trashedRunnerIds: CardInstanceId[];
  finishedRuns: boolean[];
} {
  const sourceDefinitionId =
    options.sourceDefinitionId ?? "onr_v1_358_dr-dreff";
  const sourceTitle = options.sourceTitle ?? "Dr. Dreff";
  const hqIceRezCost = options.hqIceRezCost ?? 5;
  const existingIceCount = options.existingIceCount ?? 1;
  const definitions: Record<string, CardDefinition> = {
    [sourceDefinitionId]: definition(
      sourceDefinitionId,
      sourceTitle,
      "upgrade",
    ),
    hq_ice_def: definition("hq_ice_def", "HQ ICE", "ice", {
      rezCost: hqIceRezCost,
    }),
    existing_ice_def: definition("existing_ice_def", "Existing ICE", "ice", {
      rezCost: 3,
    }),
    "onr_v1_026_false-echo": definition(
      "onr_v1_026_false-echo",
      "False Echo",
      "program",
    ),
    "onr_v1_044_netspace-inverter": definition(
      "onr_v1_044_netspace-inverter",
      "Netspace Inverter",
      "program",
    ),
    "onr_v1_032_i-spy": definition("onr_v1_032_i-spy", "I Spy", "program"),
    "onr_v1_123_bodyweight-data-creche": definition(
      "onr_v1_123_bodyweight-data-creche",
      "Bodyweight Data Creche",
      "hardware",
    ),
    "onr_v1_166_karl-de-veres-corporate-stooge": definition(
      "onr_v1_166_karl-de-veres-corporate-stooge",
      "Karl de Veres",
      "resource",
    ),
    "onr_proteus_136_credit-subversion": definition(
      "onr_proteus_136_credit-subversion",
      "Credit Subversion",
      "resource",
    ),
    onr_proteus_078_armageddon: definition(
      "onr_proteus_078_armageddon",
      "Armageddon",
      "program",
    ),
  };
  const existingIceIds = Array.from(
    { length: existingIceCount },
    (_, index) => `existing_ice_${index + 1}` as CardInstanceId,
  );
  const servers = [
    {
      id: "remote_1",
      kind: "remote",
      ice: existingIceIds.slice(),
      root: ["source_upgrade" as CardInstanceId],
    },
    { id: "hq", kind: "hq", ice: [], root: [] },
    { id: "rd", kind: "rd", ice: [], root: [] },
    { id: "archives", kind: "archives", ice: [], root: [] },
  ] as unknown as CorpServer[];
  const cardInstances: Record<string, CardInstance> = {
    source_upgrade: instance(
      "source_upgrade",
      sourceDefinitionId,
      {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1",
      } as CardInstance["zone"],
      { faceup: true, rezzed: true },
    ),
    hq_ice: instance("hq_ice", "hq_ice_def", { side: "corp", zone: "hq" }),
    false_echo: instance("false_echo", "onr_v1_026_false-echo", {
      side: "runner",
      zone: "rig",
    }),
    netspace: instance("netspace", "onr_v1_044_netspace-inverter", {
      side: "runner",
      zone: "rig",
    }),
    i_spy: instance("i_spy", "onr_v1_032_i-spy", {
      side: "runner",
      zone: "rig",
    }),
    bodyweight: instance("bodyweight", "onr_v1_123_bodyweight-data-creche", {
      side: "runner",
      zone: "rig",
    }),
    karl: instance("karl", "onr_v1_166_karl-de-veres-corporate-stooge", {
      side: "runner",
      zone: "rig",
    }),
    credit_subversion: instance(
      "credit_subversion",
      "onr_proteus_136_credit-subversion",
      {
        side: "runner",
        zone: "rig",
      },
    ),
    armageddon: instance("armageddon", "onr_proteus_078_armageddon", {
      side: "runner",
      zone: "rig",
    }),
  };
  for (const iceId of existingIceIds) {
    cardInstances[iceId] = instance(iceId, "existing_ice_def", {
      side: "corp",
      zone: "serverIce",
      serverId: "remote_1",
    } as CardInstance["zone"]);
  }
  const state = {
    stateVersion: 3,
    phase: "run",
    timingPoint: "run.successful",
    activeSide: "corp",
    corp: {
      credits: 10,
      hq: ["hq_ice"],
      rd: [],
      archives: [],
      servers,
    },
    runner: {
      credits: 5,
      tags: 0,
      rig: {
        programs: ["false_echo", "netspace", "i_spy", "armageddon"],
        hardware: ["bodyweight"],
        resources: ["karl", "credit_subversion"],
      },
    },
    cardInstances,
    run: {
      runId: "run_1",
      attackedServerId: "remote_1",
      phase: "access",
      position: { kind: "server", serverId: "remote_1" },
      successful: true,
    },
  } as unknown as GameState;
  const begunEncounters: CardInstanceId[] = [];
  const approachedIce: CardInstanceId[] = [];
  let startedAccessCount = 0;
  const trashedCorpIds: CardInstanceId[] = [];
  const trashedRunnerIds: CardInstanceId[] = [];
  const finishedRuns: boolean[] = [];
  const host: SuccessfulRunInterventionHost = {
    state,
    cards: {
      definitionFor: (cardId) => {
        const found = definitions[cardInstances[cardId]?.definitionId ?? ""];
        if (!found) throw new Error(`missing definition for ${cardId}`);
        return found;
      },
      cardInstanceFor: (cardId) => {
        const found = cardInstances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
    },
    servers: {
      mustServer: (serverId) => {
        const server = servers.find((candidate) => candidate.id === serverId);
        if (!server) throw new Error(`missing server ${serverId}`);
        return server;
      },
      publicServerLabel: (serverId) => `Server ${serverId}`,
    },
    actions: {
      createRunnerTriggerAction: (label, source, costs, payload) =>
        ({
          side: "runner",
          type: "trigger_ability",
          label,
          source,
          costs,
          payload,
        }) as LegalAction,
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
    costs: {
      creditCostForAction: (legalAction) => legalAction.costs[0]?.credits ?? 0,
      rezCostForCard: (cardId) =>
        definitions[cardInstances[cardId]!.definitionId]!.rezCost ?? 0,
    },
    credits: {
      spend: (side, amount) => {
        state[side].credits -= amount;
      },
      gainRunner: (amount) => {
        state.runner.credits += amount;
      },
    },
    counters: {
      cardCounter: (cardId, type) =>
        Math.max(
          0,
          Math.floor(
            cardInstances[cardId]?.counters?.[type as CounterType] ?? 0,
          ),
        ),
      addCardCounter: (cardId, type, amount) => {
        const instance = cardInstances[cardId]!;
        const counterType = type as CounterType;
        instance.counters = {
          ...(instance.counters ?? {}),
          [counterType]:
            Math.max(0, Math.floor(instance.counters?.[counterType] ?? 0)) +
            amount,
        };
      },
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
        state.corp.hq = state.corp.hq.filter(
          (candidate) => candidate !== cardId,
        );
        for (const server of servers) {
          server.ice = server.ice.filter((candidate) => candidate !== cardId);
          server.root = server.root.filter((candidate) => candidate !== cardId);
        }
      },
      trashCorpInstalledCardToArchives: (cardId) => {
        trashedCorpIds.push(cardId);
        state.corp.archives.push(cardId);
        cardInstances[cardId] = {
          ...cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
        };
      },
      trashRunnerInstalledCardToHeap: (cardId) => {
        trashedRunnerIds.push(cardId);
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (candidate) => candidate !== cardId,
        );
      },
    },
    encounter: {
      beginEncounter: (iceId) => {
        begunEncounters.push(iceId);
      },
      approachOrEncounterIce: (iceId) => {
        approachedIce.push(iceId);
      },
    },
    access: {
      startAccessFromSuccessfulRun: () => {
        startedAccessCount += 1;
      },
      finishSuccessfulRun: () => {
        finishedRuns.push(true);
        delete state.run;
      },
    },
  };
  return {
    state,
    host,
    servers,
    begunEncounters,
    approachedIce,
    get startedAccessCount() {
      return startedAccessCount;
    },
    trashedCorpIds,
    trashedRunnerIds,
    finishedRuns,
  };
}

function configureSuccessfulRunDamageCoreHost(
  fixture: ReturnType<typeof makeHost>,
): void {
  configureDamageCoreHost({
    cards: {
      definitionFor: (_state, cardId) =>
        fixture.host.cards.definitionFor(cardId),
      runnerInstalledCardIds: (state) => [
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ],
      scoredCorpAgendaIds: (state) => state.corp.scoreArea,
      scoredAgendaKindForDefinition: () => undefined,
    },
    zones: {
      removeFromAllZones: (_state, cardId) => {
        fixture.state.runner.rig.resources =
          fixture.state.runner.rig.resources.filter((id) => id !== cardId);
      },
      trashRunnerInstalledCardToHeap: () => undefined,
      returnRunnerInstalledCardToGrip: () => undefined,
    },
    runner: {
      drawRunnerCard: () => undefined,
      ensureRunnerTurnFlags: (state) =>
        (state.runnerTurnFlags ??= {} as NonNullable<
          GameState["runnerTurnFlags"]
        >),
      addFutureActionDebt: () => undefined,
    },
    corp: {
      agendaPointTotal: () => 0,
      chooseAgendasForPointCost: () => [],
      agendaPointsForScoredCard: () => 0,
      forfeitAgendaForPointCost: () => undefined,
    },
    counters: {
      cardCounter: () => 0,
      spendCardCounter: () => undefined,
    },
    credits: {
      gain: (state, side, amount) => {
        state[side].credits += amount;
      },
      spend: (state, side, amount) => {
        state[side].credits -= amount;
      },
    },
    rng: {
      nextRandom: () => 0,
    },
  } satisfies DamageCoreHost);
}

function delayedChoice(
  kind:
    | "temporary_hq_ice_encounter_after_successful_run"
    | "install_hq_ice_innermost_after_successful_run",
): NonNullable<GameState["pendingChoice"]> {
  return {
    choiceId: "p3_54_delayed_success_4",
    side: "corp",
    source: `p3_54.delayed_success:source_upgrade:${kind}:remote_1:4`,
    prompt: "Delayed success",
    kind: "select_option",
    options: [
      {
        id: "decline",
        label: "Decline",
        publicLabel: "Decline",
        value: "decline",
      },
      {
        id: "ice_hq_ice",
        label: "ICE aus HQ",
        publicLabel: "ICE aus HQ",
        value: "hq_ice",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 4,
    visibility: "hidden_info_barrier",
  };
}

describe("successful run interventions", () => {
  it("resolves Dr. Dreff by paying half rez cost and starting a temporary encounter", () => {
    const fixture = makeHost({ hqIceRezCost: 5 });
    fixture.state.pendingChoice = delayedChoice(
      "temporary_hq_ice_encounter_after_successful_run",
    );
    const legalAction = { payload: {}, costs: [] } as unknown as LegalAction;

    const result = resolveSuccessfulRunInterventionChoice(
      fixture.host,
      legalAction,
      {
        selectedChoices: { selectedOptionIds: ["ice_hq_ice"] },
      } as unknown as PlayerAction,
    );

    expect(result).toMatchObject({
      handled: true,
      temporaryEncounterIceId: "hq_ice",
      rezCostPaid: 2,
      encounterStarted: true,
      successFinalizationDelayed: true,
    });
    expect(fixture.state.corp.credits).toBe(8);
    expect(fixture.state.corp.hq).toEqual([]);
    expect(fixture.servers[0]!.ice[0]).toBe("hq_ice");
    expect(fixture.state.run?.phase).toBe("encounter_ice");
    expect(fixture.begunEncounters).toEqual(["hq_ice"]);
    expect(legalAction.payload).toMatchObject({
      selectedIceDefinitionId: "hq_ice_def",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_54_dr_dreff_temporary_encounter",
    });
    expect(legalAction.payload).not.toHaveProperty("unselectedHqCardIds");
  });

  it("resolves Jenny Jett by installing innermost at current ICE count cost", () => {
    const fixture = makeHost({
      sourceDefinitionId: "onr_v1_359_jenny-jett",
      sourceTitle: "Jenny Jett",
      existingIceCount: 2,
    });
    fixture.state.pendingChoice = delayedChoice(
      "install_hq_ice_innermost_after_successful_run",
    );
    const legalAction = { payload: {}, costs: [] } as unknown as LegalAction;

    const result = resolveSuccessfulRunInterventionChoice(
      fixture.host,
      legalAction,
      {
        selectedChoices: { selectedOptionIds: ["ice_hq_ice"] },
      } as unknown as PlayerAction,
    );

    expect(result).toMatchObject({
      handled: true,
      installedIceId: "hq_ice",
      installCost: 2,
      approachStarted: true,
      successFinalizationDelayed: true,
    });
    expect(fixture.state.corp.credits).toBe(8);
    expect(fixture.servers[0]!.ice[0]).toBe("hq_ice");
    expect(fixture.state.cardInstances.hq_ice?.rezzed).toBe(false);
    expect(fixture.state.run?.phase).toBe("approach_ice");
    expect(fixture.approachedIce).toEqual(["hq_ice"]);
    expect(legalAction.payload).toMatchObject({
      installCostPaid: 2,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_54_jenny_jett_install_approach",
    });
  });

  it("finalizes delayed success and trashes Dr. Dreff temporary ICE after passing it", () => {
    const fixture = makeHost();
    fixture.state.run = {
      ...(fixture.state.run as NonNullable<GameState["run"]>),
      delayedSuccessfulRun: {
        originalServerId: "remote_1",
        interventionSourceId: "source_upgrade",
        pendingMode: "temporary_hq_ice_encounter",
        temporaryIceId: "hq_ice",
      },
    };
    fixture.state.cardInstances.hq_ice = {
      ...fixture.state.cardInstances.hq_ice!,
      zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
    };
    const legalAction = { payload: {}, costs: [] } as unknown as LegalAction;

    const result = finalizeDelayedSuccessfulRunAfterPassedIce(
      fixture.host,
      "hq_ice",
      legalAction,
    );

    expect(result).toMatchObject({ handled: true, successFinalized: true });
    expect(fixture.trashedCorpIds).toEqual(["hq_ice"]);
    expect(fixture.state.run?.delayedSuccessfulRun).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      temporaryEncounterTrashed: true,
      successfulRunFinalizedAfterIntervention: true,
      delayedSuccessfulRun: false,
    });
  });

  it("builds and resolves False Echo, Netspace and I Spy followups", () => {
    const fixture = makeHost({ existingIceCount: 2 });

    const actions = buildSuccessfulRunFollowupActions(
      fixture.host,
      fixture.state.run as NonNullable<GameState["run"]>,
    );

    expect(actions.map((action) => action.payload)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          v1922RunnerProgramAbility: "successful_run_force_rez",
        }),
        expect.objectContaining({
          v1922RunnerProgramAbility: "successful_run_reverse_ice",
        }),
        expect.objectContaining({
          runnerUtilityAbility: "successful_run_fort_counter_expose",
        }),
      ]),
    );

    const falseEchoAction = actions.find(
      (action) =>
        action.payload?.v1922RunnerProgramAbility === "successful_run_force_rez",
    )!;
    resolveSuccessfulRunFollowupAbility(fixture.host, falseEchoAction);
    expect(fixture.state.runner.credits).toBe(3);
    expect(fixture.state.corp.credits).toBe(4);
    expect(falseEchoAction.payload).toMatchObject({
      successfulRunForceRezCreditCost: 2,
      checkedIceCount: 2,
      rezzedIceCount: 2,
      rezCostPaid: 6,
    });

    fixture.state.run = {
      ...(fixture.state.run as NonNullable<GameState["run"]>),
      successfulRunAbilityUsedSourceIds: [],
    };
    const beforeOrder = fixture.servers[0]!.ice.slice();
    const netspaceAction = actions.find(
      (action) =>
        action.payload?.v1922RunnerProgramAbility ===
        "successful_run_reverse_ice",
    )!;
    resolveSuccessfulRunFollowupAbility(fixture.host, netspaceAction);
    expect(fixture.servers[0]!.ice).toEqual(beforeOrder.reverse());

    fixture.state.run = {
      ...(fixture.state.run as NonNullable<GameState["run"]>),
      successfulRunAbilityUsedSourceIds: [],
    };
    const iSpyAction = actions.find(
      (action) =>
        action.payload?.runnerUtilityAbility === "successful_run_fort_counter_expose",
    )!;
    resolveSuccessfulRunFollowupAbility(fixture.host, iSpyAction);
    expect(fixture.trashedRunnerIds).toEqual(["i_spy"]);
    expect(fixture.state.spyCountersByServer?.remote_1).toBe(1);
    expect(iSpyAction.payload).toMatchObject({
      counterType: "spy",
      addedCounterAmount: 1,
      exposedServerId: "remote_1",
    });
  });

  it("uses primitive ability keys for hidden successful-run followups and keeps legacy fallback", () => {
    const fixture = makeHost();
    fixture.state.run = {
      ...(fixture.state.run as NonNullable<GameState["run"]>),
      attackedServerId: "hq",
      position: { kind: "server", serverId: "hq" },
    };
    const action = buildSuccessfulRunFollowupActions(
      fixture.host,
      fixture.state.run as NonNullable<GameState["run"]>,
    ).find(
      (candidate) =>
        candidate.payload?.cardImplementationEffectKind === "corp_lose_credits",
    );
    expect(action?.payload).toMatchObject({
      cardImplementationAbilityId:
        "onr_proteus_136_credit-subversion:successful_run_before_access:0",
      cardImplementationAbilityKey: "successful_run_before_access:0",
      cardImplementationPrimitiveKind: "successful_run_before_access_effect",
      cardImplementationEffectKind: "corp_lose_credits",
    });
    if (!action) throw new Error("Missing Credit Subversion action");

    expect(() =>
      resolveSuccessfulRunFollowupAbility(fixture.host, {
        ...action,
        payload: {
          ...(action.payload ?? {}),
          cardImplementationAbilityKey: "successful_run_before_access:wrong",
        },
      } as LegalAction),
    ).toThrow("Die Hidden-Resource-Faehigkeit passt nicht zur Karte.");
    expect(fixture.state.cardInstances.credit_subversion?.tapped).not.toBe(
      true,
    );

    const legacyFixture = makeHost();
    configureSuccessfulRunDamageCoreHost(legacyFixture);
    legacyFixture.state.run = {
      ...(legacyFixture.state.run as NonNullable<GameState["run"]>),
      attackedServerId: "hq",
      position: { kind: "server", serverId: "hq" },
    };
    const legacyAction = buildSuccessfulRunFollowupActions(
      legacyFixture.host,
      legacyFixture.state.run as NonNullable<GameState["run"]>,
    ).find(
      (candidate) =>
        candidate.payload?.cardImplementationEffectKind === "corp_lose_credits",
    );
    if (!legacyAction)
      throw new Error("Missing legacy Credit Subversion action");
    const legacyPayload = { ...(legacyAction.payload ?? {}) };
    delete (legacyPayload as Record<string, unknown>)
      .cardImplementationAbilityKey;
    delete (legacyPayload as Record<string, unknown>)
      .cardImplementationAbilityId;

    const result = resolveSuccessfulRunFollowupAbility(legacyFixture.host, {
      ...legacyAction,
      payload: legacyPayload,
    } as LegalAction);

    expect(result.handled).toBe(true);
    expect(legacyFixture.state.cardInstances.credit_subversion?.tapped).toBe(
      true,
    );
  });

  it("builds and resolves Armageddon R&D access replacement through Runner followups", () => {
    const fixture = makeHost();
    fixture.state.run = {
      ...(fixture.state.run as NonNullable<GameState["run"]>),
      attackedServerId: "rd",
      position: { kind: "server", serverId: "rd" },
    };

    const actions = buildSuccessfulRunFollowupActions(
      fixture.host,
      fixture.state.run as NonNullable<GameState["run"]>,
    );
    const armageddonAction = actions.find(
      (action) =>
        action.payload?.proteusRunnerVirusFollowup ===
        "doom_counter_instead_of_rd_access",
    );

    expect(armageddonAction).toMatchObject({
      side: "runner",
      type: "trigger_ability",
      source: "armageddon",
      costs: [],
      payload: {
        cardId: "armageddon",
        serverId: "rd",
        counterType: "doom",
        counterDelta: 1,
      },
    });
    if (!armageddonAction) throw new Error("Missing Armageddon action");
    expect(() =>
      resolveSuccessfulRunFollowupAbility(fixture.host, {
        ...armageddonAction,
        side: "corp",
      } as LegalAction),
    ).toThrow("Nur der Runner");

    const result = resolveSuccessfulRunFollowupAbility(
      fixture.host,
      armageddonAction,
    );

    expect(result).toMatchObject({
      handled: true,
      sourceCardId: "armageddon",
      sourceDefinitionId: "onr_proteus_078_armageddon",
      counterPlaced: true,
    });
    expect(fixture.state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      doom: 1,
    });
    expect(fixture.finishedRuns).toEqual([true]);
    expect(fixture.state.run).toBeUndefined();
    expect(armageddonAction.payload).toMatchObject({
      proteusRunnerVirusFollowup: "doom_counter_instead_of_rd_access",
      counterType: "doom",
      counterDelta: 1,
      counterTotalAfter: 1,
      sourceCardDefinitionId: "onr_proteus_078_armageddon",
      serverId: "rd",
    });
  });

  it("applies Karl credits and Bodyweight extra-run flags without changing payload fields", () => {
    const fixture = makeHost();
    const legalAction = { payload: {}, costs: [] } as unknown as LegalAction;

    const karl = applyDirectSuccessfulRunTriggers(fixture.host, legalAction);
    const bodyweight = applySuccessfulRunExtraRunFollowup(
      fixture.host,
      legalAction,
    );

    expect(karl).toMatchObject({ handled: true, creditsGained: 1 });
    expect(bodyweight).toMatchObject({
      handled: true,
      sourceCardId: "bodyweight",
    });
    expect(fixture.state.runner.credits).toBe(6);
    expect(fixture.state.runnerTurnFlags).toMatchObject({
      successfulRunExtraRunPending: true,
      successfulRunExtraRunUsedThisTurn: true,
      bonusRunPending: true,
    });
    expect(legalAction.payload).toMatchObject({
      karlSuccessfulRunCreditGain: 1,
      successfulRunExtraRunPending: true,
      sourceDefinitionId: "onr_v1_123_bodyweight-data-creche",
    });
  });
});
