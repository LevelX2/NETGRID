import {
  CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID,
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type CardDefinitionId,
  type CardInstanceId,
  type CorpPunishRouteQuoteRequest,
  type GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { addCorpCardToHqForTest } from "../../test-fixtures/index-test-helpers";
import {
  corpPunishRouteRequestFingerprint,
  quoteCorpPunishRoute,
} from "./corp-punish-route-quotes";

describe("Corp punish-route quote request", () => {
  it("never certifies a CardSpec hardware capability from legacy authority", () => {
    const state = corpActionState("punish-route-hardware-owner-xor");
    state.runner.tags = 1;
    const source = addCorpCardToHqForTest(
      state,
      "onr_v1_299_power-grid-overload",
      "hardware-trash",
    );
    const request = routeRequest(state, [
      {
        ...step("hardware-trash", 0, "hardware_trash", source),
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID,
      },
    ]);

    expect(quoteCorpPunishRoute(state, request)).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["source_capability_missing"],
      },
    });
  });

  it("returns a structured incomplete quote for a malformed canonical capability id", () => {
    const state = corpActionState("punish-route-malformed-capability-id");
    const source = addCorpCardToHqForTest(
      state,
      "onr_proteus_048_data-sifters",
      "tag",
    );
    const request = routeRequest(state, [
      {
        ...step("tag", 0, "tag", source),
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: "bad/id",
      },
    ]);

    expect(() => quoteCorpPunishRoute(state, request)).not.toThrow();
    expect(quoteCorpPunishRoute(state, request)).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["source_capability_missing"],
      },
    });
  });

  it("certifies an adaptive Tag -> 4 meat damage route with exact action and response credits", () => {
    const state = corpActionState("punish-route-tag-four");
    const tag = addCorpCardToHqForTest(
      state,
      "onr_proteus_048_data-sifters",
      "tag",
    );
    const four = addCorpCardToHqForTest(
      state,
      "onr_v1_302_scorched-earth",
      "four",
    );
    const request = routeRequest(state, [
      step("tag", 0, "tag", tag),
      step("damage-4", 1, "meat_damage", four),
    ]);
    const before = structuredClone(state);

    const result = quoteCorpPunishRoute(state, request);

    expect(result).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        campaignId: "campaign:tag-and-bag",
        routeId: "route:adaptive",
        requestEcho: request,
        totalClicks: 2,
        totalActionCredits: 7,
        tagTrigger: {
          kind: "direct_tag_step",
          sourceStepId: "tag",
        },
        responsePaymentEnvelope: {
          corpResponseCredits: { minimum: 0, maximum: 0 },
          totalCorpCredits: { minimum: 7, maximum: 7 },
        },
        damageEnvelope: {
          rawDamage: { meat: 4, net: 0, core: 0, total: 4 },
          effectiveDamage: { minimum: 4, maximum: 4 },
          visiblePrevention: {
            knowledge: "none_visible",
            maximumPreventableDamage: 0,
          },
        },
        guarantee: "conditional_on_runner_response",
        responseKnowledge: "unknown",
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.quote.requestFingerprint).toBe(
      corpPunishRouteRequestFingerprint(request),
    );
    expect(result.quote.steps[0]?.currentLegalAction).toMatchObject({
      side: "corp",
      type: "play_operation",
      source: tag,
      payload: { cardId: tag },
    });
    expect(result.quote.steps[1]).not.toHaveProperty("currentLegalAction");
    expect(state).toEqual(before);
  });

  it("extends the same route to Tag -> 4 -> 2 without inventing response credits", () => {
    const state = corpActionState("punish-route-tag-four-two");
    const tag = addCorpCardToHqForTest(
      state,
      "onr_proteus_048_data-sifters",
      "tag",
    );
    const four = addCorpCardToHqForTest(
      state,
      "onr_v1_302_scorched-earth",
      "four",
    );
    const two = addCorpCardToHqForTest(
      state,
      "onr_v1_301_punitive-counterstrike",
      "two",
    );

    const result = quoteCorpPunishRoute(
      state,
      routeRequest(state, [
        step("tag", 0, "tag", tag),
        step("damage-4", 1, "meat_damage", four),
        step("damage-2", 2, "meat_damage", two),
      ]),
    );

    expect(result).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        totalClicks: 3,
        totalActionCredits: 7,
        responsePaymentEnvelope: {
          corpResponseCredits: { minimum: 0, maximum: 0 },
          totalCorpCredits: { minimum: 7, maximum: 7 },
        },
        damageEnvelope: {
          rawDamage: { meat: 6, net: 0, core: 0, total: 6 },
          effectiveDamage: { minimum: 6, maximum: 6 },
        },
      },
    });
  });

  it("certifies the public Chance Observation bid bound and hides concealed response identities", () => {
    const state = corpActionState("punish-route-chance-scorched");
    state.corp.credits = 12;
    state.corp.clicks = 3;
    state.runner.credits = 9;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      runAttemptsLastTurn: 1,
    };
    const chance = addCorpCardToHqForTest(
      state,
      "onr_v1_284_chance-observation",
      "chance",
    );
    const scorched = addCorpCardToHqForTest(
      state,
      "onr_v1_302_scorched-earth",
      "scorched",
    );
    const request = routeRequest(state, [
      canonicalStep(
        "trace-tag",
        0,
        "trace_tag",
        chance,
        "onr_v1_284_chance-observation",
        "abilities_on_play_trace",
      ),
      canonicalStep(
        "damage-4",
        1,
        "meat_damage",
        scorched,
        "onr_v1_302_scorched-earth",
        "abilities_on_play_damage",
      ),
    ]);
    const before = structuredClone(state);

    const clean = quoteCorpPunishRoute(state, request);

    expect(clean).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        totalClicks: 2,
        totalActionCredits: 5,
        tagTrigger: {
          kind: "trace_tag_step",
          traceLimit: 5,
          sourceStepId: "trace-tag",
        },
        responsePaymentEnvelope: {
          paymentKnowledge: "exact_public",
          corpResponseCredits: { minimum: 0, maximum: 5 },
          totalCorpCredits: { minimum: 5, maximum: 10 },
          runnerResponseCredits: { minimum: 0, maximum: 9 },
        },
        damageEnvelope: {
          effectiveDamage: { minimum: 4, maximum: 4 },
        },
        responseKnowledge: "public_exact",
      },
    });
    expect(state).toEqual(before);

    const unfunded = structuredClone(state);
    unfunded.corp.credits = 0;
    const unfundedQuote = quoteCorpPunishRoute(unfunded, request);
    expect(unfundedQuote).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        responsePaymentEnvelope: {
          corpCreditsAvailable: 0,
          corpResponseCredits: { maximum: 5 },
          totalCorpCredits: { maximum: 10 },
        },
        steps: [
          {
            sourceCardDefinitionId: "onr_v1_284_chance-observation",
          },
          {
            sourceCardDefinitionId: "onr_v1_302_scorched-earth",
          },
        ],
      },
    });
    if (!unfundedQuote.ok) throw new Error(unfundedQuote.error.message);
    expect(unfundedQuote.quote.steps[0]).not.toHaveProperty(
      "currentLegalAction",
    );

    const left = structuredClone(state);
    const leftFirst = addConcealedRunnerResource(
      left,
      "onr_proteus_147_r-and-d-mole",
      "first",
    );
    const leftSecond = addConcealedRunnerResource(
      left,
      "onr_proteus_142_hq-mole",
      "second",
    );
    const right = structuredClone(left);
    right.cardInstances[leftFirst]!.definitionId = "onr_proteus_142_hq-mole";
    right.cardInstances[leftSecond]!.definitionId =
      "onr_proteus_147_r-and-d-mole";

    const leftQuote = quoteCorpPunishRoute(left, request);
    const rightQuote = quoteCorpPunishRoute(right, request);

    expect(leftQuote).toEqual(rightQuote);
    expect(leftQuote).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        guarantee: "not_guaranteed",
        responseKnowledge: "unknown",
        responsePaymentEnvelope: {
          paymentKnowledge: "unknown",
          corpResponseCredits: { maximum: 5 },
          totalCorpCredits: { maximum: 10 },
        },
      },
    });
  });

  it("keeps a visible extra base-link response window fail-closed", () => {
    const state = corpActionState("punish-route-visible-base-link-window");
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      runAttemptsLastTurn: 1,
    };
    const chance = addCorpCardToHqForTest(
      state,
      "onr_v1_284_chance-observation",
      "chance",
    );
    const scorched = addCorpCardToHqForTest(
      state,
      "onr_v1_302_scorched-earth",
      "scorched",
    );
    const baseLink = addConcealedRunnerResource(
      state,
      "onr_v1_148_access-through-alpha",
      "visible-base-link",
    );
    state.cardInstances[baseLink]!.faceup = true;

    expect(
      quoteCorpPunishRoute(
        state,
        routeRequest(state, [
          canonicalStep(
            "trace-tag",
            0,
            "trace_tag",
            chance,
            "onr_v1_284_chance-observation",
            "abilities_on_play_trace",
          ),
          canonicalStep(
            "damage-4",
            1,
            "meat_damage",
            scorched,
            "onr_v1_302_scorched-earth",
            "abilities_on_play_damage",
          ),
        ]),
      ),
    ).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["response_window_unknown"],
      },
    });
  });

  it("certifies tagged Closed Accounts from its exact current LegalAction and lose-all implementation", () => {
    const state = corpActionState("punish-route-closed-accounts-execute");
    state.runner.tags = 1;
    state.runner.credits = 9;
    const closedAccounts = addCorpCardToHqForTest(
      state,
      "onr_v1_285_closed-accounts",
      "closed-accounts",
    );

    const result = quoteCorpPunishRoute(
      state,
      routeRequest(state, [
        step("credit-denial", 0, "other_punish", closedAccounts),
      ]),
    );

    expect(result).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        totalClicks: 1,
        totalActionCredits: 1,
        tagTrigger: {
          kind: "existing_tag",
          status: "satisfied",
          currentRunnerTags: 1,
        },
        responsePaymentEnvelope: {
          corpCreditsAvailable: 20,
          runnerCreditsVisible: 9,
          totalCorpCredits: { minimum: 1, maximum: 1 },
        },
        damageEnvelope: {
          rawDamage: { total: 0 },
          effectiveDamage: { minimum: 0, maximum: 0 },
        },
        guarantee: "guaranteed",
        responseKnowledge: "public_exact",
        steps: [
          {
            kind: "other_punish",
            sourceCardDefinitionId: "onr_v1_285_closed-accounts",
            sourceCapabilityId: "ability:on_play:0",
            clicks: 1,
            credits: 1,
            currentLegalAction: {
              side: "corp",
              type: "play_operation",
              source: closedAccounts,
              payload: { cardId: closedAccounts },
              costs: [{ clicks: 1, credits: 1 }],
            },
          },
        ],
      },
    });
  });

  it("certifies a Closed Accounts funding horizon only when adding the exact fixed gap produces its LegalAction", () => {
    const state = corpActionState("punish-route-closed-accounts-fund");
    state.runner.tags = 1;
    state.runner.credits = 7;
    state.corp.credits = 0;
    const closedAccounts = addCorpCardToHqForTest(
      state,
      "onr_v1_285_closed-accounts",
      "closed-accounts",
    );
    const request = routeRequest(state, [
      step("credit-denial", 0, "other_punish", closedAccounts),
    ]);
    const before = structuredClone(state);

    const result = quoteCorpPunishRoute(state, request);

    expect(result).toMatchObject({
      ok: true,
      quote: {
        complete: true,
        totalClicks: 1,
        totalActionCredits: 1,
        responsePaymentEnvelope: {
          corpCreditsAvailable: 0,
          runnerCreditsVisible: 7,
          totalCorpCredits: { minimum: 1, maximum: 1 },
        },
        steps: [
          {
            sourceCardDefinitionId: "onr_v1_285_closed-accounts",
            credits: 1,
          },
        ],
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.quote.steps[0]).not.toHaveProperty("currentLegalAction");
    expect(state).toEqual(before);
  });

  it("keeps Closed Accounts fail-closed when the tag condition is not met", () => {
    const state = corpActionState("punish-route-closed-accounts-untagged");
    const closedAccounts = addCorpCardToHqForTest(
      state,
      "onr_v1_285_closed-accounts",
      "closed-accounts",
    );

    expect(
      quoteCorpPunishRoute(
        state,
        routeRequest(state, [
          step("credit-denial", 0, "other_punish", closedAccounts),
        ]),
      ),
    ).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["head_legal_action_unavailable"],
      },
    });
  });

  it("keeps hidden Runner twins identical and normalizes hidden-id probes with missing ids", () => {
    const left = corpActionState("punish-route-hidden-twin");
    const tag = addCorpCardToHqForTest(
      left,
      "onr_proteus_048_data-sifters",
      "tag",
    );
    const four = addCorpCardToHqForTest(
      left,
      "onr_v1_302_scorched-earth",
      "four",
    );
    const right = structuredClone(left);
    const [firstGripId, secondGripId] = right.runner.grip;
    if (!firstGripId || !secondGripId)
      throw new Error("Hidden-twin fixture requires two Runner grip cards.");
    const firstDefinitionId = right.cardInstances[firstGripId]!.definitionId;
    right.cardInstances[firstGripId]!.definitionId =
      right.cardInstances[secondGripId]!.definitionId;
    right.cardInstances[secondGripId]!.definitionId = firstDefinitionId;
    const request = routeRequest(left, [
      step("tag", 0, "tag", tag),
      step("damage-4", 1, "meat_damage", four),
    ]);

    expect(quoteCorpPunishRoute(right, request)).toEqual(
      quoteCorpPunishRoute(left, request),
    );

    const missingProbe = quoteCorpPunishRoute(
      left,
      routeRequest(left, [step("probe", 0, "tag", "nonexistent-source")]),
    );
    const hiddenProbe = quoteCorpPunishRoute(
      left,
      routeRequest(left, [step("probe", 0, "tag", firstGripId)]),
    );
    expect(incompleteProbeFacts(hiddenProbe)).toEqual(
      incompleteProbeFacts(missingProbe),
    );
    expect(hiddenProbe).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["source_unavailable"],
      },
    });
  });

  it.each([
    [
      "stale state",
      (state: GameState, request: CorpPunishRouteQuoteRequest) => {
        request.stateVersion = state.stateVersion + 1;
      },
      "ERR_STALE_STATE",
    ],
    [
      "foreign match",
      (_state: GameState, request: CorpPunishRouteQuoteRequest) => {
        request.matchId = "foreign-match";
      },
      "ERR_INVALID_TARGET",
    ],
    [
      "wrong timing",
      (_state: GameState, request: CorpPunishRouteQuoteRequest) => {
        request.timingPoint = "runner_action.main";
      },
      "ERR_UNKNOWN_ACTION",
    ],
    [
      "wrong side",
      (_state: GameState, request: CorpPunishRouteQuoteRequest) => {
        (request as { side: string }).side = "runner";
      },
      "ERR_WRONG_SIDE",
    ],
  ] as const)("rejects %s before quoting", (_label, mutate, errorCode) => {
    const state = corpActionState(`punish-route-${errorCode}`);
    const tag = addCorpCardToHqForTest(
      state,
      "onr_proteus_048_data-sifters",
      "tag",
    );
    const request = routeRequest(state, [step("tag", 0, "tag", tag)]);
    mutate(state, request);

    expect(quoteCorpPunishRoute(state, request)).toMatchObject({
      ok: false,
      error: { code: errorCode },
    });
  });

  it("rejects malformed, duplicate, empty and oversized step requests", () => {
    const state = corpActionState("punish-route-malformed");
    const tag = addCorpCardToHqForTest(
      state,
      "onr_proteus_048_data-sifters",
      "tag",
    );
    const valid = routeRequest(state, [step("tag", 0, "tag", tag)]);
    const malformed = [
      { ...valid, steps: [] },
      {
        ...valid,
        steps: [
          step("same", 0, "tag", tag),
          step("same", 1, "tag", `${tag}-2`),
        ],
      },
      {
        ...valid,
        steps: Array.from({ length: 7 }, (_, index) =>
          step(`step-${index}`, index, "tag", `${tag}-${index}`),
        ),
      },
    ];

    for (const request of malformed) {
      expect(
        quoteCorpPunishRoute(state, request as CorpPunishRouteQuoteRequest),
      ).toMatchObject({
        ok: false,
        error: { code: "ERR_INVALID_TARGET" },
      });
    }
  });

  it("fails only the requested route for absent heads, bad capabilities and unsupported trace costs", () => {
    const state = corpActionState("punish-route-fail-closed");
    const damage = addCorpCardToHqForTest(
      state,
      "onr_v1_302_scorched-earth",
      "damage",
    );
    const trace = addCorpCardToHqForTest(
      state,
      "onr_proteus_052_schlaghund-pointers",
      "trace",
    );
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      runAttemptsThisGame: 1,
    };

    expect(
      quoteCorpPunishRoute(
        state,
        routeRequest(state, [step("damage", 0, "meat_damage", damage)]),
      ),
    ).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["head_legal_action_unavailable"],
      },
    });
    expect(
      quoteCorpPunishRoute(
        state,
        routeRequest(state, [
          {
            ...step("bad-capability", 0, "tag", trace),
            sourceCapabilityId: "ability:on_play:7",
          },
        ]),
      ),
    ).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["source_capability_missing"],
      },
    });
    expect(
      quoteCorpPunishRoute(
        state,
        routeRequest(state, [step("trace", 0, "trace_tag", trace)]),
      ),
    ).toMatchObject({
      ok: true,
      quote: {
        complete: false,
        incompleteReasons: ["head_legal_action_unavailable"],
      },
    });
  });
});

