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
  buildCorpTraceDamageAbilityActionsForCard,
  corpTraceDamageAbilityProfileForDefinitionId,
  handleCorpTraceDamageActivatedAbility,
  type CorpTraceDamageAbilityHost,
} from "./trace-damage-abilities";

function definition(
  id: string,
  title = id,
  type: CardDefinition["type"] = "agenda",
): CardDefinition {
  return { id: id as CardDefinitionId, title, type } as CardDefinition;
}

function instance(
  cardId: CardInstanceId,
  definitionId: string,
  zone: CardInstance["zone"] = { side: "corp", zone: "scoreArea" },
): CardInstance {
  return {
    id: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    faceup: true,
    rezzed: true,
    zone,
  } as unknown as CardInstance;
}

type HostInput = {
  legalAction?: LegalAction;
  scoreArea?: CardInstanceId[];
  definitions?: Record<string, CardDefinition>;
  instances?: Record<string, CardInstance>;
  resolveResult?: boolean;
};

function makeHost(input: HostInput = {}) {
  const definitions: Record<string, CardDefinition> = {
    netwatch: definition(
      "onr_v1_207_netwatch-operations-office",
      "Netwatch Operations Office",
    ),
    private: definition(
      "onr_v1_213_private-cybernet-police",
      "Private Cybernet Police",
    ),
    on_call: definition(
      "onr_v1_208_on-call-solo-team",
      "On-Call Solo Team",
    ),
    kali: definition("onr_v1_217_strike-force-kali", "Strike Force Kali"),
    blood_cat: definition("onr_v1_310_blood-cat", "Blood Cat", "asset"),
    solo_squad: definition("onr_v1_342_solo-squad", "Solo Squad", "asset"),
    i_got_a_rock: definition("onr_v1_327_i-got-a-rock", "I Got a Rock", "asset"),
    schlaghund: definition("onr_v1_339_schlaghund", "Schlaghund", "asset"),
    ...input.definitions,
  };
  const scoreArea =
    input.scoreArea ??
    (["netwatch", "private", "on_call", "kali"] as CardInstanceId[]);
  const defaultInstances: Record<string, CardInstance> = {
    netwatch: instance(
      "netwatch" as CardInstanceId,
      definitions.netwatch!.id,
    ),
    private: instance("private" as CardInstanceId, definitions.private!.id),
    on_call: instance("on_call" as CardInstanceId, definitions.on_call!.id),
    kali: instance("kali" as CardInstanceId, definitions.kali!.id),
    blood_cat: instance(
      "blood_cat" as CardInstanceId,
      definitions.blood_cat!.id,
      { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    ),
    solo_squad: instance(
      "solo_squad" as CardInstanceId,
      definitions.solo_squad!.id,
      { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    ),
    i_got_a_rock: instance(
      "i_got_a_rock" as CardInstanceId,
      definitions.i_got_a_rock!.id,
      { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    ),
    schlaghund: instance(
      "schlaghund" as CardInstanceId,
      definitions.schlaghund!.id,
      { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    ),
  };
  const state = {
    corp: { scoreArea } as GameState["corp"],
    cardInstances: { ...defaultInstances, ...input.instances },
  } as CorpTraceDamageAbilityHost["state"];
  const calls = {
    pushed: [] as CardInstanceId[],
    resolved: 0,
  };
  const host: CorpTraceDamageAbilityHost = {
    state,
    ...(input.legalAction ? { legalAction: input.legalAction } : {}),
    cards: {
      definitionFor: (cardId) => definitions[cardId]!,
    },
    callbacks: {
      pushActivatedCardImplementationActions: (actions, cardId, cardDefinition) => {
        calls.pushed.push(cardId);
        const profile = corpTraceDamageAbilityProfileForDefinitionId(
          cardDefinition.id,
        );
        actions.push({
          actionId: `activated_card_ability:corp:${cardId}`,
          side: "corp",
          type: "activated_card_ability",
          label: `${cardDefinition.title}: Fähigkeit nutzen`,
          source: cardId,
          timingPoint: "corp_action.main",
          stateVersion: 1,
          costs: [{ clicks: 1 }],
          abilityRef: {
            sourceCardInstanceId: cardId,
            abilityId: "ability_0",
          },
          payload: {
            cardId,
            cardImplementationAbility: "activated",
            cardImplementationAbilityIndex: 0,
            cardImplementationAbilityTiming: "corp_main",
            ...(profile?.family === "trace_tag"
              ? { traceBase: profile.traceBase }
              : {}),
            ...(profile?.family === "tagged_meat_damage"
              ? {
                  damageType: profile.damageType,
                  damageAmount: profile.damageAmount,
                }
              : {}),
          },
        } as unknown as LegalAction);
      },
      resolveActivatedCardImplementationAbility: () => {
        calls.resolved += 1;
        const legalAction = input.legalAction;
        if (legalAction?.payload) {
          legalAction.payload = {
            ...legalAction.payload,
            delegatedToCardImplementationRuntime: true,
          };
        }
        return input.resolveResult ?? true;
      },
    },
  };
  return { host, calls };
}

function activatedAction(sourceCardId: CardInstanceId): LegalAction {
  return {
    side: "corp",
    type: "activated_card_ability",
    abilityRef: { sourceCardInstanceId: sourceCardId, abilityId: "ability_0" },
    payload: { cardId: sourceCardId },
  } as unknown as LegalAction;
}

describe("corp trace/damage activated abilities", () => {
  it("builds scored agenda trace LegalActions with stable trace bases", () => {
    const { host, calls } = makeHost();

    const netwatch = buildCorpTraceDamageAbilityActionsForCard(
      host,
      "netwatch" as CardInstanceId,
    );
    const privateCybernet = buildCorpTraceDamageAbilityActionsForCard(
      host,
      "private" as CardInstanceId,
    );

    expect(calls.pushed).toEqual(["netwatch", "private"]);
    expect(netwatch).toMatchObject({
      handled: true,
      sourceDefinitionId: "onr_v1_207_netwatch-operations-office",
      traceBase: 2,
    });
    expect(privateCybernet).toMatchObject({
      handled: true,
      sourceDefinitionId: "onr_v1_213_private-cybernet-police",
      traceBase: 5,
    });
    expect(netwatch.actions[0]?.actionId).toBe(
      "activated_card_ability:corp:netwatch",
    );
    expect(privateCybernet.actions[0]?.payload).toMatchObject({
      cardId: "private",
      traceBase: 5,
    });
  });

  it("builds scored agenda tagged meat damage LegalActions", () => {
    const { host } = makeHost();

    const onCall = buildCorpTraceDamageAbilityActionsForCard(
      host,
      "on_call" as CardInstanceId,
    );
    const kali = buildCorpTraceDamageAbilityActionsForCard(
      host,
      "kali" as CardInstanceId,
    );

    expect(onCall).toMatchObject({
      handled: true,
      damageType: "meat",
      damageAmount: 1,
      requiresRunnerTagged: true,
    });
    expect(kali).toMatchObject({
      handled: true,
      damageType: "meat",
      damageAmount: 2,
      requiresRunnerTagged: true,
    });
  });

  it("handles scored trace execution through the existing runtime callback", () => {
    const action = activatedAction("netwatch" as CardInstanceId);
    const { host, calls } = makeHost({ legalAction: action });

    const result = handleCorpTraceDamageActivatedAbility(host);

    expect(result).toMatchObject({
      handled: true,
      stateChanged: true,
      sourceCardId: "netwatch",
      sourceDefinitionId: "onr_v1_207_netwatch-operations-office",
      traceStarted: true,
      traceBase: 2,
    });
    expect(calls.resolved).toBe(1);
    expect(action.payload).toMatchObject({
      delegatedToCardImplementationRuntime: true,
    });
  });

  it("handles scored damage execution through the existing runtime callback", () => {
    const action = activatedAction("kali" as CardInstanceId);
    const { host, calls } = makeHost({ legalAction: action });

    const result = handleCorpTraceDamageActivatedAbility(host);

    expect(result).toMatchObject({
      handled: true,
      stateChanged: true,
      sourceCardId: "kali",
      sourceDefinitionId: "onr_v1_217_strike-force-kali",
      damageType: "meat",
      damageAmount: 2,
      requiresRunnerTagged: true,
    });
    expect(calls.resolved).toBe(1);
  });

  it("moves same-path installed trace and damage nodes into the boundary", () => {
    const { host } = makeHost();

    const bloodCat = buildCorpTraceDamageAbilityActionsForCard(
      host,
      "blood_cat" as CardInstanceId,
    );
    const soloSquad = buildCorpTraceDamageAbilityActionsForCard(
      host,
      "solo_squad" as CardInstanceId,
    );

    expect(bloodCat).toMatchObject({
      handled: true,
      sourceDefinitionId: "onr_v1_310_blood-cat",
      traceBase: 5,
    });
    expect(soloSquad).toMatchObject({
      handled: true,
      sourceDefinitionId: "onr_v1_342_solo-squad",
      damageType: "meat",
      damageAmount: 1,
    });
  });

  it("leaves broad random or agenda-point-cost damage families outside", () => {
    const { host } = makeHost();

    expect(
      buildCorpTraceDamageAbilityActionsForCard(
        host,
        "i_got_a_rock" as CardInstanceId,
      ).handled,
    ).toBe(false);
    expect(
      buildCorpTraceDamageAbilityActionsForCard(
        host,
        "schlaghund" as CardInstanceId,
      ).handled,
    ).toBe(false);
  });

  it("rejects stale revalidation when the existing runtime callback fails", () => {
    const action = activatedAction("on_call" as CardInstanceId);
    const { host } = makeHost({ legalAction: action, resolveResult: false });

    expect(() => handleCorpTraceDamageActivatedAbility(host)).toThrow(
      "Die Trace-/Damage-Kartenfaehigkeit ist nicht gueltig.",
    );
  });
});
