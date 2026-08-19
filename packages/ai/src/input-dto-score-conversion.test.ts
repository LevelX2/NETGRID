import { describe, expect, it } from "vitest";
import type {
  LegalAction,
  PlayerView,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { buildAiDecisionInputDto } from "./input-dto";

describe("AI input DTO score-conversion contract", () => {
  it("preserves the public obligation-removal cost and agenda conversion quote", () => {
    const action = conversionAction();
    action.type = "trigger_ability";
    action.source = "game_rule";
    action.costs = [{ credits: 12, clicks: 1 }];
    action.payload = {
      abilityId: "remove_obligation",
      obligationDebtAbility: "remove_obligation",
      obligationDebtCreditCost: 12,
      obligationDebtScoreAgendaPoints: 1,
      obligationDebtCountBefore: 1,
      privateObligationProbe: "must-not-cross-dto",
    };

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView(action),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "obligation-removal-dto",
      decisionId: "obligation-removal-dto:corp:1",
      actionNumber: 1,
      profileId: "obligation-removal-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      obligationDebtAbility: "remove_obligation",
      obligationDebtCreditCost: 12,
      obligationDebtScoreAgendaPoints: 1,
      obligationDebtCountBefore: 1,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      obligationDebtAbility: "remove_obligation",
      obligationDebtCreditCost: 12,
      obligationDebtScoreAgendaPoints: 1,
      obligationDebtCountBefore: 1,
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty(
      "privateObligationProbe",
    );
  });

  it("preserves a public engine-bound install target but blocks an engine-only one", () => {
    const publicInstall = conversionAction();
    publicInstall.type = "install_card";
    publicInstall.payload = {
      cardId: "black-widow",
      selectedCardId: "public-mastermind",
    };
    publicInstall.targetRequirements = [
      {
        id: "targetIce",
        kind: "card",
        side: "corp",
        zoneScope: ["corp.servers.ice"],
        visibility: "public",
      },
    ];
    const engineOnlyInstall = {
      ...publicInstall,
      actionId: "black-widow-engine-only",
      targetRequirements: [
        {
          ...publicInstall.targetRequirements[0]!,
          visibility: "engine_only" as const,
        },
      ],
      payload: { ...publicInstall.payload, selectedCardId: "hidden-ice" },
    };

    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(publicInstall, "runner"),
      eventTail: [],
      legalActions: [publicInstall, engineOnlyInstall],
      difficulty: "normal",
      seed: "bound-install-target-dto",
      decisionId: "bound-install-target-dto:runner:1",
      actionNumber: 1,
      profileId: "bound-install-target-dto-test",
    });

    expect(input.legalActions[0]?.payload?.selectedCardId).toBe(
      "public-mastermind",
    );
    expect(input.legalActions[1]?.payload?.selectedCardId).toBeUndefined();
  });

  it("preserves an exact advancement-counter economy quote", () => {
    const action = conversionAction();
    action.type = "activated_card_ability";
    action.source = "cashout-source";
    action.payload = {
      cardId: "cashout-source",
      cardImplementationEconomyKind:
        "gain_credits_per_advancement_counter_on_source",
      cardImplementationAmountPerAdvancementCounter: 4,
      advancementCounterCount: 2,
      gainCreditsAmount: 8,
    };
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView(action),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "counter-cashout-dto",
      decisionId: "counter-cashout-dto:corp:1",
      actionNumber: 1,
      profileId: "counter-cashout-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      cardImplementationEconomyKind:
        "gain_credits_per_advancement_counter_on_source",
      cardImplementationAmountPerAdvancementCounter: 4,
      advancementCounterCount: 2,
      gainCreditsAmount: 8,
    });
  });

  it("preserves only a current Corp-bound counter-bank preparation quote", () => {
    const action = conversionAction();
    const view = playerView(action);
    view.own.gripOrHq = [
      {
        instanceId: "vapor",
        definitionId: "onr_v1_347_vapor-ops",
        title: "Vapor Ops",
        owner: "corp",
        controller: "corp",
        type: "asset",
        known: true,
        counterBankPreparationQuote: {
          schemaVersion: "corp-counter-bank-preparation-quote-v1",
          context: "corp_counter_bank_preparation",
          sourceCardId: "vapor",
          expiresAtStateVersion: 1,
          location: { kind: "corp_hq" },
          advancementCounters: 2,
          advanceableBeforeRez: true,
          activatedAbilitiesRequireRez: true,
          cashout: {
            advancementCounterCost: 1,
            creditGain: 1,
            actionCost: 0,
          },
          transfer: {
            actionCost: 1,
            minimumSourceCounters: 1,
            source: "source_card",
            target: "chosen_installed_advanceable_card",
            maximum: "all",
          },
        },
      },
    ];

    const corpInput = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "counter-bank-dto",
      decisionId: "counter-bank-dto:corp:1",
      actionNumber: 1,
      profileId: "counter-bank-dto-test",
    });
    expect(
      corpInput.playerView.own.gripOrHq[0]?.counterBankPreparationQuote,
    ).toMatchObject({
      sourceCardId: "vapor",
      location: { kind: "corp_hq" },
      advancementCounters: 2,
    });

    view.side = "runner";
    const runnerInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "counter-bank-dto-runner",
      decisionId: "counter-bank-dto:runner:1",
      actionNumber: 1,
      profileId: "counter-bank-dto-test",
    });
    expect(runnerInput.playerView.own.gripOrHq[0]).not.toHaveProperty(
      "counterBankPreparationQuote",
    );
  });

  it("preserves explicit play costs only for known cards", () => {
    const action = conversionAction();
    const view = playerView(action);
    view.own.gripOrHq = [
      {
        instanceId: "power-grid",
        definitionId: "onr_v1_299_power-grid-overload",
        title: "Power Grid Overload",
        owner: "corp",
        controller: "corp",
        type: "operation",
        known: true,
        playCost: {
          kind: "variable_x",
          minimumX: 1,
          creditsPerX: 1,
          maximumX: { kind: "context" },
        },
      },
    ];
    view.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [
          {
            instanceId: "hidden-root",
            known: false,
            playCost: { kind: "fixed", credits: 7 },
          },
        ],
      },
    ];

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "play-cost-dto",
      decisionId: "play-cost-dto:corp:1",
      actionNumber: 1,
      profileId: "play-cost-dto-test",
    });

    expect(input.playerView.own.gripOrHq[0]?.playCost).toEqual({
      kind: "variable_x",
      minimumX: 1,
      creditsPerX: 1,
      maximumX: { kind: "context" },
    });
    expect(input.playerView.servers[0]?.root[0]).not.toHaveProperty("playCost");
  });

  it("preserves only a current Corp score-choice continuation", () => {
    const action = conversionAction();
    const view = playerView(action);
    view.pendingChoice = {
      choiceId: "score-choice",
      side: "corp",
      source: "p3_34.distribute_advancement:test",
      prompt: "Choose agenda",
      kind: "select_option",
      options: [{ id: "agenda", label: "Agenda", value: "agenda:2" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 1,
      visibility: "public",
      continuation: {
        family: "corp_advancement_counter",
        originActionId: "corp.play_operation.test",
        createdAtStateVersion: 1,
      },
    };
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "continuation",
      decisionId: "continuation:1",
      actionNumber: 1,
      profileId: "continuation-test",
    });
    expect(input.playerView.pendingChoice?.continuation).toEqual(
      view.pendingChoice.continuation,
    );
    view.pendingChoice.continuation!.createdAtStateVersion = 0;
    expect(
      buildAiDecisionInputDto({
        side: "corp",
        playerView: view,
        eventTail: [],
        legalActions: [action],
        difficulty: "normal",
        seed: "continuation",
        decisionId: "continuation:2",
        actionNumber: 1,
        profileId: "continuation-test",
      }).playerView.pendingChoice?.continuation,
    ).toBeUndefined();
  });

  it("preserves only explicitly public resolved effects for plan-phase communication", () => {
    const action = conversionAction();
    const view = playerView(action, "runner");
    view.publicEvents = [
      {
        eventId: "turn-start-effects",
        type: "automatic_effects_resolved",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:turn-start-effects",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          resolvedEffects: [
            {
              effectId: "conference-credit",
              kind: "gain_credits",
              visibility: "public",
              side: "runner",
              amount: 2,
              reason: "start_of_turn",
              sourceDefinitionId: "onr_v1_184_top-runners-conference",
              sourceTitle: "Top Runners' Conference",
            },
            {
              effectId: "private-probe",
              kind: "draw_cards",
              visibility: "private_to_side",
              side: "corp",
              amount: 1,
              cardDefinitionId: "must-not-cross-dto",
              cardTitle: "Must not cross DTO",
            },
          ],
        },
      },
    ];
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: view.publicEvents,
      legalActions: [action],
      difficulty: "normal",
      seed: "public-resolved-effects-dto",
      decisionId: "public-resolved-effects-dto:runner:1",
      actionNumber: 1,
      profileId: "public-resolved-effects-dto-test",
    });

    expect(
      input.playerView.publicEvents[0]?.publicPayload.resolvedEffects,
    ).toEqual([
      expect.objectContaining({
        effectId: "conference-credit",
        kind: "gain_credits",
        visibility: "public",
        sourceDefinitionId: "onr_v1_184_top-runners-conference",
      }),
    ]);
    expect(input.eventTail[0]?.publicPayload.resolvedEffects).toEqual(
      input.playerView.publicEvents[0]?.publicPayload.resolvedEffects,
    );
    expect(JSON.stringify(input)).not.toContain("must-not-cross-dto");
  });

  it("preserves exact public score-conversion capabilities and drops unknown payload data", () => {
    const action = conversionAction();
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView(action),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "score-conversion-dto",
      decisionId: "score-conversion-dto:corp:1",
      actionNumber: 1,
      profileId: "score-conversion-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      scoreConversionCapability: "move_advancement",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });

  it("preserves the complete side-safe action-capacity contract", () => {
    const action = conversionAction();
    action.payload = {
      cardId: "corp-action-bank",
      gainActionsAmount: 1,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "unrestricted",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
      cardImplementationSourceCounterType: "boon",
      cardImplementationSourceCounterCost: 1,
      privateProbe: "must-not-cross-dto",
    };
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView(action),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "action-capacity-dto",
      decisionId: "action-capacity-dto:corp:1",
      actionNumber: 1,
      profileId: "action-capacity-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      gainActionsAmount: 1,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "unrestricted",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
      cardImplementationSourceCounterType: "boon",
      cardImplementationSourceCounterCost: 1,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      gainActionsAmount: 1,
      actionCapacityRestriction: "unrestricted",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });

  it("keeps an Engine-resolved action total above the normal turn start", () => {
    const action = conversionAction();
    const view = playerView(action);
    view.own.clicks = 5;
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "resolved-extra-actions-dto",
      decisionId: "resolved-extra-actions-dto:corp:1",
      actionNumber: 1,
      profileId: "resolved-extra-actions-dto-test",
    });

    expect(input.playerView.own.clicks).toBe(5);
  });

  it("preserves side-safe hosted-credit and run-action semantics", () => {
    const action = runnerSemanticAction();
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-action-semantics-dto",
      decisionId: "runner-action-semantics-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-action-semantics-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
      cardImplementationTakesHostedCredits: false,
      hostedCreditTakeAmount: 0,
      hostedCreditTakeMode: "all",
      gainCreditsAmount: 2,
      drawCardsAmount: 1,
      cardImplementationScoresSourceAsAgenda: true,
      runnerEventRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      cardImplementationScoresSourceAsAgenda: true,
      runnerEventRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });

  it("preserves declarative run projection fields and drops unrelated payload data", () => {
    const action = runnerSemanticAction();
    action.type = "activated_card_ability";
    action.payload = {
      cardId: "runner-program",
      cardImplementationEffectKind: "make_run",
      runActionKind: "make_run",
      serverId: "rd",
      runServerId: "rd",
      accessServerId: "rd",
      successfulRunAccessReplacement: "private_look_top_rd",
      successfulRunPrivateLookCount: 5,
      bypassFirstIce: true,
      privateRunProbe: "must-not-cross-dto",
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-run-projection-dto",
      decisionId: "runner-run-projection-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-run-projection-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      cardImplementationEffectKind: "make_run",
      runActionKind: "make_run",
      serverId: "rd",
      runServerId: "rd",
      accessServerId: "rd",
      successfulRunAccessReplacement: "private_look_top_rd",
      successfulRunPrivateLookCount: 5,
      bypassFirstIce: true,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      cardImplementationEffectKind: "make_run",
      successfulRunAccessReplacement: "private_look_top_rd",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty(
      "privateRunProbe",
    );
  });

  it("preserves actor-visible self-damage costs and prevention status", () => {
    const action = runnerSemanticAction();
    action.payload = {
      ...action.payload,
      xValue: 2,
      xMinimum: 1,
      xMaximum: 4,
      xUpperBound: 4,
      xCreditsPerUnit: 1,
      variableCostKind: "printed_play_cost",
      hardwareTrashByCounterTrashCount: 2,
      eligibleHardwareCount: 4,
      damageCannotBePrevented: true,
      damageType: "core",
      damageAmount: 2,
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-self-damage-dto",
      decisionId: "runner-self-damage-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-self-damage-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      xValue: 2,
      xMinimum: 1,
      xMaximum: 4,
      xUpperBound: 4,
      xCreditsPerUnit: 1,
      variableCostKind: "printed_play_cost",
      hardwareTrashByCounterTrashCount: 2,
      eligibleHardwareCount: 4,
      damageCannotBePrevented: true,
      damageType: "core",
      damageAmount: 2,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      xValue: 2,
      xMinimum: 1,
      xMaximum: 4,
      xUpperBound: 4,
      xCreditsPerUnit: 1,
      variableCostKind: "printed_play_cost",
      hardwareTrashByCounterTrashCount: 2,
      eligibleHardwareCount: 4,
      damageCannotBePrevented: true,
      damageType: "core",
      damageAmount: 2,
    });
  });

  it("preserves the public selected-server binding for server-tax installs", () => {
    const action = runnerSemanticAction();
    action.payload = {
      ...action.payload,
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
      privateSelectedCardId: "must-not-cross-dto",
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-selected-server-dto",
      decisionId: "runner-selected-server-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-selected-server-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty(
      "privateSelectedCardId",
    );
  });

  it("preserves actor-visible encounter subroutine targets", () => {
    const action = runnerSemanticAction();
    action.type = "break_subroutine";
    action.payload = {
      ...action.payload,
      breakerId: "runner-breaker",
      iceId: "corp-ice",
      subroutineIndex: 1,
      subroutineIndexes: "1",
      privateEncounterProbe: "must-not-cross-dto",
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-encounter-target-dto",
      decisionId: "runner-encounter-target-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-encounter-target-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      breakerId: "runner-breaker",
      iceId: "corp-ice",
      subroutineIndex: 1,
      subroutineIndexes: "1",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      breakerId: "runner-breaker",
      iceId: "corp-ice",
      subroutineIndex: 1,
      subroutineIndexes: "1",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty(
      "privateEncounterProbe",
    );
  });

  it("preserves public remote-root structure without exposing card identities", () => {
    const action = runnerSemanticAction();
    const events: PublicGameEvent[] = [
      publicEvent("install", {
        actor: "corp",
        actionType: "install_card",
        serverLabel: "Remote 1",
        installPlacement: "root",
        rootReplacement: "asset_to_agenda",
        replacedRootCardType: "asset",
        replacedRootCardId: "must-not-cross-dto",
      }),
      publicEvent("score", {
        actor: "corp",
        actionType: "score_agenda",
        targets: {
          scoredFromServerId: "remote-1",
          scoredCardId: "must-not-cross-dto",
        },
      }),
    ];
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: events,
      legalActions: [action],
      difficulty: "normal",
      seed: "remote-root-structure-dto",
      decisionId: "remote-root-structure-dto:runner:1",
      actionNumber: 1,
      profileId: "remote-root-structure-dto-test",
    });

    expect(input.eventTail[0]?.publicPayload).toMatchObject({
      rootReplacement: "asset_to_agenda",
      replacedRootCardType: "asset",
    });
    expect(input.eventTail[0]?.publicPayload).not.toHaveProperty(
      "replacedRootCardId",
    );
    expect(input.eventTail[1]?.publicPayload.targets).toEqual({
      scoredFromServerId: "remote-1",
    });
  });

  it("sanitizes aliased public history only once", () => {
    const action = conversionAction();
    const events = [publicEvent("shared", { actionType: "gain_credit" })];
    events[0]!.turnSerial = 7;
    const view = playerView(action);
    view.publicEvents = events;

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: events,
      legalActions: [action],
      difficulty: "normal",
      seed: "shared-history-dto",
      decisionId: "shared-history-dto:corp:1",
      actionNumber: 1,
      profileId: "shared-history-dto-test",
    });

    expect(input.eventTail).toBe(input.playerView.publicEvents);
    expect(input.eventTail[0]).not.toBe(events[0]);
    expect(input.eventTail[0]?.turnSerial).toBe(7);
    expect(input.playerView.publicEvents[0]?.turnSerial).toBe(7);
  });

  it("reuses sanitized event objects for a public-history suffix", () => {
    const action = conversionAction();
    const events = [
      publicEvent("one", { actionType: "gain_credit" }),
      publicEvent("two", { actionType: "click_credit" }),
      publicEvent("three", { actionType: "end_turn" }),
    ];
    const view = playerView(action);
    view.publicEvents = events;

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: events.slice(-2),
      legalActions: [action],
      difficulty: "normal",
      seed: "suffix-history-dto",
      decisionId: "suffix-history-dto:corp:1",
      actionNumber: 1,
      profileId: "suffix-history-dto-test",
    });

    expect(input.eventTail).toEqual(input.playerView.publicEvents.slice(-2));
    expect(input.eventTail[0]).toBe(input.playerView.publicEvents[1]);
    expect(input.eventTail[1]).toBe(input.playerView.publicEvents[2]);
  });

  it("preserves public advancement-counter costs for economy-cycle reasoning", () => {
    const action = conversionAction();
    action.payload = {
      ...action.payload,
      cardImplementationAdvancementCounterCost: 1,
    };
    const payoutEvent = publicEvent("counter-payout", {
      actor: "corp",
      actionType: "activated_card_ability",
      sourceDefinitionId: "corp-counter-economy",
      cardImplementationAdvancementCounterCost: 1,
      gainedCredits: 1,
      privateProbe: "must-not-cross-dto",
    });
    const view = playerView(action);
    view.publicEvents = [payoutEvent];

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [payoutEvent],
      legalActions: [action],
      difficulty: "normal",
      seed: "advancement-counter-cost-dto",
      decisionId: "advancement-counter-cost-dto:corp:1",
      actionNumber: 1,
      profileId: "advancement-counter-cost-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      cardImplementationAdvancementCounterCost: 1,
    });
    expect(input.eventTail[0]?.publicPayload).toMatchObject({
      sourceDefinitionId: "corp-counter-economy",
      cardImplementationAdvancementCounterCost: 1,
      gainedCredits: 1,
    });
    expect(input.eventTail[0]?.publicPayload).not.toHaveProperty(
      "privateProbe",
    );
  });

  it("preserves the complete public effective ICE run quote without aliasing it", () => {
    const action = runnerSemanticAction();
    const view = playerView(action, "runner");
    const effectiveRunQuote = {
      iceInstanceId: "homing-missile",
      iceDefinitionId: "onr_proteus_025_homing-missile",
      effectiveStrength: 5,
      encounterTemporaryTraceCredits: 2,
      conditionalEncounterEffects: [
        {
          kind: "corp_paid_add_end_the_run_subroutine" as const,
          creditCost: 2,
        },
        {
          kind: "random_strength_or_derez_auto_pass" as const,
          dieFaces: 6 as const,
          autoPassResult: 6 as const,
          maxStrengthBonus: 5,
        },
      ],
      subroutines: [
        {
          id: "homing-missile:trace",
          type: "initiate_trace" as const,
          traceLimit: 5,
          runFutureStrengthCancelPaymentAmount: 2,
        },
      ],
    };
    view.servers = [
      {
        id: "rd",
        label: "R&D",
        ice: [
          {
            instanceId: "homing-missile",
            definitionId: "onr_proteus_025_homing-missile",
            title: "Homing Missile",
            type: "ice",
            known: true,
            rezzed: true,
            effectiveRunQuote,
          },
        ],
        root: [],
      },
    ];

    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "effective-run-quote-dto",
      decisionId: "effective-run-quote-dto:runner:1",
      actionNumber: 1,
      profileId: "effective-run-quote-dto-test",
    });

    const quote = input.playerView.servers[0]?.ice[0]?.effectiveRunQuote;
    expect(quote).toMatchObject(effectiveRunQuote);
    expect(quote).not.toBe(effectiveRunQuote);
    expect(quote?.subroutines).not.toBe(effectiveRunQuote.subroutines);
    expect(quote?.conditionalEncounterEffects).not.toBe(
      effectiveRunQuote.conditionalEncounterEffects,
    );
  });

  it("fails closed for a malformed public effective ICE run quote", () => {
    const action = runnerSemanticAction();
    const view = playerView(action, "runner");
    view.servers = [
      {
        id: "rd",
        label: "R&D",
        ice: [
          {
            instanceId: "malformed-ice",
            definitionId: "onr_proteus_025_homing-missile",
            type: "ice",
            known: true,
            rezzed: true,
            effectiveRunQuote: {
              iceInstanceId: "malformed-ice",
              iceDefinitionId: "onr_proteus_025_homing-missile",
              effectiveStrength: 5,
              subroutines: [
                {
                  id: "malformed-ice:trace",
                  type: "initiate_trace",
                  traceLimit: -1,
                },
              ],
              conditionalEncounterEffects: [
                {
                  kind: "random_strength_or_derez_auto_pass",
                  dieFaces: 6,
                  autoPassResult: 6,
                  maxStrengthBonus: 6,
                },
              ],
            } as unknown as NonNullable<VisibleCard["effectiveRunQuote"]>,
          },
        ],
        root: [],
      },
    ];

    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "malformed-effective-run-quote-dto",
      decisionId: "malformed-effective-run-quote-dto:runner:1",
      actionNumber: 1,
      profileId: "effective-run-quote-dto-test",
    });

    expect(input.playerView.servers[0]?.ice[0]).not.toHaveProperty(
      "effectiveRunQuote",
    );
  });

  it("does not forward an effective run quote from hidden ICE", () => {
    const action = runnerSemanticAction();
    const view = playerView(action, "runner");
    view.servers = [
      {
        id: "rd",
        label: "R&D",
        ice: [
          {
            instanceId: "hidden-ice",
            known: false,
            type: "ice",
            rezzed: true,
            effectiveRunQuote: {
              iceInstanceId: "hidden-ice",
              iceDefinitionId: "must-not-cross-dto",
              effectiveStrength: 5,
              subroutines: [],
              privateQuoteProbe: "must-not-cross-dto",
            } as unknown as NonNullable<VisibleCard["effectiveRunQuote"]>,
          },
        ],
        root: [],
      },
    ];

    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "hidden-effective-run-quote-dto",
      decisionId: "hidden-effective-run-quote-dto:runner:1",
      actionNumber: 1,
      profileId: "effective-run-quote-dto-test",
    });

    expect(input.playerView.servers[0]?.ice[0]).not.toHaveProperty(
      "effectiveRunQuote",
    );
    expect(JSON.stringify(input)).not.toContain("must-not-cross-dto");
  });

  it("keeps only a correctly bound Corp-private post-rez run quote", () => {
    const action = runnerSemanticAction();
    const view = playerView(action, "corp");
    const postRezQuote = {
      context: "installed_post_rez" as const,
      cardId: "corp-fixed-ice",
      iceDefinitionId: "simple_barrier_ice",
      targetServerId: "rd" as const,
      projectedServerId: "rd" as const,
      expiresAtStateVersion: view.stateVersion,
      complete: true as const,
      effectiveRunQuote: {
        iceInstanceId: "corp-fixed-ice",
        iceDefinitionId: "simple_barrier_ice",
        effectiveStrength: 3,
        subroutines: [{ id: "fixed-etr", type: "end_the_run" as const }],
      },
    };
    view.servers = [
      {
        id: "rd",
        label: "R&D",
        ice: [
          {
            instanceId: "corp-fixed-ice",
            definitionId: "simple_barrier_ice",
            type: "ice",
            owner: "corp",
            controller: "corp",
            known: true,
            rezzed: false,
            effectivePostRezRunQuote: postRezQuote,
          },
        ],
        root: [],
      },
    ];

    const corpInput = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "post-rez-run-quote-dto",
      decisionId: "post-rez-run-quote-dto:corp:1",
      actionNumber: 1,
      profileId: "post-rez-run-quote-dto-test",
    });
    expect(
      corpInput.playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote,
    ).toMatchObject(postRezQuote);
    expect(
      corpInput.playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote,
    ).not.toBe(postRezQuote);

    view.servers[0]!.ice[0]!.effectivePostRezRunQuote = {
      context: "installed_post_rez",
      cardId: "corp-fixed-ice",
      iceDefinitionId: "simple_barrier_ice",
      targetServerId: "rd",
      projectedServerId: "rd",
      expiresAtStateVersion: view.stateVersion,
      complete: false,
      reason: "active_run_context",
    };
    const incompleteInput = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "incomplete-post-rez-run-quote",
      decisionId: "incomplete-post-rez-run-quote:corp:1",
      actionNumber: 1,
      profileId: "post-rez-run-quote-dto-test",
    });
    expect(
      incompleteInput.playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote,
    ).toEqual({
      context: "installed_post_rez",
      cardId: "corp-fixed-ice",
      iceDefinitionId: "simple_barrier_ice",
      targetServerId: "rd",
      projectedServerId: "rd",
      expiresAtStateVersion: view.stateVersion,
      complete: false,
      reason: "active_run_context",
    });

    const runnerView = {
      ...view,
      side: "runner" as const,
    };
    const runnerInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: runnerView,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "post-rez-run-quote-redaction",
      decisionId: "post-rez-run-quote-redaction:runner:1",
      actionNumber: 1,
      profileId: "post-rez-run-quote-dto-test",
    });
    expect(runnerInput.playerView.servers[0]?.ice[0]).not.toHaveProperty(
      "effectivePostRezRunQuote",
    );

    view.servers[0]!.ice[0]!.effectivePostRezRunQuote = {
      ...postRezQuote,
      expiresAtStateVersion: view.stateVersion + 1,
    };
    const staleInput = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "stale-post-rez-run-quote",
      decisionId: "stale-post-rez-run-quote:corp:1",
      actionNumber: 1,
      profileId: "post-rez-run-quote-dto-test",
    });
    expect(staleInput.playerView.servers[0]?.ice[0]).not.toHaveProperty(
      "effectivePostRezRunQuote",
    );
  });
});

