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
  if (text.includes("wall") || text.includes("barrier")) return "breaker_wall";
  if (text.includes("code gate") || text.includes("codegate")) {
    return "breaker_code_gate";
  }
  if (text.includes("sentry")) return "breaker_sentry";
  if (text.includes("ap")) return "breaker_ap";
  if (text.includes("trace")) return "breaker_trace";
  return "breaker_universal";
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
      : /breaker|fracter|decoder|killer/i.test(action.label);
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
