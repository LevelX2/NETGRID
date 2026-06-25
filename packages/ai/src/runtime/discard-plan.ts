import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { sortedUnique } from "./collection";

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
  return discardStrongestDoctrinePlan(input);
}

export function discardEvidenceForInput(
  input: AiDecisionInput,
  plan: string | undefined,
): string[] {
  const evidence = ["discard_score:base"];
  if (plan) evidence.push("discard_score:planfit", `discard_keep:${plan}`);
  const tags = input.ownDeckDoctrine?.archetypeTags ?? [];
  if (tags.length > 0) {
    evidence.push("discard_score:doctrinefit");
    for (const tag of tags.slice(0, 3))
      evidence.push(`discard_keep:doctrine_${tag}`);
  }
  return sortedUnique(evidence);
}

function discardStrongestDoctrinePlan(
  input: AiDecisionInput,
): string | undefined {
  return Object.entries(input.ownDeckDoctrine?.planWeights ?? {})
    .filter(([, weight]) => weight > 0)
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )[0]?.[0];
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
