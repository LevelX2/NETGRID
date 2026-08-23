import {
  RUNNER_AGENDA_POINT_TRANSFER_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
} from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { AiHintStrategicExchangeKind } from "../hint-ontology";
import { runnerDebtFinancingProfile } from "./runner-canonical-card-facts";

export type RunnerStrategicExchangeKind = AiHintStrategicExchangeKind;

export function runnerStrategicExchangeKinds(
  candidate: ActionSemanticCandidate,
): RunnerStrategicExchangeKind[] {
  const risks = new Set(candidate.risks.map((risk) => risk.kind));
  // A current action may only bind one of a card's effects.  The exchange
  // classification is intentionally card-level as well: an install action
  // for a debt, temporary or self-damaging resource must retain the burden
  // that will be paid later, even when that later effect is not the action's
  // immediate engine effect.
  const effects = [
    ...(candidate.functionalEffects ?? []),
    ...(candidate.cardContextFunctionalEffects ?? []),
  ];
  const kinds = new Set<RunnerStrategicExchangeKind>(
    candidate.strategicExchangeKinds ?? [],
  );
  if (runnerDebtFinancingProfile(candidate.sourceDefinitionId)) {
    kinds.add("debt_financing");
  }
  if (
    candidate.costProfile.agendaPointCost !== undefined ||
    risks.has("agenda_cost") ||
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
    risks.has("brain_damage") ||
    risks.has("unpreventable_damage") ||
    effects.some(
      (effect) =>
        effect.target === "self_brain_damage" ||
        effect.target === "self_inflicted_brain_damage",
    )
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
  const transfersAgendaPointsToCorp = [
    ...(candidate.functionalEffects ?? []),
    ...(candidate.cardContextFunctionalEffects ?? []),
  ].some((effect) => effect.target === "agenda_points_given_to_corp");
  if (!transfersAgendaPointsToCorp) return undefined;
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const payload = action?.payload;
  const quoteComplete =
    payload?.runnerAgendaPointTransferQuoteSchemaVersion ===
      RUNNER_AGENDA_POINT_TRANSFER_QUOTE_SCHEMA_VERSION &&
    payload.runnerAgendaPointTransferQuoteComplete === true &&
    payload.runnerAgendaPointTransferQuoteStateVersion ===
      input.playerView.stateVersion &&
    action?.expiresAtStateVersion === input.playerView.stateVersion &&
    Number.isSafeInteger(payload.runnerAgendaPointsTransferredToCorp) &&
    Number(payload.runnerAgendaPointsTransferredToCorp) > 0 &&
    Number.isSafeInteger(payload.corpAgendaPointsAfterRunnerTransfer) &&
    Number(payload.corpAgendaPointsAfterRunnerTransfer) >=
      input.playerView.opponent.agendaPoints;
  if (!quoteComplete)
    return "runner_strategic_exchange_agenda_transfer_quote_incomplete";
  if (
    Number(payload.corpAgendaPointsAfterRunnerTransfer) >=
    input.playerView.agendaPointsToWin
  )
    return "runner_strategic_exchange_opponent_terminal_score";
  return undefined;
}

export function runnerStrategicExchangeRequiresBoundParent(
  candidate: ActionSemanticCandidate,
): boolean {
  const kinds = runnerStrategicExchangeKinds(candidate);
  return (
    (kinds.includes("debt_financing") &&
      candidate.semanticActionType === "install.card") ||
    (kinds.includes("self_damage") &&
      (candidate.costProfile.selfDamage?.length ?? 0) > 0)
  );
}
