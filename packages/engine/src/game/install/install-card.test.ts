import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  installCard,
  type InstallCardHost,
} from "./install-card";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";

describe("install card execution", () => {
  it("installs a Runner program by moving the existing instance into the rig", () => {
    const programId = "program_1" as CardInstanceId;
    const programDefinition = definition("program_def", "program", {
      memoryCost: 2,
      mechanics: ["icebreaker"],
    });
    const state = minimalState({
      cardInstances: {
        [programId]: instance(programId, programDefinition.id, "runner", "grip"),
      },
      runnerGrip: [programId],
    });
    const calls = testCalls();
    const action = installAction("runner", programId);

    installCard(testHost(state, { [programDefinition.id]: programDefinition }, calls), action);

    expect(state.runner.grip).toEqual([]);
    expect(state.runner.rig.programs).toEqual([programId]);
    expect(state.runner.memoryUsed).toBe(2);
    expect(state.cardInstances[programId]).toMatchObject({
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    });
    expect(calls.lifecycle).toEqual([programId]);
  });

  it("keeps Runner hardware deck replacement payloads stable", () => {
    const oldDeckId = "old_deck" as CardInstanceId;
    const newDeckId = "new_deck" as CardInstanceId;
    const oldDefinition = definition("old_deck_def", "hardware", {
      mechanics: ["hardware_deck"],
    });
    const newDefinition = definition("new_deck_def", "hardware", {
      mechanics: ["hardware_deck"],
    });
    const state = minimalState({
      cardInstances: {
        [oldDeckId]: instance(oldDeckId, oldDefinition.id, "runner", "rig"),
        [newDeckId]: instance(newDeckId, newDefinition.id, "runner", "grip"),
      },
      runnerGrip: [newDeckId],
      runnerHardware: [oldDeckId],
    });
    const action = installAction("runner", newDeckId);

    installCard(
      testHost(state, {
        [oldDefinition.id]: oldDefinition,
        [newDefinition.id]: newDefinition,
      }),
      action,
    );

    expect(state.runner.rig.hardware).toEqual([newDeckId]);
    expect(state.runner.heap).toEqual([oldDeckId]);
    expect(action.payload).toMatchObject({
      deckUniqueReplacement: true,
      trashedDeckDefinitionIds: oldDefinition.id,
    });
  });

  it("installs Corp ICE on an existing server without changing payload shape", () => {
    const iceId = "ice_1" as CardInstanceId;
    const iceDefinition = definition("ice_def", "ice");
    const state = minimalState({
      cardInstances: {
        [iceId]: instance(iceId, iceDefinition.id, "corp", "hq"),
      },
      corpHq: [iceId],
    });
    state.corp.credits = 5;
    const action = installAction("corp", iceId, {
      placement: "ice",
      serverId: "hq",
    });
    action.costs = [{ credits: 2 }];

    installCard(testHost(state, { [iceDefinition.id]: iceDefinition }), action);

    expect(state.corp.credits).toBe(3);
    expect(state.corp.servers[0]?.ice).toEqual([iceId]);
    expect(state.cardInstances[iceId]).toMatchObject({
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
    });
  });

  it("delegates Corp root region replacement to the host", () => {
    const regionId = "region_1" as CardInstanceId;
    const regionDefinition = definition("region_def", "upgrade", {
      subtypes: ["region"],
    });
    const state = minimalState({
      cardInstances: {
        [regionId]: instance(regionId, regionDefinition.id, "corp", "hq"),
      },
      corpHq: [regionId],
    });
    const calls = testCalls();
    const action = installAction("corp", regionId, {
      placement: "root",
      serverId: "remote_1",
    });

    installCard(
      testHost(state, { [regionDefinition.id]: regionDefinition }, calls),
      action,
    );

    expect(state.corp.servers[1]?.root).toEqual([regionId]);
    expect(calls.regionReplacement).toEqual([regionId]);
  });

  it("records public rez-on-install effects for cards that enter play rezzed", () => {
    const regionId = "region_1" as CardInstanceId;
    const forcedRezId = "forced_rez_1" as CardInstanceId;
    const regionDefinition = definition("region_def", "upgrade", {
      title: "Test Region",
      subtypes: ["region"],
    });
    const forcedRezDefinition = definition("forced_rez_def", "upgrade", {
      title: "Forced Rez Upgrade",
    });
    const state = minimalState({
      cardInstances: {
        [regionId]: instance(regionId, regionDefinition.id, "corp", "hq"),
        [forcedRezId]: instance(
          forcedRezId,
          forcedRezDefinition.id,
          "corp",
          "hq",
        ),
      },
      corpHq: [regionId, forcedRezId],
    });
    const host = testHost(state, {
      [regionDefinition.id]: regionDefinition,
      [forcedRezDefinition.id]: forcedRezDefinition,
    });
    host.servers.rootInstallRezzesOnInstall = () => true;
    const regionAction = installAction("corp", regionId, {
      placement: "root",
      serverId: "remote_1",
    });
    const forcedRezAction = installAction("corp", forcedRezId, {
      placement: "root",
      serverId: "remote_1",
    });

    installCard(host, regionAction);
    installCard(host, forcedRezAction);

    expect(state.cardInstances[regionId]).toMatchObject({
      faceup: true,
      rezzed: true,
    });
    expect(state.cardInstances[forcedRezId]).toMatchObject({
      faceup: true,
      rezzed: true,
    });
    expect(regionAction.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "rez_card",
        visibility: "public",
        side: "corp",
        reason: "region_install",
        sourceDefinitionId: regionDefinition.id,
        sourceTitle: "Test Region",
        cardDefinitionId: regionDefinition.id,
        cardTitle: "Test Region",
        serverLabel: "Remote 1",
      }),
    ]);
    expect(forcedRezAction.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "rez_card",
        reason: "install_rez",
        sourceDefinitionId: forcedRezDefinition.id,
        sourceTitle: "Forced Rez Upgrade",
        cardDefinitionId: forcedRezDefinition.id,
        cardTitle: "Forced Rez Upgrade",
      }),
    ]);
  });

  it("preserves Proteus doom install roll payloads and trash behavior", () => {
    const assetId = "asset_1" as CardInstanceId;
    const assetDefinition = definition("asset_def", "asset");
    const state = minimalState({
      cardInstances: {
        [assetId]: instance(assetId, assetDefinition.id, "corp", "hq"),
      },
      corpHq: [assetId],
    });
    state.purgeableRunnerVirusCounters = { corp: { doom: 1 } };
    const calls = testCalls({ rolls: [6] });
    const action = installAction("corp", assetId, {
      placement: "root",
      serverId: "remote_1",
    });

    installCard(testHost(state, { [assetDefinition.id]: assetDefinition }, calls), action);

    expect(state.corp.archives).toEqual([assetId]);
    expect(action.payload).toMatchObject({
      proteusDoomInstallRolls: "6",
      proteusDoomHits: 1,
      doomCountersBefore: 1,
      doomCountersAfter: 0,
      proteusDoomSourceDefinitionId: "onr_proteus_078_armageddon",
      trashedInstalledCardDefinitionId: assetDefinition.id,
    });
  });

  it("does not import from index.ts", () => {
    const source = readFileSync(
      new URL("./install-card.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
  });
});

