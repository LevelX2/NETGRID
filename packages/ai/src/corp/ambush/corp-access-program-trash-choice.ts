import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { CorpAmbushSignal } from "../../plans/corp-tactical-plan-contracts";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { projectKnownCorpCardAccessEffect } from "../../runtime/known-corp-card-access-effect-projection";
export function accessProgramTrashChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpAmbushSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    choice?.kind !== "select_cards" ||
    choice.source !== "card_implementation.runner_installed_multi_trash" ||
    choice.side !== "corp" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.visibility !== "public" ||
    !Number.isSafeInteger(choice.minSelections) ||
    choice.minSelections < 1 ||
    choice.minSelections !== choice.maxSelections ||
    choice.selectionOrdering !== "ordered" ||
    choice.maxSelections <= 0
  ) {
    return undefined;
  }
  const sourceInstanceId = choice.sourceCardInstanceId;
  const sourceDefinitionId = choice.sourceCardDefinitionId;
  const server = input.playerView.servers.find((s) =>
    s.root.some((c) => c.instanceId === sourceInstanceId),
  );
  const card = server?.root.find((c) => c.instanceId === sourceInstanceId);
  if (
    !server ||
    !card ||
    !sourceInstanceId ||
    !sourceDefinitionId ||
    card.definitionId !== sourceDefinitionId ||
    card.known !== true ||
    card.owner !== "corp" ||
    card.controller !== "corp" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    input.playerView.run?.accessedCard?.instanceId !== sourceInstanceId ||
    input.playerView.run.attackedServerId !== server.id ||
    input.playerView.run.position?.kind !== "server" ||
    input.playerView.run.position.serverId !== server.id
  )
    return undefined;
  const hint = AI_HINTS_BY_CARD.get(sourceDefinitionId);
  if (
    !(
      hint?.strategyAnchors?.includes("corp.ambush_bluff") ||
      hint?.lineSupport?.includes("corp.ambush_bluff")
    ) ||
    !hint.targetProfiles?.some(
      (p) => "purpose" in p && p.purpose === "trash_installed_runner_programs",
    )
  )
    return undefined;
  const projection = projectKnownCorpCardAccessEffect({
    input,
    sourceDefinitionId,
    sourceCard: card,
  });
  if (
    projection.status !== "complete" ||
    projection.installedProgramTrash !== choice.minSelections
  )
    return undefined;
  const location = { card, serverId: server.id };
  const resolveCandidates = candidates.filter(
    (candidate) =>
      candidate.semanticActionType === "choice.resolve" &&
      candidate.actionType === "resolve_choice",
  );
  if (resolveCandidates.length !== 1) return undefined;
  const resolveCandidate = resolveCandidates[0]!;
  const resolveAction = input.legalActions.find(
    (action) => action.actionId === resolveCandidate.actionId,
  );
  const requirement = resolveAction?.choiceRequirements?.[0];
  const selectableOptions = choice.options.filter(
    (option) => option.selectable !== false,
  );
  const optionIds = selectableOptions.map((option) => option.id);
  if (
    !resolveAction ||
    resolveAction.side !== "corp" ||
    resolveAction.type !== "resolve_choice" ||
    resolveAction.source !== "game_rule" ||
    resolveAction.timingPoint !== input.playerView.timingPoint ||
    resolveAction.expiresAtStateVersion !== input.playerView.stateVersion ||
    resolveAction.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== choice.minSelections ||
    requirement.maxSelections !== choice.maxSelections ||
    requirement.optionIds.length !== optionIds.length ||
    !optionIds.every((optionId) => requirement.optionIds.includes(optionId))
  ) {
    return undefined;
  }
  const visiblePrograms = new Map(
    (input.playerView.opponent.rig ?? [])
      .filter(
        (card) =>
          card.known === true &&
          card.owner === "runner" &&
          card.controller === "runner" &&
          card.type === "program",
      )
      .map((card) => [card.instanceId, card] as const),
  );
  const optionBindings = selectableOptions.map((option) => ({
    optionId: option.id,
    cardId: typeof option.value === "string" ? option.value : undefined,
  }));
  if (
    optionBindings.length !== visiblePrograms.size ||
    new Set(optionBindings.map((b) => b.cardId)).size !==
      optionBindings.length ||
    optionBindings.some(
      (binding) =>
        !binding.cardId ||
        binding.optionId !== `target_${binding.cardId}` ||
        !visiblePrograms.has(binding.cardId),
    )
  ) {
    return undefined;
  }
  const selected = optionBindings
    .map((binding) => ({
      ...binding,
      card: visiblePrograms.get(binding.cardId!)!,
    }))
    .sort(
      (left, right) =>
        programTrashTargetScore(right.card) -
          programTrashTargetScore(left.card) ||
        left.optionId.localeCompare(right.optionId),
    )
    .slice(0, choice.maxSelections);
  return {
    commitmentVersion: "corp_ambush_commitment_v1",
    ambushId: `access-program-trash:${choice.choiceId}`,
    sourceDefinitionId,
    sourceInstanceId,
    actionIds: [resolveAction.actionId],
    serverId: location.serverId,
    phase: "trigger",
    purposeCode: `resolve_access_program_trash:${sourceInstanceId}`,
    assignedDomainPlanIds: ["corp.ambush_bluff"],
    duplicateAlreadyInstalled: false,
    affordableOrSupportable: true,
    plannedAtStateVersion: input.playerView.stateVersion,
    plannedAdvancementTarget: Math.max(
      0,
      location.card.advancementCounters ?? 0,
    ),
    value: 1_000,
    evidenceCode: `corp_ambush_access_program_trash_owned:${sourceInstanceId}`,
    accessProgramTrashChoiceBinding: {
      actionId: resolveAction.actionId,
      choiceId: choice.choiceId,
      choiceSource: choice.source,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionIds: selected.map((entry) => entry.optionId),
      targetProgramInstanceIds: selected.map((entry) => entry.cardId!),
      evidenceCodes: [
        "corp_ambush_program_trash_choice_owned_by_ambush_plan",
        "corp_ambush_program_trash_bound_to_current_engine_choice",
        "corp_ambush_program_trash_targets_ranked_by_visible_board_value",
      ],
    },
  };
}

function programTrashTargetScore(card: VisibleCard): number {
  const counters = Object.values(card.counters ?? {}).reduce(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0,
  );
  const isIcebreaker = card.subtypes?.some(
    (subtype) => subtype.toLocaleLowerCase() === "icebreaker",
  );
  return (
    (isIcebreaker ? 100_000 : 0) +
    counters * 1_000 +
    Math.max(0, card.installCost ?? 0) * 10 +
    Math.max(0, card.memoryCost ?? 0)
  );
}
