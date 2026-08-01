import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { semanticRuntimeCorpAdvancementCounterPlacementAssessment } from "./semantic-runtime-corp-advancement-counter";

describe("semanticRuntimeCorpAdvancementCounterPlacementAssessment", () => {
  it("derives agenda overadvance thresholds from generic rules text", () => {
    const assessment = assessmentForAgendaRulesText(
      "for every two advancement counters over this agenda's difficulty that are on this agenda when you score it",
    );

    expect(assessment?.advancementWitness).toBe("overadvance_threshold");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:agenda_overadvance_threshold",
    );
    expect(assessment?.evidence).toContain("overadvance_threshold_size:2");
    expect(assessment?.evidence).toContain("overadvance_hits_threshold:true");
  });

  it("bounds agenda overadvance thresholds to exact rules text tokens", () => {
    const assessment = assessmentForAgendaRulesText(
      "for every twone advancement countersover this agenda's difficulty that are on this agenda when you score it",
    );

    expect(assessment?.advancementWitness).toBe("score_now");
    expect(assessment?.evidence).not.toContain(
      "advancement_target_class:agenda_overadvance_threshold",
    );
    expect(assessment?.evidence).not.toContain("overadvance_threshold_size:2");
  });

  it("derives advancement-counter credit cashout from bounded rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Gain [4] credits for each advancement counter on this asset.",
    );

    expect(assessment?.advancementWitness).toBe("counter_cashout_credit");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:counter_cashout_credit",
    );
  });

  it("ignores credit cashout suffix noise in rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Gain [4] creditsish for each advancement counter on this asset.",
    );

    expect(assessment?.advancementWitness).toBe("counter_bank_only");
    expect(assessment?.evidence).not.toContain(
      "advancement_target_class:counter_cashout_credit",
    );
  });

  it("derives access net-damage ambushes from bounded rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Do 2 net damage when accessed.",
    );

    expect(assessment?.advancementWitness).toBe("access_net_damage_ambush");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:access_net_damage_ambush",
    );
  });

  it("ignores net-damage ambush substring noise in rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Do 2 internet damage when accessed.",
    );

    expect(assessment?.advancementWitness).toBe("none");
    expect(assessment?.evidence).not.toContain(
      "advancement_target_class:access_net_damage_ambush",
    );
  });

  it("derives advancement-counter action cashout from bounded rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Spend 1 advancement counter to draw a card.",
    );

    expect(assessment?.advancementWitness).toBe("counter_cashout_action");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:counter_cashout_action",
    );
  });

  it("ignores action cashout substring noise in rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Counteraction protocol stores one advancement counter.",
    );

    expect(assessment?.advancementWitness).toBe("counter_bank_only");
    expect(assessment?.evidence).not.toContain(
      "advancement_target_class:counter_cashout_action",
    );
  });

  it("derives generic counter-bank targets from bounded rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "This card can be advanced.",
    );

    expect(assessment?.advancementWitness).toBe("counter_bank_only");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:counter_bank_only",
    );
  });

  it("ignores generic counter-bank substring noise in rules text tokens", () => {
    const assessment = assessmentForAssetRulesText("Encounter protocol only.");

    expect(assessment?.advancementWitness).toBe("none");
    expect(assessment?.evidence).not.toContain(
      "advancement_target_class:counter_bank_only",
    );
  });

  it("derives transfer-source targets from bounded rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Move any number of advancement counters to another installed card.",
    );

    expect(assessment?.advancementWitness).toBe("counter_bank_only");
    expect(assessment?.evidence).toContain(
      "advancement_target_class:counter_bank_only",
    );
  });

  it("ignores transfer-source substring noise in rules text tokens", () => {
    const assessment = assessmentForAssetRulesText(
      "Move any number of advancement countersink to another installed card.",
    );

    expect(assessment?.advancementWitness).toBe("none");
    expect(assessment?.evidence).not.toContain(
      "advancement_target_class:counter_bank_only",
    );
  });

  it("rejects legacy operation rules text without structured placement semantics", () => {
    const assessment = assessmentForAssetRulesText(
      "This card can be advanced.",
      "add one advancement counterproductive to each of up to two installed cards that can be advanced",
    );

    expect(assessment).toBeUndefined();
  });

  it("converts a public two-counter distribution into an immediate score line", () => {
    const assessment = assessmentForSemanticPayload({
      amount: 2,
      mode: "any_combination",
      target: corpCard("two-counter-agenda", {
        type: "agenda",
        advancementCounters: 1,
        advancementRequirement: 3,
      }),
    });

    expect(assessment?.advancementWitness).toBe("score_now");
    expect(assessment?.noConcreteConversion).toBe(false);
    expect(assessment?.scoreValue).toBeGreaterThan(5000);
    expect(assessment?.evidence).toContain("advancement_total_counters:2");
    expect(assessment?.evidence).toContain(
      "advancement_distribution:any_combination",
    );
  });

  it("rejects an advancement burst when only a generic counter bank is visible", () => {
    const assessment = assessmentForSemanticPayload({
      amount: 3,
      mode: "any_combination",
      target: corpCard("counter-bank", {
        type: "asset",
        advancementCounters: 0,
      }),
      targetRulesText: "This card can be advanced.",
    });

    expect(assessment?.advancementWitness).toBe("counter_bank_only");
    expect(assessment?.noConcreteConversion).toBe(true);
    expect(assessment?.scoreValue).toBe(-5200);
  });

  it("recognizes a visible counter transfer into an immediate score line", () => {
    const agenda = corpCard("transfer-agenda", {
      type: "agenda",
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const source = corpCard("transfer-source", {
      type: "asset",
      advancementCounters: 2,
    });
    const advanceAgenda = corpAction("advance_card", {
      cardId: agenda.instanceId,
    });
    const advanceSource = corpAction("advance_card", {
      cardId: source.instanceId,
    });
    const transfer = corpAction("activated_card_ability", {
      cardId: source.instanceId,
      cardImplementationEffectKind: "move_advancement_counters",
      advancementCounterMoveMaximum: "all",
    });
    transfer.source = source.instanceId;
    const input = corpInput({
      root: [agenda, source],
      legalActions: [advanceAgenda, advanceSource, transfer],
    });

    const assessment = semanticRuntimeCorpAdvancementCounterPlacementAssessment(
      input,
      transfer,
      semanticPayloadDependencies([agenda, source], {
        [agenda.definitionId!]: "",
        [source.definitionId!]:
          "Move any number of advancement counters to another installed card.",
      }),
    );

    expect(assessment?.advancementWitness).toBe("score_now");
    expect(assessment?.selectedTargets).toBe(1);
    expect(assessment?.noConcreteConversion).toBe(false);
  });

  it("uses the generic score-conversion capability without card identity metadata", () => {
    const agenda = corpCard("capability-transfer-agenda", {
      type: "agenda",
      advancementCounters: 0,
      advancementRequirement: 3,
    });
    const source = corpCard("capability-transfer-source", {
      type: "asset",
      advancementCounters: 3,
    });
    const advanceAgenda = corpAction("advance_card", {
      cardId: agenda.instanceId,
    });
    const transfer = corpAction("activated_card_ability", {
      cardId: source.instanceId,
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
    });
    transfer.source = source.instanceId;
    const input = corpInput({
      root: [agenda, source],
      legalActions: [advanceAgenda, transfer],
    });
    const dependencies = semanticPayloadDependencies([agenda, source], {
      [agenda.definitionId!]: "",
      [source.definitionId!]: "",
    });

    const assessment = semanticRuntimeCorpAdvancementCounterPlacementAssessment(
      input,
      transfer,
      {
        ...dependencies,
        sourceDefinitionIdForAction: () => undefined,
      },
    );

    expect(assessment?.advancementWitness).toBe("score_now");
    expect(assessment?.selectedTargets).toBe(1);
    expect(assessment?.noConcreteConversion).toBe(false);
  });

  it("penalizes a self-funded counter whose credit cashout cannot repay its advance", () => {
    const assessment = assessmentForBasicAdvance("Public counter surface.", {
      economy: 1,
      tacticSignals: [
        "economy.corp_counter_cashout",
        "advance.corp_counter_transfer",
      ],
    });

    expect(assessment).toMatchObject({
      dominatedByBasicAdvance: false,
      noConcreteConversion: false,
      advancementWitness: "counter_cashout_credit",
      scoreValue: -5200,
    });
    expect(assessment?.evidence).toContain(
      "self_funded_counter_liquid_gain_nonpositive:true",
    );
    expect(assessment?.evidence).toContain(
      "self_funded_counter_requires_selected_conversion_route:true",
    );
    expect(assessment?.evidence).toContain(
      "self_funded_counter_cashout_hint:true",
    );
  });

  it("keeps profitable counter cashouts and agenda advances outside that penalty", () => {
    expect(
      assessmentForBasicAdvance("Public counter surface.", {
        economy: 4,
        tacticSignals: ["economy.corp_counter_cashout"],
      }),
    ).toBeUndefined();
    expect(
      assessmentForBasicAdvance(
        "Gain 1 credit.",
        { economy: 1, tacticSignals: ["economy.corp_counter_cashout"] },
        { type: "agenda" },
      ),
    ).toBeUndefined();
  });
});

