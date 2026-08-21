import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  type AiDecisionInput,
  type AiDecisionScoreComponent,
} from "@netgrid/shared";

import { mergedPublicHistory } from "./public-event-history";

export type RunnerHqSaturationAssessment = {
  applies: boolean;
  agendaFreeAccesses: number;
  repeatedDefinitionAccesses: number;
  hqIceCount: number;
  otherServerIceCount: number;
  penalty: number;
  evidence: string[];
};

export function runnerHqSaturationAssessment(
  input: AiDecisionInput,
): RunnerHqSaturationAssessment {
  const hqIceCount =
    input.playerView.servers.find((server) => server.id === "hq")?.ice.length ??
    0;
  const otherServerIceCount = input.playerView.servers
    .filter((server) => server.id !== "hq")
    .reduce((sum, server) => sum + server.ice.length, 0);
  const accessedDefinitions = mergedPublicHistory(input).flatMap((event) => {
    const payload = event.publicPayload;
    const serverLabel = String(payload.serverLabel ?? "").toLowerCase();
    const serverId = String(payload.serverId ?? "").toLowerCase();
    const cardDefinitionId =
      typeof payload.cardDefinitionId === "string"
        ? payload.cardDefinitionId
        : undefined;
    if (
      payload.actor !== "runner" ||
      payload.actionType !== "access_card" ||
      (serverId !== "hq" && serverLabel !== "hq") ||
      !cardDefinitionId ||
      CARD_DEFINITIONS_BY_ID[cardDefinitionId]?.type === "agenda"
    ) {
      return [];
    }
    return [cardDefinitionId];
  });
  const accessCounts = new Map<string, number>();
  for (const definitionId of accessedDefinitions) {
    accessCounts.set(definitionId, (accessCounts.get(definitionId) ?? 0) + 1);
  }
  const repeatedDefinitionAccesses = [...accessCounts.values()].reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0,
  );
  const agendaFreeAccesses = accessedDefinitions.length;
  const agendaPointsNeeded = Math.max(
    0,
    input.playerView.agendaPointsToWin - input.playerView.own.agendaPoints,
  );
  const applies =
    hqIceCount === 0 &&
    otherServerIceCount >= 2 &&
    agendaFreeAccesses >= 3 &&
    agendaPointsNeeded > 2;
  const penalty = applies
    ? Math.min(
        1000,
        900 +
          Math.max(0, agendaFreeAccesses - 3) * 350 +
          repeatedDefinitionAccesses * 250 +
          Math.min(700, Math.max(0, otherServerIceCount - 2) * 200),
      )
    : 0;
  return {
    applies,
    agendaFreeAccesses,
    repeatedDefinitionAccesses,
    hqIceCount,
    otherServerIceCount,
    penalty,
    evidence: [
      `hq_agenda_free_accesses:${agendaFreeAccesses}`,
      `hq_repeated_definition_accesses:${repeatedDefinitionAccesses}`,
      `hq_ice_count:${hqIceCount}`,
      `other_server_ice_count:${otherServerIceCount}`,
      `runner_agenda_points_needed:${agendaPointsNeeded}`,
      `corp_hq_defense_neglect:${hqIceCount === 0 && otherServerIceCount >= 2}`,
      "hq_saturation_uses_runner_visible_history:true",
    ],
  };
}

export function runnerHqSaturationScoreComponent(
  input: AiDecisionInput,
): AiDecisionScoreComponent | undefined {
  const assessment = runnerHqSaturationAssessment(input);
  if (!assessment.applies) return undefined;
  return {
    key: "runner_hq_defense_neglect_saturation",
    label: "HQ-Druck gesättigt",
    value: -assessment.penalty,
    reason: assessment.evidence.join("|"),
  };
}
