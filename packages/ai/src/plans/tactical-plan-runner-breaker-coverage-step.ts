import { createPlanStep } from "./tactical-plan-builders";
import {
  isBreakerInstallAction,
  missingBreakerCoverageKind,
  runnerHandBreakerForCoverage,
} from "./tactical-plan-breaker-coverage";
import { breakerCoverageCapability } from "./tactical-plan-deck-coverage";
import {
  bestDeckBreakerForRequiredCoverage,
  deckCapabilityHasDeckSnapshot,
  deckCoverageStateForRequiredCoverage,
} from "./tactical-plan-deck-coverage";
import { bestLegalCoverageAnswerRole } from "./tactical-plan-legal-coverage-answers";
import type {
  PlanStep,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function runnerBreakerCoverageStep(
  context: TacticalPlanBuildContext,
  serverId: string,
): PlanStep {
  const input = context.input;
  const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
  const deckState = deckCoverageStateForRequiredCoverage(context, missingCoverage);
  const deckInventoryEntry = bestDeckBreakerForRequiredCoverage(
    context,
    missingCoverage,
  );
  const memoryAvailable =
    context.deckCapabilities?.runner?.memoryProfile.memoryAvailable ??
    (input.playerView.own.memoryUsed !== undefined &&
    input.playerView.own.memoryLimit !== undefined
      ? Math.max(0, input.playerView.own.memoryLimit - input.playerView.own.memoryUsed)
      : undefined);
  const matchingHandBreaker = runnerHandBreakerForCoverage(
    input.playerView,
    missingCoverage,
  );
  if (deckState?.installed) {
    return createPlanStep({
      stepId: `run_target:${serverId}`,
      kind: "run_target",
      desiredActionSemantics: ["run.start"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability reports installed ${missingCoverage} coverage; retry the target plan`,
      ],
    });
  }
  if (input.legalActions.some(isBreakerInstallAction(input.playerView, missingCoverage))) {
    return createPlanStep({
      stepId: `install_breaker:${serverId}`,
      kind: "install_breaker",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `visible install action can add ${missingCoverage} coverage`,
      ],
    });
  }
  if (
    deckState?.inHand &&
    memoryAvailable !== undefined &&
    memoryAvailable <= 0
  ) {
    return createPlanStep({
      stepId: `resolve_missing_mu:${serverId}`,
      kind: "resolve_missing_mu",
      desiredActionSemantics: ["install.card", "memory"],
      requiredCapabilities: [
        breakerCoverageCapability(missingCoverage, serverId),
        {
          capabilityId: `mu:${serverId}`,
          kind: "mu",
          side: "runner",
          target: { kind: "capability", id: "memory" },
          evidence: [`memory_available:${memoryAvailable}`],
        },
      ],
      rationale: [
        `matching ${missingCoverage} breaker is in hand but MU is blocked`,
        "deck_capability:breaker_present_but_mu_blocked",
      ],
    });
  }
  if (
    (matchingHandBreaker || deckState?.inHand) &&
    input.legalActions.some((action) => action.type === "gain_credit")
  ) {
    const installCost = deckInventoryEntry?.installCost ?? matchingHandBreaker?.installCost;
    return createPlanStep({
      stepId: `gain_credits:${serverId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        installCost !== undefined && installCost > input.playerView.own.credits
          ? `matching ${missingCoverage} breaker is already in hand; needs ${installCost} credits before install`
          : `matching ${missingCoverage} breaker is already in hand; credits are needed before install`,
        matchingHandBreaker
          ? `hand_breaker:${matchingHandBreaker.definitionId ?? matchingHandBreaker.title ?? "unknown"}`
          : "deck_capability:breaker_in_hand",
      ],
    });
  }
  if (deckState?.searchableNow) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "setup.program_search",
        "breaker_search",
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has ${missingCoverage} coverage and legal search access`,
      ],
    });
  }
  if (deckState?.inDeckKnown) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: ["draw.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has ${missingCoverage} coverage but no legal search access`,
        "deck_capability:draw_only",
      ],
    });
  }
  if (deckState?.missing && deckCapabilityHasDeckSnapshot(context)) {
    return createPlanStep({
      stepId: `pivot_to_alternative:${serverId}`,
      kind: "pivot_to_alternative",
      desiredActionSemantics: [],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has no ${missingCoverage} coverage; do not blind-search`,
        "deck_capability:coverage_not_in_deck",
      ],
    });
  }
  const legalAnswerRole = bestLegalCoverageAnswerRole(input, missingCoverage);
  if (legalAnswerRole === "direct_breaker_install") {
    return createPlanStep({
      stepId: `install_breaker:${serverId}`,
      kind: "install_breaker",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `legal breaker install can cover ${missingCoverage}`,
        "coverage_answer_role:direct_breaker_install",
      ],
    });
  }
  if (
    legalAnswerRole === "program_search" ||
    legalAnswerRole === "recovery_answer"
  ) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `legal search or recovery action can find ${missingCoverage} coverage`,
        `coverage_answer_role:${legalAnswerRole}`,
      ],
    });
  }
  if (legalAnswerRole === "search_engine_setup") {
    return createPlanStep({
      stepId: `setup_search_engine:${serverId}`,
      kind: "setup_search_engine",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `legal search engine setup can prepare ${missingCoverage} coverage`,
        "coverage_answer_role:search_engine_setup",
      ],
    });
  }
  if (
    legalAnswerRole === "draw_for_answer" ||
    legalAnswerRole === "basic_draw_fallback"
  ) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: [
        "play.runner_event",
        "card_ability.trigger",
        "card_ability.unknown",
        "draw.card",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        legalAnswerRole === "draw_for_answer"
          ? `legal draw action can dig for ${missingCoverage} coverage`
          : `basic draw is the fallback path toward ${missingCoverage} coverage`,
        `coverage_answer_role:${legalAnswerRole}`,
      ],
    });
  }
  return createPlanStep({
    stepId: `gain_credits:${serverId}`,
    kind: "gain_credits",
    desiredActionSemantics: ["economy.gain_credit"],
    requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
    rationale: [
      `no ${missingCoverage} answer action is visible; credits preserve future options`,
    ],
  });
}
