import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canPlayCorpOperation,
  cardImplementationOperationLegalActions,
  resolveCorpOperation,
  type CorpOperationResolutionHost,
} from "./corp-operation-resolution";

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
  return {
    id,
    title: options.title ?? id,
    side: "corp",
    type: "operation",
    cost: 1,
    ...options,
  } as CardDefinition;
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
      buildLegalAction: (
        _state,
        side,
        type,
        label,
        source,
        costs,
        payload,
      ) =>
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
      drawCorpCard: () => calls.push("drawCorpCard"),
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
        if (targetState.runner.tags <= 0) throw new Error("Runner ist nicht getaggt.");
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
        targetState.runner.rig.resources = targetState.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        targetState.runner.heap.push(cardId);
        calls.push(`trashRunner:${cardId}`);
      },
    },
    damage: {
      resolveDamageOperation: (_legalAction, damageType, amount, sourceDefinitionId) =>
        calls.push(`damage:${damageType}:${amount}:${sourceDefinitionId}`),
      addRunnerTagsWithPrevention: (_legalAction, amount, source) =>
        calls.push(`tag:${amount}:${source}`),
    },
    hiddenZone: {
      startCorpArchivesToHqChoice: (_legalAction, sourceCardId) =>
        calls.push(`archivesToHq:${sourceCardId}`),
      startCorpRdTopReorderChoice: (_legalAction, sourceCardId) =>
        calls.push(`rdReorder:${sourceCardId}`),
      resolveNewBloodConcealAndReorder: () => calls.push("newBlood"),
    },
    board: {
      installedAgendaOperationTarget: () => RESOURCE_ID,
      advanceableInstalledCardTargets: () => [RESOURCE_ID],
      advancementDistributionOptions: () => [RESOURCE_ID],
      moveAdvancementOptions: () => [RESOURCE_ID],
      resolveAgendaCounterOperation: (_legalAction, sourceDefinitionId) =>
        calls.push(`agendaCounter:${sourceDefinitionId}`),
      resolveManagementShakeUpOperation: () => calls.push("managementShakeUp"),
      resolveSystematicLayoffsAdvancementOperation: () =>
        calls.push("systematicLayoffs"),
    },
    operations: {
      powerGridOverloadEligibleHardwareIds: () => [RESOURCE_ID],
      resolvePowerGridOverloadOperation: () => calls.push("powerGridOverload"),
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
  });

  it("resolves simple credit, draw, damage and tag operations through the boundary", () => {
    const targetState = state();
    const calls: string[] = [];
    const host = hostFor(targetState, calls);

    resolveCorpOperation(host, definition("simple_economy_operation"), action());
    expect(targetState.corp.credits).toBe(10);

    resolveCorpOperation(host, definition("simple_draw_operation"), action());
    resolveCorpOperation(host, definition("v111_core_damage_operation"), action());
    resolveCorpOperation(host, definition("simple_tag_punishment_operation"), action());

    expect(calls).toEqual([
      "drawCorpCard",
      "drawCorpCard",
      "damage:core:1:v111_core_damage_operation",
    ]);
    expect(targetState.runner.credits).toBe(3);
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

    expect(canPlayCorpOperation(host, definition("onr_v1_289_edgerunner-inc-temps"))).toBe(
      true,
    );

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
});
