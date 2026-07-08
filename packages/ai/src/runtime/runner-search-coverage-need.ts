import type { AiDecisionInput, PlayerView, VisibleCard } from "@netgrid/shared";
import { cardProvidesBreakerCoverage } from "../plans/tactical-plan-breaker-cards";
import { missingBreakerCoverageKind } from "../plans/tactical-plan-breaker-coverage";
import type { RequiredCapabilityKind } from "../plans/tactical-plan-types";
import {
  assessKnownRezzedIcePath,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import { rolesMatch } from "./role-match";

export type RunnerVisibleSearchCoverageNeed = {
  readonly requiredCoverage: RequiredCapabilityKind;
  readonly serverId: string;
  readonly reason: string;
};

export type RunnerCoverageSearchSaturation = {
  readonly requiredCoverage: RequiredCapabilityKind;
  readonly serverId: string;
  readonly handAnswerDefinitionId?: string;
  readonly handAnswerTitle?: string;
};

type RolesForCardId = (cardId: string | undefined) => readonly string[];

export function runnerVisibleSearchCoverageNeed(
  input: AiDecisionInput,
): RunnerVisibleSearchCoverageNeed | undefined {
  if (input.side !== "runner") return undefined;
  const playerView = input.playerView;
  const servers = playerView.servers ?? [];
  const candidates: Array<{
    readonly serverId: string;
    readonly requiredCoverage: RequiredCapabilityKind;
    readonly priority: number;
  }> = [];
  for (const server of servers) {
    const hasKnownRezzedIce = (server.ice ?? []).some(
      (ice) => ice.known && ice.rezzed === true,
    );
    if (!hasKnownRezzedIce) continue;
    const assessment = assessKnownRezzedIcePath(
      server.ice ?? [],
      playerView.own.rig ?? [],
      runnerRunPathCreditBudgetWithVisiblePools(
        playerView.own.credits,
        playerView.own.rig ?? [],
      ),
      server.root ?? [],
    );
    if (!runnerKnownPathAssessmentIsUnbreakableNoAccess(assessment)) continue;
    const requiredCoverage = missingBreakerCoverageKind(
      playerView as PlayerView,
      server.id,
    );
    if (!searchCoverageKindIsActionable(requiredCoverage)) continue;
    candidates.push({
      serverId: server.id,
      requiredCoverage,
      priority: searchCoverageServerPriority(server),
    });
  }
  candidates.sort(
    (left, right) =>
      right.priority - left.priority ||
      left.serverId.localeCompare(right.serverId, "en"),
  );
  const best = candidates[0];
  if (!best) return undefined;
  return {
    requiredCoverage: best.requiredCoverage,
    serverId: best.serverId,
    reason: `visible_known_rezzed_ice:${best.serverId}`,
  };
}

export function runnerCoverageSearchSaturation(
  input: AiDecisionInput,
  rolesForCardId: RolesForCardId = () => [],
): RunnerCoverageSearchSaturation | undefined {
  const need = runnerVisibleSearchCoverageNeed(input);
  if (!need) return undefined;
  const handAnswer = runnerVisibleHandCoverageAnswer(
    input,
    need.requiredCoverage,
    rolesForCardId,
  );
  if (!handAnswer) return undefined;
  return {
    requiredCoverage: need.requiredCoverage,
    serverId: need.serverId,
    ...(handAnswer.definitionId
      ? { handAnswerDefinitionId: handAnswer.definitionId }
      : {}),
    ...(handAnswer.title ? { handAnswerTitle: handAnswer.title } : {}),
  };
}

export function runnerVisibleHandCoverageAnswer(
  input: AiDecisionInput,
  requiredCoverage: RequiredCapabilityKind | undefined,
  rolesForCardId: RolesForCardId = () => [],
): VisibleCard | undefined {
  if (!requiredCoverage) return undefined;
  return (input.playerView.own.gripOrHq ?? []).find((card) =>
    visibleCardCoversRequiredCoverage(card, requiredCoverage, rolesForCardId),
  );
}

export function visibleCardCoversRequiredCoverage(
  card: VisibleCard,
  requiredCoverage: RequiredCapabilityKind | undefined,
  rolesForCardId: RolesForCardId = () => [],
): boolean {
  if (!requiredCoverage || card.known === false) return false;
  if (cardProvidesBreakerCoverage(card, requiredCoverage)) return true;
  return rolesCoverRequiredCoverage(
    rolesForCardId(card.definitionId),
    requiredCoverage,
  );
}

function searchCoverageKindIsActionable(
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  return requiredCoverage !== "breaker_coverage";
}

function searchCoverageServerPriority(
  server: AiDecisionInput["playerView"]["servers"][number],
): number {
  const root = server.root ?? [];
  const ice = server.ice ?? [];
  let priority = server.id.startsWith("remote_") ? 90 : 40;
  if (server.id === "rd") priority += 20;
  if (server.id === "hq") priority += 12;
  if (server.id === "archives") priority -= 10;
  if (root.length > 0) priority += 35;
  if (
    root.some(
      (card) =>
        (card.advancementCounters ?? 0) > 0 ||
        card.type === "agenda" ||
        card.known === false,
    )
  ) {
    priority += 25;
  }
  priority += ice.filter((card) => card.known && card.rezzed === true).length;
  return priority;
}

function rolesCoverRequiredCoverage(
  roles: readonly string[],
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  switch (requiredCoverage) {
    case "breaker_wall":
      return rolesMatch(roles, ["breaker_wall", "breaker_fracter"]);
    case "breaker_code_gate":
      return rolesMatch(roles, ["breaker_code_gate", "breaker_decoder"]);
    case "breaker_sentry":
      return rolesMatch(roles, ["breaker_sentry", "breaker_killer"]);
    case "breaker_ap":
      return rolesMatch(roles, ["breaker_ap"]);
    case "breaker_trace":
      return rolesMatch(roles, ["breaker_trace"]);
    case "breaker_universal":
      return rolesMatch(roles, ["breaker_universal"]);
    case "breaker_coverage":
      return rolesMatch(roles, [
        "breaker_wall",
        "breaker_fracter",
        "breaker_code_gate",
        "breaker_decoder",
        "breaker_sentry",
        "breaker_killer",
        "breaker_ap",
        "breaker_trace",
        "breaker_universal",
      ]);
    default:
      return false;
  }
}