function publicEvent(
  eventId: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: String(publicPayload.actionType ?? "game_event"),
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: `hash-${eventId}`,
    publicPayload,
  };
}

function conversionAction(): LegalAction {
  return {
    actionId: "corp.score-conversion.move",
    side: "corp",
    type: "activated_card_ability",
    label: "Advancement-Counter bewegen",
    source: "corp-conversion-source",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "corp-conversion-source",
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
      privateProbe: "must-not-cross-dto",
    },
  };
}

function runnerSemanticAction(): LegalAction {
  return {
    actionId: "runner.hosted-credit.build",
    side: "runner",
    type: "activated_card_ability",
    label: "Credit-Bank laden",
    source: "runner-bank",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "runner-bank",
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
      cardImplementationTakesHostedCredits: false,
      hostedCreditTakeAmount: 0,
      hostedCreditTakeMode: "all",
      gainCreditsAmount: 2,
      drawCardsAmount: 1,
      cardImplementationScoresSourceAsAgenda: true,
      runnerEventRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
      privateProbe: "must-not-cross-dto",
    },
  };
}

function playerView(
  action: LegalAction,
  side: "corp" | "runner" = "corp",
): PlayerView {
  const corpIdentity = identity("corp");
  const runnerIdentity = identity("runner");
  return {
    side,
    stateVersion: 1,
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    activeSide: side,
    phase: "action",
    own: {
      identity: side === "corp" ? corpIdentity : runnerIdentity,
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
      identity: side === "corp" ? runnerIdentity : corpIdentity,
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
    servers: [],
    publicEvents: [],
    legalActions: [action],
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
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
