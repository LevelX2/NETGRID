import {
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
  CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
  type CorpOptionalRezChoiceQuote,
  type LegalAction,
  type PlayerView,
  type VisibleCard,
  type VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "./input-dto";

describe("AI input DTO Corp rez projection contract", () => {
  it("preserves plan-bound Runner cost-penalty support bindings", () => {
    const action = iceInstallAction();
    action.payload = {
      ...action.payload,
      runnerCostPenaltySupportContinuation: true,
      runnerCostPenaltySupportWindowId: "runner_cost_penalty_support.91",
      costPenaltySupportWindowId: "runner_cost_penalty_support.91",
      costPenaltySupportOriginalActionId: "runner.play_event.temple",
    };
    const view = playerView(action);
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-cost-penalty-support-bindings",
      decisionId: "runner-cost-penalty-support-bindings:corp:1",
      actionNumber: 1,
      profileId: "rez-projection-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      runnerCostPenaltySupportContinuation: true,
      runnerCostPenaltySupportWindowId: "runner_cost_penalty_support.91",
      costPenaltySupportWindowId: "runner_cost_penalty_support.91",
      costPenaltySupportOriginalActionId: "runner.play_event.temple",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject(
      input.legalActions[0]?.payload ?? {},
    );
  });

  it("preserves install cost fields, exact post-install quote and current visible quote", () => {
    const action = iceInstallAction();
    const view = playerView(action);
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "rez-projection-dto",
      decisionId: "rez-projection-dto:corp:1",
      actionNumber: 1,
      profileId: "rez-projection-dto-test",
    });

    expect(input.legalActions[0]?.payload).toEqual(action.payload);
    expect(input.playerView.legalActions[0]?.payload).toEqual(action.payload);
    expect(input.playerView.servers[0]?.ice[0]?.effectiveRezCostQuote).toEqual(
      view.servers[0]?.ice[0]?.effectiveRezCostQuote,
    );
  });

  it("preserves public opponent memory facts for Corp delayed-install projections", () => {
    const action = iceInstallAction();
    const view = playerView(action);
    view.opponent.memoryUsed = 2;
    view.opponent.memoryLimit = 4;

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "public-opponent-memory",
      decisionId: "public-opponent-memory:corp:1",
      actionNumber: 1,
      profileId: "rez-projection-dto-test",
    });

    expect(input.playerView.opponent).toMatchObject({
      memoryUsed: 2,
      memoryLimit: 4,
    });
  });

  it.each([
    [
      "X-strength",
      {
        postInstallRezQuoteVariableRezKind: "x_strength",
        postInstallRezQuoteVariableAdditionalCreditsPerValue: 1,
        postInstallRezQuoteVariableMinValue: 0,
        postInstallRezQuoteVariableMaxValue: 8,
        postInstallRezQuoteVariableMinValueFinalCredits: 3,
        postInstallRezQuoteVariableMaxValueFinalCredits: 11,
        postInstallRezQuoteVariableEffectiveStrengthFromValue: true,
        postInstallRezQuoteVariableTraceLimitFromValue: true,
      },
    ],
    [
      "paid ETR",
      {
        postInstallRezQuoteVariableRezKind: "paid_end_the_run_subroutines",
        postInstallRezQuoteVariableAdditionalCreditsPerSubroutine: 2,
        postInstallRezQuoteVariableMinSubroutines: 0,
        postInstallRezQuoteVariableMinSubroutinesFinalCredits: 3,
        postInstallRezQuoteVariableFirstEndTheRunSubroutineCount: 1,
        postInstallRezQuoteVariableFirstEndTheRunFinalCredits: 5,
      },
    ],
    [
      "alternate subtype",
      {
        postInstallRezQuoteVariableRezKind: "alternate_subtype",
        postInstallRezQuoteVariableBaseSubtypes: "sentry",
        postInstallRezQuoteVariableBaseSubtypesFinalCredits: 3,
        postInstallRezQuoteVariableAlternateSubtypes: "wall",
        postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits: 1,
        postInstallRezQuoteVariableAlternateSubtypesFinalCredits: 4,
      },
    ],
  ] as const)(
    "preserves the complete %s post-install quote payload allowlist",
    (_label, variablePayload) => {
      const action = iceInstallAction();
      action.payload = {
        ...action.payload,
        postInstallRezQuoteCostKind: "variable",
        ...variablePayload,
      };
      const view = playerView(action);
      const input = buildAiDecisionInputDto({
        side: "corp",
        playerView: view,
        eventTail: [],
        legalActions: [action],
        difficulty: "normal",
        seed: "variable-rez-payload-allowlist",
        decisionId: "variable-rez-payload-allowlist:corp:1",
        actionNumber: 1,
        profileId: "rez-projection-dto-test",
      });

      expect(input.legalActions[0]?.payload).toEqual(action.payload);
      expect(input.playerView.legalActions[0]?.payload).toEqual(action.payload);
    },
  );

  it.each([
    ["X-strength", "x_strength"],
    ["paid ETR", "paid_end_the_run_subroutines"],
    ["alternate subtype", "alternate_subtype"],
  ] as const)(
    "preserves an exact complete installed %s parameter quote",
    (_label, kind) => {
      const action = iceInstallAction();
      const view = playerView(action);
      const quote = variableInstalledRezQuote(kind);
      view.servers[0]!.ice[0]!.effectiveRezCostQuote = quote;
      const input = buildAiDecisionInputDto({
        side: "corp",
        playerView: view,
        eventTail: [],
        legalActions: [action],
        difficulty: "normal",
        seed: "variable-installed-rez-quote",
        decisionId: "variable-installed-rez-quote:corp:1",
        actionNumber: 1,
        profileId: "rez-projection-dto-test",
      });

      expect(
        input.playerView.servers[0]?.ice[0]?.effectiveRezCostQuote,
      ).toEqual(quote);
      expect(
        input.playerView.servers[0]?.ice[0]?.effectiveRezCostQuote,
      ).not.toBe(quote);
    },
  );

  it.each([
    [
      "X-strength payment bounds",
      "x_strength",
      (parameter: Record<string, unknown>) => {
        parameter.maxValueFinalCredits = 99;
      },
    ],
    [
      "paid-ETR first-effect frontier",
      "paid_end_the_run_subroutines",
      (parameter: Record<string, unknown>) => {
        parameter.firstEndTheRunFinalCredits = 4;
      },
    ],
    [
      "alternate-subtype payment branch",
      "alternate_subtype",
      (parameter: Record<string, unknown>) => {
        parameter.alternateSubtypesFinalCredits = 3;
      },
    ],
    [
      "alternate-subtype canonical labels",
      "alternate_subtype",
      (parameter: Record<string, unknown>) => {
        parameter.alternateSubtypes = ["Code Gate"];
      },
    ],
  ] as const)(
    "downgrades malformed variable quote %s to incomplete",
    (_label, kind, mutate) => {
      const action = iceInstallAction();
      const view = playerView(action);
      const quote = structuredClone(
        variableInstalledRezQuote(kind),
      ) as unknown as Record<string, unknown>;
      mutate(quote.variableParameter as Record<string, unknown>);
      view.servers[0]!.ice[0]!.effectiveRezCostQuote =
        quote as unknown as VisibleCorpRezCostQuote;
      const input = buildAiDecisionInputDto({
        side: "corp",
        playerView: view,
        eventTail: [],
        legalActions: [action],
        difficulty: "normal",
        seed: "malformed-variable-installed-rez-quote",
        decisionId: "malformed-variable-installed-rez-quote:corp:1",
        actionNumber: 1,
        profileId: "rez-projection-dto-test",
      });

      expect(
        input.playerView.servers[0]?.ice[0]?.effectiveRezCostQuote,
      ).toMatchObject({
        context: "installed",
        complete: false,
      });
    },
  );

  it("drops a maliciously enriched Corp rez quote from a Runner view", () => {
    const action = iceInstallAction();
    const view = playerView(action);
    view.side = "runner";
    view.legalActions = [];
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "rez-projection-runner-negative",
      decisionId: "rez-projection-runner-negative:runner:1",
      actionNumber: 1,
      profileId: "rez-projection-dto-test",
    });

    expect(input.playerView.servers[0]?.ice[0]).not.toHaveProperty(
      "effectiveRezCostQuote",
    );
  });

  it.each([
    [
      "fractional base credits",
      (quote: Record<string, unknown>) => {
        quote.baseCredits = 0.5;
      },
    ],
    [
      "negative final credits",
      (quote: Record<string, unknown>) => {
        quote.finalCredits = -1;
      },
    ],
    [
      "duplicate modifier ids",
      (quote: Record<string, unknown>) => {
        quote.reductionSourceDefinitionIds = ["same", "same"];
      },
    ],
    [
      "unsorted modifier ids",
      (quote: Record<string, unknown>) => {
        quote.reductionSourceDefinitionIds = ["z", "a"];
      },
    ],
    [
      "overlapping modifier ids",
      (quote: Record<string, unknown>) => {
        quote.reductionSourceDefinitionIds = ["same"];
        quote.increaseSourceDefinitionIds = ["same"];
      },
    ],
  ])(
    "downgrades an installed quote with %s to incomplete",
    (_label, mutate) => {
      const action = iceInstallAction();
      const view = playerView(action);
      const quote = view.servers[0]?.ice[0]
        ?.effectiveRezCostQuote as unknown as Record<string, unknown>;
      mutate(quote);

      const input = buildAiDecisionInputDto({
        side: "corp",
        playerView: view,
        eventTail: [],
        legalActions: [action],
        difficulty: "normal",
        seed: "malformed-installed-rez-quote",
        decisionId: "malformed-installed-rez-quote:corp:1",
        actionNumber: 1,
        profileId: "rez-projection-dto-test",
      });

      expect(
        input.playerView.servers[0]?.ice[0]?.effectiveRezCostQuote,
      ).toMatchObject({
        context: "installed",
        complete: false,
      });
    },
  );

  it("preserves the complete Engine-certified root-rez credit outcome quote", () => {
    const action = rootRezCreditAction();
    const view = playerView(action);
    view.stateVersion = 18;
    view.timingPoint = "run.movement_rez_window";
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "root-rez-credit-outcome-dto",
      decisionId: "root-rez-credit-outcome-dto:corp:1",
      actionNumber: 1,
      profileId: "rez-projection-dto-test",
    });

    expect(input.legalActions[0]?.payload).toEqual(action.payload);
    expect(input.playerView.legalActions[0]?.payload).toEqual(action.payload);
  });

  it("preserves only an exactly bound complete optional-rez option quote", () => {
    const action = iceInstallAction();
    const view = optionalRezChoiceView(action, optionalRezQuote());
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: view.legalActions,
      difficulty: "normal",
      seed: "optional-rez-choice-dto",
      decisionId: "optional-rez-choice-dto:corp:12",
      actionNumber: 12,
      profileId: "rez-projection-dto-test",
    });

    expect(
      input.playerView.pendingChoice?.options[0]?.hqInstallRezOptionQuote,
    ).toEqual(optionalRezQuote());
    expect(
      input.playerView.pendingChoice?.options[0]?.hqInstallRezOptionQuote,
    ).not.toBe(view.pendingChoice?.options[0]?.hqInstallRezOptionQuote);
  });

  it("preserves a bound incomplete optional-rez quote without cost fields", () => {
    const action = iceInstallAction();
    const complete = optionalRezQuote();
    const incomplete: CorpOptionalRezChoiceQuote = {
      schemaVersion: complete.schemaVersion,
      kind: complete.kind,
      context: complete.context,
      choiceId: complete.choiceId,
      optionId: complete.optionId,
      sourceAgendaId: complete.sourceAgendaId,
      cardId: complete.cardId,
      cardDefinitionId: complete.cardDefinitionId,
      targetServerId: complete.targetServerId,
      installedZone: complete.installedZone,
      sequencePosition: complete.sequencePosition,
      stateVersion: complete.stateVersion,
      complete: false,
    };
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: optionalRezChoiceView(action, incomplete),
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "optional-rez-choice-incomplete",
      decisionId: "optional-rez-choice-incomplete:corp:12",
      actionNumber: 12,
      profileId: "rez-projection-dto-test",
    });

    expect(
      input.playerView.pendingChoice?.options[0]?.hqInstallRezOptionQuote,
    ).toEqual(incomplete);
  });

  it.each([
    [
      "choice binding",
      (quote: Record<string, unknown>) => {
        quote.choiceId = "different-choice";
      },
    ],
    [
      "state binding",
      (quote: Record<string, unknown>) => {
        quote.stateVersion = 11;
      },
    ],
    [
      "payment arithmetic",
      (quote: Record<string, unknown>) => {
        quote.regularCreditsRequired = 99;
      },
    ],
    [
      "card type and zone",
      (quote: Record<string, unknown>) => {
        quote.cardType = "asset";
      },
    ],
    [
      "score parent",
      (quote: Record<string, unknown>) => {
        quote.sourceAgendaId = "different-agenda";
      },
    ],
    [
      "target server",
      (quote: Record<string, unknown>) => {
        quote.targetServerId = "hq";
      },
    ],
    [
      "new_remote target",
      (quote: Record<string, unknown>) => {
        quote.targetServerId = "new_remote";
      },
    ],
    [
      "current regular credits",
      (quote: Record<string, unknown>) => {
        quote.regularCreditsAvailable = 4;
      },
    ],
    [
      "additional-cost affordability",
      (quote: Record<string, unknown>) => {
        quote.additionalCostsPayable = false;
        quote.affordable = false;
      },
    ],
    [
      "duplicate modifier ids",
      (quote: Record<string, unknown>) => {
        quote.reductionSourceDefinitionIds = ["rez-reducer", "rez-reducer"];
      },
    ],
    [
      "non-canonical modifier ids",
      (quote: Record<string, unknown>) => {
        quote.reductionSourceDefinitionIds = ["z-reducer", "a-reducer"];
      },
    ],
  ])("drops an optional-rez quote with malformed %s", (_label, mutate) => {
    const action = iceInstallAction();
    const quote = structuredClone(optionalRezQuote()) as unknown as Record<
      string,
      unknown
    >;
    mutate(quote);
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: optionalRezChoiceView(
        action,
        quote as unknown as CorpOptionalRezChoiceQuote,
      ),
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "optional-rez-choice-malformed",
      decisionId: "optional-rez-choice-malformed:corp:12",
      actionNumber: 12,
      profileId: "rez-projection-dto-test",
    });

    expect(input.playerView.pendingChoice?.options[0]).not.toHaveProperty(
      "hqInstallRezOptionQuote",
    );
  });

  it("drops an optional-rez quote when the card is in the wrong server zone", () => {
    const action = iceInstallAction();
    const view = optionalRezChoiceView(action, optionalRezQuote());
    const server = view.servers[0]!;
    server.root = server.ice;
    server.ice = [];
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "optional-rez-choice-wrong-zone",
      decisionId: "optional-rez-choice-wrong-zone:corp:12",
      actionNumber: 12,
      profileId: "rez-projection-dto-test",
    });

    expect(input.playerView.pendingChoice?.options[0]).not.toHaveProperty(
      "hqInstallRezOptionQuote",
    );
  });

  it.each([
    [
      "option value",
      (view: PlayerView) => {
        view.pendingChoice!.options[0]!.value = "different-card";
      },
    ],
    [
      "visible card id",
      (view: PlayerView) => {
        view.pendingChoice!.options[0]!.card!.instanceId = "different-card";
      },
    ],
    [
      "visible definition",
      (view: PlayerView) => {
        view.pendingChoice!.options[0]!.card!.definitionId =
          "different-definition";
      },
    ],
  ])("drops an optional-rez quote with mismatched %s", (_label, mutate) => {
    const action = iceInstallAction();
    const view = optionalRezChoiceView(action, optionalRezQuote());
    mutate(view);
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "optional-rez-choice-misbinding",
      decisionId: "optional-rez-choice-misbinding:corp:12",
      actionNumber: 12,
      profileId: "rez-projection-dto-test",
    });

    expect(input.playerView.pendingChoice?.options[0]).not.toHaveProperty(
      "hqInstallRezOptionQuote",
    );
  });

  it("drops an optional-rez quote from a non-Corp actor view", () => {
    const action = iceInstallAction();
    const view = optionalRezChoiceView(action, optionalRezQuote());
    view.side = "runner";
    view.legalActions = [];
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "optional-rez-choice-runner",
      decisionId: "optional-rez-choice-runner:runner:12",
      actionNumber: 12,
      profileId: "rez-projection-dto-test",
    });

    expect(input.playerView.pendingChoice?.options[0]).not.toHaveProperty(
      "hqInstallRezOptionQuote",
    );
  });
});

