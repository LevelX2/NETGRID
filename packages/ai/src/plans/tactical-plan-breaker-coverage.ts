import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { cardProvidesBreakerCoverage } from "./tactical-plan-breaker-cards";
import { coverageKindForAssessment } from "./tactical-plan-coverage-kinds";
import type { RequiredCapabilityKind } from "./tactical-plan-types";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";

export function missingBreakerCoverageKind(
  playerView: PlayerView,
  serverId: string,
): RequiredCapabilityKind {
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return "breaker_coverage";
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    playerView.own.rig ?? [],
    playerView.own.credits,
    server.root,
  );
  const preciseMissingCoverage = coverageKindForAssessment(assessment);
  if (preciseMissingCoverage) return preciseMissingCoverage;
  const blockedIceIndex =
    assessment.unbreakableIceIndex ?? assessment.unpayableIceIndex;
  const blockedIce =
    blockedIceIndex !== undefined ? server.ice[blockedIceIndex] : undefined;
  const rezzedIce =
    blockedIce?.known && blockedIce.rezzed === true
      ? blockedIce
      : server.ice.find((ice) => ice.known && ice.rezzed === true);
  if (!rezzedIce) return "breaker_coverage";
  const tokens = visibleCardCoverageTokens(rezzedIce);
  if (coverageTokensInclude(tokens, ["wall", "barrier"])) return "breaker_wall";
  if (
    coverageTokensInclude(tokens, ["codegate"]) ||
    coverageTokensIncludePhrase(tokens, ["code", "gate"])
  ) {
    return "breaker_code_gate";
  }
  if (coverageTokensInclude(tokens, ["sentry"])) return "breaker_sentry";
  if (coverageTokensInclude(tokens, ["ap"])) return "breaker_ap";
  if (coverageTokensInclude(tokens, ["trace"])) return "breaker_trace";
  return "breaker_universal";
}

function visibleCardCoverageTokens(card: VisibleCard): string[] {
  return [
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
  ]
    .flatMap((entry) => coverageTokens(entry))
    .filter((token) => token.length > 0);
}

function coverageTokens(value: string | undefined): string[] {
  return (value ?? "")
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function coverageTokensInclude(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function coverageTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((word, offset) => tokens[index + offset] === word),
  );
}

export function isBreakerInstallAction(
  playerView: PlayerView,
  requiredCoverage: RequiredCapabilityKind = "breaker_coverage",
) {
  return (action: LegalAction): boolean => {
    if (action.type !== "install_card") return false;
    const sourceCard = visibleCardByInstanceId(
      playerView,
      String(action.source),
    );
    return sourceCard
      ? cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
      : false;
  };
}

export function runnerHandBreakerForCoverage(
  playerView: PlayerView,
  requiredCoverage: RequiredCapabilityKind,
): VisibleCard | undefined {
  return playerView.own.gripOrHq.find(
    (card) => card.known && cardProvidesBreakerCoverage(card, requiredCoverage),
  );
}
