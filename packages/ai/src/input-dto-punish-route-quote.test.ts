import { corpPunishRouteRequestFingerprint } from "@netgrid/engine";
import type {
  CorpPunishRouteQuoteRequest,
  CorpPunishRouteQuoteSet,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "./input-dto";
import {
  aiInput,
  legalAction,
} from "./semantic-ai-runtime-cutover.test-support";

describe("AI input DTO Corp punish-route quote contract", () => {
  it("preserves a valid Corp-only quote and only the current head LegalAction", () => {
    const head = damageAction("tag-source", "tag-action");
    const input = aiInput("corp", [head]);
    input.playerView.corpPunishRouteQuoteSet = completeQuoteSet(head);

    const dto = buildAiDecisionInputDto({
      side: "corp",
      playerView: input.playerView,
      eventTail: [],
      legalActions: [head],
      difficulty: "normal",
      seed: "punish-route-dto",
      decisionId: "punish-route-dto:corp",
      actionNumber: 1,
      profileId: "punish-route-dto",
    });

    expect(dto.playerView.corpPunishRouteQuoteSet).toMatchObject({
      schemaVersion: "corp-punish-route-quote-v2",
      visibility: "private_to_actor",
      side: "corp",
      stateVersion: 1,
      complete: true,
      routes: [
        {
          routeId: "route:tag-4-2",
          campaignId: "campaign:tag-and-bag",
          campaignIdOrigin: "request_binding",
          totalClicks: 3,
          totalActionCredits: 5,
          tagOutcomeEnvelope: {
            currentRunnerTags: 0,
            addedTags: { minimum: 1, maximum: 1 },
            projectedRunnerTags: { minimum: 1, maximum: 1 },
          },
        },
      ],
    });
    expect(
      dto.playerView.corpPunishRouteQuoteSet?.routes[0]?.steps[0]
        ?.currentLegalAction,
    ).toEqual(head);
    expect(
      dto.playerView.corpPunishRouteQuoteSet?.routes[0]?.steps[1],
    ).not.toHaveProperty("currentLegalAction");
  });

  it("drops stale or non-Corp actor-private quote sets", () => {
    const action = damageAction("tag-source", "tag-action");
    const corpInput = aiInput("corp", [action]);
    corpInput.playerView.corpPunishRouteQuoteSet = {
      ...completeQuoteSet(action),
      stateVersion: 0,
    };
    const runnerInput = aiInput("runner", []);
    runnerInput.playerView.corpPunishRouteQuoteSet = completeQuoteSet(action);

    expect(dtoFor(corpInput.playerView, [action])).not.toHaveProperty(
      "corpPunishRouteQuoteSet",
    );
    expect(dtoFor(runnerInput.playerView, [])).not.toHaveProperty(
      "corpPunishRouteQuoteSet",
    );
  });

  it("preserves one canonical incomplete route without invalidating its quote-set siblings", () => {
    const action = damageAction("tag-source", "tag-action");
    const input = aiInput("corp", [action]);
    const quoteSet = completeQuoteSet(action);
    const incomplete = structuredClone(quoteSet.routes[0]!);
    incomplete.complete = false;
    incomplete.incompleteReasons = ["source_unavailable"];
    incomplete.steps = [];
    incomplete.totalClicks = 0;
    incomplete.totalActionCredits = 0;
    incomplete.tagTrigger = {
      kind: "unknown",
      status: "unknown",
      currentRunnerTags: 0,
      requiredRunnerTags: 0,
    };
    incomplete.responsePaymentEnvelope = {
      responseKind: "unknown",
      paymentKnowledge: "unknown",
      corpCreditsAvailable: 0,
      runnerCreditsVisible: 0,
      corpResponseCredits: { minimum: 0, maximum: 0 },
      totalCorpCredits: { minimum: 0, maximum: 0 },
      runnerResponseCredits: { minimum: 0, maximum: 0 },
    };
    incomplete.damageEnvelope = {
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
    };
    incomplete.guarantee = "unknown";
    incomplete.responseKnowledge = "unknown";
    quoteSet.routes.push(incomplete);
    quoteSet.routes[1]!.routeId = "route:unsupported";
    quoteSet.routes[1]!.requestEcho.routeId = "route:unsupported";
    quoteSet.routes[1]!.requestFingerprint = corpPunishRouteRequestFingerprint(
      quoteSet.routes[1]!.requestEcho,
    );
    input.playerView.corpPunishRouteQuoteSet = quoteSet;

    expect(
      dtoFor(input.playerView, [action]).corpPunishRouteQuoteSet?.routes,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ complete: true }),
        expect.objectContaining({
          routeId: "route:unsupported",
          complete: false,
          incompleteReasons: ["source_unavailable"],
        }),
      ]),
    );
  });

  it.each<
    [string, (quote: CorpPunishRouteQuoteSet, action: LegalAction) => void]
  >([
    [
      "non-finite route totals",
      (quote) => {
        quote.routes[0]!.totalActionCredits = Number.NaN;
      },
    ],
    [
      "route state drift",
      (quote) => {
        quote.routes[0]!.stateVersion = 0;
      },
    ],
    [
      "request fingerprint drift",
      (quote) => {
        quote.routes[0]!.requestFingerprint = "forged";
      },
    ],
    [
      "request echo binding drift",
      (quote) => {
        quote.routes[0]!.requestEcho.steps[0]!.sourceCardInstanceId =
          "different-source";
      },
    ],
    [
      "request echo capability-owner drift",
      (quote) => {
        quote.routes[0]!.requestEcho.steps[0]!.sourceCapabilityId =
          "different-definition:tag";
      },
    ],
    [
      "complete/incomplete inconsistency",
      (quote) => {
        quote.routes[0]!.incompleteReasons = ["cost_quote_incomplete"];
      },
    ],
    [
      "duplicate step order",
      (quote) => {
        quote.routes[0]!.steps[1]!.order = 0;
      },
    ],
    [
      "future-step LegalAction",
      (quote, action) => {
        quote.routes[0]!.steps[1]!.currentLegalAction = action;
      },
    ],
    [
      "head source mismatch",
      (quote) => {
        quote.routes[0]!.steps[0]!.currentLegalAction!.source =
          "different-source";
      },
    ],
    [
      "damage total mismatch",
      (quote) => {
        quote.routes[0]!.damageEnvelope.rawDamage.total = 5;
      },
    ],
    [
      "effective damage outside raw range",
      (quote) => {
        quote.routes[0]!.damageEnvelope.effectiveDamage.maximum = 7;
      },
    ],
    [
      "payment envelope mismatch",
      (quote) => {
        quote.routes[0]!.responsePaymentEnvelope.totalCorpCredits.maximum = 6;
      },
    ],
    [
      "tag outcome envelope mismatch",
      (quote) => {
        quote.routes[0]!.tagOutcomeEnvelope!.projectedRunnerTags.maximum = 2;
      },
    ],
    [
      "visible Runner aggregate mismatch",
      (quote) => {
        quote.runnerHandCount = 4;
      },
    ],
  ])("fails closed for %s", (_label, mutate) => {
    const action = damageAction("tag-source", "tag-action");
    const input = aiInput("corp", [action]);
    const quote = completeQuoteSet(action);
    mutate(quote, action);
    input.playerView.corpPunishRouteQuoteSet = quote;

    expect(dtoFor(input.playerView, [action])).not.toHaveProperty(
      "corpPunishRouteQuoteSet",
    );
  });
});

