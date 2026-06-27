import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

type KnownPathAssessment = {
  assessedKnownIceCount: number;
  canReachAccess: boolean;
};

type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

export type RunnerVisibleBreakerNeedDependencies = {
  isVisibleIcebreakerProgram: (card: VisibleCard) => boolean;
  knownPathAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
  ) => KnownPathAssessment;
  breakerCanAddressIce: (breaker: VisibleCard, ice: VisibleCard) => boolean;
};

export function runnerCardAddressesVisibleBreakerNeed(
  input: AiDecisionInput,
  card: VisibleCard,
  dependencies: RunnerVisibleBreakerNeedDependencies,
): boolean {
  if (
    input.side !== "runner" ||
    !dependencies.isVisibleIcebreakerProgram(card)
  ) {
    return false;
  }
  return input.playerView.servers.some((server) => {
    const assessment = dependencies.knownPathAssessment(input, server);
    if (assessment.assessedKnownIceCount <= 0 || assessment.canReachAccess) {
      return false;
    }
    return server.ice.some(
      (ice) =>
        ice.known &&
        ice.rezzed === true &&
        dependencies.breakerCanAddressIce(card, ice),
    );
  });
}

export type VisibleBreakerCardCanAddressIceDependencies = {
  visibleBreakerRoles: (card: VisibleCard) => readonly string[];
  visibleCardText: (card: VisibleCard) => string;
};

export function visibleBreakerCardCanAddressIce(
  breaker: VisibleCard,
  ice: VisibleCard,
  dependencies: VisibleBreakerCardCanAddressIceDependencies,
): boolean {
  const roles = dependencies.visibleBreakerRoles(breaker);
  const breakerText = dependencies.visibleCardText(breaker).toLowerCase();
  if (
    roles.includes("icebreaker") &&
    /break (?:an? |one |\d+ )?ice subroutine|breaks? .*subroutine/.test(
      breakerText,
    )
  ) {
    return true;
  }
  const iceText = dependencies.visibleCardText(ice).toLowerCase();
  if (/wall|barrier/.test(iceText)) {
    return (
      roles.includes("fracter") || /fracter|wall|barrier/.test(breakerText)
    );
  }
  if (/code gate|codegate/.test(iceText)) {
    return (
      roles.includes("decoder") ||
      /decoder|code gate|codegate/.test(breakerText)
    );
  }
  if (/sentry/.test(iceText)) {
    return roles.includes("killer") || /killer|sentry/.test(breakerText);
  }
  return roles.length > 0 && /break/.test(breakerText);
}

export function visibleBreakerRoleCounts(
  cards: readonly VisibleCard[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const role of visibleBreakerRoles(card)) {
      counts.set(role, (counts.get(role) ?? 0) + 1);
    }
  }
  return counts;
}

export function visibleBreakerRoles(card: VisibleCard): string[] {
  const subtypes = (card.subtypes ?? []).map((subtype) =>
    subtype.toLowerCase(),
  );
  const roles = new Set<string>();
  if (subtypes.includes("fracter")) {
    roles.add("fracter");
  }
  if (subtypes.includes("decoder")) {
    roles.add("decoder");
  }
  if (subtypes.includes("killer")) {
    roles.add("killer");
  }
  if (subtypes.includes("icebreaker") && roles.size === 0) {
    roles.add("icebreaker");
  }
  return [...roles].sort();
}
