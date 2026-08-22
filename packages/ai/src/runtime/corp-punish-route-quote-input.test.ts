import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteRequest,
  type CorpPunishRouteQuoteResult,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { corpPunishRouteRequestFingerprint } from "@netgrid/engine";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  buildBoundedCorpPunishRouteRequests,
  withDecisionLocalCorpPunishRouteQuotes,
} from "./corp-punish-route-quote-input";

const DATA_SIFTERS = "onr_proteus_048_data-sifters";
const CHANCE_OBSERVATION = "onr_v1_284_chance-observation";
const MANHUNT = "onr_proteus_050_manhunt";
const CLOSED_ACCOUNTS = "onr_v1_285_closed-accounts";
const PUNITIVE = "onr_v1_301_punitive-counterstrike";
const SCORCHED = "onr_v1_302_scorched-earth";

describe("decision-local Corp punish route quote input", () => {
  afterEach(() => {
    resetResidentPlanPortfolioMemory();
  });

  it("builds bounded visible Tag -> 4 and Tag -> 4 -> 2 route probes without inventing outcomes", () => {
    const input = punishInput({ runnerTags: 0, runnerHandCount: 3 });

    const requests = buildBoundedCorpPunishRouteRequests(input);

    expect(requests.length).toBeGreaterThan(1);
    expect(requests.length).toBeLessThanOrEqual(8);
    expect(requests.every((request) => request.steps.length <= 6)).toBe(true);
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          steps: [
            expect.objectContaining({
              kind: "tag",
              sourceCardInstanceId: "data-sifters",
              sourceCapabilityBindingKind: "card_spec_capability_key",
              sourceCapabilityId:
                "onr_proteus_048_data-sifters:on_play_tag_after_runner_trashed_node",
            }),
            expect.objectContaining({
              kind: "meat_damage",
              sourceCardInstanceId: "scorched",
              sourceCapabilityBindingKind: "card_spec_capability_key",
              sourceCapabilityId:
                "onr_v1_302_scorched-earth:abilities_on_play_damage",
            }),
          ],
        }),
        expect.objectContaining({
          steps: [
            expect.objectContaining({
              kind: "tag",
              sourceCardInstanceId: "data-sifters",
            }),
            expect.objectContaining({
              kind: "meat_damage",
              sourceCardInstanceId: "scorched",
            }),
            expect.objectContaining({
              kind: "meat_damage",
              sourceCardInstanceId: "punitive",
            }),
          ],
        }),
      ]),
    );
    expect(requests).toEqual(
      buildBoundedCorpPunishRouteRequests(structuredClone(input)),
    );
  });

  it("recognizes a reviewed Trace -> tag head without inventing its bid or cost", () => {
    const input = punishInput({ runnerTags: 0, runnerHandCount: 5 });
    input.playerView.own.gripOrHq = [
      operation("chance", CHANCE_OBSERVATION),
      operation("scorched", SCORCHED),
    ];

    expect(buildBoundedCorpPunishRouteRequests(input)).toEqual([
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            kind: "trace_tag",
            sourceCardInstanceId: "chance",
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId:
              "onr_v1_284_chance-observation:abilities_on_play_trace",
          }),
          expect.objectContaining({
            kind: "meat_damage",
            sourceCardInstanceId: "scorched",
          }),
        ],
      }),
    ]);
  });

  it("binds Manhunt's trace-margin tag head to the punish owner", () => {
    const input = punishInput({ runnerTags: 0, runnerHandCount: 5 });
    input.playerView.own.gripOrHq = [
      operation("manhunt", MANHUNT),
      operation("scorched", SCORCHED),
    ];

    expect(buildBoundedCorpPunishRouteRequests(input)).toEqual([
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            kind: "trace_tag",
            sourceCardInstanceId: "manhunt",
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId:
              "onr_proteus_050_manhunt:on_play_trace_six_tags_by_margin",
          }),
          expect.objectContaining({
            kind: "meat_damage",
            sourceCardInstanceId: "scorched",
          }),
        ],
      }),
    ]);
  });

  it("deterministically caps expanded visible combinations at eight routes and six steps", () => {
    const input = punishInput({ runnerTags: 0, runnerHandCount: 10 });
    input.playerView.own.gripOrHq = [
      operation("tag", DATA_SIFTERS),
      ...Array.from({ length: 20 }, (_, index) =>
        operation(`damage-${index}`, index % 2 === 0 ? SCORCHED : PUNITIVE),
      ),
    ];

    const first = buildBoundedCorpPunishRouteRequests(input);
    const second = buildBoundedCorpPunishRouteRequests(structuredClone(input));

    expect(first).toHaveLength(8);
    expect(Math.max(...first.map((request) => request.steps.length))).toBe(6);
    expect(second).toEqual(first);
  });

  it("omits the tag step when the Runner is already tagged", () => {
    const requests = buildBoundedCorpPunishRouteRequests(
      punishInput({ runnerTags: 1, runnerHandCount: 1 }),
    );

    expect(requests).not.toHaveLength(0);
    expect(
      requests.every((request) =>
        request.steps.every((step) => step.kind === "meat_damage"),
      ),
    ).toBe(true);
  });

  it("probes tagged Closed Accounts as an explicit Engine-certified non-damage payoff", () => {
    const input = punishInput({ runnerTags: 1, runnerHandCount: 3 });
    input.playerView.own.gripOrHq = [
      operation("closed-accounts", CLOSED_ACCOUNTS),
    ];

    expect(buildBoundedCorpPunishRouteRequests(input)).toEqual([
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            kind: "other_punish",
            sourceCardInstanceId: "closed-accounts",
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId:
              "onr_v1_285_closed-accounts:abilities_on_play_lose_credits",
          }),
        ],
      }),
    ]);
  });

  it("binds Closed Accounts behind a visible direct-tag head but emits no untagged standalone probe", () => {
    const input = punishInput({ runnerTags: 0, runnerHandCount: 3 });
    input.playerView.own.gripOrHq = [
      operation("data-sifters", DATA_SIFTERS),
      operation("closed-accounts", CLOSED_ACCOUNTS),
    ];

    expect(buildBoundedCorpPunishRouteRequests(input)).toEqual([
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            kind: "tag",
            sourceCardInstanceId: "data-sifters",
          }),
          expect.objectContaining({
            kind: "other_punish",
            sourceCardInstanceId: "closed-accounts",
          }),
        ],
      }),
    ]);

    input.playerView.own.gripOrHq = [
      operation("closed-accounts", CLOSED_ACCOUNTS),
    ];
    expect(buildBoundedCorpPunishRouteRequests(input)).toEqual([]);
  });

  it("uses only known own visible components with reviewed structured hints", () => {
    const input = punishInput({ runnerTags: 0, runnerHandCount: 3 });
    input.playerView.own.gripOrHq = [
      hiddenCard("hidden-data-sifters", DATA_SIFTERS),
      operation("scorched", SCORCHED),
      operation("unknown-punish", "test-unknown-damage"),
    ];

    expect(buildBoundedCorpPunishRouteRequests(input)).toEqual([]);
  });

  it("keeps a complete sibling when another quoted route is canonically incomplete", () => {
    const input = punishInput({ runnerTags: 1, runnerHandCount: 3 });
    const callback = vi.fn((request: CorpPunishRouteQuoteRequest) =>
      request.steps.some((step) => step.sourceCardInstanceId === "punitive") &&
      request.steps.every((step) => step.sourceCardInstanceId !== "scorched")
        ? incompleteQuote(request, "source_condition_unsatisfied")
        : completeQuote(input, request),
    );

    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, callback);

    expect(quoted.playerView.corpPunishRouteQuoteSet).toMatchObject({
      complete: true,
      incompleteReasons: [],
    });
    expect(
      quoted.playerView.corpPunishRouteQuoteSet?.routes.some(
        (route) => route.complete,
      ),
    ).toBe(true);
    expect(
      quoted.playerView.corpPunishRouteQuoteSet?.routes.some(
        (route) =>
          route.complete === false &&
          route.incompleteReasons.includes("source_condition_unsatisfied"),
      ),
    ).toBe(true);
  });

  it.each(["stale", "malformed", "thrown", "rejected"] as const)(
    "fails closed a %s callback result without mutating the decision input",
    (failure) => {
      const input = punishInput({ runnerTags: 1, runnerHandCount: 3 });
      const before = structuredClone(input);
      const callback = (
        request: CorpPunishRouteQuoteRequest,
      ): CorpPunishRouteQuoteResult => {
        if (failure === "thrown") throw new Error("quote failed");
        if (failure === "rejected") {
          return {
            ok: false,
            error: { code: "ERR_INVALID_TARGET", message: "rejected" },
          };
        }
        const result = completeQuote(input, request);
        if (!result.ok) return result;
        if (failure === "stale") result.quote.stateVersion += 1;
        if (failure === "malformed") {
          result.quote.requestEcho.routeId = "foreign-route";
        }
        return result;
      };

      const quoted = withDecisionLocalCorpPunishRouteQuotes(input, callback);

      expect(quoted).toBe(input);
      expect(input).toEqual(before);
      expect(input.playerView.corpPunishRouteQuoteSet).toBeUndefined();
    },
  );

  it("leaves normal planning untouched without a callback or a complete visible route", () => {
    const missingCallback = punishInput({
      runnerTags: 1,
      runnerHandCount: 3,
    });
    expect(
      withDecisionLocalCorpPunishRouteQuotes(missingCallback, undefined),
    ).toBe(missingCallback);

    const noTagRoute = punishInput({ runnerTags: 0, runnerHandCount: 3 });
    noTagRoute.playerView.own.gripOrHq =
      noTagRoute.playerView.own.gripOrHq.filter(
        (card) => card.definitionId !== DATA_SIFTERS,
      );
    const callback = vi.fn();
    expect(withDecisionLocalCorpPunishRouteQuotes(noTagRoute, callback)).toBe(
      noTagRoute,
    );
    expect(callback).not.toHaveBeenCalled();
  });

  it.each([
    {
      runnerHandCount: 3,
      expectedDamageSources: ["scorched"],
    },
    {
      runnerHandCount: 5,
      expectedDamageSources: ["scorched", "punitive"],
    },
  ])(
    "lets the plan runtime choose the minimal quoted route for hand count $runnerHandCount",
    ({ runnerHandCount, expectedDamageSources }) => {
      const input = punishInput({ runnerTags: 0, runnerHandCount });
      const before = structuredClone(input);
      const expectedRoutes = buildBoundedCorpPunishRouteRequests(input).filter(
        (request) =>
          request.steps
            .filter((step) => step.kind === "meat_damage")
            .map((step) => step.sourceCardInstanceId)
            .sort()
            .join(",") === expectedDamageSources.slice().sort().join(","),
      );
      const callback = vi.fn((request: CorpPunishRouteQuoteRequest) =>
        completeQuote(input, request),
      );

      const first = chooseCorpAction(input, {
        quoteCorpPunishRoute: callback,
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      });
      const second = chooseCorpAction(input, {
        quoteCorpPunishRoute: callback,
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      });

      expect(first.actionId).toBe("play-data-sifters");
      expect(second).toEqual(first);
      expect(first.fallbackUsed).toBe(false);
      expect(
        expectedRoutes.some(
          (route) =>
            first.evidence?.includes(
              `plan_assessment_evidence:corp_punish_route_selected:${route.routeId}`,
            ) === true,
        ),
      ).toBe(true);
      expect(input).toEqual(before);
      expect(input.playerView.corpPunishRouteQuoteSet).toBeUndefined();
    },
  );
});

