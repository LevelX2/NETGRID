import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import {
  PendingChoice,
  PendingChoiceOptions,
  unresolvedChoiceFailure,
} from "../../runtime/plan-bound-choice-contract";

export function selectedCorpRezOrTrashIceOptionId(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string | undefined {
  const rezOptionId = selectableOptions.find(
    (option) => option.id === "rez_ice",
  )?.id;
  const trashOptionId = selectableOptions.find(
    (option) => option.id === "trash_ice",
  )?.id;
  const targetMatch =
    /^card_implementation\.corp_choice_rez_or_trash_ice_decision:([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const targetCardId = targetMatch?.[1];
  const targetIce = input.playerView.servers
    .flatMap((server) => server.ice)
    .find(
      (card) =>
        card.instanceId === targetCardId &&
        card.known === true &&
        card.rezzed === false,
    );
  const rezQuote = targetIce?.effectiveRezCostQuote;
  if (
    rezOptionId !== undefined &&
    rezQuote?.complete === true &&
    rezQuote.cardId === targetCardId &&
    rezQuote.expiresAtStateVersion === input.playerView.stateVersion &&
    Number.isFinite(rezQuote.finalCredits) &&
    rezQuote.finalCredits <= input.playerView.own.credits
  ) {
    return rezOptionId;
  }
  return trashOptionId;
}

export function selectedCorpClassicDeflectorOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceParts = choice.source.split(":");
  const subroutineIndex = Number(sourceParts[3]);
  const creditCost = Number(sourceParts[7]);
  let decoded:
    | {
        runId: string;
        sourceIceInstanceId: string;
        sourceDefinitionId: string;
        subroutineId: string;
      }
    | undefined;
  if (
    sourceParts.length === 9 &&
    sourceParts[0] === "card_implementation.classic_deflector" &&
    sourceParts[1] &&
    sourceParts[2] &&
    sourceParts[4] &&
    sourceParts[5]
  ) {
    try {
      decoded = {
        runId: decodeURIComponent(sourceParts[1]),
        sourceIceInstanceId: decodeURIComponent(sourceParts[2]),
        sourceDefinitionId: decodeURIComponent(sourceParts[4]),
        subroutineId: decodeURIComponent(sourceParts[5]),
      };
    } catch {
      decoded = undefined;
    }
  }
  const targetProfile = sourceParts[6];
  const autoBreakIfNoTarget = sourceParts[8] === "1";
  const requirement = action.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactChoiceAndAction =
    decoded !== undefined &&
    Number.isSafeInteger(subroutineIndex) &&
    subroutineIndex >= 0 &&
    Number.isSafeInteger(creditCost) &&
    creditCost >= 0 &&
    (targetProfile === "archives" ||
      targetProfile === "any_data_fort" ||
      targetProfile === "subsidiary_data_fort") &&
    (sourceParts[8] === "0" || sourceParts[8] === "1") &&
    choice.side === "corp" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: Array<{
          kind?: unknown;
          phase?: unknown;
          actionIds?: unknown;
          choiceResolution?: Record<string, unknown>;
        }>;
      }
    | undefined;
  const signal = moduleState?.signals?.find(
    (candidate) =>
      candidate.kind === "generic" &&
      candidate.phase === "resolve_run_redirect" &&
      Array.isArray(candidate.actionIds) &&
      candidate.actionIds.length === 1 &&
      candidate.actionIds[0] === action.actionId &&
      candidate.choiceResolution?.kind === "classic_deflector_redirect" &&
      candidate.choiceResolution.choiceId === choice.choiceId,
  );
  const resolution = signal?.choiceResolution;
  const selectedOptionId = resolution?.selectedOptionId;
  const selectedOption = selectableOptions.find(
    (option) => option.id === selectedOptionId,
  );
  const disposition = resolution?.disposition;
  const selectedServerId = resolution?.selectedServerId;
  const exactSelection =
    (disposition === "decline" &&
      selectedServerId === undefined &&
      selectedOptionId === "decline" &&
      selectedOption?.value === "decline" &&
      creditCost > 0) ||
    (disposition === "redirect" &&
      typeof selectedServerId === "string" &&
      selectedOptionId === `server_${selectedServerId}` &&
      selectedOption?.value === selectedServerId);
  const exactPlanBinding =
    exactChoiceAndAction &&
    portfolio?.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "defense" &&
    resolution !== undefined &&
    resolution.sourceStateVersion === input.playerView.stateVersion &&
    resolution.runId === decoded?.runId &&
    resolution.sourceIceInstanceId === decoded?.sourceIceInstanceId &&
    resolution.sourceDefinitionId === decoded?.sourceDefinitionId &&
    resolution.subroutineIndex === subroutineIndex &&
    resolution.subroutineId === decoded?.subroutineId &&
    resolution.targetProfile === targetProfile &&
    resolution.creditCost === creditCost &&
    resolution.autoBreakIfNoTarget === autoBreakIfNoTarget &&
    exactSelection;
  if (!exactPlanBinding || typeof selectedOptionId !== "string") {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize a Classic Deflector payload only from the current corp.defend_servers executor and its exact plan-bound redirect or decline choice.",
    );
  }
  return [selectedOptionId];
}