function assessmentForBasicAdvance(
  rulesText: string,
  hint?: { economy: number; tacticSignals: string[] },
  overrides: Partial<VisibleCard> = {},
) {
  const source = corpCard("self-funded-counter-source", {
    type: "asset",
    advancementCounters: 0,
    ...overrides,
  });
  const advance = corpAction("advance_card", { cardId: source.instanceId });
  advance.source = source.instanceId;
  advance.costs = [{ clicks: 1, credits: 1 }];
  const input = corpInput({ root: [source], legalActions: [advance] });
  return semanticRuntimeCorpAdvancementCounterPlacementAssessment(
    input,
    advance,
    {
      ...semanticPayloadDependencies([source], {
        [source.definitionId!]: rulesText,
      }),
      actionCreditCost: () => 1,
      hintForDefinitionId: () =>
        hint
          ? ({
              cardId: source.definitionId!,
              side: "corp",
              roles: [],
              planRoles: [],
              aiSupportStatus: "ai_supported",
              tacticSignals: hint.tacticSignals,
              valueHints: { economy: hint.economy },
            } as never)
          : undefined,
    },
  );
}

function assessmentForSemanticPayload(input: {
  amount: number;
  mode: "single_target" | "any_combination" | "up_to_distinct_targets_one_each";
  target: VisibleCard;
  targetRulesText?: string;
}) {
  const advance = corpAction("advance_card", {
    cardId: input.target.instanceId,
  });
  const placement = corpAction("play_operation", {
    cardId: "semantic-advancement-source-instance",
    cardImplementationEffectKind: "distribute_advancement_counters",
    advancementCounterAmount: String(input.amount),
    advancementCounterChoiceMode: input.mode,
  });
  placement.payload!.advancementCounterAmount = input.amount;
  const decisionInput = corpInput({
    root: [input.target],
    legalActions: [advance, placement],
  });
  return semanticRuntimeCorpAdvancementCounterPlacementAssessment(
    decisionInput,
    placement,
    semanticPayloadDependencies([input.target], {
      [input.target.definitionId!]: input.targetRulesText ?? "",
      "semantic-advancement-source-instance": "",
    }),
  );
}