function punishInput(params: {
  runnerTags: number;
  runnerHandCount: number;
}): AiDecisionInput {
  const dataSifters = operation("data-sifters", DATA_SIFTERS);
  const punitive = operation("punitive", PUNITIVE);
  const scorched = operation("scorched", SCORCHED);
  const stateVersion = 7;
  const actions = [
    playOperation("play-data-sifters", dataSifters, 4, stateVersion),
    playOperation("play-punitive", punitive, 0, stateVersion),
    playOperation("play-scorched", scorched, 3, stateVersion),
    basicAction("gain-credit", "gain_credit", stateVersion),
    basicAction("draw-card", "draw_card", stateVersion),
    basicAction("end-turn", "end_turn", stateVersion),
  ];
  return {
    matchId: "punish-callback-match",
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion,
      turnSerial: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: {
          instanceId: "corp-identity",
          known: true,
          definitionId: "corp-identity",
          title: "Corp identity",
          owner: "corp",
          controller: "corp",
          type: "identity",
        },
        credits: 20,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [dataSifters, scorched, punitive],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "runner-identity",
          known: true,
          definitionId: "runner-identity",
          title: "Runner identity",
          owner: "runner",
          controller: "runner",
          type: "identity",
        },
        credits: 4,
        clicks: 4,
        agendaPoints: 0,
        tags: params.runnerTags,
        handCount: params.runnerHandCount,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: actions,
    difficulty: "normal",
    seed: "punish-callback-seed",
    decisionId: "punish-callback-decision",
    actionNumber: 7,
    profileId: "corp-punish-callback-test",
  };
}

