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
  readExactInstalledCorpIceRezQuote,
} from "./corp-exact-ice-rez-route";

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
    if (
      sourceQuote?.context !== "installed" ||
      sourceQuote.complete !== true
    ) {
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

    expect(() =>
      engineIceRezWindow("onr_classic_011_glacier", 0),
    ).toThrow(
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
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .expiresAtStateVersion += 1;
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
        (fixture.sourceCard.effectiveRezCostQuote as any).targetServerId =
          "hq";
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
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .reductionSourceDefinitionIds = ["same", "same"];
      },
    ],
    [
      "unsorted modifier ids",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .reductionSourceDefinitionIds = ["z", "a"];
      },
    ],
    [
      "overlapping modifier ids",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .reductionSourceDefinitionIds = ["same"];
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .increaseSourceDefinitionIds = ["same"];
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
        if (
          quote?.context !== "installed" ||
          quote.complete !== true
        ) {
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
    const fixture = mutableFixture(
      engineIceRezWindow("simple_barrier_ice", 0),
    );
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

  it("does not create a rez route without exact access-probability progress", () => {
    const fixture = engineIceRezWindow("onr_v1_249_hunter", 0);

    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
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
        runnerBreakerDefinitionId: "onr_classic_031_rent-i-con",
        runnerConsumedCardInstanceIds: ["exact_runner_program_0"],
      },
    });
    expect(
      chooseAiAction(fixture.input, { persistTacticalPlanMemory: false })
        .actionId,
    ).toBe(fixture.engineAction.actionId);
  });

  it("does not promote a free break without a certified consumed resource", () => {
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

function mutableFixture(
  fixture: ReturnType<typeof engineIceRezWindow>,
) {
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
  const iceId =
    `exact_ice_${agendaPoints}` as CardInstanceId;
  for (const [index, runnerProgram] of (
    options?.runnerPrograms ?? []
  ).entries()) {
    addInstalledRunnerProgram(
      state,
      `exact_runner_program_${index}` as CardInstanceId,
      runnerProgram,
      options?.runnerProgramStrengthModifiers?.[index] ?? 0,
    );
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
    (action) =>
      action.type === "rez_ice" && action.payload?.cardId === iceId,
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
  addUnrezzedIce(
    state,
    iceId,
    "onr_v1_232_crystal-wall",
    "remote_1",
  );
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
    (action) =>
      action.type === "rez_ice" && action.payload?.cardId === iceId,
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
  serverId: "rd" | "remote_1",
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