function corpActionState(seed: string): GameState {
  const state = createGame({ seed, setupMode: "completed" });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 4;
  state.corp.credits = 20;
  state.runner.tags = 0;
  state.runnerTurnFlags = {
    ...(state.runnerTurnFlags ?? {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
    }),
    trashedNodeLastTurn: true,
  };
  return state;
}

function routeRequest(
  state: GameState,
  steps: CorpPunishRouteQuoteRequest["steps"],
): CorpPunishRouteQuoteRequest {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    matchId: state.matchId,
    side: "corp",
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    campaignId: "campaign:tag-and-bag",
    routeId: "route:adaptive",
    steps,
  };
}

function step(
  stepId: string,
  order: number,
  kind: CorpPunishRouteQuoteRequest["steps"][number]["kind"],
  sourceCardInstanceId: CardInstanceId,
): CorpPunishRouteQuoteRequest["steps"][number] {
  return {
    stepId,
    order,
    kind,
    sourceCardInstanceId,
    sourceCapabilityBindingKind: "legacy_card_implementation_index",
    sourceCapabilityId: "ability:on_play:0",
  };
}

function canonicalStep(
  stepId: string,
  order: number,
  kind: CorpPunishRouteQuoteRequest["steps"][number]["kind"],
  sourceCardInstanceId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  capabilityKey: string,
): CorpPunishRouteQuoteRequest["steps"][number] {
  return {
    stepId,
    order,
    kind,
    sourceCardInstanceId,
    sourceCapabilityBindingKind: "card_spec_capability_key",
    sourceCapabilityId: `${sourceDefinitionId}:${capabilityKey}`,
  };
}

function addConcealedRunnerResource(
  state: GameState,
  definitionId: CardDefinitionId,
  suffix: string,
): CardInstanceId {
  const cardId = `concealed_runner_resource_${suffix}` as CardInstanceId;
  state.runner.rig.resources.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function incompleteProbeFacts(
  result: ReturnType<typeof quoteCorpPunishRoute>,
): unknown {
  if (!result.ok) return result;
  const {
    requestEcho: _requestEcho,
    requestFingerprint: _fingerprint,
    ...quote
  } = result.quote;
  return quote;
}
