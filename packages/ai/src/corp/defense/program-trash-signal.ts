import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import {
  corpProgramTrashChoiceContext,
  rankCorpProgramTrashChoiceOptionIds,
} from "./program-trash-targets";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";

export function corpProgramTrashDefenseSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpGenericDefenseSignal[] {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    !choice?.source.startsWith("card_implementation.trash_installed_program:")
  )
    return [];
  const action = input.legalActions.find(
    (a) =>
      a.type === "resolve_choice" &&
      a.choiceRequirements?.[0]?.choiceId === choice.choiceId,
  );
  if (!action) return [];
  const options = choice.options.filter((o) => o.selectable !== false);
  const selected = rankCorpProgramTrashChoiceOptionIds(
    input,
    action,
    choice,
    options,
    (id) => (id ? (AI_HINTS_BY_CARD.get(id)?.roles ?? []) : []),
  );
  const option = options.find((o) => o.id === selected?.[0]);
  const context = corpProgramTrashChoiceContext(input, choice);
  if (
    !option ||
    typeof option.value !== "string" ||
    !context ||
    !candidates.some(
      (c) =>
        c.actionId === action.actionId &&
        c.semanticActionType === "choice.resolve",
    )
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Produce an exact Defense program-trash target from the public encounter or Trace continuation and current legal choice.",
    );
  }
  return [
    {
      kind: "generic",
      defenseId: `program-trash:${choice.choiceId}`,
      serverId: context.serverId,
      phase: "resolve_program_trash",
      sourceDefinitionIds: [context.sourceDefinitionId],
      actionIds: [action.actionId],
      urgent: true,
      value: 1000,
      evidenceCode: "corp_program_trash_ranked_by_visible_coverage_loss",
      choiceResolution: {
        kind: "program_trash",
        choiceId: choice.choiceId,
        choiceSource: choice.source,
        sourceStateVersion: input.playerView.stateVersion,
        origin: context.origin,
        sourceIceInstanceId: context.sourceIceId,
        selectedOptionId: option.id,
        targetCardInstanceId: option.value,
      },
    },
  ];
}
