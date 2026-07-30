import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { hashState } from "../hash";
import { assertCorpRootRezCostQuoteValid } from "../payment";
import { buildLegalAction } from "../turn/action-builders";
import {
  buildCorpApproachActions,
  buildCorpRunRootRezWindowActions,
  handleRunRootRezPostRez,
  passCorpRunRootRezWindow,
  resolveCorpRootRezEffect,
  resolveRezInterruptJackOutChoice,
  startRezInterruptJackOutChoice,
  type RunRezWindowHost,
} from "./run-rez-window";

function instance(
  id: string,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverRoot", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? false,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function definition(
  id: string,
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title: options.title ?? id,
    side: options.side ?? "corp",
    type: options.type ?? "upgrade",
    rezCost: options.rezCost ?? 0,
    ...options,
  } as CardDefinition;
}

function makeState(
  options: {
    iceRezzed?: boolean;
    rootDefinitionId?: string;
    rootRezzed?: boolean;
    runnerProgramDefinitionId?: string;
    timingPoint?: GameState["timingPoint"];
    activeSide?: GameState["activeSide"];
    positionKind?: "ice" | "server";
  } = {},
): GameState {
  const iceId = "ice_1" as CardInstanceId;
  const rootId = "root_1" as CardInstanceId;
  const programId = "program_1" as CardInstanceId;
  const cardInstances: Record<CardInstanceId, CardInstance> = {
    [iceId]: instance(iceId, "simple_barrier_ice", {
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      rezzed: options.iceRezzed ?? false,
    }),
    [rootId]: instance(rootId, options.rootDefinitionId ?? "simple_upgrade", {
      rezzed: options.rootRezzed ?? false,
    }),
  };
  const runnerPrograms: CardInstanceId[] = [];
  if (options.runnerProgramDefinitionId) {
    runnerPrograms.push(programId);
    cardInstances[programId] = instance(
      programId,
      options.runnerProgramDefinitionId,
      {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        rezzed: true,
      },
    );
  }
  return {
    stateVersion: 11,
    activeSide: options.activeSide ?? "corp",
    phase: "run",
    timingPoint: options.timingPoint ?? "run.movement_rez_window",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: runnerPrograms, hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: [iceId],
          root: [rootId],
        },
      ],
    },
    cardInstances,
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "movement",
      position:
        options.positionKind === "server"
          ? { kind: "server", serverId: "rd" }
          : { kind: "ice", serverId: "rd", iceIndex: 0 },
      approachedIceId: iceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definitionsFor(state: GameState): Record<string, CardDefinition> {
  const definitions: Record<string, CardDefinition> = {
    simple_barrier_ice: definition("simple_barrier_ice", {
      title: "Simple Barrier ICE",
      type: "ice",
      rezCost: 3,
    }),
    simple_upgrade: definition("simple_upgrade", {
      title: "Simple Upgrade",
      type: "upgrade",
      rezCost: 1,
    }),
    simple_economy_asset: definition("simple_economy_asset", {
      title: "Simple Economy Asset",
      type: "asset",
      rezCost: 0,
    }),
    "onr_v1_067_speed-trap": definition("onr_v1_067_speed-trap", {
      title: "Speed Trap",
      side: "runner",
      type: "program",
    }),
  };
  for (const card of Object.values(state.cardInstances)) {
    definitions[card.definitionId] ??= definition(card.definitionId);
  }
  return definitions;
}

