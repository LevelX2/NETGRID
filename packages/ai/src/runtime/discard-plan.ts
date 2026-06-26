import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { sortedUnique } from "./collection";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

export type DiscardPlanDependencies = {
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly definitionTypeForCardId: (cardId: string | undefined) => string | undefined;
};

export function discardCurrentPlanKind(
  input: AiDecisionInput,
  dependencies: DiscardPlanDependencies,
): string | undefined {
  const hand = input.playerView.own.gripOrHq;
  if (input.side === "runner") {
    if (input.playerView.own.credits < 4) return "recover_economy";
    const hasInstalledBreaker = (input.playerView.own.rig ?? []).some((card) =>
      dependencies
        .rolesForCardId(card.definitionId)
        .some((role) => role.startsWith("breaker_")),
    );
    if (
      !hasInstalledBreaker &&
      hand.some((card) =>
        dependencies.rolesForCardId(card.definitionId).some(
          (role) =>
            role.startsWith("breaker_") ||
            role === "memory" ||
            role === "setup",
        ),
      )
    )
      return "build_rig";
  } else {
    const hasAgenda = hand.some(
      (card) => visibleCardType(card, dependencies) === "agenda",
    );
    const hasRemoteSupport = hand.some((card) => {
      const roles = dependencies.rolesForCardId(card.definitionId);
      const type = visibleCardType(card, dependencies);
      return (
        type === "ice" ||
        roles.some(
          (role) =>
            role.includes("remote") ||
            role.includes("ice") ||
            role.includes("economy"),
        )
      );
    });
    if (hasAgenda && hasRemoteSupport) return "score_next_turn";
    if (input.playerView.own.credits < 5) return "recover_economy";
  }
  return discardStrategicPlanKind(input);
}

export function discardEvidenceForInput(
  input: AiDecisionInput,
  plan: string | undefined,
): string[] {
  const evidence = ["discard_score:base"];
  if (plan) evidence.push("discard_score:planfit", `discard_keep:${plan}`);
  const strategicIntent = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (strategicIntent && strategicIntent.primaryStrategy.family !== "neutral") {
    evidence.push(
      "discard_score:strategic_intent_fit",
      `discard_keep:strategy_${strategicIntent.primaryStrategy.strategyId}`,
      `discard_keep:phase_${strategicIntent.phase}`,
    );
  }
  return sortedUnique(evidence);
}

function discardStrategicPlanKind(
  input: AiDecisionInput,
): string | undefined {
  const strategicIntent = (input as AiDecisionInputWithDeckCapabilities)
    .ownStrategicIntentState;
  if (!strategicIntent || strategicIntent.primaryStrategy.family === "neutral") {
    return undefined;
  }
  switch (strategicIntent.primaryStrategy.family) {
    case "runner_setup":
      return "build_rig";
    case "runner_central_pressure":
      return strategicIntent.targetVector.targetId === "hq"
        ? "pressure_hq"
        : "pressure_rnd";
    case "runner_remote_contest":
    case "runner_remote_trash":
      return "contest_remote";
    case "runner_survival":
      return "draw_for_answers";
    case "runner_tempo":
      return "safe_probe_run";
    case "corp_scoreline":
    case "corp_fast_advance":
      return "score_next_turn";
    case "corp_ice_tax":
    case "corp_central_defense":
      return "protect_hq";
    case "corp_asset_economy":
      return "bait_runner";
    case "corp_economy_reserve":
      return "recover_economy";
    default:
      return undefined;
  }
}

function visibleCardType(
  card: VisibleCard,
  dependencies: DiscardPlanDependencies,
): string | undefined {
  return (
    card.type ??
    (card.definitionId
      ? dependencies.definitionTypeForCardId(card.definitionId)
      : undefined)
  );
}
