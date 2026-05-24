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
  buildCorpSpecialDamageAbilityActionsForCard,
  handleCorpAccessAmbushDamageEffects,
  handleCorpSpecialDamageAbilityAction,
  resolveCorpAccessAmbushPaymentChoice,
  type CorpSpecialDamageAbilityHost,
} from "./special-damage-abilities";

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

function makeAction(payload: LegalAction["payload"]): LegalAction {
  return {
    side: "corp",
    type: "gain_credit",
    source: "source",
    costs: [{ clicks: 1 }],
    payload,
  } as LegalAction;
}

function makeHost(legalAction?: LegalAction) {
  const definitions: Record<string, CardDefinition> = {
    rock: definition("onr_v1_327_i-got-a-rock", "I Got a Rock"),
    dog: definition("onr_v1_339_schlaghund", "Schlaghund"),
    setup: definition("onr_v1_340_setup", "Setup!"),
    trap: definition("onr_v1_345_trap", "TRAP!"),
    agenda: definition("agenda", "Agenda", "agenda"),
  };
  const cardInstances: Record<string, CardInstance> = {
    rock: instance("rock", definitions.rock!.id),
    dog: instance("dog", definitions.dog!.id),
    setup: instance("setup", definitions.setup!.id),
    trap: instance("trap", definitions.trap!.id, {
      side: "corp",
      zone: "rd",
    }),
    agenda: instance("agenda", definitions.agenda!.id, {
      side: "corp",
      zone: "scoreArea",
    }),
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
  };
  const state = {
    stateVersion: 7,
    randomCounter: 2,
    corp: {
      credits: 6,
      hq: [],
      rd: ["trap"],
      archives: [],
      scoreArea: ["agenda"],
      servers: [],
    },
    runner: {
      tags: 2,
      identity: "runner_identity",
      rig: { programs: [], hardware: [], resources: [] },
    },
    cardInstances,
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      accessedCardId: "trap",
    },
  } as unknown as GameState;
  const calls = {
    builtActions: [] as LegalAction[],
    forfeited: [] as CardInstanceId[],
    damages: [] as Array<{ type: string; amount: number; source: string }>,
    rolls: [] as string[],
    trashedCorp: [] as CardInstanceId[],
    spentCredits: [] as number[],
  };
  const host: CorpSpecialDamageAbilityHost = {
    state,
    ...(legalAction ? { legalAction } : {}),
    definitions: {
      setup: definitions.setup!.id,
      trap: definitions.trap!.id,
      crybaby: "crybaby" as CardDefinitionId,
      dedicatedResponseTeam: "dedicated" as CardDefinitionId,
      dieterEsslin: "dieter" as CardDefinitionId,
      turbeauDelacroix: "turbeau" as CardDefinitionId,
      corprunnersShatteredRemains: "remains" as CardDefinitionId,
      experimentalAi: "experimental" as CardDefinitionId,
      vacantSoulkiller: "soulkiller" as CardDefinitionId,
      virusTestSite: "virus" as CardDefinitionId,
    },
    cards: {
      definitionFor: (cardId) => definitions[cardId]!,
      mustInstance: (cardId) => cardInstances[cardId]!,
      cardHasSubtype: () => false,
      accessEffectsForDefinition: (definitionId) => accessEffects[definitionId] ?? [],
      uniqueDirectLongtailImplementationForCard: (cardId) =>
        cardId === "rock"
          ? {
              kind: "i_got_a_rock_tagged_meat_damage",
              requiredRunnerTags: 2,
              agendaPointCost: 3,
              damageType: "meat",
              damageAmount: 15,
              visibility: "public",
            }
          : cardId === "dog"
            ? {
                kind: "schlaghund_tag_die_meat_damage",
                damageType: "meat",
                damageAmount: 10,
                trashSourceOnSuccess: true,
                visibility: "public",
              }
            : undefined,
      uniqueDirectLongtailImplementationForDefinition: (definitionId) =>
        definitionId === definitions.rock!.id
          ? {
              kind: "i_got_a_rock_tagged_meat_damage",
              requiredRunnerTags: 2,
              agendaPointCost: 3,
              damageType: "meat",
              damageAmount: 15,
              visibility: "public",
            }
          : definitionId === definitions.dog!.id
            ? {
                kind: "schlaghund_tag_die_meat_damage",
                damageType: "meat",
                damageAmount: 10,
                trashSourceOnSuccess: true,
                visibility: "public",
              }
            : undefined,
      uniqueDirectLongtailKindForCard: () => undefined,
      rezzedCorpRootCardIds: () => ["rock", "dog"] as CardInstanceId[],
    },
    actions: {
      buildLegalAction: (side, type, label, source, costs, payload) => {
        const action = { side, type, label, source, costs, payload } as LegalAction;
        calls.builtActions.push(action);
        return action;
      },
    },
    agendaPoints: {
      total: () => 3,
      scoredForfeitTargets: () => ["agenda" as CardInstanceId],
      pointsForScoredCard: () => 3,
      forfeitCorpAgendaForPointCost: (cardId) => calls.forfeited.push(cardId),
    },
    counters: {
      cardCounter: () => 0,
      addCardCounter: () => undefined,
    },
    damage: {
      resolveDamageOperation: (type, amount, source) => {
        calls.damages.push({ type, amount, source });
        if (legalAction) {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            damageResolved: true,
            damageType: type,
            damageAmount: amount,
          };
        }
      },
      doDamage: (_id, type, amount, source) => {
        calls.damages.push({ type, amount, source });
        return { damageType: type, amount, cardsTrashed: amount, flatline: false };
      },
      setDamagePayload: (summary) => {
        if (legalAction) {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            damageResolved: true,
            damageType: summary.damageType,
            damageAmount: summary.amount,
            cardsTrashed: summary.cardsTrashed,
            flatline: summary.flatline,
          };
        }
      },
    },
    tags: {
      addRunnerTagsWithPrevention: (amount) => {
        state.runner.tags += amount;
      },
    },
    trace: {
      startTraceFromOperation: () => undefined,
      traceSuccessEffectForCardImplementation: () => ({ type: "add_tag", amount: 1 }),
    },
    rng: {
      rollDie: (purpose) => {
        calls.rolls.push(purpose);
        state.randomCounter += 1;
        return 2;
      },
      randomCounter: () => state.randomCounter,
    },
    trash: {
      trashCorpInstalledCardToArchives: (cardId) => calls.trashedCorp.push(cardId),
      trashRunnerInstalledCardToHeap: () => undefined,
      openRunnerInstalledTrashPreventionWindow: () => false,
    },
    credits: {
      spendCorpCredits: (amount) => {
        calls.spentCredits.push(amount);
        state.corp.credits -= amount;
      },
    },
  };
  return { host, calls, state };
}