function hostFor(state: GameState): {
  host: RunRezWindowHost;
  calls: {
    continued: LegalAction[];
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
    trashed: CardInstanceId[];
  };
} {
  const definitions = definitionsFor(state);
  const calls: {
    continued: LegalAction[];
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
    trashed: CardInstanceId[];
  } = { continued: [], finish: [], trashed: [] };
  return {
    calls,
    host: {
      state,
      cards: {
        definitionFor: (cardId) =>
          definitions[state.cardInstances[cardId]!.definitionId]!,
        cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
        runnerInstalledProgramIds: () => state.runner.rig.programs,
      },
      servers: {
        mustServer: (serverId) => {
          const server = state.corp.servers.find(
            (candidate) => candidate.id === serverId,
          );
          if (!server) throw new Error(`Server fehlt: ${serverId}`);
          return server as CorpServer;
        },
        publicServerLabel: () => "R&D",
      },
      fortPass: {
        state,
        cards: {
          definitionFor: (cardId) =>
            definitions[state.cardInstances[cardId]!.definitionId]!,
          cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
          publicInstalledCorpCardIdentityKnown: (cardId) =>
            Boolean(
              state.cardInstances[cardId]?.faceup ||
              state.cardInstances[cardId]?.rezzed,
            ),
        },
        servers: {
          mustServer: (serverId) => {
            const server = state.corp.servers.find(
              (candidate) => candidate.id === serverId,
            );
            if (!server) throw new Error(`Server fehlt: ${serverId}`);
            return server as CorpServer;
          },
        },
        payment: {
          spendCorpCredits: (amount) => {
            state.corp.credits -= amount;
          },
        },
      },
      choices: {
        selectedChoiceIds: (selectedChoices) => {
          const raw = selectedChoices?.selectedOptionIds;
          return Array.isArray(raw)
            ? raw.filter((value): value is string => typeof value === "string")
            : [];
        },
      },
      callbacks: {
        canReplaceFortCardsFromHq: () => true,
        continueAfterRootRez: (legalAction) => {
          if (legalAction) calls.continued.push(legalAction);
        },
        finishRun: (successful, legalAction) => {
          calls.finish.push({
            successful,
            ...(legalAction ? { legalAction } : {}),
          });
          delete state.run;
        },
        trashCorpInstalledCardToArchives: (cardId) => {
          calls.trashed.push(cardId);
          state.cardInstances[cardId] = {
            ...state.cardInstances[cardId]!,
            zone: { side: "corp", zone: "archives" },
          };
        },
        activeObligationCount: () =>
          Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0)),
        addActiveObligation: (amount) => {
          state.activeObligationDebtCount =
            Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0)) +
            amount;
        },
      },
    },
  };
}

function legalAction(
  state: GameState,
  side: "corp" | "runner",
  type: LegalAction["type"],
  payload?: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(state, side, type, type, "game_rule", [], payload);
}

function choiceAction(selectedOptionId: string): PlayerAction {
  return {
    matchId: "match_1",
    side: "runner",
    actionId: "choice",
    clientKnownStateVersion: 11,
    selectedChoices: {
      choiceId: "choice",
      selectedOptionIds: [selectedOptionId],
    },
  };
}

