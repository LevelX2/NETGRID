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
  const text = [
    rezzedIce.title,
    rezzedIce.definitionId,
    ...(rezzedIce.subtypes ?? []),
    rezzedIce.rulesText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (breakerCoverageTextMatches(text, ["wall", "barrier"]))
    return "breaker_wall";
  if (/\bcode\s*gate\b/.test(text)) {
    return "breaker_code_gate";
  }
  if (breakerCoverageTextMatches(text, ["sentry"])) return "breaker_sentry";
  if (breakerCoverageTextMatches(text, ["ap"])) return "breaker_ap";
  if (breakerCoverageTextMatches(text, ["trace"])) return "breaker_trace";
  return "breaker_universal";
}

function breakerCoverageTextMatches(
  text: string,
  needles: readonly string[],
): boolean {
  return needles.some((needle) =>
    new RegExp(`\\b${escapeRegExp(needle)}\\b`).test(text),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
