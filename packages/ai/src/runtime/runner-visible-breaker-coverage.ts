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
