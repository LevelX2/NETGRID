import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildCorpSpecialDamageAbilityActionsForCard,
  handleCorpSpecialDamageAbilityAction,
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
    agenda: definition("agenda", "Agenda", "agenda"),
  };
  const cardInstances: Record<string, CardInstance> = {
    rock: instance("rock", definitions.rock!.id),
    dog: instance("dog", definitions.dog!.id),
    agenda: instance("agenda", definitions.agenda!.id, {
      side: "corp",
      zone: "scoreArea",
    }),
  };
  const state = {
    stateVersion: 7,
    randomCounter: 2,
    corp: {
      scoreArea: ["agenda"],
    },
    runner: {
      tags: 2,
    },
    cardInstances,
  } as unknown as GameState;
  const calls = {
    builtActions: [] as LegalAction[],
    spentAgendaPointCosts: [] as number[],
    damages: [] as Array<{ type: string; amount: number; source: string }>,
    rolls: [] as string[],
    trashedCorp: [] as CardInstanceId[],
  };
  const host: CorpSpecialDamageAbilityHost = {
    state,
    ...(legalAction ? { legalAction } : {}),
    cards: {
      definitionFor: (cardId) => definitions[cardId]!,
      uniqueDirectLongtailImplementationForCard: (cardId) =>
        cardId === "rock"
          ? {
              kind: "tagged_meat_damage",
              requiredRunnerTags: 2,
              agendaPointCost: 3,
              damageType: "meat",
              damageAmount: 15,
              visibility: "public",
            }
          : cardId === "dog"
            ? {
                kind: "tag_threshold_meat_damage_asset",
                damageType: "meat",
                damageAmount: 10,
                trashSourceOnSuccess: true,
                visibility: "public",
              }
            : undefined,
      uniqueDirectLongtailImplementationForDefinition: (definitionId) =>
        definitionId === definitions.rock!.id
          ? {
              kind: "tagged_meat_damage",
              requiredRunnerTags: 2,
              agendaPointCost: 3,
              damageType: "meat",
              damageAmount: 15,
              visibility: "public",
            }
          : definitionId === definitions.dog!.id
            ? {
                kind: "tag_threshold_meat_damage_asset",
                damageType: "meat",
                damageAmount: 10,
                trashSourceOnSuccess: true,
                visibility: "public",
              }
            : undefined,
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
      forfeitCorpAgendaForPointCost: () => undefined,
      spendPointCost: (requiredPoints) => {
        calls.spentAgendaPointCosts.push(requiredPoints);
        return {
          paidPoints: requiredPoints,
          bonusPointsSpent: 0,
          spentAgendaIds: ["agenda" as CardInstanceId],
          spentAgendaDefinitionIds: ["agenda" as CardDefinitionId],
        };
      },
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
    },
  };
  return { host, calls };
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
      v1920AssetAbility: "tagged_meat_damage",
      agendaPointCost: 3,
      damageType: "meat",
      damageAmount: 15,
    });
    expect(dog.actions[0]?.payload).toEqual({
      cardId: "dog",
      v1921AssetAbility: "schlaghund_tag_damage",
    });
  });

  it("executes I Got a Rock through agenda point spend and damage callbacks", () => {
    const legalAction = makeAction({
      cardId: "rock",
      v1920AssetAbility: "tagged_meat_damage",
    });
    const { host, calls } = makeHost(legalAction);

    const result = handleCorpSpecialDamageAbilityAction(host);

    expect(result.handled).toBe(true);
    expect(calls.spentAgendaPointCosts).toEqual([3]);
    expect(calls.damages).toEqual([
      { type: "meat", amount: 15, source: "onr_v1_327_i-got-a-rock" },
    ]);
    expect(legalAction.payload).toMatchObject({
      agendaPointCost: 3,
      agendaPointCostPaid: 3,
      spentAgendaDefinitionIds: "agenda",
    });
    expect(legalAction.payload?.specialZoneReason).toBeUndefined();
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
});
