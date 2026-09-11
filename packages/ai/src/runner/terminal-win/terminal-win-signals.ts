import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { runnerImmediateAgendaPointGain } from "../../actions/runner-agenda-point-effect";
import type { RunnerTerminalWinSignal } from "./terminal-win-types";

export function runnerImmediateAgendaPointTerminalWinSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerTerminalWinSignal[] {
  return candidates.flatMap((candidate) => {
    const agendaPointAmount = runnerImmediateAgendaPointGain(candidate);
    if (
      agendaPointAmount === undefined ||
      input.playerView.own.agendaPoints + agendaPointAmount <
        input.playerView.agendaPointsToWin
    ) {
      return [];
    }
    return [
      {
        terminalId: `immediate-agenda-point:${candidate.actionId}`,
        semanticActionTypes: [candidate.semanticActionType],
        actionIds: [candidate.actionId],
        terminalCondition: "runner_immediate_agenda_point" as const,
        evidenceCode: "runner_legal_immediate_agenda_point_closeout",
      },
    ];
  });
}

export function runnerTerminalWinSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  immediateAgendaPointTerminalWins: readonly RunnerTerminalWinSignal[],
): RunnerTerminalWinSignal[] {
  return [
    ...(input.playerView.opponent.deckCount === 0 &&
    candidates.some((candidate) => candidate.actionType === "end_turn")
      ? [
          {
            terminalId: "force-corp-empty-rd-draw",
            semanticActionTypes: ["turn_flow.end_turn"],
            terminalCondition: "corp_empty_rd_mandatory_draw" as const,
            evidenceCode: "corp_visible_empty_rd_forced_mandatory_draw",
          },
        ]
      : []),
    ...immediateAgendaPointTerminalWins,
  ];
}