describe("corp special damage abilities", () => {
  it("builds stable I Got a Rock and Schlaghund LegalActions", () => {
    const { host } = makeHost();

    const rock = buildCorpSpecialDamageAbilityActionsForCard(
      host,
      "rock" as CardInstanceId,
    );
    const dog = buildCorpSpecialDamageAbilityActionsForCard(
      host,
      "dog" as CardInstanceId,
    );

    expect(rock.actions[0]?.payload).toMatchObject({
      cardId: "rock",
      v1920AssetAbility: "i_got_a_rock_tagged_meat_damage",
      agendaPointCost: 3,
      damageType: "meat",
      damageAmount: 15,
    });
    expect(dog.actions[0]?.payload).toEqual({
      cardId: "dog",
      v1921AssetAbility: "schlaghund_tag_damage",
    });
  });

  it("executes I Got a Rock through agenda forfeit and damage callbacks", () => {
    const legalAction = makeAction({
      cardId: "rock",
      v1920AssetAbility: "i_got_a_rock_tagged_meat_damage",
    });
    const { host, calls } = makeHost(legalAction);

    const result = handleCorpSpecialDamageAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(calls.forfeited).toEqual(["agenda"]);
    expect(calls.damages).toEqual([
      { type: "meat", amount: 15, source: "onr_v1_327_i-got-a-rock" },
    ]);
    expect(legalAction.payload).toMatchObject({
      agendaPointCost: 3,
      agendaPointCostPaid: 3,
      specialZoneReason: "v1920_i_got_a_rock",
    });
  });

  it("executes Schlaghund with stable die purpose, threshold damage, and source trash", () => {
    const legalAction = makeAction({
      cardId: "dog",
      v1921AssetAbility: "schlaghund_tag_damage",
    });
    const { host, calls } = makeHost(legalAction);

    const result = handleCorpSpecialDamageAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(calls.rolls).toEqual(["v1921.die.onr_v1_339_schlaghund.tag_damage"]);
    expect(calls.damages).toEqual([
      { type: "meat", amount: 10, source: "onr_v1_339_schlaghund" },
    ]);
    expect(calls.trashedCorp).toEqual(["dog"]);
    expect(legalAction.payload).toMatchObject({
      v1921DieRoll: 2,
      runnerTags: 2,
      tagThresholdMet: true,
      randomCounterAfter: 3,
      selfTrashed: true,
    });
  });

  it("handles access ambush payment and executes TRAP! without leaking private zones", () => {
    const legalAction = {
      side: "runner",
      type: "access_card",
      payload: { serverId: "rd" },
    } as unknown as LegalAction;
    const { host, calls, state } = makeHost(legalAction);

    handleCorpAccessAmbushDamageEffects(host, "trap" as CardInstanceId);
    expect(state.pendingChoice?.source).toContain("p3_35.access_payment");

    resolveCorpAccessAmbushPaymentChoice(host, "pay");

    expect(calls.spentCredits).toEqual([4]);
    expect(calls.damages).toEqual([
      { type: "net", amount: 3, source: "onr_v1_345_trap" },
    ]);
    expect(legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1917_access_ambush",
      ambushDefinitionId: "onr_v1_345_trap",
      ambushPaidCost: 4,
      damageResolved: true,
      damageAmount: 3,
      publicRevealDefinitionId: "onr_v1_345_trap",
    });
    expect(JSON.stringify(legalAction.payload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"\w+":\[/,
    );
  });
});
