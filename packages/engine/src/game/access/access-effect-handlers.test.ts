import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { CardAccessEffectImplementation } from "../../ability-engine/definition-types";
import {
  handleAccessEffectsForCard,
  resolveAccessPaymentChoice,
  resolveChimeraDaemonTrashChoice,
  type AccessEffectHandlerHost,
} from "./access-effect-handlers";

function definition(
  id: string,
  title: string,
  type: CardDefinition["type"] = "asset",
): CardDefinition {
  return { id: id as CardDefinitionId, title, type } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"] = { side: "corp", zone: "serverRoot", serverId: "remote_1" },
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    faceup: true,
    rezzed: true,
    zone,
  } as unknown as CardInstance;
}

function makeHost(legalAction: LegalAction) {
  const definitions: Record<string, CardDefinition> = {
    setup: definition("onr_v1_340_setup", "Setup!"),
    trap: definition("onr_v1_345_trap", "TRAP!"),
    dedicated: definition("onr_v1_356_dedicated-response-team", "Dedicated Response Team", "upgrade"),
    dieter: definition("onr_v1_357_dieter-esslin", "Dieter Esslin", "upgrade"),
    chimera: definition("onr_v1_309_chimera", "Chimera"),
    crybaby: definition("onr_v1_352_crybaby", "Crybaby", "upgrade"),
    turbeau: definition("onr_v1_361_turbeau-delacroix", "Turbeau Delacroix", "upgrade"),
    remains: definition("onr_v1_346_corprunners-shattered-remains", "Corprunner's Shattered Remains"),
    daemon: definition("daemon", "Daemon", "program"),
  };
  const cardInstances: Record<string, CardInstance> = {
    setup: instance("setup", definitions.setup!.id),
    trap: instance("trap", definitions.trap!.id, { side: "corp", zone: "rd" }),
    dedicated: instance("dedicated", definitions.dedicated!.id),
    dieter: instance("dieter", definitions.dieter!.id),
    chimera: instance("chimera", definitions.chimera!.id),
    crybaby: instance("crybaby", definitions.crybaby!.id),
    turbeau: instance("turbeau", definitions.turbeau!.id),
    remains: instance("remains", definitions.remains!.id),
    daemon: instance("daemon", definitions.daemon!.id, {
      side: "runner",
      zone: "rig",
    } as CardInstance["zone"]),
  };
  const accessEffects: Record<string, readonly CardAccessEffectImplementation[]> = {
    [definitions.setup!.id]: [
      {
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd", "archives"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "net",
            amount: 2,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
    [definitions.trap!.id]: [
      {
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd", "archives"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        cost: { kind: "corp_may_pay_credits", amount: 4 },
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "net",
            amount: 3,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
          {
            kind: "add_tags",
            recipient: "runner",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
    [definitions.crybaby!.id]: [
      {
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "add_runner_counter",
            counterType: "crying",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
    [definitions.turbeau!.id]: [
      {
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trace",
            baseTraceStrength: 10,
            onSuccess: [
              {
                kind: "add_tags",
                recipient: "runner",
                amount: 1,
                visibility: "hidden_info_barrier",
              },
            ],
            limit: "once_per_run_on_this_fort_per_source",
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
    [definitions.remains!.id]: [
      {
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trash_installed_runner_cards",
            target: "program",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  };
  const state = {
    stateVersion: 7,
    corp: {
      credits: 6,
      hq: [],
      rd: ["trap"],
      archives: [],
      servers: [],
    },
    runner: {
      tags: 1,
      identity: "runner_identity",
      rig: { programs: ["daemon"], hardware: [], resources: [] },
    },
    cardInstances,
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      accessedCardId: "trap",
    },
  } as unknown as GameState;
  const calls = {
    damages: [] as Array<{ type: string; amount: number; source: string }>,
    traces: [] as Array<{ base: number; source: string }>,
    counters: [] as Array<{ cardId: string; counterType: string; amount: number }>,
    trashed: [] as CardInstanceId[],
    spentCredits: [] as number[],
  };
  const host: AccessEffectHandlerHost = {
    state,
    legalAction,
    definitions: {
      setup: definitions.setup!.id,
      trap: definitions.trap!.id,
      crybaby: definitions.crybaby!.id,
      taggedRunnerMeatDamageUpgrade: definitions.dedicated!.id,
      accessNetDamageUpgrade: definitions.dieter!.id,
      oncePerRunAccessTraceUpgrade: definitions.turbeau!.id,
      hardwareTrashByAdvancementAsset: definitions.remains!.id,
      programTrashByAdvancementAsset: "experimental" as CardDefinitionId,
      advancementCoreDamageAsset: "soulkiller" as CardDefinitionId,
      advancementNetDamageAsset: "virus" as CardDefinitionId,
      chimera: definitions.chimera!.id,
    },
    cards: {
      definitionFor: (cardId) => definitions[cardId]!,
      mustInstance: (cardId) => cardInstances[cardId]!,
      cardHasSubtype: (cardDefinition, subtype) =>
        cardDefinition.id === definitions.daemon!.id && subtype === "daemon",
      accessEffectsForDefinition: (definitionId) => accessEffects[definitionId] ?? [],
      hiddenReplacementLongtailKindForDefinition: () => undefined,
    },
    damage: {
      resolveDamageOperation: (type, amount, source) => {
        calls.damages.push({ type, amount, source });
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          damageResolved: true,
          damageType: type,
          damageAmount: amount,
        };
      },
      doDamage: (_id, type, amount, source) => {
        calls.damages.push({ type, amount, source });
        return { damageType: type, amount, cardsTrashed: amount, flatline: false };
      },
      setDamagePayload: (summary) => {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          damageResolved: true,
          damageType: summary.damageType,
          damageAmount: summary.amount,
          cardsTrashed: summary.cardsTrashed,
          flatline: summary.flatline,
        };
      },
    },
    tags: {
      addRunnerTagsWithPrevention: (amount) => {
        state.runner.tags += amount;
      },
    },
    trace: {
      startTraceFromOperation: (source, base) => {
        calls.traces.push({ source, base });
      },
      traceSuccessEffectForCardImplementation: () => ({ type: "add_tag", amount: 1 }),
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        calls.counters
          .filter(
            (counter) =>
              counter.cardId === cardId && counter.counterType === counterType,
          )
          .reduce((sum, counter) => sum + counter.amount, 0),
      addCardCounter: (cardId, counterType, amount) => {
        calls.counters.push({ cardId, counterType, amount });
      },
      addCounterToAllInstalledRunnerIcebreakers: (counterType, amount) => ({
        amount,
        counterType,
        countersAfter: amount,
        publicPayload: {
          counterType,
          addedCounterAmount: amount,
          targetCount: 1,
        },
      }),
    },
    corpCards: {
      shuffleCorpCardIntoRd: (cardId, sourceDefinitionId) => ({
        publicPayload: {
          hiddenZoneBarrier: true,
          hiddenZoneAction: "shuffle_source_into_corp_rd",
          movedCardCount: 1,
          cardId,
          sourceDefinitionId,
        },
      }),
    },
    runnerCards: {
      returnInstalledProgramsToGrip: (cardIds) => ({
        publicPayload: {
          returnedProgramCount: cardIds.length,
          returnedProgramDefinitionIds: cardIds.join(","),
          daemonHostedTrashCount: 0,
        },
      }),
    },
    payment: {
      spendCorpCredits: (amount) => {
        calls.spentCredits.push(amount);
        state.corp.credits -= amount;
      },
    },
    trash: {
      trashRunnerInstalledCardToHeap: (cardId) => calls.trashed.push(cardId),
      openRunnerInstalledTrashPreventionWindow: () => false,
    },
  };
  return { host, calls, state };
}

function accessAction(cardId: string, serverId = "rd"): LegalAction {
  return {
    side: "runner",
    type: "access_card",
    payload: { serverId },
  } as unknown as LegalAction;
}

describe("access effect handlers", () => {
  it("dispatches Setup damage through the damage callback", () => {
    const action = accessAction("setup", "remote_1");
    const { host, calls, state } = makeHost(action);
    state.run = { ...state.run!, accessedCardId: "setup", attackedServerId: "remote_1" };

    const result = handleAccessEffectsForCard(host, "setup" as CardInstanceId);

    expect(result.handled).toBe(true);
    expect(calls.damages).toEqual([
      { type: "net", amount: 2, source: "onr_v1_340_setup" },
    ]);
    expect(action.payload).toMatchObject({
      hiddenZoneAction: "v1917_access_ambush",
      damageResolved: true,
      damageAmount: 2,
    });
  });

  it("keeps TRAP! access payment choice and pay path stable", () => {
    const action = accessAction("trap");
    const { host, calls, state } = makeHost(action);

    handleAccessEffectsForCard(host, "trap" as CardInstanceId);
    expect(state.pendingChoice).toMatchObject({
      choiceId: "p3_35_access_payment_8",
      source: "p3_35.access_payment:trap:0:rd:8",
      kind: "select_option",
      visibility: "hidden_info_barrier",
    });

    resolveAccessPaymentChoice(host, "pay");

    expect(calls.spentCredits).toEqual([4]);
    expect(calls.damages).toEqual([
      { type: "net", amount: 3, source: "onr_v1_345_trap" },
    ]);
    expect(action.payload).toMatchObject({
      ambushPaidCost: 4,
      corpCreditsAfter: 2,
      publicRevealDefinitionId: "onr_v1_345_trap",
      damageResolved: true,
      damageAmount: 3,
    });
  });

  it("runs Dedicated Response Team and Dieter through access damage callbacks", () => {
    const dedicatedAction = accessAction("dedicated", "remote_1");
    const dedicated = makeHost(dedicatedAction);
    dedicated.state.run = {
      ...dedicated.state.run!,
      accessedCardId: "dedicated",
      attackedServerId: "remote_1",
    };
    handleAccessEffectsForCard(dedicated.host, "dedicated" as CardInstanceId);

    const dieterAction = accessAction("dieter", "remote_1");
    const dieter = makeHost(dieterAction);
    dieter.state.run = {
      ...dieter.state.run!,
      accessedCardId: "dieter",
      attackedServerId: "remote_1",
    };
    handleAccessEffectsForCard(dieter.host, "dieter" as CardInstanceId);

    expect(dedicated.calls.damages).toEqual([
      { type: "meat", amount: 3, source: "onr_v1_356_dedicated-response-team" },
    ]);
    expect(dieter.calls.damages).toEqual([
      { type: "net", amount: 1, source: "onr_v1_357_dieter-esslin" },
    ]);
  });

  it("dispatches trace, counter, and installed-trash steps through callbacks", () => {
    const traceAction = accessAction("turbeau", "remote_1");
    const trace = makeHost(traceAction);
    trace.state.run = {
      ...trace.state.run!,
      accessedCardId: "turbeau",
      attackedServerId: "remote_1",
    };
    handleAccessEffectsForCard(trace.host, "turbeau" as CardInstanceId);

    const counterAction = accessAction("crybaby", "remote_1");
    const counter = makeHost(counterAction);
    counter.state.run = {
      ...counter.state.run!,
      accessedCardId: "crybaby",
      attackedServerId: "remote_1",
    };
    handleAccessEffectsForCard(counter.host, "crybaby" as CardInstanceId);

    const trashAction = accessAction("remains", "remote_1");
    const trash = makeHost(trashAction);
    trash.state.run = {
      ...trash.state.run!,
      accessedCardId: "remains",
      attackedServerId: "remote_1",
    };
    handleAccessEffectsForCard(trash.host, "remains" as CardInstanceId);

    expect(trace.calls.traces).toEqual([
      { source: "onr_v1_361_turbeau-delacroix", base: 10 },
    ]);
    expect(traceAction.payload).toMatchObject({
      hiddenZoneAction: "v1918_upgrade_access_trace",
      baseTraceStrength: 10,
    });
    expect(counter.calls.counters).toEqual([
      { cardId: "runner_identity", counterType: "crying", amount: 1 },
    ]);
    expect(counterAction.payload).toMatchObject({
      hiddenZoneAction: "v1918_crybaby_access_counter",
      cryingCountersAfter: 1,
    });
    expect(trash.calls.trashed).toEqual(["daemon"]);
    expect(trashAction.payload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      trashedCount: 1,
      trashedCardDefinitionIds: "daemon",
    });
  });

  it("starts and resolves Chimera daemon trash choices", () => {
    const action = accessAction("chimera", "remote_1");
    const { host, calls, state } = makeHost(action);
    state.run = {
      ...state.run!,
      accessedCardId: "chimera",
      attackedServerId: "remote_1",
    };

    handleAccessEffectsForCard(host, "chimera" as CardInstanceId);
    expect(state.pendingChoice).toMatchObject({
      choiceId: "v199_chimera_8",
      source: "v199.chimera_daemon_trash:chimera:8",
    });

    resolveChimeraDaemonTrashChoice(host, "card_daemon");

    expect(calls.trashed).toEqual(["daemon"]);
    expect(action.payload).toMatchObject({
      chimeraAccessed: true,
      chimeraDaemonCandidateCount: 1,
      chimeraDaemonTrashed: true,
      chimeraDaemonDefinitionId: "daemon",
    });
  });
});
