import { createAiHintsByCard } from "../ai-hints";
import { cardRolesForId } from "../runtime/card-role-lookup";
import { isRunnerPressureRole } from "../runtime/runner-role-classification";
import type { CentralServerId } from "../runtime/server-target";
import { sortedUnique } from "../runtime/collection";
import type { AiDecisionInput } from "@netgrid/shared";
import { definitionTypeForMetrics } from "./card-metric-lookup";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

const CENTRAL_PRESSURE_AI_HINTS = createAiHintsByCard();

export function isCentralPressureCardForMetrics(
  definitionId: string | undefined,
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
  definitionId: string | undefined,
): CentralServerId[] {
  if (!definitionId) return [];
  const roles = centralPressureRolesForCard(definitionId);
  const targets: CentralServerId[] = [];
  if (
    definitionId === "onr_v1_139_r-and-d-interface" ||
    roles.includes("pressure_rnd") ||
    roles.includes("rnd_pressure")
  )
    targets.push("rd");
  if (
    definitionId === "onr_v1_129_hq-interface" ||
    roles.includes("pressure_hq") ||
    roles.includes("hq_pressure")
  )
    targets.push("hq");
  if (roles.includes("archives_pressure")) targets.push("archives");
  if (
    targets.length === 0 &&
    roles.some((role) => role.includes("multiaccess")) &&
    [
      "onr_v1_024_expert-schedule-analyzer",
      "onr_v1_041_microtech-ai-interface",
      "onr_v1_105_priority-wreck",
    ].includes(definitionId)
  )
    targets.push("rd", "hq");
  return sortedUnique(targets) as CentralServerId[];
}

function centralPressureRolesForCard(definitionId: string): string[] {
  return cardRolesForId(definitionId, CENTRAL_PRESSURE_AI_HINTS);
}

export function centralPressureTargetIsGoodForMetrics(
  input: AiDecisionInput,
  target: CentralServerId,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === target,
  );
  if (!server) return false;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  if (assessment.blocked) return false;
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