function semanticPayloadDependencies(
  cards: VisibleCard[],
  rulesText: Record<string, string>,
) {
  return {
    sourceDefinitionIdForAction: (
      _input: AiDecisionInput,
      action: LegalAction,
    ) =>
      action.type === "activated_card_ability"
        ? cards.find((card) => card.instanceId === action.source)?.definitionId
        : "semantic-advancement-source-instance",
    normalizedRulesTextForDefinition: (definitionId: string) =>
      rulesText[definitionId] ?? "",
    actionCreditCost: () => 0,
    actionSourceCard: (_input: AiDecisionInput, action: LegalAction) =>
      cards.find(
        (card) =>
          card.instanceId === action.source ||
          card.instanceId === action.payload?.cardId,
      ),
    visibleServerCard: (_input: AiDecisionInput, cardId: string) => {
      const card = cards.find((candidate) => candidate.instanceId === cardId);
      return card
        ? {
            card,
            server: {
              id: "remote_1" as const,
              label: "Remote 1",
              ice: [],
              root: cards,
            },
          }
        : undefined;
    },
    cardType: (card: VisibleCard) => card.type,
    cardAdvancementRequirement: (card: VisibleCard) =>
      card.advancementRequirement,
  };
}

function assessmentForAgendaRulesText(agendaRulesText: string) {
  return assessmentForTargetRulesText(agendaRulesText, {
    advancementCounters: 4,
    advancementRequirement: 3,
    type: "agenda",
  });
}

