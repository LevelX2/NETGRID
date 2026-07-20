import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { createCorpTagSourcePayoffContext } from "./corp-tag-source-payoff-context";

describe("createCorpTagSourcePayoffContext", () => {
  it("derives visible economic tag punish payoff from payoff profiles", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: () => undefined,
      visibleMeatDamagePayoff: () => false,
      tagPunishAssessmentForAction: () => undefined,
      tagSourceProfileForDefinition: () => undefined,
      payoffProfileForDefinition: (definitionId) =>
        definitionId === "custom-economic-punish"
          ? { kind: "economic" }
          : undefined,
    });

    expect(
      context.corpVisibleTagPunishPayoffKind(
        inputWithHqCard(visibleCard("custom-economic-punish")),
      ),
    ).toBe("economic");
    expect(
      context.corpVisibleTagPunishPayoffKind(
        inputWithHqCard(visibleCard("unprofiled-punish-card")),
      ),
    ).toBeUndefined();
  });

  it("derives immediate operation tag sources from action ontology", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: () => "custom-trace-operation",
      visibleMeatDamagePayoff: () => false,
      tagPunishAssessmentForAction: () => ({
        isPunishPayoff: false,
        isTagSource: true,
      }),
      tagSourceProfileForDefinition: () => undefined,
      payoffProfileForDefinition: () => undefined,
    });

    expect(
      context.corpImmediateTagSourceAction(
        inputWithHqCard(visibleCard("corp-card")),
        corpAction("play_operation"),
      ),
    ).toBe(true);
    expect(
      context.corpImmediateTagSourceAction(
        inputWithHqCard(visibleCard("corp-card")),
        corpAction("install_card"),
      ),
    ).toBe(false);
  });

  it("prioritizes an immediate tag source when a damage payoff remains reachable this turn", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: () => "custom-trace-operation",
      visibleMeatDamagePayoff: () => true,
      tagPunishAssessmentForAction: () => ({
        isPunishPayoff: false,
        isTagSource: true,
      }),
      tagSourceProfileForDefinition: () => undefined,
      payoffProfileForDefinition: (definitionId) =>
        definitionId === "custom-damage-punish"
          ? { payoffKinds: ["damage"] }
          : undefined,
    });
    const input = inputWithHqCard({
      ...visibleCard("custom-damage-punish"),
      cost: 3,
    });
    input.playerView.own.credits = 4;

    expect(
      context.corpImmediateTagSourceVisiblePayoffProfile(
        input,
        corpAction("play_operation", {}, [{ clicks: 1 }, { credits: 2 }]),
      ),
    ).toMatchObject({
      kind: "tag_source",
      value: 4300,
      evidence: expect.arrayContaining([
        "corp_tag_source_same_turn_damage_conversion:true",
        "conversion_funding_clicks:1",
      ]),
    });
  });

  it("does not overvalue a visible damage payoff that cannot be reached this turn", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: () => "custom-trace-operation",
      visibleMeatDamagePayoff: () => true,
      tagPunishAssessmentForAction: () => ({
        isPunishPayoff: false,
        isTagSource: true,
      }),
      tagSourceProfileForDefinition: () => undefined,
      payoffProfileForDefinition: (definitionId) =>
        definitionId === "custom-damage-punish"
          ? { payoffKinds: ["damage"] }
          : undefined,
    });
    const input = inputWithHqCard({
      ...visibleCard("custom-damage-punish"),
      cost: 4,
    });
    input.playerView.own.credits = 4;

    expect(
      context.corpImmediateTagSourceVisiblePayoffProfile(
        input,
        corpAction("play_operation", {}, [{ clicks: 1 }, { credits: 2 }]),
      ),
    ).toMatchObject({
      kind: "tag_source",
      value: 2350,
    });
  });

  it("derives persistent tag asset setup from source tag-source profiles", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: (_input, action) => {
        const cardId = action.payload?.cardId;
        return typeof cardId === "string" ? cardId : undefined;
      },
      visibleMeatDamagePayoff: () => false,
      tagPunishAssessmentForAction: () => undefined,
      tagSourceProfileForDefinition: (definitionId) =>
        definitionId === "custom-persistent-tag-asset"
          ? { tagSource: true }
          : undefined,
      payoffProfileForDefinition: () => undefined,
    });

    expect(
      context.corpUnprotectedPersistentTagAssetSetup(
        inputWithHqCard(visibleCard("corp-card")),
        corpAction("install_card", {
          cardId: "custom-persistent-tag-asset",
        }),
      ),
    ).toBe(true);
    expect(
      context.corpUnprotectedPersistentTagAssetSetup(
        inputWithHqCard(visibleCard("corp-card")),
        corpAction("install_card", {
          cardId: "custom-blank-asset",
        }),
      ),
    ).toBe(false);
    expect(
      context.corpUnprotectedPersistentTagAssetSetup(
        inputWithHqCard(visibleCard("corp-card")),
        corpAction("play_operation", {
          cardId: "custom-persistent-tag-asset",
        }),
      ),
    ).toBe(false);
  });

  it("does not activate scored-only tag sources through install or rez actions", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: (_input, action) => {
        const cardId = action.payload?.cardId;
        return typeof cardId === "string" ? cardId : undefined;
      },
      visibleMeatDamagePayoff: () => false,
      tagPunishAssessmentForAction: () => undefined,
      tagSourceProfileForDefinition: (definitionId) =>
        definitionId === "custom-scored-only-tag-agenda"
          ? { requiresScoredAgenda: true }
          : definitionId === "custom-persistent-tag-asset"
            ? { requiresScoredAgenda: false }
            : undefined,
      payoffProfileForDefinition: () => undefined,
    });
    const input = inputWithHqCard(visibleCard("corp-card"));

    for (const type of ["install_card", "rez_card", "rez_ice"]) {
      expect(
        context.corpUnprotectedPersistentTagAssetSetup(
          input,
          corpAction(type, { cardId: "custom-scored-only-tag-agenda" }),
        ),
      ).toBe(false);
    }
    expect(
      context.corpUnprotectedPersistentTagAssetSetup(
        input,
        corpAction("install_card", {
          cardId: "custom-persistent-tag-asset",
        }),
      ),
    ).toBe(true);
  });

  it("values persistent tag-engine activation only with a visible payoff", () => {
    const context = createCorpTagSourcePayoffContext({
      sourceDefinitionIdForAction: (_input, action) => {
        const cardId = action.payload?.cardId;
        return typeof cardId === "string" ? cardId : undefined;
      },
      visibleMeatDamagePayoff: () => false,
      tagPunishAssessmentForAction: () => undefined,
      tagSourceProfileForDefinition: (definitionId) =>
        definitionId === "custom-persistent-tag-asset"
          ? { tagSource: true }
          : undefined,
      payoffProfileForDefinition: (definitionId) =>
        definitionId === "custom-economic-punish"
          ? { kind: "economic" }
          : undefined,
    });
    const rezEngine = corpAction("rez_ice", {
      cardId: "custom-persistent-tag-asset",
    });

    expect(
      context.corpPersistentTagEngineVisiblePayoffProfile(
        inputWithHqCard(visibleCard("custom-economic-punish")),
        rezEngine,
      ),
    ).toMatchObject({
      kind: "tag_source",
      value: 1650,
    });
    expect(
      context.corpPersistentTagEngineVisiblePayoffProfile(
        inputWithHqCard(visibleCard("unprofiled-card")),
        rezEngine,
      ),
    ).toBeUndefined();
  });
});

function inputWithHqCard(card: VisibleCard): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: visibleCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [card],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("runner-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 1,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "corp-tag-source-payoff-context-test",
    decisionId: "corp-tag-source-payoff-context-test",
    actionNumber: 1,
    profileId: "corp-tag-source-payoff-context-test",
  } as AiDecisionInput;
}

function visibleCard(definitionId: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "operation",
    known: true,
    owner: "corp",
    controller: "corp",
  };
}

function corpAction(
  type: string,
  payload: Record<string, string> = {},
  costs: LegalAction["costs"] = [],
): LegalAction {
  return {
    actionId: `${type}-${payload.cardId ?? "action"}`,
    side: "corp",
    type,
    payload,
    costs,
  } as LegalAction;
}