function operation(instanceId: string, definitionId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    definitionId,
    title: definitionId,
    owner: "corp",
    controller: "corp",
    type: "operation",
  };
}

function hiddenCard(instanceId: string, definitionId: string): VisibleCard {
  return {
    instanceId,
    known: false,
    definitionId,
  };
}

function playOperation(
  actionId: string,
  card: VisibleCard,
  credits: number,
  stateVersion: number,
): LegalAction {
  return {
    actionId,
    side: "corp",
    type: "play_operation",
    label: actionId,
    source: card.instanceId,
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: stateVersion,
    payload: {
      cardId: card.instanceId,
      sourceDefinitionId: card.definitionId!,
    },
  };
}

function basicAction(
  actionId: string,
  type: Extract<LegalAction["type"], "gain_credit" | "draw_card" | "end_turn">,
  stateVersion: number,
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source: type === "end_turn" ? "game_rule" : "basic_action",
    timingPoint: "corp_action.main",
    costs: type === "end_turn" ? [] : [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: stateVersion,
  };
}

function completeQuote(
  input: AiDecisionInput,
  request: CorpPunishRouteQuoteRequest,
): CorpPunishRouteQuoteResult {
  const cards = new Map(
    input.playerView.own.gripOrHq.map((card) => [card.instanceId, card]),
  );
  const actionCredits = new Map([
    ["data-sifters", 4],
    ["punitive", 0],
    ["scorched", 3],
  ]);
  const damage = new Map([
    ["punitive", 2],
    ["scorched", 4],
  ]);
  const steps = request.steps.map((step, index) => {
    const card = cards.get(step.sourceCardInstanceId)!;
    const currentLegalAction =
      index === 0
        ? input.legalActions.find(
            (action) => action.source === step.sourceCardInstanceId,
          )
        : undefined;
    return {
      ...step,
      sourceCardDefinitionId: card.definitionId!,
      clicks: 1,
      credits: actionCredits.get(step.sourceCardInstanceId) ?? 0,
      ...(currentLegalAction ? { currentLegalAction } : {}),
    };
  });
  const rawDamage = request.steps.reduce(
    (sum, step) => sum + (damage.get(step.sourceCardInstanceId) ?? 0),
    0,
  );
  const totalActionCredits = steps.reduce((sum, step) => sum + step.credits, 0);
  const tagStep = steps.find((step) => step.kind === "tag");
  const quote: CorpPunishRouteQuote = {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    matchId: request.matchId,
    side: "corp",
    routeId: request.routeId,
    campaignId: request.campaignId,
    campaignIdOrigin: "request_binding",
    stateVersion: request.stateVersion,
    timingPoint: request.timingPoint,
    requestFingerprint: corpPunishRouteRequestFingerprint(request),
    requestEcho: structuredClone(request),
    complete: true,
    incompleteReasons: [],
    steps,
    totalClicks: steps.length,
    totalActionCredits,
    tagTrigger: tagStep
      ? {
          kind: "direct_tag_step",
          status: "projected",
          currentRunnerTags: input.playerView.opponent.tags,
          requiredRunnerTags: 1,
          sourceStepId: tagStep.stepId,
        }
      : {
          kind: "existing_tag",
          status: "satisfied",
          currentRunnerTags: input.playerView.opponent.tags,
          requiredRunnerTags: 1,
        },
    responsePaymentEnvelope: {
      responseKind: "none",
      paymentKnowledge: "exact_public",
      corpCreditsAvailable: input.playerView.own.credits,
      runnerCreditsVisible: input.playerView.opponent.credits,
      corpResponseCredits: { minimum: 0, maximum: 0 },
      totalCorpCredits: {
        minimum: totalActionCredits,
        maximum: totalActionCredits,
      },
      runnerResponseCredits: { minimum: 0, maximum: 0 },
    },
    damageEnvelope: {
      runnerHandCount: input.playerView.opponent.handCount,
      rawDamage: {
        meat: rawDamage,
        net: 0,
        core: 0,
        total: rawDamage,
      },
      effectiveDamage: { minimum: rawDamage, maximum: rawDamage },
      visiblePrevention: {
        knowledge: "none_visible",
        maximumPreventableDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
      visiblePiercing: {
        knowledge: "none_visible",
        maximumBypassedDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
    },
    guarantee:
      rawDamage > input.playerView.opponent.handCount
        ? "guaranteed"
        : "not_guaranteed",
    responseKnowledge: "public_exact",
  };
  return { ok: true, quote };
}

function incompleteQuote(
  request: CorpPunishRouteQuoteRequest,
  reason: CorpPunishRouteQuote["incompleteReasons"][number],
): CorpPunishRouteQuoteResult {
  return {
    ok: true,
    quote: {
      schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
      visibility: "private_to_actor",
      matchId: request.matchId,
      side: "corp",
      routeId: request.routeId,
      campaignId: request.campaignId,
      campaignIdOrigin: "request_binding",
      stateVersion: request.stateVersion,
      timingPoint: request.timingPoint,
      requestFingerprint: corpPunishRouteRequestFingerprint(request),
      requestEcho: structuredClone(request),
      complete: false,
      incompleteReasons: [reason],
      steps: [],
      totalClicks: 0,
      totalActionCredits: 0,
      tagTrigger: {
        kind: "unknown",
        status: "unknown",
        currentRunnerTags: 0,
        requiredRunnerTags: 0,
      },
      responsePaymentEnvelope: {
        responseKind: "unknown",
        paymentKnowledge: "unknown",
        corpCreditsAvailable: 0,
        runnerCreditsVisible: 0,
        corpResponseCredits: { minimum: 0, maximum: 0 },
        totalCorpCredits: { minimum: 0, maximum: 0 },
        runnerResponseCredits: { minimum: 0, maximum: 0 },
      },
      damageEnvelope: {
        runnerHandCount: 0,
        rawDamage: { meat: 0, net: 0, core: 0, total: 0 },
        effectiveDamage: { minimum: 0, maximum: 0 },
        visiblePrevention: {
          knowledge: "unknown",
          maximumPreventableDamage: 0,
          creditCost: { minimum: 0, maximum: 0 },
        },
        visiblePiercing: {
          knowledge: "unknown",
          maximumBypassedDamage: 0,
          creditCost: { minimum: 0, maximum: 0 },
        },
      },
      guarantee: "unknown",
      responseKnowledge: "unknown",
    },
  };
}
