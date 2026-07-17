import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import { actionCreditCost } from "./action-cost";
import { runnerExposeInstalledOpportunity } from "./runner-expose-installed-card-choice";

export function runnerTerminalRemoteToolScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    !candidate ||
    input.playerView.own.clicks < 2
  ) {
    return undefined;
  }

  const corpAtMatchpoint =
    input.playerView.opponent.agendaPoints >=
    input.playerView.agendaPointsToWin - 1;

  const signals = new Set([
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
  ]);
  const exposeOpportunity = runnerExposeInstalledOpportunity(input);
  const remoteContexts = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .map((server) => ({
      server,
      hiddenRootCount: exposeOpportunity.unseenPositions.filter(
        (position) =>
          position.serverId === server.id && position.area === "root",
      ).length,
      advancedHiddenRootCount: exposeOpportunity.unseenPositions.filter(
        (position) =>
          position.serverId === server.id &&
          position.area === "root" &&
          position.advanced,
      ).length,
      visibleRezzedIceCount: server.ice.filter(
        (card) => card.known && card.definitionId && card.rezzed === true,
      ).length,
    }));
  const exposeInfo = [...signals].some(
    (signal) =>
      signal === "effect:expose_info" ||
      signal.includes("expose_installed_card") ||
      signal.includes("expose_info"),
  );
  if (exposeInfo) {
    const installPreparation = action.type === "install_card";
    if (
      installPreparation &&
      (input.playerView.own.clicks < 3 ||
        input.playerView.own.credits < actionCreditCost(action) + 1)
    ) {
      return undefined;
    }
    if (
      exposeOpportunity.positions.length > 0 &&
      exposeOpportunity.unseenPositions.length === 0
    ) {
      return {
        key: "runner_expose_no_unseen_target",
        label: "Keine neue Expose-Information",
        value: -3_200,
        reason: `exactly_exposed_positions:${exposeOpportunity.positions.length}`,
      };
    }
    const possibleMatchpointRemotes = remoteContexts.filter(
      (context) => context.hiddenRootCount > 0,
    );
    const advancedHiddenRootCount = possibleMatchpointRemotes.reduce(
      (sum, context) => sum + context.advancedHiddenRootCount,
      0,
    );
    if (corpAtMatchpoint && possibleMatchpointRemotes.length > 0) {
      return {
        key: "runner_terminal_remote_tool",
        label: "Matchpoint-Remote aufklären",
        value: advancedHiddenRootCount > 0 ? 2_150 : 1_800,
        reason: [
          "terminal_remote_tool:expose_info",
          `terminal_tool_step:${
            installPreparation ? "install_then_activate" : "execute"
          }`,
          `corp_agenda_points:${input.playerView.opponent.agendaPoints}`,
          `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
          `possible_matchpoint_remotes:${possibleMatchpointRemotes.length}`,
          `advanced_hidden_roots:${advancedHiddenRootCount}`,
        ].join("|"),
      };
    }

    const damageThreat = runnerDamageThreatAssessment(input);
    if (
      !["confirmed", "critical"].includes(damageThreat.level) ||
      damageThreat.handCount < damageThreat.recommendedHandFloor
    ) {
      return undefined;
    }
    const unseenDamageRemotePositions =
      exposeOpportunity.unseenPositions.filter((position) =>
        position.serverId.startsWith("remote_"),
      );
    if (unseenDamageRemotePositions.length === 0) return undefined;
    const unseenDamageRemoteRoots = unseenDamageRemotePositions.filter(
      (position) => position.area === "root",
    );
    const unseenDamageRemoteIce = unseenDamageRemotePositions.filter(
      (position) => position.area === "ice",
    );
    const advancedDamageRoots = unseenDamageRemoteRoots.filter(
      (position) => position.advanced,
    );
    const damageThreatBase = damageThreat.level === "critical" ? 1_250 : 1_000;
    const targetRelevance =
      advancedDamageRoots.length > 0
        ? 300
        : unseenDamageRemoteRoots.length > 0
          ? 100
          : 0;
    return {
      key: "runner_damage_intelligence_tool",
      label: "Damage-Remote aufklären",
      value: damageThreatBase + targetRelevance,
      reason: [
        "damage_intelligence_tool:expose_info",
        `terminal_tool_step:${
          installPreparation ? "install_then_activate" : "execute"
        }`,
        `damage_threat_level:${damageThreat.level}`,
        `damage_visible_score:${damageThreat.visiblePunishSignalScore}`,
        `damage_hand:${damageThreat.handCount}`,
        `damage_hand_floor:${damageThreat.recommendedHandFloor}`,
        `unseen_remote_roots:${unseenDamageRemoteRoots.length}`,
        `unseen_remote_ice:${unseenDamageRemoteIce.length}`,
        `advanced_hidden_roots:${advancedDamageRoots.length}`,
      ].join("|"),
    };
  }

  if (!corpAtMatchpoint) return undefined;

  const possibleMatchpointRemotes = remoteContexts.filter(
    (context) => context.hiddenRootCount > 0,
  );
  if (possibleMatchpointRemotes.length === 0) return undefined;

  const iceDisruption = [...signals].some(
    (signal) =>
      signal === "effect:ice_trash" ||
      signal.includes("rez_or_trash_choice") ||
      signal.includes("ice_trash"),
  );
  const urgentWithConcreteIce = possibleMatchpointRemotes.filter(
    (context) =>
      context.advancedHiddenRootCount > 0 && context.visibleRezzedIceCount > 0,
  );
  if (!iceDisruption || urgentWithConcreteIce.length === 0) return undefined;

  return {
    key: "runner_terminal_remote_tool",
    label: "Matchpoint-Pfad öffnen",
    value: 2_200,
    reason: [
      "terminal_remote_tool:ice_disruption",
      `corp_agenda_points:${input.playerView.opponent.agendaPoints}`,
      `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
      `urgent_remote_count:${urgentWithConcreteIce.length}`,
      `visible_rezzed_target_count:${urgentWithConcreteIce.reduce(
        (sum, context) => sum + context.visibleRezzedIceCount,
        0,
      )}`,
    ].join("|"),
  };
}