function iceInstallAction(): LegalAction {
  return {
    actionId: "corp.install.ice",
    side: "corp",
    type: "install_card",
    label: "ICE vor HQ installieren",
    source: "ice-in-hq",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits: 2 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 12,
    payload: {
      cardId: "ice-in-hq",
      serverId: "hq",
      placement: "ice",
      iceInstallBaseCost: 1,
      iceInstallAdditionalCost: 2,
      iceInstallReduction: 1,
      iceInstallReductionSourceDefinitionIds: "rez-reducer",
      iceInstallIncreaseSourceDefinitionIds: "rez-increaser",
      iceInstallTotalCost: 2,
      postInstallRezQuoteCardId: "ice-in-hq",
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 12,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCostKind: "fixed",
      postInstallRezQuoteBaseCredits: 5,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 1,
      postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
      postInstallRezQuoteReductionSourceDefinitionIds: "rez-reducer",
      postInstallRezQuoteIncreaseSourceDefinitionIds: "rez-increaser",
    },
  };
}

function rootRezCreditAction(): LegalAction {
  const actionId = "corp.rez_card.economy-asset.remote_1.economy-asset";
  return {
    actionId,
    side: "corp",
    type: "rez_card",
    label: "Economy Asset laden",
    source: "economy-asset",
    timingPoint: "run.movement_rez_window",
    costs: [{ credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 18,
    payload: {
      cardId: "economy-asset",
      serverId: "remote_1",
      rootRezCreditOutcomeQuoteSchemaVersion:
        CORP_ROOT_REZ_CREDIT_OUTCOME_QUOTE_SCHEMA_VERSION,
      rootRezCreditOutcomeQuoteComplete: true,
      rootRezCreditOutcomeQuoteSourceCardInstanceId: "economy-asset",
      rootRezCreditOutcomeQuoteTargetServerId: "remote_1",
      rootRezCreditOutcomeQuoteStateVersion: 18,
      rootRezCreditOutcomeQuoteTimingPoint: "run.movement_rez_window",
      rootRezCreditOutcomeQuoteActionId: actionId,
      rootRezCreditOutcomeQuoteResolution: "guaranteed",
      rootRezCreditOutcomeQuoteGrossCreditGain: 3,
      rootRezCreditOutcomeQuoteRezCredits: 1,
      rootRezCreditOutcomeQuoteNetCreditGain: 2,
    },
  };
}

function playerView(action: LegalAction): PlayerView {
  const corpIdentity = identity("corp");
  const runnerIdentity = identity("runner");
  const installedIce: VisibleCard = {
    instanceId: "installed-ice",
    definitionId: "installed-ice-definition",
    title: "Installed ICE",
    owner: "corp",
    controller: "corp",
    type: "ice",
    known: true,
    rezzed: false,
    rezCost: 5,
    effectiveRezCostQuote: {
      context: "installed",
      cardId: "installed-ice",
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: 12,
      complete: true,
      costKind: "fixed",
      baseCredits: 5,
      finalCredits: 3,
      mandatoryAdditionalCosts: { agendaPoints: 1 },
      reductionSourceDefinitionIds: ["rez-reducer"],
      increaseSourceDefinitionIds: ["rez-increaser"],
    },
  };
  return {
    side: "corp",
    stateVersion: 12,
    timingPoint: "corp_action.main",
    activeSide: "corp",
    phase: "action",
    own: {
      identity: corpIdentity,
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 40,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: runnerIdentity,
      credits: 5,
      clicks: 4,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      coreDamage: 0,
      deckCount: 40,
      discardCount: 0,
      discardCards: [],
      scoreArea: [],
      rig: [],
      memoryUsed: 0,
      memoryLimit: 4,
    },
    servers: [
      {
        id: "hq",
        label: "HQ",
        ice: [installedIce],
        root: [],
      },
    ],
    publicEvents: [],
    legalActions: [action],
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
}

function optionalRezChoiceView(
  action: LegalAction,
  quote: CorpOptionalRezChoiceQuote,
): PlayerView {
  const view = playerView(action);
  view.servers[0]!.id = "remote_1";
  view.servers[0]!.label = "Remote 1";
  view.pendingChoice = {
    choiceId: "choice_optional_rez_12",
    side: "corp",
    source:
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data-fort:remote_1:installed-ice:1:12",
    prompt: "Karte rezzen?",
    kind: "select_cards",
    options: [
      {
        id: "card_installed-ice",
        label: "Installed ICE",
        value: "installed-ice",
        card: {
          instanceId: "installed-ice",
          definitionId: "installed-ice-definition",
          title: "Installed ICE",
          known: true,
          type: "ice",
          owner: "corp",
          controller: "corp",
          rezzed: false,
        },
        hqInstallRezOptionQuote: quote,
      },
    ],
    minSelections: 0,
    maxSelections: 1,
    stateVersion: 12,
    visibility: "hidden_info_barrier",
  };
  view.own.scoreArea = [
    {
      instanceId: "data-fort",
      definitionId: "onr_v1_197_data-fort-reclamation",
      title: "Data Fort Reclamation",
      known: true,
      type: "agenda",
      owner: "corp",
      controller: "corp",
    },
  ];
  return view;
}

function optionalRezQuote(): Extract<
  CorpOptionalRezChoiceQuote,
  { complete: true }
> {
  return {
    schemaVersion: CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
    kind: CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
    context: "hq_to_new_remote_optional_rez",
    choiceId: "choice_optional_rez_12",
    optionId: "card_installed-ice",
    sourceAgendaId: "data-fort",
    cardId: "installed-ice",
    cardDefinitionId: "installed-ice-definition",
    targetServerId: "remote_1",
    installedZone: "serverIce",
    sequencePosition: 1,
    stateVersion: 12,
    complete: true,
    cardType: "ice",
    baseCredits: 5,
    finalCredits: 3,
    mandatoryAdditionalCosts: { agendaPoints: 0 },
    reductionSourceDefinitionIds: ["rez-reducer"],
    temporaryCreditsAvailable: 2,
    temporaryCreditsApplied: 2,
    regularCreditsAvailable: 5,
    regularCreditsRequired: 1,
    creditPayable: true,
    additionalCostsPayable: true,
    affordable: true,
    mandatoryContinuationComplete: true,
    rezAndMandatoryContinuationExecutable: true,
  };
}

function variableInstalledRezQuote(
  kind: "x_strength" | "paid_end_the_run_subroutines" | "alternate_subtype",
): VisibleCorpRezCostQuote {
  const binding = {
    context: "installed" as const,
    cardId: "installed-ice",
    targetServerId: "hq" as const,
    projectedServerId: "hq" as const,
    expiresAtStateVersion: 12,
    complete: true as const,
    costKind: "variable" as const,
    baseCredits: 5,
    finalCredits: 3,
    mandatoryAdditionalCosts: { agendaPoints: 1 },
    reductionSourceDefinitionIds: ["rez-reducer"],
    increaseSourceDefinitionIds: ["rez-increaser"],
  };
  if (kind === "x_strength") {
    return {
      ...binding,
      variableParameter: {
        kind,
        additionalCreditsPerValue: 1,
        minValue: 0,
        maxValue: 8,
        minValueFinalCredits: 3,
        maxValueFinalCredits: 11,
        effectiveStrengthFromValue: true,
        traceLimitFromValue: true,
      },
    };
  }
  if (kind === "paid_end_the_run_subroutines") {
    return {
      ...binding,
      variableParameter: {
        kind,
        additionalCreditsPerSubroutine: 2,
        minSubroutines: 0,
        minSubroutinesFinalCredits: 3,
        firstEndTheRunSubroutineCount: 1,
        firstEndTheRunFinalCredits: 5,
      },
    };
  }
  return {
    ...binding,
    variableParameter: {
      kind,
      baseSubtypes: ["sentry"],
      baseSubtypesFinalCredits: 3,
      alternateSubtypes: ["wall"],
      alternateSubtypesAdditionalCredits: 1,
      alternateSubtypesFinalCredits: 4,
    },
  };
}

function identity(side: "corp" | "runner"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
