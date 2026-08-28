import {
  CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canPlayCorpOperation,
  cardImplementationOperationLegalActions,
  resolveCorpOperation,
  type CorpOperationResolutionHost,
} from "./corp-operation-resolution";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";

const OPERATION_ID = "operation_1" as CardInstanceId;
const RESOURCE_ID = "resource_1" as CardInstanceId;
const HIDDEN_RESOURCE_ID = "hidden_resource_1" as CardInstanceId;
const RUNNER_RESOURCE_DEFINITION_ID = "onr_v1_151_aujourdoui";
const CORP_ASSET_DEFINITION_ID = "onr_v1_308_acme-savings-and-loan";

function state(): GameState {
  return {
    stateVersion: 4,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 3,
      tags: 1,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [RESOURCE_ID] },
    },
    corp: {
      credits: 6,
      clicks: 3,
      hq: [OPERATION_ID],
      rd: ["rd_1" as CardInstanceId, "rd_2" as CardInstanceId],
      archives: ["archive_1" as CardInstanceId],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      badPublicity: 0,
      servers: [],
    },
    cardInstances: {
      [OPERATION_ID]: instance(OPERATION_ID, "simple_economy_operation", {
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "hq" },
      }),
      [RESOURCE_ID]: instance(RESOURCE_ID, RUNNER_RESOURCE_DEFINITION_ID, {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
      }),
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id,
    instanceId: id,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "hq" },
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters: 0,
    strengthModifier: 0,
    ...options,
  } as unknown as CardInstance;
}

function definition(
  id: string,
  options: Partial<CardDefinition> = {},
): CardDefinition {
  const cost = options.cost ?? 1;
  return {
    id,
    title: options.title ?? id,
    side: "corp",
    type: "operation",
    cost,
    playCost: { kind: "fixed", credits: cost },
    ...options,
  } as CardDefinition;
}

function canonicalDefinition(id: string): CardDefinition {
  const result =
    CARD_DEFINITIONS_BY_ID[id as keyof typeof CARD_DEFINITIONS_BY_ID];
  if (!result) throw new Error(`Missing canonical card definition: ${id}`);
  return result;
}

function action(type = "play_operation"): LegalAction {
  return {
    actionId: "corp.play_operation.operation_1",
    side: "corp",
    type,
    label: "Play operation",
    source: OPERATION_ID,
    stateVersion: 4,
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    payload: { cardId: OPERATION_ID },
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 5,
  } as unknown as LegalAction;
}