describe("run rez window", () => {
  it("builds approach and root rez actions with stable payloads", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      rootRezzed: false,
    });
    const { host } = hostFor(state);

    const actions = buildCorpApproachActions(host);

    expect(actions.map((action) => action.type)).toEqual([
      "rez_ice",
      "decline_rez",
      "rez_card",
    ]);
    expect(actions[0]?.payload).toMatchObject({
      cardId: "ice_1",
    });
    expect(actions[0]?.costs).toEqual([{ credits: 3 }]);
    expect(actions[1]?.payload).toBeUndefined();
    expect(actions[2]?.payload).toMatchObject({
      cardId: "root_1",
      rootRez: true,
      rezInterruptJackOutEligible: true,
      serverId: "rd",
    });
  });

  it("certifies Jenny Jett's exact final-window rez and install funding without exposing HQ ICE identity", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      rootDefinitionId: "onr_v1_359_jenny-jett",
    });
    state.run!.phase = "approach_ice";
    const hqIceId = "hq_ice_1" as CardInstanceId;
    state.corp.credits = 3;
    state.corp.hq.push(hqIceId);
    state.cardInstances[hqIceId] = instance(hqIceId, "onr_v1_261_quandary", {
      zone: { side: "corp", zone: "hq" },
      faceup: false,
    });
    const beforeHash = hashState(state);
    const { host } = hostFor(state);

    const actions = buildCorpApproachActions(host);
    const jennyRez = actions.find(
      (action) => action.type === "rez_card" && action.source === "root_1",
    );

    expect(jennyRez).toBeDefined();
    expect(jennyRez?.payload).toMatchObject({
      cardImplementationFortRunRezSupportQuoteSchemaVersion:
        "corp-fort-run-rez-support-quote-v1",
      cardImplementationFortRunRezSupportQuoteKind:
        "install_hq_ice_innermost_after_successful_run",
      cardImplementationFortRunRezSupportQuoteComplete: true,
      cardImplementationFortRunRezSupportQuoteSourceCardInstanceId: "root_1",
      cardImplementationFortRunRezSupportQuoteTargetServerId: "rd",
      cardImplementationFortRunRezSupportQuoteStateVersion: 11,
      cardImplementationFortRunRezSupportQuoteActionId: jennyRez?.actionId,
      cardImplementationFortRunRezSupportQuoteRezCredits: 1,
      cardImplementationFortRunRezSupportQuoteInstallCredits: 1,
      cardImplementationFortRunRezSupportQuoteTotalCredits: 2,
      cardImplementationFortRunRezSupportQuoteTotalCreditsPayable: true,
      cardImplementationFortRunRezSupportQuoteHasOwnHqIce: true,
    });
    const serializedPayload = JSON.stringify(jennyRez?.payload);
    expect(serializedPayload).not.toContain(hqIceId);
    expect(serializedPayload).not.toContain("onr_v1_261_quandary");
    expect(hashState(state)).toBe(beforeHash);
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, "root_1", jennyRez!),
    ).not.toThrow();
  });

  it("certifies Dr. Dreff's cheapest temporary HQ ICE encounter payment", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      rootDefinitionId: "onr_v1_358_dr-dreff",
    });
    state.run!.phase = "approach_ice";
    const hqIceId = "hq_data_raven" as CardInstanceId;
    state.corp.credits = 3;
    state.corp.hq.push(hqIceId);
    state.cardInstances[hqIceId] = instance(hqIceId, "onr_v1_236_data-raven", {
      zone: { side: "corp", zone: "hq" },
      faceup: false,
    });
    const { host } = hostFor(state);

    const dreffRez = buildCorpApproachActions(host).find(
      (action) => action.type === "rez_card" && action.source === "root_1",
    );

    expect(dreffRez?.payload).toMatchObject({
      cardImplementationFortRunRezSupportQuoteKind:
        "temporary_hq_ice_encounter_after_successful_run",
      cardImplementationFortRunRezSupportQuoteComplete: true,
      cardImplementationFortRunRezSupportQuoteFollowupCredits: 2,
      cardImplementationFortRunRezSupportQuoteInstallCredits: 0,
      cardImplementationFortRunRezSupportQuoteTotalCredits: 2,
      cardImplementationFortRunRezSupportQuoteTotalCreditsPayable: true,
      cardImplementationFortRunRezSupportQuoteHasOwnHqIce: true,
    });
    expect(JSON.stringify(dreffRez?.payload)).not.toContain(hqIceId);
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, "root_1", dreffRez!),
    ).not.toThrow();
  });

  it("omits fort-run support fields for nonmatching roots and before the exact final run window", () => {
    const nonJennyState = makeState({ timingPoint: "run.approach_ice" });
    const nonJennyAction = buildCorpApproachActions(
      hostFor(nonJennyState).host,
    ).find((action) => action.type === "rez_card");
    expect(
      Object.keys(nonJennyAction?.payload ?? {}).some((field) =>
        field.includes("FortRunRezSupport"),
      ),
    ).toBe(false);
    const injectedNonJennyAction = structuredClone(nonJennyAction!);
    injectedNonJennyAction.payload = {
      ...(injectedNonJennyAction.payload ?? {}),
      cardImplementationFortRunRezSupportQuoteComplete: true,
    };
    expect(() =>
      assertCorpRootRezCostQuoteValid(
        nonJennyState,
        "root_1",
        injectedNonJennyAction,
      ),
    ).toThrow(/Fort-Run-Rez-Support-Quote/);

    const earlyJennyState = makeState({
      timingPoint: "run.approach_ice",
      rootDefinitionId: "onr_v1_359_jenny-jett",
    });
    earlyJennyState.run!.phase = "approach_ice";
    earlyJennyState.run!.position = {
      kind: "ice",
      serverId: "rd",
      iceIndex: 1,
    };
    const earlyJennyAction = buildCorpApproachActions(
      hostFor(earlyJennyState).host,
    ).find(
      (action) => action.type === "rez_card" && action.source === "root_1",
    );
    expect(earlyJennyAction).toBeDefined();
    expect(
      Object.keys(earlyJennyAction?.payload ?? {}).some((field) =>
        field.includes("FortRunRezSupport"),
      ),
    ).toBe(false);
  });

  it("rejects stale Jenny support quotes when action, state, server ICE count or HQ ICE availability changes", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      rootDefinitionId: "onr_v1_359_jenny-jett",
    });
    state.run!.phase = "approach_ice";
    const hqIceId = "hq_ice_1" as CardInstanceId;
    state.corp.hq.push(hqIceId);
    state.cardInstances[hqIceId] = instance(hqIceId, "onr_v1_261_quandary", {
      zone: { side: "corp", zone: "hq" },
    });
    const action = buildCorpApproachActions(hostFor(state).host).find(
      (candidate) =>
        candidate.type === "rez_card" && candidate.source === "root_1",
    )!;

    const incompleteQuote = structuredClone(action);
    delete incompleteQuote.payload
      ?.cardImplementationFortRunRezSupportQuoteInstallCredits;
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, "root_1", incompleteQuote),
    ).toThrow(/Fort-Run-Rez-Support-Quote/);

    const changedActionId = structuredClone(action);
    changedActionId.actionId = `${action.actionId}:stale`;
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, "root_1", changedActionId),
    ).toThrow(/Fort-Run-Rez-Support-Quote/);

    const changedStateVersion = structuredClone(state);
    changedStateVersion.stateVersion += 1;
    expect(() =>
      assertCorpRootRezCostQuoteValid(changedStateVersion, "root_1", action),
    ).toThrow(/Fort-Run-Rez-Support-Quote/);

    const changedIceCount = structuredClone(state);
    const outerIceId = "ice_2" as CardInstanceId;
    changedIceCount.cardInstances[outerIceId] = instance(
      outerIceId,
      "simple_barrier_ice",
      {
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      },
    );
    changedIceCount.corp.servers[0]!.ice.push(outerIceId);
    expect(() =>
      assertCorpRootRezCostQuoteValid(changedIceCount, "root_1", action),
    ).toThrow(/Fort-Run-Rez-Support-Quote/);

    const changedHqIce = structuredClone(state);
    changedHqIce.corp.hq = [];
    changedHqIce.cardInstances[hqIceId] = {
      ...changedHqIce.cardInstances[hqIceId]!,
      zone: { side: "corp", zone: "archives" },
    };
    expect(() =>
      assertCorpRootRezCostQuoteValid(changedHqIce, "root_1", action),
    ).toThrow(/Fort-Run-Rez-Support-Quote/);
  });

  it("opens and passes the root rez window without changing action ids or payload shape", () => {
    const state = makeState({ rootRezzed: false });
    const { host, calls } = hostFor(state);

    const actions = buildCorpRunRootRezWindowActions(host);
    expect(actions.map((action) => action.type)).toEqual([
      "rez_card",
      "decline_rez",
    ]);
    expect(actions[1]?.payload).toMatchObject({
      runRootRezPass: true,
      serverId: "rd",
      serverLabel: "R&D",
    });

    const result = passCorpRunRootRezWindow(host, actions[1]!);

    expect(result).toMatchObject({
      handled: true,
      continueAfterRez: true,
      serverId: "rd",
    });
    expect(state.activeSide).toBe("corp");
    expect(state.run?.rootRezWindowPassedKeys).toEqual(["run_1:ice:rd:0"]);
    expect(calls.continued).toEqual([actions[1]]);
  });

  it("opens a run rez window for an affordable root card in another server", () => {
    const state = makeState({ rootRezzed: true });
    const remoteRootId = "remote_root" as CardInstanceId;
    const rezzedRemoteRootId = "remote_root_rezzed" as CardInstanceId;
    state.cardInstances[remoteRootId] = instance(
      remoteRootId,
      "simple_economy_asset",
      {
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      },
    );
    state.cardInstances[rezzedRemoteRootId] = instance(
      rezzedRemoteRootId,
      "simple_economy_asset",
      {
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
        rezzed: true,
      },
    );
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [rezzedRemoteRootId, remoteRootId],
    });
    const { host } = hostFor(state);

    const actions = buildCorpRunRootRezWindowActions(host);

    expect(actions.map((action) => action.type)).toEqual([
      "rez_card",
      "decline_rez",
    ]);
    expect(actions[0]).toMatchObject({
      label: "Simple Economy Asset in Remote 1 rezzen",
      costs: [{ credits: 1 }],
      payload: {
        cardId: remoteRootId,
        rootRez: true,
        rezInterruptJackOutEligible: true,
        serverId: "remote_1",
        rootRezCreditOutcomeQuoteSchemaVersion:
          "corp-root-rez-credit-outcome-quote-v1",
        rootRezCreditOutcomeQuoteComplete: true,
        rootRezCreditOutcomeQuoteSourceCardInstanceId: remoteRootId,
        rootRezCreditOutcomeQuoteTargetServerId: "remote_1",
        rootRezCreditOutcomeQuoteStateVersion: state.stateVersion,
        rootRezCreditOutcomeQuoteTimingPoint: state.timingPoint,
        rootRezCreditOutcomeQuoteActionId: actions[0]?.actionId,
        rootRezCreditOutcomeQuoteResolution: "guaranteed",
        rootRezCreditOutcomeQuoteGrossCreditGain: 3,
        rootRezCreditOutcomeQuoteRezCredits: 1,
        rootRezCreditOutcomeQuoteNetCreditGain: 2,
      },
    });
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, remoteRootId, actions[0]!),
    ).not.toThrow();
    const manipulatedOutcome = structuredClone(actions[0]!);
    manipulatedOutcome.payload = {
      ...(manipulatedOutcome.payload ?? {}),
      rootRezCreditOutcomeQuoteNetCreditGain: 3,
    };
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, remoteRootId, manipulatedOutcome),
    ).toThrow(/Root-Rez-Credit-Outcome-Quote/);
    expect(actions[1]?.payload).toMatchObject({
      runRootRezPass: true,
      serverId: "rd",
      serverLabel: "R&D",
    });
  });

  it("marks an exact root-rez credit outcome as Runner-interruptible when Speed Trap is active", () => {
    const state = makeState({
      rootDefinitionId: "simple_economy_asset",
      runnerProgramDefinitionId: "onr_v1_067_speed-trap",
      positionKind: "server",
    });
    const { host } = hostFor(state);

    const rez = buildCorpRunRootRezWindowActions(host).find(
      (action) => action.type === "rez_card",
    );

    expect(rez?.payload).toMatchObject({
      rootRezCreditOutcomeQuoteComplete: true,
      rootRezCreditOutcomeQuoteResolution: "runner_interruptible",
      rootRezCreditOutcomeQuoteGrossCreditGain: 3,
      rootRezCreditOutcomeQuoteRezCredits: 1,
      rootRezCreditOutcomeQuoteNetCreditGain: 2,
    });
    expect(() =>
      assertCorpRootRezCostQuoteValid(state, "root_1" as CardInstanceId, rez!),
    ).not.toThrow();
  });

  it("resolves simple root rez effects without generic rez or payment execution", () => {
    const state = makeState({
      rootDefinitionId: "simple_economy_asset",
      rootRezzed: true,
    });
    state.corp.credits = 4;
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_card", {
      cardId: "root_1",
      rootRez: true,
    });

    const result = resolveCorpRootRezEffect(
      host,
      "root_1" as CardInstanceId,
      action,
    );

    expect(result).toMatchObject({
      handled: true,
      rootEffectResolved: true,
      rezzedCardId: "root_1",
      sourceDefinitionId: "simple_economy_asset",
    });
    expect(state.corp.credits).toBe(7);
    expect(calls.continued).toEqual([]);
    expect(calls.finish).toEqual([]);
  });

  it("continues after root rez when no root effect or Speed Trap window handles it", () => {
    const state = makeState({ rootRezzed: true });
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_card", {
      cardId: "root_1",
      rootRez: true,
    });

    const result = handleRunRootRezPostRez(
      host,
      "root_1" as CardInstanceId,
      action,
    );

    expect(result).toMatchObject({
      handled: true,
      continueAfterRez: true,
      rezzedCardId: "root_1",
    });
    expect(calls.continued).toEqual([action]);
  });

  it("closes the movement root rez window after the last real rez action", () => {
    const state = makeState({ rootRezzed: true });
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_card", {
      cardId: "root_1",
      rootRez: true,
    });

    handleRunRootRezPostRez(host, "root_1" as CardInstanceId, action);

    expect(state.run?.rootRezWindowPassedKeys).toEqual(["run_1:ice:rd:0"]);
    expect(state.run?.rootRezWindowPendingPassKeys).toBeUndefined();
    expect(buildCorpRunRootRezWindowActions(host)).toEqual([]);
    expect(calls.continued).toEqual([action]);
  });

  it("keeps the movement root rez window open when another root can be rezzed", () => {
    const state = makeState({ rootRezzed: true });
    const secondRootId = "root_2" as CardInstanceId;
    state.cardInstances[secondRootId] = instance(
      secondRootId,
      "simple_economy_asset",
      {
        zone: { side: "corp", zone: "serverRoot", serverId: "rd" },
      },
    );
    state.corp.servers[0]!.root.push(secondRootId);
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_card", {
      cardId: "root_1",
      rootRez: true,
    });

    handleRunRootRezPostRez(host, "root_1" as CardInstanceId, action);

    expect(state.run?.rootRezWindowPassedKeys).toBeUndefined();
    expect(state.run?.rootRezWindowPendingPassKeys).toEqual(["run_1:ice:rd:0"]);
    expect(
      buildCorpRunRootRezWindowActions(host).map((entry) => entry.type),
    ).toEqual(["rez_card", "decline_rez"]);
    expect(calls.continued).toEqual([action]);
  });

  it("opens and resolves Speed Trap root-rez interrupt through the run rez window", () => {
    const state = makeState({
      runnerProgramDefinitionId: "onr_v1_067_speed-trap",
      rootRezzed: true,
      positionKind: "server",
    });
    const { host, calls } = hostFor(state);
    const action = legalAction(state, "corp", "rez_card", {
      cardId: "root_1",
      rootRez: true,
    });

    const startResult = startRezInterruptJackOutChoice(host, "root_1", action);

    expect(startResult).toMatchObject({
      handled: true,
      rezInterruptChoiceStarted: true,
      sourceDefinitionId: "onr_v1_067_speed-trap",
      sourceCardId: "program_1",
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining(
        "rez_interrupt.jack_out:program_1:root_1",
      ),
      kind: "select_option",
      visibility: "public",
    });
    expect(action.payload).toMatchObject({
      v1922RunnerProgramAbility: "rez_interrupt_jack_out_choice",
      sourceDefinitionId: "onr_v1_067_speed-trap",
      rezInterruptSourceCardId: "program_1",
      rezzedCardDefinitionId: "simple_upgrade",
      rezInterruptChoiceOpened: true,
    });

    const resolveAction = legalAction(state, "runner", "resolve_choice");
    const result = resolveRezInterruptJackOutChoice(
      host,
      resolveAction,
      choiceAction("jack_out"),
    );

    expect(result).toMatchObject({
      handled: true,
      runnerJackedOut: true,
      rezInterruptResolved: true,
      successfulRunWithoutAccess: true,
    });
    expect(calls.finish).toHaveLength(1);
    expect(calls.finish[0]?.successful).toBe(true);
    expect(resolveAction.payload).toMatchObject({
      v1922RunnerProgramAbility: "rez_interrupt_jack_out",
      rezInterruptUsed: true,
      successfulRunWithoutAccess: true,
      rezzedCardDefinitionId: "simple_upgrade",
    });
  });
});