function definition(
  id: string,
  type: CardDefinition["type"],
  extras: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title: id,
    type,
    installCost: 0,
    rezCost: 0,
    agendaPoints: 0,
    advancementRequirement: 0,
    mechanics: [],
    subtypes: [],
    ...extras,
  } as CardDefinition;
}

function instance(
  id: CardInstanceId,
  definitionId: CardDefinitionId,
  side: "corp" | "runner",
  zone: "grip" | "hq" | "rig",
): CardInstance {
  return {
    id,
    definitionId,
    owner: side,
    controller: side,
    faceup: zone === "rig",
    rezzed: zone === "rig",
    zone:
      side === "runner"
        ? zone === "rig"
          ? { side, zone: "rig" }
          : { side, zone: "grip" }
        : { side, zone: "hq" },
  } as unknown as CardInstance;
}

function minimalState(input: {
  cardInstances: Record<CardInstanceId, CardInstance>;
  runnerGrip?: CardInstanceId[];
  runnerHardware?: CardInstanceId[];
  corpHq?: CardInstanceId[];
}): GameState {
  return {
    stateVersion: 1,
    randomCounter: 0,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    runner: {
      clicks: 4,
      credits: 10,
      stack: [],
      grip: [...(input.runnerGrip ?? [])],
      heap: [],
      scoreArea: [],
      tags: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      rig: {
        programs: [],
        hardware: [...(input.runnerHardware ?? [])],
        resources: [],
      },
    },
    corp: {
      clicks: 3,
      credits: 10,
      rd: [],
      hq: [...(input.corpHq ?? [])],
      archives: [],
      scoreArea: [],
      badPublicity: 0,
      servers: [
        { id: "hq", kind: "hq", label: "HQ", ice: [], root: [] },
        { id: "remote_1", kind: "remote", label: "Remote 1", ice: [], root: [] },
      ],
    },
    cardInstances: input.cardInstances,
    eventLog: [],
  } as unknown as GameState;
}