function hostFor(
  targetState: GameState,
  calls: string[] = [],
  overrides: Partial<CorpOperationResolutionHost> = {},
): CorpOperationResolutionHost {
  const host: CorpOperationResolutionHost = {
    state: targetState,
    actions: {
      buildLegalAction: (_state, side, type, label, source, costs, payload) =>
        ({
          actionId: `${side}.${type}.${source}`,
          side,
          type,
          label,
          source,
          stateVersion: targetState.stateVersion,
          timingPoint: targetState.timingPoint,
          costs,
          payload,
          targetRequirements: [],
          visibility: "private_to_actor",
          expiresAtStateVersion: targetState.stateVersion + 1,
        }) as LegalAction,
    },
    cards: {
      isCorpInstallableCardType: (cardDefinition) =>
        cardDefinition.side === "corp" && cardDefinition.type === "asset",
    },
    corp: {
      drawCorpCards: (amount) => calls.push(`drawCorpCards:${amount}`),
      ensureTurnFlags: () =>
        (targetState.corpTurnFlags ??= {
          scoredBlackOpsAgendaThisTurn: false,
          scoredBlackOpsAgendaLastTurn: false,
        } as NonNullable<GameState["corpTurnFlags"]>),
      runnerStoleAgendaLastTurn: () => true,
      runnerStolenAgendaAdvancementCountersLastTurn: () => 2,
      swapCorpHqAndRdTop: () => calls.push("swapCorpHqAndRdTop"),
    },
    runner: {
      requireRunnerTagged: () => {
        if (targetState.runner.tags <= 0)
          throw new Error("Runner ist nicht getaggt.");
      },
      runnerLastTurnInstalledResourceIds: () => [RESOURCE_ID],
      isConcealedRunnerResource: (cardId) => cardId === HIDDEN_RESOURCE_ID,
      hiddenRunnerResourceSlotId: () => "hidden_slot_1",
    },
    economy: {
      gainCorpCredits: (amount) => {
        targetState.corp.credits += amount;
        calls.push(`gainCorpCredits:${amount}`);
      },
    },
    zones: {
      trashRunnerInstalledCardToHeap: (cardId) => {
        targetState.runner.rig.resources =
          targetState.runner.rig.resources.filter((id) => id !== cardId);
        targetState.runner.heap.push(cardId);
        calls.push(`trashRunner:${cardId}`);
      },
    },
    damage: {
      resolveDamageOperation: (
        _legalAction,
        damageType,
        amount,
        sourceDefinitionId,
      ) => calls.push(`damage:${damageType}:${amount}:${sourceDefinitionId}`),
      addRunnerTagsWithPrevention: (_legalAction, amount, source) =>
        calls.push(`tag:${amount}:${source}`),
    },
    hiddenZone: {
      startCorpArchivesToHqChoice: (_legalAction, sourceCardId) =>
        calls.push(`archivesToHq:${sourceCardId}`),
      startCorpHqCardToRdChoice: (_legalAction, sourceCardId) =>
        calls.push(`hqToRd:${sourceCardId}`),
      startCorpRdTopReorderChoice: (_legalAction, sourceCardId) =>
        calls.push(`rdReorder:${sourceCardId}`),
      resolveConcealAndReorderInstalledIce: () => calls.push("newBlood"),
    },
    board: {
      installedAgendaOperationTarget: () => RESOURCE_ID,
      advanceableInstalledCardTargets: () => [RESOURCE_ID],
      advancementDistributionOptions: () => [RESOURCE_ID],
      moveAdvancementOptions: () => [RESOURCE_ID],
      resolveAgendaCounterOperation: (_legalAction, sourceDefinitionId) =>
        calls.push(`agendaCounter:${sourceDefinitionId}`),
      resolveCorpOperationAddAdvancementCounters: () =>
        calls.push("managementShakeUp"),
      resolveAdvancementPlacementOperation: () =>
        calls.push("systematicLayoffs"),
    },
    operations: {
      hardwareTrashByCounterEligibleHardwareIds: () => [RESOURCE_ID],
      resolveHardwareTrashByCounterOperation: () =>
        calls.push("hardwareTrashByCounter"),
      resolveTaggedRunnerResourceMultiTrashOperation: () =>
        calls.push("runnerResourceMultiTrash"),
    },
    cardImplementation: {
      canPlayPrintedCostOnPlay: () => true,
      executeOnPlayAbility: (_legalAction, cardDefinition, cardId) =>
        calls.push(`onPlay:${cardDefinition.id}:${cardId}`),
    },
  };

  return {
    ...host,
    ...overrides,
    actions: { ...host.actions, ...overrides.actions },
    cards: { ...host.cards, ...overrides.cards },
    corp: { ...host.corp, ...overrides.corp },
    runner: { ...host.runner, ...overrides.runner },
    economy: { ...host.economy, ...overrides.economy },
    zones: { ...host.zones, ...overrides.zones },
    damage: { ...host.damage, ...overrides.damage },
    hiddenZone: { ...host.hiddenZone, ...overrides.hiddenZone },
    board: { ...host.board, ...overrides.board },
    operations: { ...host.operations, ...overrides.operations },
    cardImplementation: {
      ...host.cardImplementation,
      ...overrides.cardImplementation,
    },
  };
}