export function selectedCorpAgendaPurgeInstallTargetOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string[] {
  const sourceMatch =
    /^card_implementation\.agenda_purge_install_targets:([^:]+):([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const revealedIds = sourceMatch?.[2]?.split(",").filter(Boolean) ?? [];
  const sourceStateVersion = Number(sourceMatch?.[3]);
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceAgendaId &&
          card.known &&
          card.type === "agenda",
      )
    : undefined;
  const targetServerIds = input.playerView.servers.map((server) => server.id);
  const allowedTargetServerIds = new Set([...targetServerIds, "new_remote"]);
  const revealedIdSet = new Set(revealedIds);
  const optionsByCardId = new Map<string, Map<string, PendingChoiceOptions>>();
  let optionsAreExact = selectableOptions.length > 0;
  for (const option of selectableOptions) {
    const valueParts =
      typeof option.value === "string" ? option.value.split("|") : [];
    const [cardId, serverId, rezVariantId] = valueParts;
    if (
      valueParts.length !== 3 ||
      !cardId ||
      !serverId ||
      !rezVariantId ||
      !revealedIdSet.has(cardId) ||
      !allowedTargetServerIds.has(serverId) ||
      option.id !== `agenda_purge_${cardId}_${serverId}_${rezVariantId}`
    ) {
      optionsAreExact = false;
      continue;
    }
    const optionsByServerId =
      optionsByCardId.get(cardId) ?? new Map<string, PendingChoiceOptions>();
    const variants = optionsByServerId.get(serverId) ?? [];
    if (
      variants.some((variant) => {
        const variantParts =
          typeof variant.value === "string" ? variant.value.split("|") : [];
        return variantParts[2] === rezVariantId;
      })
    ) {
      optionsAreExact = false;
    }
    variants.push(option);
    optionsByServerId.set(serverId, variants);
    optionsByCardId.set(cardId, optionsByServerId);
  }
  for (const optionsByServerId of optionsByCardId.values()) {
    if (optionsByServerId.size === 0) {
      optionsAreExact = false;
    }
  }
  const revealedOptionsAreExact = revealedIds.every((cardId) =>
    choice.options.some(
      (option) =>
        option.id === `agenda_purge_revealed_${cardId}` &&
        option.value === cardId &&
        option.selectable === false,
    ),
  );
  const requirement = action.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactActionBinding =
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const exactChoiceContract =
    choice.side === "corp" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    sourceStateVersion === input.playerView.stateVersion &&
    choice.minSelections === choice.maxSelections &&
    choice.minSelections > 0 &&
    choice.minSelections === optionsByCardId.size &&
    revealedIds.length > 0 &&
    new Set(revealedIds).size === revealedIds.length &&
    sourceAgenda !== undefined &&
    targetServerIds.length > 0 &&
    optionsAreExact &&
    revealedOptionsAreExact &&
    exactActionBinding;
  if (!exactChoiceContract) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind Security Purge to its exact scored agenda, current hidden Corp choice/action contract, revealed-card set and Engine-provided selectable target-server options.",
    );
  }

  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: Array<{
          kind?: unknown;
          phase?: unknown;
          actionIds?: unknown;
          choiceResolution?: {
            kind?: unknown;
            choiceId?: unknown;
            sourceAgendaId?: unknown;
            sourceStateVersion?: unknown;
            revealedCardIds?: unknown;
            targets?: Array<{
              cardId?: unknown;
              serverId?: unknown;
              optionId?: unknown;
            }>;
          };
        }>;
      }
    | undefined;
  const signal = moduleState?.signals?.find(
    (candidate) =>
      candidate.kind === "generic" &&
      candidate.phase === "resolve_install_targets" &&
      Array.isArray(candidate.actionIds) &&
      candidate.actionIds.length === 1 &&
      candidate.actionIds[0] === action.actionId &&
      candidate.choiceResolution?.kind === "agenda_purge_install_targets" &&
      candidate.choiceResolution.choiceId === choice.choiceId,
  );
  const planResolution = signal?.choiceResolution;
  const planTargets = planResolution?.targets;
  const planRevealedCardIds = Array.isArray(planResolution?.revealedCardIds)
    ? planResolution.revealedCardIds
    : undefined;
  const selectedOptionIds =
    planTargets?.map((target) =>
      typeof target.optionId === "string" ? target.optionId : "",
    ) ?? [];
  const exactPlanBinding =
    portfolio?.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "defense" &&
    planResolution !== undefined &&
    planResolution.sourceAgendaId === sourceAgendaId &&
    planResolution.sourceStateVersion === input.playerView.stateVersion &&
    planRevealedCardIds !== undefined &&
    planRevealedCardIds.length === revealedIds.length &&
    revealedIds.every(
      (cardId, index) => planRevealedCardIds[index] === cardId,
    ) &&
    Array.isArray(planTargets) &&
    planTargets.length === choice.minSelections &&
    new Set(
      planTargets.map((target) =>
        typeof target.cardId === "string" ? target.cardId : "",
      ),
    ).size === planTargets.length &&
    planTargets.every((target) => {
      if (
        typeof target.cardId !== "string" ||
        typeof target.serverId !== "string" ||
        typeof target.optionId !== "string"
      ) {
        return false;
      }
      return (
        optionsByCardId
          .get(target.cardId)
          ?.get(target.serverId)
          ?.some((option) => option.id === target.optionId) === true
      );
    });
  if (!exactPlanBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize Security Purge only from the current corp.defend_servers executor and its exact plan-bound ICE-to-server allocation.",
    );
  }
  return selectedOptionIds;
}
