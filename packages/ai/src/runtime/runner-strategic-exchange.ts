import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export type RunnerStrategicExchangeKind =
  | "score_progress"
  | "debt_financing"
  | "board_or_hand_sacrifice"
  | "self_tag"
  | "self_damage"
  | "temporary_resource";

export function runnerStrategicExchangeKinds(
  candidate: ActionSemanticCandidate,
): RunnerStrategicExchangeKind[] {
  const risks = new Set(candidate.risks.map((risk) => risk.kind));
  const effects = candidate.functionalEffects ?? [];
  const kinds = new Set<RunnerStrategicExchangeKind>();
  if (
    candidate.costProfile.agendaPointCost !== undefined ||
    effects.some((effect) => effect.target === "agenda_points_given_to_corp")
  ) {
    kinds.add("score_progress");
  }
  if (
    risks.has("credit_swing") ||
    effects.some(
      (effect) =>
        effect.kind === "delayed_penalty" &&
        (effect.target === "risk.debt_loss_condition" ||
          effect.target === "risk.lose_game_debt"),
    )
  ) {
    kinds.add("debt_financing");
  }
  if (
    risks.has("grip_trash") ||
    risks.has("board_tradeoff") ||
    effects.some(
      (effect) =>
        effect.target === "trash_grip_as_search_cost" ||
        effect.target === "installed_card_trash_cost",
    )
  ) {
    kinds.add("board_or_hand_sacrifice");
  }
  if (
    candidate.costProfile.selfTag !== undefined ||
    risks.has("tag_self") ||
    risks.has("tag_window")
  ) {
    kinds.add("self_tag");
  }
  if (
    (candidate.costProfile.selfDamage?.length ?? 0) > 0 ||
    risks.has("damage_window") ||
    risks.has("brain_damage")
  ) {
    kinds.add("self_damage");
  }
  if (
    risks.has("temporary_install") ||
    risks.has("self_trash") ||
    effects.some(
      (effect) =>
        effect.target === "temporary_program_loss" ||
        effect.target === "end_of_turn_bounce" ||
        effect.target === "run_end_self_trash",
    )
  ) {
    kinds.add("temporary_resource");
  }
  return [...kinds].sort();
}

export function runnerStrategicExchangeHardExclusion(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  const kinds = runnerStrategicExchangeKinds(candidate);
  if (kinds.length === 0) return undefined;
  const transfersAgendaPointsToCorp = (candidate.functionalEffects ?? []).some(
    (effect) => effect.target === "agenda_points_given_to_corp",
  );
  if (
    transfersAgendaPointsToCorp &&
    input.playerView.opponent.agendaPoints >= input.playerView.agendaPointsToWin - 1
  ) {
    return "runner_strategic_exchange_opponent_terminal_score";
  }
  return undefined;
}
