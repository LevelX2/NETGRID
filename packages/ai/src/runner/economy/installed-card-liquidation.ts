import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type { AiDeckStrategyProfile } from "../../deck-doctrine-strategy";
import { rolesMatch } from "../../runtime/role-match";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerInstalledCardLiquidationChoiceSignal } from "./economy-types";
export function runnerInstalledCardLiquidationChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerInstalledCardLiquidationChoiceSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "runner" ||
    choice?.side !== "runner" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    return undefined;
  }
  const sourceMatch =
    /^runner\.installed_resource_trash_for_credits:([^:]+):([0-9]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceResourceInstanceId = sourceMatch?.[1];
  const gainCredits = Number(sourceMatch?.[2]);
  const sourceStateVersion = Number(sourceMatch?.[3]);
  const rig = input.playerView.own.rig ?? [];
  const sourceResource = sourceResourceInstanceId
    ? rig.find(
        (card) =>
          card.instanceId === sourceResourceInstanceId &&
          card.known &&
          card.type === "resource" &&
          typeof card.definitionId === "string" &&
          card.definitionId.length > 0,
      )
    : undefined;
  const action = input.legalActions.find(
    (legalAction) =>
      legalAction.side === "runner" &&
      legalAction.type === "resolve_choice" &&
      legalAction.source === "game_rule" &&
      legalAction.timingPoint === input.playerView.timingPoint &&
      legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
      legalAction.choiceRequirements?.length === 1 &&
      legalAction.choiceRequirements[0]?.choiceId === choice.choiceId,
  );
  const candidate = action
    ? candidates.find(
        (entry) =>
          entry.actionId === action.actionId &&
          entry.semanticActionType === "choice.resolve",
      )
    : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactActionBinding =
    requirement !== undefined &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const eligibleCards = rig.filter(
    (card) => card.instanceId !== sourceResourceInstanceId,
  );
  const optionById = new Map(
    choice.options.map((option) => [option.id, option]),
  );
  const passOption = optionById.get("pass");
  const exactOptionMatrix =
    choice.options.length === eligibleCards.length + 1 &&
    passOption !== undefined &&
    passOption.selectable !== false &&
    passOption.value === undefined &&
    eligibleCards.every((card) => {
      const option = optionById.get(`card_${card.instanceId}`);
      return option?.selectable !== false && option?.value === card.instanceId;
    });
  if (
    !sourceResourceInstanceId ||
    !sourceResource?.definitionId ||
    !Number.isInteger(gainCredits) ||
    gainCredits <= 0 ||
    sourceStateVersion !== input.playerView.stateVersion ||
    !action ||
    !candidate ||
    !exactActionBinding ||
    !exactOptionMatrix ||
    eligibleCards.length === 0
  ) {
    return undefined;
  }
  const quotedTargets = eligibleCards
    .map((card) => {
      const retainedCardValue = installedCardRetentionValue(input, card);
      const expendability = installedCardLiquidationExpendability(input, card);
      return {
        card,
        optionId: `card_${card.instanceId}`,
        retainedCardValue,
        netLiquidationValue: gainCredits - retainedCardValue,
        expendability,
      };
    })
    .sort(
      (left, right) =>
        right.netLiquidationValue - left.netLiquidationValue ||
        left.retainedCardValue - right.retainedCardValue ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  const selectedTarget = quotedTargets.find(
    (target) =>
      target.expendability === "proven_redundant" &&
      target.netLiquidationValue > 0,
  );
  const bestQuotedTarget = selectedTarget ?? quotedTargets[0]!;
  const quote = selectedTarget
    ? {
        gainCredits,
        retainedCardValue: selectedTarget.retainedCardValue,
        netLiquidationValue: selectedTarget.netLiquidationValue,
        expendability: selectedTarget.expendability,
      }
    : {
        gainCredits,
        retainedCardValue: bestQuotedTarget.retainedCardValue,
        netLiquidationValue: bestQuotedTarget.netLiquidationValue,
        expendability: bestQuotedTarget.expendability,
      };
  return {
    conversionId: `installed-card-liquidation:${choice.choiceId}`,
    sourceResourceInstanceId,
    sourceResourceDefinitionId: sourceResource.definitionId,
    actionId: action.actionId,
    choiceId: choice.choiceId,
    sourceStateVersion,
    selectedOptionId: selectedTarget?.optionId ?? "pass",
    ...(selectedTarget
      ? { selectedCardInstanceId: selectedTarget.card.instanceId }
      : {}),
    disposition: selectedTarget
      ? "liquidate_proven_expendable"
      : quote.netLiquidationValue <= 0
        ? "decline_nonpositive_conversion"
        : "decline_unproven_expendability",
    quote,
    priorityClass: "P4",
    value: 1_000,
    evidenceCodes: [
      "runner_installed_card_liquidation_choice_owned_by_economy",
      selectedTarget
        ? `runner_installed_card_liquidation_proven_redundant:${selectedTarget.card.instanceId}:${selectedTarget.netLiquidationValue}`
        : quote.netLiquidationValue <= 0
          ? "runner_installed_card_liquidation_declined_nonpositive_value"
          : `runner_installed_card_liquidation_declined_unproven_expendability:${bestQuotedTarget.card.instanceId}`,
    ],
  };
}

function installedCardLiquidationExpendability(
  input: AiDecisionInput,
  card: VisibleCard,
): "proven_redundant" | "unproven" {
  if (!card.known || !card.definitionId) return "unproven";
  const rig = input.playerView.own.rig ?? [];
  const duplicateCount = rig.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  const strategyProfile = (
    input as AiDecisionInput & {
      ownDeckStrategyProfile?: AiDeckStrategyProfile;
    }
  ).ownDeckStrategyProfile;
  const doctrineProvider =
    strategyProfile?.runnerEngineDoctrine?.providers.find(
      (provider) => provider.cardId === card.definitionId,
    );
  const roles = rolesForDeckDoctrineCard(card.definitionId);
  const hostedCardCount = rig.filter(
    (candidate) => candidate.hostedOn === card.instanceId,
  ).length;
  const counterCount = Object.values(card.counters ?? {}).reduce(
    (sum, count) => sum + Math.max(0, count ?? 0),
    0,
  );
  const structurallyActive =
    rolesMatch(roles, [
      "breaker",
      "coverage",
      "damage_prevention",
      "survive_meat_damage",
      "tag_prevention",
      "tag_clear",
      "economy",
      "draw",
      "search",
      "link",
      "trace",
      "access",
      "run",
      "engine",
      "build_rig",
      "delayed_install",
      "resource_value_engine",
      "credit_bank",
    ]) ||
    (card.memoryLimitBonus ?? 0) > 0 ||
    (card.maxHandSizeBonus ?? 0) > 0 ||
    (card.baseLink ?? 0) > 0 ||
    hostedCardCount > 0 ||
    counterCount > 0 ||
    (card.lifecycleMarkers?.length ?? 0) > 0;
  return duplicateCount > 1 &&
    doctrineProvider?.additivity === "redundant_by_default" &&
    !structurallyActive
    ? "proven_redundant"
    : "unproven";
}

function installedCardRetentionValue(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  if (!card.known || !card.definitionId) return Number.MAX_SAFE_INTEGER;
  const rig = input.playerView.own.rig ?? [];
  const roles = rolesForDeckDoctrineCard(card.definitionId);
  const duplicateCount = rig.filter(
    (candidate) => candidate.definitionId === card.definitionId,
  ).length;
  const hostedCardCount = rig.filter(
    (candidate) => candidate.hostedOn === card.instanceId,
  ).length;
  const counterCount = Object.values(card.counters ?? {}).reduce(
    (sum, count) => sum + Math.max(0, count ?? 0),
    0,
  );
  const memoryWouldOverflow =
    (card.memoryLimitBonus ?? 0) > 0 &&
    (input.playerView.own.memoryUsed ?? 0) >
      Math.max(
        0,
        (input.playerView.own.memoryLimit ?? 0) - (card.memoryLimitBonus ?? 0),
      );
  const criticalRigRole = rolesMatch(roles, [
    "breaker",
    "coverage",
    "damage_prevention",
    "survive_meat_damage",
    "tag_prevention",
    "tag_clear",
  ]);
  const activeEngineRole = rolesMatch(roles, [
    "economy",
    "draw",
    "search",
    "link",
    "trace",
    "access",
    "run",
    "engine",
    "build_rig",
    "delayed_install",
    "resource_value_engine",
    "credit_bank",
  ]);
  return Math.max(
    0,
    1 +
      Math.max(0, card.installCost ?? card.cost ?? 0) +
      (duplicateCount > 1 ? -1 : 0) +
      (criticalRigRole ? 20 : 0) +
      (activeEngineRole ? 5 : 0) +
      ((card.memoryLimitBonus ?? 0) > 0 ? 8 : 0) +
      ((card.maxHandSizeBonus ?? 0) > 0 ? 8 : 0) +
      ((card.baseLink ?? 0) > 0 ? 5 : 0) +
      (memoryWouldOverflow ? 30 : 0) +
      hostedCardCount * 10 +
      counterCount * 2 +
      (card.lifecycleMarkers?.length ?? 0) * 4,
  );
}
