import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildAiDecisionInputDto } from "../input-dto";
import { chooseAiAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  projectExactCorpIceRezRoute,
  readExactCurrentInstalledCorpIceRezQuote,
  readExactInstalledCorpIceRezQuote,
} from "./corp-exact-ice-rez-route";
import { assessCorpExactIceRezAgainstScoreReserves } from "./corp-defense-score-reserve";
import { assessCorpScoreProtection } from "./corp-score-protection-assessment";

describe("exact Corp ICE rez route", () => {
  it("accepts the Engine's ordinary rez_ice action without an optional server payload", () => {
    const { input, candidate, sourceCard, engineAction } = engineIceRezWindow(
      "simple_barrier_ice",
      0,
    );

    const projection = projectExactCorpIceRezRoute({
      input,
      candidate,
      sourceCard,
      targetServerId: "rd",
    });
    const sourceQuote = sourceCard.effectiveRezCostQuote;
    if (sourceQuote?.context !== "installed" || sourceQuote.complete !== true) {
      throw new Error("Engine-backed ICE rez fixture has no complete quote");
    }
    expect(input.legalActions[0]).toMatchObject({
      type: "rez_ice",
      payload: {
        cardId: sourceCard.instanceId,
      },
    });
    expect(engineAction.payload).toMatchObject(
      input.legalActions[0]?.payload ?? {},
    );
    expect(input.legalActions[0]?.payload?.serverId).toBeUndefined();
    expect(projection).toMatchObject({
      actionId: input.legalActions[0]?.actionId,
      sourceCardInstanceId: sourceCard.instanceId,
      sourceDefinitionId: "simple_barrier_ice",
      targetServerId: "rd",
      effect: "satisfied",
      totalRezCredits: sourceQuote.finalCredits,
      quote: {
        context: "installed",
        complete: true,
        mandatoryAdditionalCosts: { agendaPoints: 0 },
      },
    });
  });

  it("accepts an Engine-certified Olivia Salazar rez receipt without using printed rezCost", () => {
    const fixture = engineOliviaIceRezWindow();
    const ordinaryProjection = projectExactCorpIceRezRoute({
      input: fixture.input,
      candidate: fixture.ordinaryCandidate,
      sourceCard: fixture.sourceCard,
      targetServerId: "remote_1",
    });
    const discountedProjection = projectExactCorpIceRezRoute({
      input: fixture.input,
      candidate: fixture.discountedCandidate,
      sourceCard: fixture.sourceCard,
      targetServerId: "remote_1",
    });

    expect(ordinaryProjection).toMatchObject({
      actionId: fixture.ordinaryAction.actionId,
      totalRezCredits: 4,
      quote: {
        context: "installed",
        complete: true,
        finalCredits: 4,
      },
    });
    expect(discountedProjection).toMatchObject({
      actionId: fixture.discountedAction.actionId,
      totalRezCredits: 2,
      quote: {
        context: "installed",
        complete: true,
        finalCredits: 2,
        reductionSourceDefinitionIds: ["onr_v1_363_olivia-salazar"],
      },
    });

    const missingReceipt = structuredClone(fixture.input);
    const action = missingReceipt.legalActions.find(
      (candidate) => candidate.actionId === fixture.discountedAction.actionId,
    )!;
    delete action.payload!.rezCostPaid;
    expect(
      readExactInstalledCorpIceRezQuote({
        input: missingReceipt,
        candidate: fixture.discountedCandidate,
        sourceCard: missingReceipt.playerView.servers
          .find((server) => server.id === "remote_1")!
          .ice.find((ice) => ice.instanceId === fixture.sourceCard.instanceId)!,
        targetServerId: "remote_1",
      }),
    ).toBeUndefined();
  });

  it("keeps ordinary and Olivia-discounted quotes as distinct executable routes for one ICE", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineOliviaIceRezWindow();

    const decision = chooseAiAction(fixture.input, {
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });

    expect([
      fixture.ordinaryAction.actionId,
      fixture.discountedAction.actionId,
    ]).toContain(decision.actionId);
    expect(decision).toMatchObject({
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("echoes the Engine-certified mandatory agenda-point cost and fails closed when it is not payable", () => {
    const payable = engineIceRezWindow("onr_classic_011_glacier", 1);
    expect(
      readExactInstalledCorpIceRezQuote({
        input: payable.input,
        candidate: payable.candidate,
        sourceCard: payable.sourceCard,
        targetServerId: "rd",
      })?.quote.mandatoryAdditionalCosts.agendaPoints,
    ).toBe(1);

    expect(() => engineIceRezWindow("onr_classic_011_glacier", 0)).toThrow(
      "Engine did not expose a payable ICE rez action",
    );
  });

  it.each([
    [
      "missing quote",
      (fixture: MutableExactRezFixture) => {
        delete fixture.sourceCard.effectiveRezCostQuote;
      },
    ],
    [
      "incomplete quote",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard as any).effectiveRezCostQuote = {
          context: "installed",
          cardId: fixture.sourceCard.instanceId,
          targetServerId: "rd",
          projectedServerId: "rd",
          expiresAtStateVersion: fixture.input.playerView.stateVersion,
          complete: false,
        };
      },
    ],
    [
      "stale quote",
      (fixture: MutableExactRezFixture) => {
        (
          fixture.sourceCard.effectiveRezCostQuote as any
        ).expiresAtStateVersion += 1;
      },
    ],
    [
      "card drift",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any).cardId =
          "different-ice";
      },
    ],
    [
      "server drift",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any).targetServerId = "hq";
      },
    ],
    [
      "action cost drift",
      (fixture: MutableExactRezFixture) => {
        fixture.input.legalActions[0]!.costs = [{ credits: 99 }];
      },
    ],
    [
      "duplicate modifier ids",
      (fixture: MutableExactRezFixture) => {
        (
          fixture.sourceCard.effectiveRezCostQuote as any
        ).reductionSourceDefinitionIds = ["same", "same"];
      },
    ],
    [
      "unsorted modifier ids",
      (fixture: MutableExactRezFixture) => {
        (
          fixture.sourceCard.effectiveRezCostQuote as any
        ).reductionSourceDefinitionIds = ["z", "a"];
      },
    ],
    [
      "overlapping modifier ids",
      (fixture: MutableExactRezFixture) => {
        (
          fixture.sourceCard.effectiveRezCostQuote as any
        ).reductionSourceDefinitionIds = ["same"];
        (
          fixture.sourceCard.effectiveRezCostQuote as any
        ).increaseSourceDefinitionIds = ["same"];
      },
    ],
    [
      "invalid base credits",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any).baseCredits = 0.5;
      },
    ],
    [
      "unexplained base/final drift",
      (fixture: MutableExactRezFixture) => {
        const quote = fixture.sourceCard.effectiveRezCostQuote;
        if (quote?.context !== "installed" || quote.complete !== true) {
          throw new Error("Fixture has no complete installed quote");
        }
        quote.finalCredits += 1;
        fixture.input.legalActions[0]!.costs = [
          {
            credits: quote.finalCredits,
          },
        ];
      },
    ],
  ])("fails closed on %s", (_label, mutate) => {
    const fixture = mutableFixture(engineIceRezWindow("simple_barrier_ice", 0));
    mutate(fixture);

    expect(
      readExactInstalledCorpIceRezQuote({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });

  it("fails closed when mandatory agenda-point payload and quote drift", () => {
    const fixture = mutableFixture(
      engineIceRezWindow("onr_classic_011_glacier", 1),
    );
    fixture.input.legalActions[0]!.payload!.agendaPointCost = 0;

    expect(
      readExactInstalledCorpIceRezQuote({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });

  it("uses known encounter pressure on the active run when access probability remains unchanged", () => {
    const fixture = engineIceRezWindow("onr_v1_249_hunter", 0);

    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toMatchObject({
      routeKind: "qualitative_encounter_defense",
      effect: "progress",
    });
    expect(
      chooseAiAction(fixture.input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(fixture.engineAction.actionId);
  });

  it("uses an Engine-certified current-run resource exchange when access remains possible", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_244_filter", 0, {
      runnerCredits: 1,
      runnerPrograms: ["onr_classic_031_rent-i-con"],
    });
    const sourceQuote = fixture.sourceCard.effectiveRezResourceExchangeQuote;
    expect(sourceQuote).toMatchObject({
      context: "installed",
      complete: true,
      runnerBreak: {
        requiredCredits: 1,
        pumpCredits: 0,
        breakCredits: 1,
        breakUses: 1,
        normalCreditsRequired: 1,
        nonNormalRunCreditsApplied: 0,
        canPayFromCurrentCredits: true,
        paymentEvidenceSource: "engine_icebreaker_ability",
        consumedCards: [
          {
            kind: "trash_at_run_end_after_break",
            evidenceSource: "engine_icebreaker_ability",
          },
        ],
      },
    });
    expect(
      JSON.stringify(getPlayerView(fixture.state, "runner")),
    ).not.toContain("effectiveRezResourceExchangeQuote");

    const projection = projectExactCorpIceRezRoute({
      input: fixture.input,
      candidate: fixture.candidate,
      sourceCard: fixture.sourceCard,
      targetServerId: "rd",
    });
    expect(projection).toMatchObject({
      actionId: fixture.engineAction.actionId,
      sourceDefinitionId: "onr_v1_244_filter",
      routeKind: "exact_resource_exchange",
      totalRezCredits: 0,
      before: {
        runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
      },
      after: {
        runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
      },
      resourceExchange: {
        runnerRequiredCredits: 1,
        runnerPumpCredits: 0,
        runnerBreakCredits: 1,
        runnerBreakUses: 1,
        runnerNormalCreditsRequired: 1,
        runnerNonNormalRunCreditsApplied: 0,
        runnerBreakerDefinitionId: "onr_classic_031_rent-i-con",
        runnerConsumedCardInstanceIds: ["exact_runner_program_0"],
      },
    });
    expect(
      chooseAiAction(fixture.input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(fixture.engineAction.actionId);
  });

  it("keeps a current exact exchange when a recurring credit shifts cash onto later ICE", () => {
    const fixture = engineIceRezWindow("onr_v1_244_filter", 0, {
      runnerCredits: 8,
      runnerPrograms: ["onr_classic_031_rent-i-con", "onr_v1_035_invisibility"],
      runnerProgramBitCounters: [0, 1],
      futureIceDefinitionId: "onr_v1_261_quandary",
      futureIceRezzed: true,
    });

    expect(fixture.sourceCard.effectiveRezResourceExchangeQuote).toMatchObject({
      complete: true,
      runnerBreak: {
        requiredCredits: 1,
        normalCreditsRequired: 0,
        nonNormalRunCreditsApplied: 1,
      },
    });
    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toMatchObject({
      routeKind: "exact_resource_exchange",
      resourceExchange: {
        runnerRequiredCredits: 1,
        runnerNormalCreditsRequired: 0,
        runnerNonNormalRunCreditsApplied: 1,
        runnerNormalCreditsLostOnAccessPath: 1,
        runnerConsumedCardInstanceIds: ["exact_runner_program_0"],
      },
    });
  });

  it("carries the chosen Filter/Rent-I-Con rez through the real Engine run and trashes the breaker", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_244_filter", 0, {
      runnerCredits: 1,
      runnerPrograms: ["onr_classic_031_rent-i-con"],
    });
    const decision = chooseAiAction(fixture.input, {
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(decision.actionId).toBe(fixture.engineAction.actionId);

    let state = applyEngineAction(
      fixture.state,
      "corp",
      fixture.engineAction.actionId,
      "rez-filter",
    );
    const rentIConId = "exact_runner_program_0" as CardInstanceId;
    expect(state.corp.credits).toBe(10);
    expect(state.cardInstances[fixture.sourceCard.instanceId]?.rezzed).toBe(
      true,
    );

    const breakAction = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "break_subroutine" &&
        action.source === rentIConId &&
        action.payload?.subroutineIndex === 0,
    );
    expect(breakAction).toBeDefined();
    expect(breakAction?.costs).toEqual([{ credits: 1 }]);
    state = applyEngineAction(
      state,
      "runner",
      breakAction!.actionId,
      "break-filter",
    );
    expect(state.runner.credits).toBe(0);

    state = completeCurrentRunnerRun(state);
    expect(state.run).toBeUndefined();
    expect(state.runner.rig.programs).not.toContain(rentIConId);
    expect(state.cardInstances[rentIConId]?.zone).toEqual({
      side: "runner",
      zone: "heap",
    });
  });

  it("rezzes a free persistent Filter on the active central server even when Codecracker breaks it for free", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_244_filter", 0, {
      runnerCredits: 0,
      runnerPrograms: ["onr_v1_014_codecracker"],
    });

    expect(fixture.sourceCard.effectiveRezResourceExchangeQuote).toMatchObject({
      complete: true,
      runnerBreak: { requiredCredits: 0, consumedCards: [] },
    });
    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toMatchObject({
      routeKind: "free_persistent_defense",
      totalRezCredits: 0,
    });
    expect(
      chooseAiAction(fixture.input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(fixture.engineAction.actionId);
  });

  it("declines an otherwise stopping R&D rez when the score plan's published next-turn cash and remote rez reserve would be spent", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_238_data-wall-2-0", 0);
    fixture.state.corp.credits = 5;
    addProtectedNextTurnScoreRemote(fixture.state, 0);
    const input = engineRezDecisionInput(
      fixture.state,
      "score-reserve-decline",
    );
    const decline = input.legalActions.find(
      (action) => action.type === "decline_rez",
    );
    if (!decline) throw new Error("Engine did not expose the rez decline");

    const scoreAgenda = input.playerView.servers
      .find((server) => server.id === "remote_1")!
      .root.find(
        (card) => card.instanceId === "score_reserve_agenda_remote_1",
      )!;
    expect(scoreAgenda.type).toBe("agenda");
    const scoreQuote = scoreAgenda.scoreContinuationQuote;
    expect(scoreQuote).toMatchObject({
      complete: true,
      creditsRequiredBeforeNextCorpTurn: 3,
    });
    const candidate = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [fixture.sourceCard.instanceId]: "onr_v1_238_data-wall-2-0",
      },
    }).find((entry) => entry.semanticActionType === "corp_window.rez")!;
    const route = projectExactCorpIceRezRoute({
      input,
      candidate,
      sourceCard: input.playerView.servers
        .find((server) => server.id === "rd")!
        .ice.find((ice) => ice.instanceId === fixture.sourceCard.instanceId)!,
      targetServerId: "rd",
    })!;
    expect(
      assessCorpExactIceRezAgainstScoreReserves({
        input,
        route,
        scoreProjects: [
          {
            projectId: "agenda:score_reserve_agenda_remote_1:remote_1",
            agendaPoints: 2,
            serverId: "remote_1",
            phase: "advance_agenda",
            sameTurnCloseout: false,
            terminalScore: false,
            feasible: true,
            evidenceCode: "test",
            continuationReserve: {
              agendaCardId: "score_reserve_agenda_remote_1",
              serverId: "remote_1",
              requiredCreditsBeforeNextCorpTurn: 3,
              remainingAdvancementCounters: 3,
              nextCorpTurnGuaranteedFlexibleClicks: 3,
              certifiedCreditGainFromFreeClicks: 0,
            },
          },
        ],
      }).preservesReserve,
    ).toBe(false);
    expect(
      chooseAiAction(input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(decline.actionId);
  });

  it("uses the score plan's certified surplus-click conversion instead of reserving advancement credits unnecessarily", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_238_data-wall-2-0", 0);
    fixture.state.corp.credits = 5;
    addProtectedNextTurnScoreRemote(fixture.state, 2);
    const input = engineRezDecisionInput(
      fixture.state,
      "score-reserve-free-clicks",
    );

    expect(
      chooseAiAction(input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(
      input.legalActions.find(
        (action) =>
          action.type === "rez_ice" &&
          action.source === fixture.sourceCard.instanceId,
      )?.actionId,
    );
  });

  it("protects the agenda server under attack before retaining that agenda's later advancement cash", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineAgendaServerRezWindow();
    const rez = fixture.input.legalActions.find(
      (action) => action.type === "rez_ice",
    );
    if (!rez) throw new Error("Engine did not expose the agenda-server rez");

    expect(
      fixture.input.playerView.servers.find(
        (server) => server.id === "remote_1",
      )!.root[0]?.scoreContinuationQuote,
    ).toMatchObject({
      complete: true,
      creditsRequiredBeforeNextCorpTurn: 3,
    });
    expect(
      chooseAiAction(fixture.input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(rez.actionId);
  });

  it("reserves exact stopping rezzes for each additional score server the Runner can still attack", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_238_data-wall-2-0", 0);
    fixture.state.corp.credits = 7;
    addProtectedNextTurnScoreRemote(fixture.state, 2, "remote_1");
    addProtectedNextTurnScoreRemote(fixture.state, 2, "remote_2");
    const input = engineRezDecisionInput(
      fixture.state,
      "multi-score-server-reserve",
    );
    const decline = input.legalActions.find(
      (action) => action.type === "decline_rez",
    );
    if (!decline) throw new Error("Engine did not expose the rez decline");
    expect(input.playerView.opponent.clicks).toBeGreaterThanOrEqual(2);
    expect(
      input.playerView.servers.find((server) => server.id === "remote_1")!
        .ice[0]?.effectiveRezCostQuote,
    ).toMatchObject({ complete: true, finalCredits: 3 });
    expect(
      readExactCurrentInstalledCorpIceRezQuote({
        input,
        sourceCard: input.playerView.servers.find(
          (server) => server.id === "remote_1",
        )!.ice[0]!,
        targetServerId: "remote_1",
      }),
    ).toMatchObject({ totalRezCredits: 3 });
    const remoteIce = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.ice[0]!;
    expect(
      assessCorpScoreProtection({
        serverIce: [
          {
            instanceId: remoteIce.instanceId,
            known: remoteIce.known,
            rezzed: true,
            ...(remoteIce.definitionId
              ? { definitionId: remoteIce.definitionId }
              : {}),
            ...(remoteIce.strength !== undefined
              ? { strength: remoteIce.strength }
              : {}),
            ...(remoteIce.subtypes ? { subtypes: remoteIce.subtypes } : {}),
          },
        ],
        runnerRig: input.playerView.opponent.rig ?? [],
        runnerCredits: input.playerView.opponent.credits,
        maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      }),
    ).toMatchObject({
      knowledge: "known",
      runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
    const route = currentExactRezRoute(
      input,
      fixture.sourceCard.instanceId,
      "onr_v1_238_data-wall-2-0",
    );
    expect(
      assessCorpExactIceRezAgainstScoreReserves({
        input,
        route,
        scoreProjects: [
          testScoreContinuationProject("remote_1"),
          testScoreContinuationProject("remote_2"),
        ],
      }),
    ).toMatchObject({
      preservesReserve: false,
      requiredCreditsAfterRez: 6,
      immediateRezIceIds: [
        "score_reserve_remote_ice_remote_1",
        "score_reserve_remote_ice_remote_2",
      ],
    });

    // One remote would leave enough cash (7 - 2 >= 3); two still-attackable
    // remotes require both certified three-credit rez quotes.
    expect(
      chooseAiAction(input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(decline.actionId);
  });

  it("selects the cheaper sufficient legal rez receipt when it preserves the other score server's rez reserve", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineOliviaIceRezWindow();
    fixture.state.corp.credits = 5;
    addProtectedNextTurnScoreRemote(fixture.state, 2, "remote_2");
    const input = engineRezDecisionInput(
      fixture.state,
      "discounted-rez-preserves-remote",
    );
    const discounted = input.legalActions.find(
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.discountedRezSourceCardId === "exact_olivia_source",
    );
    if (!discounted)
      throw new Error("Engine did not expose the discounted rez");

    expect(
      chooseAiAction(input, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }).actionId,
    ).toBe(discounted.actionId);
  });

  it("certifies the approached outer tax before a visible inner stopping ICE", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = engineIceRezWindow("onr_v1_244_filter", 0, {
      runnerCredits: 1,
      runnerPrograms: ["onr_classic_031_rent-i-con"],
      futureIceDefinitionId: "simple_barrier_ice",
    });
    fixture.state.corp.credits = 2;
    const input = engineRezDecisionInput(
      fixture.state,
      "inner-ice-rez-reserve",
    );
    const candidate = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [fixture.sourceCard.instanceId]: "onr_v1_244_filter",
      },
    }).find((entry) => entry.semanticActionType === "corp_window.rez")!;
    expect(
      projectExactCorpIceRezRoute({
        input,
        candidate,
        sourceCard: input.playerView.servers
          .find((server) => server.id === "rd")!
          .ice.find((ice) => ice.instanceId === fixture.sourceCard.instanceId)!,
        targetServerId: "rd",
      }),
    ).toMatchObject({
      actionId: candidate.actionId,
      sourceDefinitionId: "onr_v1_244_filter",
      routeKind: "exact_resource_exchange",
      effect: "progress",
      totalRezCredits: 0,
      resourceExchange: {
        runnerRequiredCredits: 1,
        runnerConsumedCardInstanceIds: ["exact_runner_program_0"],
      },
    });
    const decision = chooseAiAction(input, {
      persistTacticalPlanMemory: false,
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(decision.actionId).toBe(candidate.actionId);
  });

  it("does not promote a paid free break without a certified consumed resource", () => {
    const fixture = engineIceRezWindow("onr_v1_238_data-wall-2-0", 0, {
      runnerCredits: 0,
      runnerPrograms: ["onr_v1_037_japanese-water-torture"],
      runnerProgramStrengthModifiers: [10],
    });

    expect(fixture.sourceCard.effectiveRezResourceExchangeQuote).toMatchObject({
      complete: true,
      runnerBreak: {
        requiredCredits: 0,
        consumedCards: [],
      },
    });
    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });

  it.each([
    [
      "an incomplete resource quote",
      (sourceCard: any) => {
        sourceCard.effectiveRezResourceExchangeQuote.complete = false;
      },
    ],
    [
      "an unknown payment evidence source",
      (sourceCard: any) => {
        sourceCard.effectiveRezResourceExchangeQuote.runnerBreak.paymentEvidenceSource =
          "unknown";
      },
    ],
    [
      "an unknown run-end consumption",
      (sourceCard: any) => {
        sourceCard.effectiveRezResourceExchangeQuote.runnerBreak.consumedCards[0].kind =
          "unknown";
      },
    ],
  ])("fails closed for %s", (_label, mutate) => {
    const fixture = mutableFixture(
      engineIceRezWindow("onr_v1_244_filter", 0, {
        runnerCredits: 1,
        runnerPrograms: ["onr_classic_031_rent-i-con"],
      }),
    );
    mutate(fixture.sourceCard);

    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });
});

type MutableExactRezFixture = ReturnType<typeof mutableFixture>;

function mutableFixture(fixture: ReturnType<typeof engineIceRezWindow>) {
  const input = structuredClone(fixture.input);
  const candidate = structuredClone(fixture.candidate);
  const sourceCard = input.playerView.servers
    .find((server) => server.id === "rd")!
    .ice.find((ice) => ice.instanceId === fixture.sourceCard.instanceId)!;
  return { input, candidate, sourceCard };
}

function engineIceRezWindow(
  definitionId: string,
  agendaPoints: number,
  options?: {
    runnerCredits?: number;
    runnerPrograms?: readonly string[];
    runnerProgramStrengthModifiers?: readonly number[];
    runnerProgramBitCounters?: readonly number[];
    futureIceDefinitionId?: string;
    futureIceRezzed?: boolean;
  },
) {
  let state = createGameAfterSetup({
    seed: `exact-ice-rez-${definitionId}-${agendaPoints}`,
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = options?.runnerCredits ?? 0;
  state.corp.credits = 10;
  state.corpBonusAgendaPoints = agendaPoints;
  const iceId = `exact_ice_${agendaPoints}` as CardInstanceId;
  for (const [index, runnerProgram] of (
    options?.runnerPrograms ?? []
  ).entries()) {
    addInstalledRunnerProgram(
      state,
      `exact_runner_program_${index}` as CardInstanceId,
      runnerProgram,
      options?.runnerProgramStrengthModifiers?.[index] ?? 0,
    );
    const bitCounters = options?.runnerProgramBitCounters?.[index] ?? 0;
    if (bitCounters > 0) {
      state.cardInstances[
        `exact_runner_program_${index}` as CardInstanceId
      ]!.counters = { bit: bitCounters };
    }
  }
  if (options?.futureIceDefinitionId) {
    const futureIceId = `exact_future_ice_${agendaPoints}` as CardInstanceId;
    addUnrezzedIce(state, futureIceId, options.futureIceDefinitionId, "rd");
    if (options.futureIceRezzed) {
      state.cardInstances[futureIceId] = {
        ...state.cardInstances[futureIceId]!,
        faceup: true,
        rezzed: true,
      };
    }
  }
  addUnrezzedIce(state, iceId, definitionId, "rd");
  const startRun = getLegalActions(state, "runner").find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  if (!startRun) throw new Error("Engine did not expose the R&D run");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: startRun.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `start-${agendaPoints}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  state = result.state;
  const rezAction = getLegalActions(state, "corp").find(
    (action) => action.type === "rez_ice" && action.payload?.cardId === iceId,
  );
  if (!rezAction) {
    throw new Error("Engine did not expose a payable ICE rez action");
  }
  const playerView = getPlayerView(state, "corp");
  const input = buildAiDecisionInputDto({
    side: "corp",
    playerView,
    eventTail: [],
    legalActions: [rezAction],
    difficulty: "normal",
    seed: state.seed,
    decisionId: `exact-ice-rez-${definitionId}-${agendaPoints}`,
    actionNumber: 1,
    profileId: "exact-glacier-rez-test",
  });
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [iceId]: definitionId,
    },
  })[0];
  const sourceCard = input.playerView.servers
    .find((server) => server.id === "rd")
    ?.ice.find((ice) => ice.instanceId === iceId);
  if (!candidate || !sourceCard) {
    throw new Error("Engine-backed ICE rez fixture is incomplete");
  }
  return { input, candidate, sourceCard, engineAction: rezAction, state };
}

function addInstalledRunnerProgram(
  state: GameState,
  instanceId: CardInstanceId,
  definitionId: string,
  strengthModifier: number,
): void {
  state.runner.rig.programs.push(instanceId);
  state.cardInstances[instanceId] = {
    instanceId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier,
  };
}

function engineOliviaIceRezWindow() {
  let state = createGameAfterSetup({
    seed: "exact-ice-rez-olivia-salazar",
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = 0;
  state.corp.credits = 10;
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [],
    root: [],
  });
  const iceId = "exact_olivia_filter" as CardInstanceId;
  const oliviaId = "exact_olivia_source" as CardInstanceId;
  addUnrezzedIce(state, iceId, "onr_v1_232_crystal-wall", "remote_1");
  const remote = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  )!;
  remote.root.push(oliviaId);
  state.cardInstances[oliviaId] = {
    instanceId: oliviaId,
    definitionId: "onr_v1_363_olivia-salazar",
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  const startRun = getLegalActions(state, "runner").find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "remote_1",
  );
  if (!startRun) throw new Error("Engine did not expose the remote run");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: startRun.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "start-olivia",
  });
  if (!result.ok) throw new Error(result.error.message);
  state = result.state;
  const rezActions = getLegalActions(state, "corp").filter(
    (action) => action.type === "rez_ice" && action.payload?.cardId === iceId,
  );
  const ordinaryAction = rezActions.find(
    (action) => action.payload?.discountedRezSourceCardId === undefined,
  );
  const discountedAction = rezActions.find(
    (action) => action.payload?.discountedRezSourceCardId === oliviaId,
  );
  if (!ordinaryAction || !discountedAction) {
    throw new Error("Engine did not expose both exact ICE rez variants");
  }
  const input = buildAiDecisionInputDto({
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    eventTail: [],
    legalActions: rezActions,
    difficulty: "normal",
    seed: state.seed,
    decisionId: "exact-ice-rez-olivia",
    actionNumber: 1,
    profileId: "exact-olivia-rez-test",
  });
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [iceId]: "onr_v1_232_crystal-wall",
    },
  });
  const ordinaryCandidate = candidates.find(
    (candidate) => candidate.actionId === ordinaryAction.actionId,
  );
  const discountedCandidate = candidates.find(
    (candidate) => candidate.actionId === discountedAction.actionId,
  );
  const sourceCard = input.playerView.servers
    .find((server) => server.id === "remote_1")
    ?.ice.find((ice) => ice.instanceId === iceId);
  if (!ordinaryCandidate || !discountedCandidate || !sourceCard) {
    throw new Error("Engine-backed Olivia fixture is incomplete");
  }
  return {
    state,
    input,
    sourceCard,
    ordinaryAction,
    discountedAction,
    ordinaryCandidate,
    discountedCandidate,
  };
}

function addUnrezzedIce(
  state: GameState,
  instanceId: CardInstanceId,
  definitionId: string,
  serverId: "rd" | "remote_1" | "remote_2",
): void {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing R&D server");
  server.ice.push(instanceId);
  state.cardInstances[instanceId] = {
    instanceId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
}

function addProtectedNextTurnScoreRemote(
  state: GameState,
  advancementCounters: number,
  serverId: "remote_1" | "remote_2" = "remote_1",
): void {
  state.corp.servers.push({
    id: serverId,
    kind: "remote",
    label: serverId === "remote_1" ? "Remote 1" : "Remote 2",
    ice: [],
    root: [],
  });
  const agendaId = `score_reserve_agenda_${serverId}` as CardInstanceId;
  state.corp.servers
    .find((server) => server.id === serverId)!
    .root.push(agendaId);
  state.cardInstances[agendaId] = {
    instanceId: agendaId,
    definitionId: "simple_agenda",
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: false,
    rezzed: false,
    advancementCounters,
    strengthModifier: 0,
  };
  addUnrezzedIce(
    state,
    `score_reserve_remote_ice_${serverId}` as CardInstanceId,
    "simple_barrier_ice",
    serverId,
  );
}

function engineRezDecisionInput(state: GameState, decisionId: string) {
  return buildAiDecisionInputDto({
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    eventTail: [],
    legalActions: getLegalActions(state, "corp"),
    difficulty: "normal",
    seed: state.seed,
    decisionId,
    actionNumber: 1,
    profileId: "score-reserve-rez-test",
  });
}

function engineAgendaServerRezWindow() {
  let state = createGameAfterSetup({ seed: "agenda-server-rez-priority" });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = 0;
  state.corp.credits = 2;
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [],
    root: [],
  });
  const agendaId = "agenda_server_priority_agenda" as CardInstanceId;
  state.corp.servers
    .find((server) => server.id === "remote_1")!
    .root.push(agendaId);
  state.cardInstances[agendaId] = {
    instanceId: agendaId,
    definitionId: "simple_agenda",
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  addUnrezzedIce(
    state,
    "agenda_server_priority_ice" as CardInstanceId,
    "onr_v1_238_data-wall-2-0",
    "remote_1",
  );
  const startRun = getLegalActions(state, "runner").find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "remote_1",
  );
  if (!startRun) throw new Error("Engine did not expose the agenda-server run");
  state = applyEngineAction(
    state,
    "runner",
    startRun.actionId,
    "run-agenda-server",
  );
  return {
    state,
    input: engineRezDecisionInput(state, "agenda-server-rez-priority"),
  };
}

function currentExactRezRoute(
  input: ReturnType<typeof engineRezDecisionInput>,
  iceId: CardInstanceId,
  definitionId: string,
) {
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: { [iceId]: definitionId },
  }).find((entry) => entry.semanticActionType === "corp_window.rez");
  const sourceCard = input.playerView.servers
    .find((server) => server.id === "rd")!
    .ice.find((ice) => ice.instanceId === iceId);
  if (!candidate || !sourceCard)
    throw new Error("Missing exact current rez route");
  const route = projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard,
    targetServerId: "rd",
  });
  if (!route) throw new Error("Missing productive current rez projection");
  return route;
}

function testScoreContinuationProject(serverId: "remote_1" | "remote_2") {
  return {
    projectId: `agenda:score_reserve_agenda_${serverId}:${serverId}`,
    agendaPoints: 2,
    serverId,
    phase: "advance_agenda" as const,
    sameTurnCloseout: false,
    terminalScore: false,
    feasible: true,
    evidenceCode: "test",
    continuationReserve: {
      agendaCardId: `score_reserve_agenda_${serverId}`,
      serverId,
      requiredCreditsBeforeNextCorpTurn: 0,
      remainingAdvancementCounters: 1,
      nextCorpTurnGuaranteedFlexibleClicks: 3,
      certifiedCreditGainFromFreeClicks: 2,
    },
  };
}

function applyEngineAction(
  state: GameState,
  side: "corp" | "runner",
  actionId: string,
  idempotencyKey: string,
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function completeCurrentRunnerRun(initial: GameState): GameState {
  let state = initial;
  for (let step = 0; step < 8 && state.run; step += 1) {
    const action = getLegalActions(state, "runner").find(
      (candidate) =>
        candidate.type === "continue_run" || candidate.type === "access_card",
    );
    if (!action) {
      throw new Error(
        `Engine did not expose a deterministic run-completion action at ${state.run.phase}: ${getLegalActions(
          state,
          "runner",
        )
          .map((candidate) => candidate.type)
          .join(",")}`,
      );
    }
    state = applyEngineAction(
      state,
      "runner",
      action.actionId,
      `complete-run-${step}`,
    );
  }
  if (state.run)
    throw new Error("Engine did not complete the deterministic run");
  return state;
}
