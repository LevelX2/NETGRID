import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { runnerImmediateAgendaPointGain } from "../../actions/runner-agenda-point-effect";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import { isStandardEndTurnCandidate } from "../../plans/plan-early-end-turn";
import type { RunnerTerminalWinSignal } from "./terminal-win-types";

export function runnerImmediateAgendaPointTerminalWinSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerTerminalWinSignal[] {
  return candidates.flatMap((candidate) => {
    const agendaPointAmount = runnerImmediateAgendaPointGain(candidate, input);
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
  const endTurn = input.side === "runner" && input.playerView.opponent.deckCount === 0
    ? input.legalActions.find(
        (action) =>
          actionMatchesCurrentDecision(input, action) &&
          action.type === "end_turn" &&
          action.source === "game_rule" &&
          candidates.some((candidate) =>
            candidate.actionId === action.actionId && isStandardEndTurnCandidate(candidate),
          ),
      )
    : undefined;
  return [
    ...(endTurn
      ? [
          {
            terminalId: "force-corp-empty-rd-draw",
            semanticActionTypes: ["turn_flow.end_turn"],
            actionIds: [endTurn.actionId],
            terminalCondition: "corp_empty_rd_mandatory_draw" as const,
            evidenceCode: "corp_visible_empty_rd_forced_mandatory_draw",
          },
        ]
      : []),
    ...immediateAgendaPointTerminalWins,
  ];
}