describe("corp-operation-resolution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./corp-operation-resolution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
    expect(source).not.toMatch(/drawCorpCard(?!s)/);
  });

  it("delegates canonical CardSpec on-play operations through the boundary", () => {
    const targetState = state();
    const calls: string[] = [];
    const host = hostFor(targetState, calls);

    resolveCorpOperation(
      host,
      canonicalDefinition("simple_economy_operation"),
      action(),
    );
    resolveCorpOperation(
      host,
      canonicalDefinition("simple_draw_operation"),
      action(),
    );
    resolveCorpOperation(
      host,
      canonicalDefinition("simple_tag_punishment_operation"),
      action(),
    );

    expect(calls).toEqual([
      `onPlay:simple_economy_operation:${OPERATION_ID}`,
      `onPlay:simple_draw_operation:${OPERATION_ID}`,
      `onPlay:simple_tag_punishment_operation:${OPERATION_ID}`,
    ]);
  });

  it("delegates hidden-zone operation effects without changing choice contracts", () => {
    const calls: string[] = [];
    const offSiteState = state();
    offSiteState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "onr_v1_296_off-site-backups",
      { owner: "corp", controller: "corp", zone: { side: "corp", zone: "hq" } },
    );
    const offSiteHost = hostFor(offSiteState, calls);

    resolveCorpOperation(
      offSiteHost,
      definition("onr_v1_296_off-site-backups"),
      action(),
    );

    const planningState = state();
    planningState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "onr_v1_298_planning-consultants",
      { owner: "corp", controller: "corp", zone: { side: "corp", zone: "hq" } },
    );
    const planningHost = hostFor(planningState, calls);

    resolveCorpOperation(
      planningHost,
      definition("onr_v1_298_planning-consultants"),
      action(),
    );

    expect(calls).toEqual([
      `archivesToHq:${OPERATION_ID}`,
      `rdReorder:${OPERATION_ID}`,
    ]);
  });

  it("keeps utility operation playability and payload fields stable", () => {
    const targetState = state();
    targetState.cardInstances["asset_1" as CardInstanceId] = instance(
      "asset_1" as CardInstanceId,
      CORP_ASSET_DEFINITION_ID,
      { owner: "corp", controller: "corp", zone: { side: "corp", zone: "hq" } },
    );
    targetState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "onr_v1_289_edgerunner-inc-temps",
      { owner: "corp", controller: "corp", zone: { side: "corp", zone: "hq" } },
    );
    targetState.corp.hq.push("asset_1" as CardInstanceId);
    const calls: string[] = [];
    const host = hostFor(targetState, calls);
    const utilityAction = action();

    expect(
      canPlayCorpOperation(host, definition("onr_v1_289_edgerunner-inc-temps")),
    ).toBe(true);

    resolveCorpOperation(
      host,
      definition("onr_v1_289_edgerunner-inc-temps"),
      utilityAction,
    );

    expect(utilityAction.payload).toMatchObject({
      v1922CorpOperationAbility: "install_action_bundle",
      gainedActions: 3,
      edgerunnerTempsInstallActionsRemaining: 3,
      corpClicksAfter: 6,
    });
  });

  it("builds printed-cost on-play operation actions with resource target payloads", () => {
    const targetState = state();
    const host = hostFor(targetState);
    const printedDefinition = definition("onr_proteus_053_underworld-mole", {
      title: "Underworld Mole",
      cost: 2,
    });

    const actions = cardImplementationOperationLegalActions(
      host,
      OPERATION_ID,
      printedDefinition,
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]?.costs).toEqual([{ clicks: 1, credits: 2 }]);
    expect(actions[0]?.payload).toMatchObject({
      cardId: OPERATION_ID,
      traceSuccessTargetCardId: RESOURCE_ID,
      traceSuccessTargetDefinitionId: RUNNER_RESOURCE_DEFINITION_ID,
    });
  });

  it("publishes advancement distribution semantics on operation LegalActions", () => {
    const targetState = state();
    const host = hostFor(targetState);
    const printedDefinition = definition("onr_v1_304_systematic-layoffs", {
      title: "Systematic Layoffs",
      cost: 5,
    });

    const actions = cardImplementationOperationLegalActions(
      host,
      OPERATION_ID,
      printedDefinition,
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]?.payload).toMatchObject({
      cardId: OPERATION_ID,
      cardImplementationEffectKind: "distribute_advancement_counters",
      advancementCounterAmount: 2,
      advancementCounterChoiceMode: "any_combination",
      scoreConversionCapability: "place_advancement",
      scoreConversionAdvancementAmount: 2,
      scoreConversionAdvancementMode: "any_combination",
      scoreConversionTargetMode: "installed_advanceable_cards",
      scoreConversionTiming: "immediate",
    });
  });

  it("publishes immediate action gain semantics on operation LegalActions", () => {
    const targetState = state();
    const host = hostFor(targetState);
    const printedDefinition = definition("onr_v1_297_overtime-incentives", {
      title: "Overtime Incentives",
      cost: 0,
    });

    const actions = cardImplementationOperationLegalActions(
      host,
      OPERATION_ID,
      printedDefinition,
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]?.payload).toMatchObject({
      cardId: OPERATION_ID,
      gainActionsAmount: 2,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "unrestricted",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
      scoreConversionCapability: "gain_action_capacity",
      scoreConversionTiming: "immediate",
    });
  });

  it("publishes advancement move semantics on operation LegalActions", () => {
    const targetState = state();
    const host = hostFor(targetState);
    const printedDefinition = definition(
      "onr_v1_291_falsified-transactions-expert",
      { title: "Falsified-Transactions Expert", cost: 0 },
    );

    const actions = cardImplementationOperationLegalActions(
      host,
      OPERATION_ID,
      printedDefinition,
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]?.payload).toMatchObject({
      cardId: OPERATION_ID,
      cardImplementationEffectKind: "move_advancement_counters",
      advancementCounterMoveMaximum: 3,
      advancementCounterMoveSource: "chosen_card",
      advancementCounterMoveTarget: "chosen_installed_advanceable_card",
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: 3,
      scoreConversionSourceMode: "chosen_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
    });
  });

  it("builds two-click Classic double operation actions", () => {
    const targetState = state();
    targetState.corp.hq = [OPERATION_ID];
    targetState.corp.rd = [1, 2, 3, 4, 5].map(
      (index) => `rd_${index}` as CardInstanceId,
    );
    targetState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "onr_classic_017_corporate-shuffle",
      {
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "hq" },
      },
    );
    const cardDefinition = definition("onr_classic_017_corporate-shuffle", {
      title: "Corporate Shuffle",
      cost: 0,
    });
    const host = hostFor(targetState);

    const actions = cardImplementationOperationLegalActions(
      host,
      OPERATION_ID,
      cardDefinition,
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]?.costs).toEqual([{ clicks: 2, credits: 0 }]);
    expect(actions[0]?.payload).toMatchObject({
      corpZoneTransitionProjectionSchemaVersion:
        CORP_ZONE_TRANSITION_PROJECTION_SCHEMA_VERSION,
      corpZoneTransitionProjectionComplete: true,
      corpZoneTransitionProjectionSourceCardInstanceId: OPERATION_ID,
      corpZoneTransitionProjectionSourceDefinitionId:
        "onr_classic_017_corporate-shuffle",
      corpZoneTransitionProjectionStateVersion: 5,
      corpZoneTransitionProjectionTimingPoint: "corp_action.main",
      corpZoneTransitionProjectionActionId: actions[0]?.actionId,
      corpZoneTransitionProjectionKind: "draw_then_shuffle_one_hq_into_rd",
      corpZoneTransitionProjectionResolution: "guaranteed",
      corpZoneTransitionProjectionGrossDrawCount: 5,
      corpZoneTransitionProjectionSourceHqConsumptionCount: 1,
      corpZoneTransitionProjectionPostDrawDispositionCount: 1,
      corpZoneTransitionProjectionRdCardsReplenishedAfterDrawCount: 1,
      corpZoneTransitionProjectionNetHqDelta: 3,
      corpZoneTransitionProjectionNetRdDelta: -4,
      corpZoneTransitionProjectionNetRdConsumption: 4,
      corpZoneTransitionProjectionVisibleDrawReplacementSourceCount: 0,
    });

    targetState.corp.rd = ["rd_1" as CardInstanceId];
    const [terminalAction] = cardImplementationOperationLegalActions(
      host,
      OPERATION_ID,
      cardDefinition,
    );
    expect(terminalAction?.payload).toMatchObject({
      corpZoneTransitionProjectionComplete: false,
      corpZoneTransitionProjectionResolution: "corp_deckout_before_completion",
    });

    targetState.corp.clicks = 1;
    expect(canPlayCorpOperation(host, cardDefinition)).toBe(false);
    expect(
      cardImplementationOperationLegalActions(
        host,
        OPERATION_ID,
        cardDefinition,
      ),
    ).toEqual([]);
  });

  it("includes Strategic Planning Group in the Corporate Shuffle zone quote", () => {
    const targetState = state();
    const spgId = "spg_1" as CardInstanceId;
    targetState.corp.hq = [OPERATION_ID];
    targetState.corp.rd = [1, 2, 3, 4, 5, 6].map(
      (index) => `rd_${index}` as CardInstanceId,
    );
    targetState.corp.servers = [
      {
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [spgId],
      },
    ];
    targetState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "onr_classic_017_corporate-shuffle",
    );
    targetState.cardInstances[spgId] = instance(
      spgId,
      "onr_classic_025_strategic-planning-group",
      {
        rezzed: true,
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      },
    );
    const [action] = cardImplementationOperationLegalActions(
      hostFor(targetState),
      OPERATION_ID,
      definition("onr_classic_017_corporate-shuffle", {
        title: "Corporate Shuffle",
        cost: 0,
      }),
    );

    expect(action?.payload).toMatchObject({
      corpZoneTransitionProjectionComplete: true,
      corpZoneTransitionProjectionGrossDrawCount: 6,
      corpZoneTransitionProjectionPostDrawDispositionCount: 2,
      corpZoneTransitionProjectionRdCardsReplenishedAfterDrawCount: 2,
      corpZoneTransitionProjectionNetHqDelta: 3,
      corpZoneTransitionProjectionNetRdDelta: -4,
      corpZoneTransitionProjectionNetRdConsumption: 4,
      corpZoneTransitionProjectionVisibleDrawReplacementSourceCount: 1,
    });
  });
});