function dtoFor(
  playerView: ReturnType<typeof aiInput>["playerView"],
  legalActions: LegalAction[],
) {
  return buildAiDecisionInputDto({
    side: playerView.side,
    playerView,
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "punish-route-dto-boundary",
    decisionId: `punish-route-dto-boundary:${playerView.side}`,
    actionNumber: 1,
    profileId: "punish-route-dto-boundary",
  }).playerView;
}

function damageAction(source: string, actionId: string): LegalAction {
  return {
    ...legalAction(
      actionId,
      "corp",
      "play_operation",
      actionId,
      { clicks: 1, credits: 2 },
      { source },
    ),
    expiresAtStateVersion: 1,
  };
}

function completeQuoteSet(head: LegalAction): CorpPunishRouteQuoteSet {
  const request: CorpPunishRouteQuoteRequest = {
    schemaVersion: "corp-punish-route-quote-v2",
    matchId: "match:punish-route-dto",
    side: "corp",
    stateVersion: 1,
    timingPoint: "corp_action.main",
    campaignId: "campaign:tag-and-bag",
    routeId: "route:tag-4-2",
    steps: [
      {
        stepId: "tag",
        order: 0,
        kind: "tag",
        sourceCardInstanceId: "tag-source",
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: "tag-definition:tag",
      },
      {
        stepId: "damage-4",
        order: 1,
        kind: "meat_damage",
        sourceCardInstanceId: "damage-source",
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: "damage-definition:damage",
      },
      {
        stepId: "damage-2",
        order: 2,
        kind: "meat_damage",
        sourceCardInstanceId: "damage-source-2",
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: "damage-definition-2:damage",
      },
    ],
  };
  return {
    schemaVersion: "corp-punish-route-quote-v2",
    visibility: "private_to_actor",
    side: "corp",
    stateVersion: 1,
    timingPoint: "corp_action.main",
    complete: true,
    incompleteReasons: [],
    runnerHandCount: 5,
    runnerTags: 0,
    runnerCreditsVisible: 4,
    routes: [
      {
        schemaVersion: "corp-punish-route-quote-v2",
        visibility: "private_to_actor",
        matchId: request.matchId,
        side: "corp",
        routeId: "route:tag-4-2",
        campaignId: "campaign:tag-and-bag",
        campaignIdOrigin: "request_binding",
        stateVersion: 1,
        timingPoint: "corp_action.main",
        requestFingerprint: corpPunishRouteRequestFingerprint(request),
        requestEcho: request,
        complete: true,
        incompleteReasons: [],
        steps: [
          {
            stepId: "tag",
            order: 0,
            kind: "tag",
            sourceCardInstanceId: "tag-source",
            sourceCardDefinitionId: "tag-definition",
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId: "tag-definition:tag",
            clicks: 1,
            credits: 2,
            currentLegalAction: head,
          },
          {
            stepId: "damage-4",
            order: 1,
            kind: "meat_damage",
            sourceCardInstanceId: "damage-source",
            sourceCardDefinitionId: "damage-definition",
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId: "damage-definition:damage",
            clicks: 1,
            credits: 3,
          },
          {
            stepId: "damage-2",
            order: 2,
            kind: "meat_damage",
            sourceCardInstanceId: "damage-source-2",
            sourceCardDefinitionId: "damage-definition-2",
            sourceCapabilityBindingKind: "card_spec_capability_key",
            sourceCapabilityId: "damage-definition-2:damage",
            clicks: 1,
            credits: 0,
          },
        ],
        totalClicks: 3,
        totalActionCredits: 5,
        tagTrigger: {
          kind: "direct_tag_step",
          status: "projected",
          currentRunnerTags: 0,
          requiredRunnerTags: 1,
          sourceStepId: "tag",
        },
        tagOutcomeEnvelope: {
          currentRunnerTags: 0,
          addedTags: { minimum: 1, maximum: 1 },
          projectedRunnerTags: { minimum: 1, maximum: 1 },
        },
        responsePaymentEnvelope: {
          responseKind: "runner_optional",
          paymentKnowledge: "exact_public",
          corpCreditsAvailable: 4,
          runnerCreditsVisible: 4,
          corpResponseCredits: { minimum: 0, maximum: 0 },
          totalCorpCredits: { minimum: 5, maximum: 5 },
          runnerResponseCredits: { minimum: 0, maximum: 2 },
        },
        damageEnvelope: {
          runnerHandCount: 5,
          rawDamage: { meat: 6, net: 0, core: 0, total: 6 },
          effectiveDamage: { minimum: 4, maximum: 6 },
          visiblePrevention: {
            knowledge: "exact_public",
            maximumPreventableDamage: 2,
            creditCost: { minimum: 0, maximum: 2 },
          },
          visiblePiercing: {
            knowledge: "none_visible",
            maximumBypassedDamage: 0,
            creditCost: { minimum: 0, maximum: 0 },
          },
        },
        guarantee: "conditional_on_runner_response",
        responseKnowledge: "public_exact",
      },
    ],
  };
}
