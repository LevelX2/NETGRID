import type { PlanInstance } from "../../plans/plan-kernel-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

export function isExactScoreRecoveryChoiceOwner(
  executor: PlanInstance | undefined,
  origin: ResidentPlanPortfolio["selectedActionOrigin"],
  stateVersion: number,
): boolean {
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: CorpScoreProjectSignal }
    | undefined;
  const signal = moduleState?.signal;
  const binding = signal?.recoveryChoiceBinding;
  return (
    executor?.moduleId === "corp.score_agenda" &&
    moduleState?.kind === "score" &&
    signal?.phase === "recover_score_support" &&
    signal.terminalScore === true &&
    signal.sameTurnCloseout === true &&
    origin?.immediateChoicePolicy ===
      "select_bound_corp_archives_cards_to_hq" &&
    signal.actionIds?.includes(origin.selectedActionId) === true &&
    binding?.stateVersion === stateVersion &&
    binding.sourceCardId === origin.sourceCardInstanceId &&
    origin.selectedArchiveCardInstanceIds.length === 1 &&
    binding.recoveredCardId === origin.selectedArchiveCardInstanceIds[0]
  );
}
