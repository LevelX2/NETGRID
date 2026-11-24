import { AI_HINTS_BY_CARD } from "../ai-hints";
import { cardRolesForId } from "../runtime/card-role-lookup";
import { rolesMatch } from "../role-match";
import { isRunnerPressureRole } from "../runtime/runner-role-classification";
import type { CentralServerId } from "../runtime/server-target";
import { sortedUnique } from "../runtime/collection";
import type { AiDecisionInput } from "@netgrid/shared";
import { definitionTypeForMetrics } from "./card-metric-lookup";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { quoteVisibleRunnerPathForMetrics } from "./visible-run-path-for-metrics";

export function isCentralPressureCardForMetrics(
  definitionId: number | undefined,
  installedOnly: boolean,
): boolean {
  if (!definitionId) return false;
  const roles = centralPressureRolesForCard(definitionId);
  if (!roles.some(isRunnerPressureRole)) return false;
  if (!installedOnly) return true;
  const type = definitionTypeForMetrics(definitionId);
  return type === "hardware" || type === "program" || type === "resource";
}

export function centralPressureTargetsForCard(
  definitionId: number | undefined,
): CentralServerId[] {
  if (!definitionId) return [];
  const roles = centralPressureRolesForCard(definitionId);
  const targets: CentralServerId[] = [];
  if (
    definitionId === 351 ||
    rolesMatch(roles, ["pressure_rnd", "rnd_pressure"])
  )
    targets.push("rd");
  if (
    definitionId === 341 ||
    rolesMatch(roles, ["pressure_hq", "hq_pressure"])
  )
    targets.push("hq");
  if (rolesMatch(roles, ["archives_pressure"])) targets.push("archives");
  if (
    targets.length === 0 &&
    rolesMatch(roles, ["multiaccess"]) &&
    [
      236,
      253,
      317,
    ].includes(definitionId)
  )
    targets.push("rd", "hq");
  return sortedUnique(targets) as CentralServerId[];
}

function centralPressureRolesForCard(definitionId: number): string[] {
  return cardRolesForId(definitionId, AI_HINTS_BY_CARD);
}

export function centralPressureTargetIsGoodForMetrics(
  input: AiDecisionInput,
  target: CentralServerId,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  if (
    !server ||
    (target === "hq" && input.playerView.opponent.handCount === 0) ||
    (target === "rd" && input.playerView.opponent.deckCount === 0)
  )
    return false;
  const assessment = quoteVisibleRunnerPathForMetrics(
    input,
    server,
    assessKnownRezzedIcePath,
  );
  if (!assessment.canReachAccess) return false;
  const cheap =
    (assessment.visibleBreakCost ?? 0) <= 1 || server.ice.length === 0;
  if (!cheap) return false;
  if (target === "archives")
    return server.root.some((card) => card.known && card.type === "agenda");
  if (
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints <=
    2
  )
    return true;
  if (target === "hq") return input.playerView.opponent.handCount >= 3;
  return true;
}
