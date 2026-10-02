import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { technicalIdCompare } from "../../runtime/runtime-identifiers";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";
import {
  corpTraceHardwareTrashChoiceFacts,
  TRACE_HARDWARE_TRASH_SOURCE,
} from "./trace-hardware-trash-choice-facts";

export function corpTraceHardwareTrashDefenseSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpGenericDefenseSignal[] {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    !choice?.source.startsWith(TRACE_HARDWARE_TRASH_SOURCE)
  )
    return [];
  const action = input.legalActions.find(
    (candidate) =>
      candidate.type === "resolve_choice" &&
      candidate.choiceRequirements?.[0]?.choiceId === choice.choiceId,
  );
  if (!action) return [];
  const facts = corpTraceHardwareTrashChoiceFacts(
    input,
    action,
    choice,
    choice.options.filter((option) => option.selectable !== false),
  );
  if (
    !candidates.some(
      (candidate) =>
        candidate.actionId === action.actionId &&
        candidate.semanticActionType === "choice.resolve",
    )
  )
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize the current hardware Choice as a corp.defend_servers route.",
    );

  const target = facts.targets
    .map((entry) => ({
      ...entry,
      counters: Object.values(entry.card.counters ?? {}).reduce(
        (sum, amount) => sum + amount,
        0,
      ),
    }))
    .sort(
      (left, right) =>
        right.counters - left.counters ||
        right.card.installCost! - left.card.installCost! ||
        technicalIdCompare(left.optionId, right.optionId),
    )[0]!;
  return [
    {
      kind: "generic",
      defenseId: `trace-hardware-trash:${choice.choiceId}`,
      serverId: facts.serverId,
      phase: "resolve_hardware_trash",
      sourceDefinitionIds: [facts.sourceDefinitionId],
      actionIds: [action.actionId],
      urgent: true,
      value: 1000,
      evidenceCode: "corp_trace_hardware_trash_ranked_by_public_board_value",
      choiceResolution: {
        kind: "trace_hardware_trash",
        choiceId: choice.choiceId,
        choiceSource: choice.source,
        sourceStateVersion: input.playerView.stateVersion,
        traceId: facts.traceId,
        runId: facts.runId,
        sourceIceInstanceId: facts.sourceIceInstanceId,
        sourceDefinitionId: facts.sourceDefinitionId,
        subroutineIndex: facts.subroutineIndex,
        selectedOptionId: target.optionId,
        targetCardInstanceId: target.card.instanceId,
      },
    },
  ];
}