function installAction(
  side: "corp" | "runner",
  cardId: CardInstanceId,
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    actionId: `${side}.install_card.${cardId}`,
    type: "install_card",
    side,
    label: "Install",
    source: cardId,
    timing: "main",
    costs: [],
    payload: { cardId, ...payload },
  } as unknown as LegalAction;
}

type TestCalls = {
  lifecycle: CardInstanceId[];
  regionReplacement: CardInstanceId[];
  rolls: number[];
};

function testCalls(input: Partial<TestCalls> = {}): TestCalls {
  return {
    lifecycle: [],
    regionReplacement: [],
    rolls: [],
    ...input,
  };
}

function testHost(
  state: GameState,
  definitions: Record<CardDefinitionId, CardDefinition>,
  calls = testCalls(),
): InstallCardHost {
  const definitionFor = (cardId: CardInstanceId) => {
    const definition = definitions[state.cardInstances[cardId]!.definitionId];
    if (!definition) throw new Error(`Definition fehlt: ${cardId}`);
    return definition;
  };
  const removeFromAllZones = (cardId: CardInstanceId) => {
    state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
    state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
    state.runner.rig.programs = state.runner.rig.programs.filter((id) => id !== cardId);
    state.runner.rig.hardware = state.runner.rig.hardware.filter((id) => id !== cardId);
    state.runner.rig.resources = state.runner.rig.resources.filter((id) => id !== cardId);
    state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
    state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
    for (const server of state.corp.servers) {
      server.ice = server.ice.filter((id) => id !== cardId);
      server.root = server.root.filter((id) => id !== cardId);
    }
  };
  return {
    state,
    cards: {
      definitionFor,
      mustInstance: (cardId) => state.cardInstances[cardId]!,
      isUniqueCard: (definition) => definition.subtypes.includes("unique"),
      hasInstalledUniqueCardDefinition: () => false,
      cardHasSubtype: (definition, subtype) => definition.subtypes.includes(subtype),
      isRunnerHardwareDeckDefinition: (definition) =>
        definition.mechanics.includes("hardware_deck"),
      hasCardImplementationMemoryUnitModifier: () => false,
      shouldLoadLegacyRecurringCredits: (definition) =>
        (definition.recurringCredits ?? 0) > 0,
      damagePreventionSourcesForDefinition: () => [],
      cardImplementationAgendaPointInstallCost: () => 0,
    },
    servers: {
      assertCorpCanCreateNewDataFort: () => undefined,
      mustServer: (serverId) => {
        const server = state.corp.servers.find(
          (candidate) => candidate.id === serverId,
        );
        if (!server) throw new Error(`Server fehlt: ${serverId}`);
        return server;
      },
      createRemote: () => {
        const server: CorpServer = {
          id: "remote_2",
          kind: "remote",
          label: "Remote 2",
          ice: [],
          root: [],
        };
        state.corp.servers.push(server);
        return server;
      },
      serverChoiceDisplayLabel: (serverId) => String(serverId),
      canInstallCorpRootCardInServer: () => true,
      corpRootAgendaOrNodeCapacityInServer: () => 1,
      corpRootAssetIdsInServer: () => [],
      corpRootMainCardIdsInServer: () => [],
      rootInstallRezzesOnInstall: () => false,
      trashOlderRegionUpgradesInServer: (_server, keepCardId) => {
        calls.regionReplacement.push(keepCardId);
      },
      markFortActivityForRunGate: () => undefined,
    },
    zones: {
      removeFromAllZones,
      trashRunnerInstalledCardToHeap: (cardId) => {
        removeFromAllZones(cardId);
        state.runner.heap.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "runner", zone: "heap" },
        };
      },
      trashCorpInstalledCardToArchives: (cardId) => {
        removeFromAllZones(cardId);
        state.corp.archives.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
        };
      },
    },
    runner: {
      ensureTurnFlags: () =>
        (state.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
        }),
      requiresDataFortInstallTarget: () => false,
      startRunnerProgramTrashBeforeInstallChoice: () => undefined,
      forfeitRunnerAgendaForPointCost: () => undefined,
      consumeValuPakProgramInstallAction: () => undefined,
      startRunnerHostingChoice: () => undefined,
      hiddenRunnerResourceSlotId: (cardId) =>
        `hidden_runner_resource:${cardId}` as CardInstanceId,
    },
    corp: {
      expireCorporateRetreatInstallCreditAbilities: () => undefined,
      consumeEdgerunnerTempsInstallAction: () => undefined,
      isRegionUpgrade: (definition) => definition.subtypes.includes("region"),
      isFortTraceBitPoolSource: () => false,
      fortTraceBitPoolCapacityForCard: () => 0,
    },
    hosting: {
      canHostProgramOnDaemon: () => true,
      canOverlayProgramOnZetatechSoftwareInstaller: () => true,
      hostedPaymentCredits: () => 0,
    },
    payment: {
      assertCorpIceInstallCostValid: () => undefined,
      spendClick: (side) => {
        state[side].clicks -= 1;
      },
      spendRunnerInstallCredits: (amount) => {
        state.runner.credits -= amount;
      },
      runnerCanPayInstallCost: (amount) => state.runner.credits >= amount,
      openRunnerCostPenaltySupportWindow: () => false,
      closeRunnerCostPenaltySupportWindowForPayment: () => undefined,
      spendCredits: (side, amount) => {
        state[side].credits -= amount;
      },
      rezCostForCard: () => 0,
    },
    counters: {
      setCardCounter: (cardId, counterType, amount) => {
        const key = counterType as CounterType;
        const instance = state.cardInstances[cardId]!;
        instance.counters = { ...(instance.counters ?? {}), [key]: amount };
      },
      addCardCounter: (cardId, counterType, amount) => {
        const key = counterType as CounterType;
        const instance = state.cardInstances[cardId]!;
        instance.counters = {
          ...(instance.counters ?? {}),
          [key]: (instance.counters?.[key] ?? 0) + amount,
        };
      },
      rollDeterministicDie: () => calls.rolls.shift() ?? 1,
    },
    lifecycle: {
      executeOnInstall: (_legalAction, _definition, cardId) => {
        calls.lifecycle.push(cardId);
      },
    },
    constants: {
      PROTEUS_ARMAGEDDON_ID:
        "onr_proteus_078_armageddon" as CardDefinitionId,
    },
  };
}
