import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export function runnerTerminalRemoteToolScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    !candidate ||
    input.playerView.own.clicks < 2 ||
    input.playerView.opponent.agendaPoints <
      input.playerView.agendaPointsToWin - 1
  ) {
    return undefined;
  }

  const signals = new Set([
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
  ]);
  const remoteContexts = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .map((server) => ({
      server,
      hiddenRootCount: server.root.filter(
        (card) => !card.known || !card.definitionId,
      ).length,
      advancedHiddenRootCount: server.root.filter(
        (card) =>
          (!card.known || !card.definitionId) &&
          (card.advancementCounters ?? 0) > 0,
      ).length,
      visibleRezzedIceCount: server.ice.filter(
        (card) => card.known && card.definitionId && card.rezzed === true,
      ).length,
    }));
  const possibleMatchpointRemotes = remoteContexts.filter(
    (context) => context.hiddenRootCount > 0,
  );
  if (possibleMatchpointRemotes.length === 0) return undefined;

  const exposeInfo = [...signals].some(
    (signal) =>
      signal === "effect:expose_info" ||
      signal.includes("expose_installed_card") ||
      signal.includes("expose_info"),
  );
  if (exposeInfo) {
    const advancedHiddenRootCount = possibleMatchpointRemotes.reduce(
      (sum, context) => sum + context.advancedHiddenRootCount,
      0,
    );
    return {
      key: "runner_terminal_remote_tool",
      label: "Matchpoint-Remote aufklären",
      value: advancedHiddenRootCount > 0 ? 2_150 : 1_800,
      reason: [
        "terminal_remote_tool:expose_info",
        `corp_agenda_points:${input.playerView.opponent.agendaPoints}`,
        `agenda_points_to_win:${input.playerView.agendaPointsToWin}`,
        `possible_matchpoint_remotes:${possibleMatchpointRemotes.length}`,
        `advanced_hidden_roots:${advancedHiddenRootCount}`,
      ].join("|"),
    };
  }

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
