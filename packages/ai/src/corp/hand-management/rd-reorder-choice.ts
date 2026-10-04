import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";
import type { DiscardKeepScorer } from "../../runtime/discard-choice-selection";
import type { CorpHandManagementSignal } from "./hand-management-types";
import type { HandState } from "./hand-management-plan-module";

export function corpRdReorderChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  keepScore: DiscardKeepScorer | undefined,
): CorpHandManagementSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    !choice?.source.startsWith("v1922.corp_rd_arrange_top5:")
  )
    return;
  const action = input.legalActions.find((a) => a.type === "resolve_choice"),
    requirement = action?.choiceRequirements?.[0];
  if (!action) return;
  const options = choice.options.filter((o) => o.selectable !== false);
  const source = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.servers.flatMap((s) => s.root),
  ].find(
    (c) =>
      c.instanceId === choice.sourceCardInstanceId &&
      c.known &&
      c.owner === "corp" &&
      c.definitionId === choice.sourceCardDefinitionId,
  );
  const quote = input.playerView.corpCentralAccessQuotes?.find(
    (q) => q.serverId === "rd",
  );
  if (
    !source?.definitionId ||
    !keepScore ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.selectionOrdering !== "ordered" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.source !==
      `v1922.corp_rd_arrange_top5:${source.instanceId}:${choice.stateVersion}` ||
    choice.minSelections !== options.length ||
    choice.maxSelections !== options.length ||
    options.length < 2 ||
    options.length > 5 ||
    action.side !== "corp" ||
    action.expiresAtStateVersion !== choice.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== options.length ||
    requirement.maxSelections !== options.length ||
    requirement.optionIds.length !== options.length ||
    options.some(
      (o) =>
        !requirement.optionIds.includes(o.id) ||
        !o.card?.known ||
        o.card.owner !== "corp" ||
        o.value !== o.card.instanceId ||
        !o.card.type ||
        (o.card.type === "agenda" &&
          (!Number.isSafeInteger(o.card.agendaPoints) ||
            Number(o.card.agendaPoints) < 0)),
    ) ||
    !candidates.some(
      (c) =>
        c.actionId === action.actionId &&
        c.semanticActionType === "choice.resolve",
    ) ||
    !quote?.complete ||
    quote.stateVersion !== choice.stateVersion ||
    !Number.isSafeInteger(quote.effectiveAccessCount) ||
    quote.effectiveAccessCount < 1
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind ordered R&D resolution to the exact current Hand plan, own source, visible card permutation and Engine access quote.",
    );
  }
  const ranked = options.map((option, index) => ({
    option,
    index,
    points:
      option.card!.type === "agenda" ? Number(option.card!.agendaPoints) : 0,
    keep: keepScore(input, option.card!).total,
  }));
  if (ranked.some((r) => !Number.isFinite(r.keep)))
    throw unresolvedChoiceFailure(
      input,
      action,
      "Quote a finite Hand retention value for every visible reorder option.",
    );
  // No own draw is committed by this choice. Minimize agenda exposure at the
  // next successful R&D access, then retain useful near-term nonagendas on top.
  ranked.sort(
    (a, b) =>
      (a.points > 0 ? 1 : 0) - (b.points > 0 ? 1 : 0) ||
      a.points - b.points ||
      b.keep - a.keep ||
      a.index - b.index,
  );
  return {
    handPlanId: `rd-reorder:${choice.choiceId}:${choice.stateVersion}`,
    phase: "rd_reorder_window",
    actionIds: [action.actionId],
    exactActionRoute: true,
    agendaCount: input.playerView.own.gripOrHq.filter(
      (c) => c.type === "agenda",
    ).length,
    handSize: input.playerView.own.gripOrHq.length,
    maximumHandSize: input.playerView.own.maxHandSize,
    concretePurposeCode:
      "Minimize exposed agenda points before an uncommitted future draw; preserve near-term Hand value among equal exposure alternatives.",
    priorityClass: "P5",
    routeAllowed: true,
    value: 1000,
    evidenceCode: "corp_rd_reorder_owned_by_hand_plan",
    rdReorderChoiceBinding: {
      actionId: action.actionId,
      choiceId: choice.choiceId,
      stateVersion: choice.stateVersion,
      sourceCardInstanceId: source.instanceId,
      sourceDefinitionId: source.definitionId,
      optionIds: options.map((o) => o.id),
      selectedOptionIds: ranked.map((r) => r.option.id),
      effectiveAccessCount: quote.effectiveAccessCount,
    },
  };
}

export function selectedCorpRdReorderChoice(
  input: AiDecisionInput,
  action: LegalAction,
  portfolio: ResidentPlanPortfolio | undefined,
): string[] {
  const choice = input.playerView.pendingChoice,
    executor = portfolio?.instances.find(
      (i) =>
        i.instanceId === portfolio.executorInstanceId &&
        i.moduleId === "corp.hand_and_agenda_management",
    ),
    state = executor?.moduleState as HandState | undefined,
    binding = state?.signal.rdReorderChoiceBinding;
  const requirement = action.choiceRequirements?.[0],
    quote = input.playerView.corpCentralAccessQuotes?.find(
      (q) => q.serverId === "rd",
    );
  if (
    state?.kind !== "hand" ||
    state.signal.phase !== "rd_reorder_window" ||
    portfolio?.stateVersion !== input.playerView.stateVersion ||
    input.side !== "corp" ||
    choice?.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== choice.options.length ||
    requirement.maxSelections !== choice.options.length ||
    !choice ||
    binding?.choiceId !== choice.choiceId ||
    binding.stateVersion !== choice.stateVersion ||
    binding.actionId !== action.actionId ||
    binding.sourceCardInstanceId !== choice.sourceCardInstanceId ||
    binding.sourceDefinitionId !== choice.sourceCardDefinitionId ||
    choice.selectionOrdering !== "ordered" ||
    binding.optionIds.length !== choice.options.length ||
    choice.options.some((o) => !binding.optionIds.includes(o.id)) ||
    requirement.optionIds.length !== binding.optionIds.length ||
    requirement.optionIds.some((id) => !binding.optionIds.includes(id)) ||
    !quote?.complete ||
    quote.stateVersion !== binding.stateVersion ||
    quote.effectiveAccessCount !== binding.effectiveAccessCount ||
    binding.selectedOptionIds.length !== choice.options.length ||
    new Set(binding.selectedOptionIds).size !== choice.options.length ||
    binding.selectedOptionIds.some((id) => !binding.optionIds.includes(id))
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete the selected R&D permutation only from the exact current Hand-plan binding.",
    );
  }
  return [...binding.selectedOptionIds];
}
