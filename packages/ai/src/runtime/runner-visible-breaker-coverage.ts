import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { rolesMatch } from "./role-match";

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
  const breakerTokens = visibleBreakerTextTokens(
    dependencies.visibleCardText(breaker),
  );
  if (
    rolesMatch(roles, ["icebreaker"]) &&
    visibleBreakerTokensIncludeUniversalBreak(breakerTokens)
  ) {
    return true;
  }
  const iceTokens = visibleBreakerTextTokens(dependencies.visibleCardText(ice));
  if (visibleBreakerTokensIncludeAny(iceTokens, ["wall", "barrier"])) {
    return (
      rolesMatch(roles, ["fracter"]) ||
      visibleBreakerTokensIncludeAny(breakerTokens, [
        "fracter",
        "wall",
        "barrier",
      ])
    );
  }
  if (
    visibleBreakerTokensIncludeAny(iceTokens, ["codegate"]) ||
    visibleBreakerTokensIncludePhrase(iceTokens, ["code", "gate"])
  ) {
    return (
      rolesMatch(roles, ["decoder"]) ||
      visibleBreakerTokensIncludeAny(breakerTokens, ["decoder", "codegate"]) ||
      visibleBreakerTokensIncludePhrase(breakerTokens, ["code", "gate"])
    );
  }
  if (visibleBreakerTokensIncludeAny(iceTokens, ["sentry"])) {
    return (
      rolesMatch(roles, ["killer"]) ||
      visibleBreakerTokensIncludeAny(breakerTokens, ["killer", "sentry"])
    );
  }
  return (
    roles.length > 0 &&
    visibleBreakerTokensIncludeAny(breakerTokens, ["break", "breaks"])
  );
}

function visibleBreakerTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function visibleBreakerTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function visibleBreakerTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((word, offset) => tokens[index + offset] === word),
  );
}

function visibleBreakerTokensIncludeUniversalBreak(
  tokens: readonly string[],
): boolean {
  return tokens.some((token, index) => {
    if (token !== "break" && token !== "breaks") return false;
    const nextTokens = tokens.slice(index + 1, index + 5);
    const iceIndex = nextTokens.findIndex((next) => next === "ice");
    return iceIndex >= 0 && nextTokens[iceIndex + 1] === "subroutine";
  });
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
  const subtypes = new Set(
    (card.subtypes ?? []).map((subtype) =>
      subtype.trim().toLocaleLowerCase("en-US"),
    ),
  );
  const roles = new Set<string>();
  if (subtypes.has("fracter")) {
    roles.add("fracter");
  }
  if (subtypes.has("decoder")) {
    roles.add("decoder");
  }
  if (subtypes.has("killer")) {
    roles.add("killer");
  }
  if (subtypes.has("icebreaker") && roles.size === 0) {
    roles.add("icebreaker");
  }
  return [...roles].sort();
}