function assessmentForAssetRulesText(
  assetRulesText: string,
  sourceRulesText?: string,
) {
  return assessmentForTargetRulesText(
    assetRulesText,
    {
      advancementCounters: 2,
      type: "asset",
    },
    sourceRulesText,
  );
}

function assessmentForTargetRulesText(
  targetRulesText: string,
  targetOverrides: Partial<VisibleCard>,
  legacySourceRulesText?: string,
) {
  const target = corpCard("custom-advance-target", targetOverrides);
  const advanceAction = corpAction("advance_card", {
    cardId: target.instanceId,
  });
  const placementAction = corpAction("play_operation", {
    cardId: "custom-advancement-distribution",
    ...(legacySourceRulesText === undefined
      ? {
          cardImplementationEffectKind: "distribute_advancement_counters",
          advancementCounterAmount: 2,
          advancementCounterChoiceMode: "up_to_distinct_targets_one_each",
        }
      : {}),
  });
  const input = corpInput({
    root: [target],
    legalActions: [advanceAction],
  });

  return semanticRuntimeCorpAdvancementCounterPlacementAssessment(
    input,
    placementAction,
    {
      sourceDefinitionIdForAction: (_input, action) =>
        typeof action.payload?.cardId === "string"
          ? action.payload.cardId
          : undefined,
      normalizedRulesTextForDefinition: (definitionId) =>
        definitionId === "custom-advancement-distribution"
          ? (legacySourceRulesText ?? "")
          : targetRulesText,
      actionCreditCost: () => 0,
      actionSourceCard: (_input, action) =>
        action.actionId === advanceAction.actionId ? target : undefined,
      visibleServerCard: (_input, cardId) =>
        cardId === target.instanceId
          ? {
              card: target,
              server: {
                id: "remote_1",
                label: "Remote 1",
                ice: [],
                root: [target],
              },
            }
          : undefined,
      cardType: (card) => card.type,
      cardAdvancementRequirement: (card) => card.advancementRequirement,
    },
  );
}

function corpInput(input: {
  root: VisibleCard[];
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: corpCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: corpCard("runner-identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: input.root,
        },
      ],
      publicEvents: [],
      legalActions: input.legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: input.legalActions,
    difficulty: "normal",
    seed: "semantic-runtime-corp-advancement-counter-test",
    decisionId: "semantic-runtime-corp-advancement-counter-test",
    actionNumber: 1,
    profileId: "semantic-runtime-corp-advancement-counter-test",
  } as AiDecisionInput;
}

function corpCard(
  definitionId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "asset",
    known: true,
    owner: "corp",
    controller: "corp",
    ...overrides,
  };
}

function corpAction(
  type: string,
  payload: Record<string, string | number | boolean> = {},
): LegalAction {
  return {
    actionId: `${type}-${payload.cardId ?? "action"}`,
    side: "corp",
    type,
    payload,
  } as LegalAction;
}
