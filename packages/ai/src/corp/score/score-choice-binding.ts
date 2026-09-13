import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { HandState } from "../hand-management/hand-management-plan-module";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import {
  corpScoredAgendaFreeRezProfile,
  corpScoredAgendaHqShuffleProfile,
  corpScoredAgendaIceMarkProfile,
} from "../../runtime/corp-canonical-card-facts";
import {
  PendingChoice,
  PendingChoiceOptions,
  unresolvedChoiceFailure,
} from "../../runtime/plan-bound-choice-contract";
export function selectedCorpScoredAgendaStartDrawChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string {
  const sourceMatch =
    /^scored_agenda\.start_draw_choice:([^:]+):([0-9]+)$/.exec(choice.source);
  const sourceCardId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const sourceCard = sourceCardId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceCardId &&
          card.known &&
          card.type === "agenda",
      )
    : undefined;
  const draw = selectableOptions.find(
    (option) => option.id === "draw" && option.value === "draw",
  );
  const skip = selectableOptions.find(
    (option) => option.id === "skip" && option.value === "skip",
  );
  const exactOptions =
    selectableOptions.length === 2 && draw !== undefined && skip !== undefined;
  const requirement = action.choiceRequirements?.[0];
  const exactActionBinding =
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === 2 &&
    requirement.optionIds.includes("draw") &&
    requirement.optionIds.includes("skip");
  const rdCount = input.playerView.own.stackOrRdCount;
  if (
    input.playerView.timingPoint !== "corp_draw.mandatory_draw" ||
    choice.side !== "corp" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.visibility !== "public" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    sourceStateVersion !== input.playerView.stateVersion ||
    !sourceCard ||
    !exactOptions ||
    !exactActionBinding ||
    !Number.isSafeInteger(rdCount) ||
    rdCount < 0
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind the optional scored-agenda start draw to its exact public source agenda, current Engine choice/action contract, and visible R&D count.",
    );
  }
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const hand = executor?.moduleState as HandState | undefined;
  const binding = hand?.signal?.optionalStartDrawChoiceBinding;
  if (
    executor?.moduleId !== "corp.hand_and_agenda_management" ||
    hand?.kind !== "hand" ||
    hand.signal.phase !== "optional_start_draw_window" ||
    binding?.actionId !== action.actionId ||
    binding.choiceId !== choice.choiceId ||
    binding.observedAtStateVersion !== input.playerView.stateVersion ||
    (binding.selectedOptionId !== "draw" && binding.selectedOptionId !== "skip")
  )
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Hand owner must bind the exact optional start-draw decision before resolving its choice.",
    );
  return binding.selectedOptionId;
}

export function selectedCorpSatelliteMonitorsStartOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string {
  const sourceMatch = /^classic\.satellite_monitors:([^:]+):([0-9]+)$/.exec(
    choice.source,
  );
  const sourceCardId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const sourceCard = sourceCardId
    ? input.playerView.servers
        .flatMap((server) => server.root)
        .find(
          (card) =>
            card.instanceId === sourceCardId &&
            card.known &&
            card.definitionId === "onr_classic_021_satellite-monitors" &&
            card.type === "asset" &&
            card.rezzed === true,
        )
    : undefined;
  const use = selectableOptions.find(
    (option) => option.id === "use" && option.value === "use",
  );
  const decline = selectableOptions.find(
    (option) => option.id === "decline" && option.value === "decline",
  );
  const requirement = action.choiceRequirements?.[0];
  const exactActionBinding =
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === 2 &&
    requirement.optionIds.includes("use") &&
    requirement.optionIds.includes("decline");
  const exactWindow =
    sourceCard !== undefined &&
    sourceStateVersion === input.playerView.stateVersion &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.side === "corp" &&
    choice.visibility === "public" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectableOptions.length === 2 &&
    use !== undefined &&
    decline !== undefined;
  if (!exactActionBinding || !exactWindow || !use) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Resolve Satellite Monitors only from its exact current public Corp start-of-turn card window, installed rezzed source and complete use-or-decline action binding.",
    );
  }
  return use.id;
}

export function selectedCorpDelayedSuccessOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const sourceMatch =
    /^p3_54\.delayed_success:([^:]+):temporary_hq_ice_encounter_after_successful_run:([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceServerId = sourceMatch?.[2];
  const boundDefensePlans = (portfolio?.instances ?? []).filter((instance) => {
    if (instance.moduleId !== "corp.defend_servers") return false;
    const state = instance.moduleState as
      | {
          kind?: unknown;
          delayedSuccessChoiceBinding?: {
            choiceId?: unknown;
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            serverId?: unknown;
            observedAtStateVersion?: unknown;
          };
        }
      | undefined;
    const candidateBinding = state?.delayedSuccessChoiceBinding;
    return (
      state?.kind === "defense" &&
      candidateBinding?.choiceId === choice.choiceId &&
      candidateBinding.actionId === action.actionId &&
      candidateBinding.sourceCardInstanceId === sourceMatch?.[1] &&
      candidateBinding.serverId === sourceServerId &&
      candidateBinding.observedAtStateVersion === input.playerView.stateVersion
    );
  });
  const executor =
    boundDefensePlans.length === 1 ? boundDefensePlans[0] : undefined;
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        delayedSuccessChoiceBinding?: {
          choiceId?: unknown;
          actionId?: unknown;
          selectedOptionId?: unknown;
          sourceCardInstanceId?: unknown;
          serverId?: unknown;
          observedAtStateVersion?: unknown;
        };
      }
    | undefined;
  const binding = moduleState?.delayedSuccessChoiceBinding;
  const selectedOption = selectableOptions.find(
    (option) => option.id === binding?.selectedOptionId,
  );
  const [requirement] = action.choiceRequirements ?? [];
  const optionIds = selectableOptions.map((option) => option.id);
  const exactBinding =
    portfolio?.side === "corp" &&
    executor !== undefined &&
    moduleState?.kind === "defense" &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.selectedOptionId === selectedOption?.id &&
    binding.sourceCardInstanceId === sourceMatch?.[1] &&
    binding.serverId === sourceServerId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    sourceMatch?.[3] === String(input.playerView.stateVersion) &&
    choice.side === "corp" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectedOption !== undefined &&
    typeof selectedOption.value === "string" &&
    ((selectedOption.id === "decline" && selectedOption.value === "decline") ||
      (selectedOption.id === `ice_${selectedOption.value}` &&
        input.playerView.own.gripOrHq.some(
          (card) =>
            card.instanceId === selectedOption.value &&
            card.known &&
            card.type === "ice",
        ))) &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !selectedOption) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete Dr. Dreff only from the exact current corp.defend_servers choice binding on the attacked fort and its legal decline or visible HQ-ICE payload.",
    );
  }
  return [selectedOption.id];
}

export function residentCorpScoreChoiceBinding(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): {
  planInstanceId: string;
  targetCardId: string;
  move?: { sourceCardId: string; targetCardId: string; amount: number };
  placement?: {
    placements: Array<{ targetCardId: string; amount: number }>;
  };
} {
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
          sourceCardId?: unknown;
          amount?: unknown;
          placements?: unknown;
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const choiceContinuation = choice.continuation;
  const targetCardId =
    typeof continuation?.targetCardId === "string"
      ? continuation.targetCardId
      : undefined;
  const isMoveChoice = choice.source.startsWith("p3_34.move_advancement:");
  const move =
    isMoveChoice &&
    typeof continuation?.sourceCardId === "string" &&
    typeof continuation.amount === "number" &&
    Number.isInteger(continuation.amount) &&
    continuation.amount > 0 &&
    targetCardId !== undefined
      ? {
          sourceCardId: continuation.sourceCardId,
          targetCardId,
          amount: continuation.amount,
        }
      : undefined;
  const placement =
    !isMoveChoice &&
    Array.isArray(continuation?.placements) &&
    continuation.placements.every(
      (entry): entry is { targetCardId: string; amount: number } =>
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as { targetCardId?: unknown }).targetCardId ===
          "string" &&
        typeof (entry as { amount?: unknown }).amount === "number" &&
        Number.isInteger((entry as { amount: number }).amount) &&
        (entry as { amount: number }).amount > 0,
    )
      ? { placements: continuation.placements }
      : undefined;
  const exactContinuation =
    portfolio !== undefined &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    typeof moduleState.signal?.agendaInstanceId === "string" &&
    moduleState.signal.agendaInstanceId === targetCardId &&
    continuation?.family === "corp_advancement_counter" &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    choiceContinuation?.family === "corp_advancement_counter" &&
    choiceContinuation.originActionId === continuation.selectedActionId &&
    choiceContinuation.createdAtStateVersion ===
      input.playerView.stateVersion &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    portfolio.stateVersion + 1 === input.playerView.stateVersion &&
    choice.stateVersion === input.playerView.stateVersion &&
    targetCardId !== undefined &&
    (move
      ? selectableOptions.some(
          (option) =>
            option.value ===
            `${move.sourceCardId}|${move.targetCardId}|${move.amount}`,
        )
      : placement
        ? selectableOptions.some((option) =>
            advancementChoiceOptionMatchesPlacements(
              option.value,
              placement.placements,
            ),
          )
        : !isMoveChoice &&
          selectableOptions.some((option) =>
            advancementChoiceOptionTargetsCard(option.value, targetCardId),
          ));
  if (!exactContinuation || !executor || !targetCardId) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "Bind the advancement choice to the immediately preceding resident Corp score executor, selected score-conversion action and exact agenda target.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return {
    planInstanceId: executor.instanceId,
    targetCardId,
    ...(move ? { move } : {}),
    ...(placement ? { placement } : {}),
  };
}

export function selectedCorpScoredAgendaSubtypeRevealOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceMatch =
    /^scored_agenda\.subtype_reveal:([^:]+):(code_gate|wall):([0-9]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const creditPer = Number(sourceMatch?.[3]);
  const sourceStateVersion = Number(sourceMatch?.[4]);
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.known &&
          card.type === "agenda" &&
          card.instanceId === sourceAgendaId,
      )
    : undefined;
  const installedIceById = new Map(
    input.playerView.servers.flatMap((server) =>
      server.ice
        .filter((ice) => ice.known && ice.type === "ice" && !ice.rezzed)
        .map((ice) => [ice.instanceId, ice] as const),
    ),
  );
  const exactOptions = selectableOptions.every(
    (option) =>
      typeof option.value === "string" &&
      option.id === `card_${option.value}` &&
      installedIceById.has(option.value),
  );
  const selectedOptionIds = selectableOptions.map((option) => option.id);
  const [requirement] = action.choiceRequirements ?? [];
  const exactContinuation =
    input.side === "corp" &&
    sourceAgenda !== undefined &&
    Number.isSafeInteger(creditPer) &&
    creditPer > 0 &&
    sourceStateVersion === input.playerView.stateVersion &&
    portfolio !== undefined &&
    portfolio.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion - 1 &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    moduleState.signal?.agendaInstanceId === sourceAgendaId &&
    continuation?.family === "corp_scored_agenda_on_score" &&
    continuation.targetCardId === sourceAgendaId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    choice.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 0 &&
    choice.maxSelections === selectableOptions.length &&
    selectableOptions.length > 0 &&
    exactOptions &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 0 &&
    requirement.maxSelections === selectableOptions.length &&
    requirement.optionIds.length === selectedOptionIds.length &&
    selectedOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  if (!exactContinuation || !executor) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "continuation",
      removalCondition:
        "Bind scored-agenda subtype reveals to the immediately preceding resident Corp score executor, exact scored agenda and complete current Engine option set.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return selectedOptionIds;
}

export function selectedCorpScoredAgendaIceMarkOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceMatch =
    /^card_implementation_primitive\.select_rezzed_ice_mark_modifier:([^:\s]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
          iceMarkChoiceBinding?: {
            sourceCapabilityId?: unknown;
            targetPurpose?: unknown;
            targetCardId?: unknown;
            targetDefinitionId?: unknown;
          };
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const binding = continuation?.iceMarkChoiceBinding;
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) => card.instanceId === sourceAgendaId,
      )
    : undefined;
  const sourceProfile = corpScoredAgendaIceMarkProfile(
    sourceAgenda?.definitionId,
  );
  const targetCard = input.playerView.servers
    .flatMap((server) => server.ice)
    .find((ice) => ice.instanceId === binding?.targetCardId);
  const matchingTargetOptions = selectableOptions.filter(
    (option) => option.value === binding?.targetCardId,
  );
  const [requirement] = action.choiceRequirements ?? [];
  const exactContinuation =
    input.side === "corp" &&
    choice.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.visibility === "public" &&
    choice.stateVersion === input.playerView.stateVersion &&
    sourceStateVersion === input.playerView.stateVersion &&
    choice.sourceCardInstanceId === sourceAgendaId &&
    choice.sourceCardDefinitionId === sourceAgenda?.definitionId &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    portfolio !== undefined &&
    portfolio.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion - 1 &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    moduleState.signal?.agendaInstanceId === sourceAgendaId &&
    continuation?.family === "corp_scored_agenda_on_score" &&
    continuation.targetCardId === sourceAgendaId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    sourceAgenda?.known === true &&
    sourceAgenda.type === "agenda" &&
    sourceProfile !== undefined &&
    binding?.sourceCapabilityId === sourceProfile.sourceCapabilityId &&
    binding.targetPurpose === sourceProfile.targetPurpose &&
    targetCard?.known === true &&
    targetCard.type === "ice" &&
    targetCard.rezzed === true &&
    targetCard.definitionId === binding.targetDefinitionId &&
    matchingTargetOptions.length === 1 &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === selectableOptions.length &&
    selectableOptions.every((option) =>
      requirement.optionIds.includes(option.id),
    );
  if (!exactContinuation) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "continuation",
      removalCondition:
        "Bind the scored-agenda ICE-mark target to the immediately preceding resident Corp score executor, canonical source capability, Defense-selected visible rezzed ICE and current Engine choice contract.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return [matchingTargetOptions[0]!.id];
}

export function selectedCorpScoredAgendaFreeRezOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceMatch =
    /^card_implementation\.scored_agenda_free_rez:([^:\s]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
          freeRezChoiceBinding?: {
            sourceCapabilityId?: unknown;
            targetPurpose?: unknown;
            targetCardId?: unknown;
            targetDefinitionId?: unknown;
            selectedVariantId?: unknown;
            selectedOptionId?: unknown;
          };
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const binding = continuation?.freeRezChoiceBinding;
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) => card.instanceId === sourceAgendaId,
      )
    : undefined;
  const sourceProfile = corpScoredAgendaFreeRezProfile(
    sourceAgenda?.definitionId,
  );
  const targetCard = input.playerView.servers
    .flatMap((server) => server.ice)
    .find((ice) => ice.instanceId === binding?.targetCardId);
  const matchingTargetOptions = selectableOptions.filter(
    (option) =>
      option.id === binding?.selectedOptionId &&
      option.value === `${binding?.targetCardId}|${binding?.selectedVariantId}`,
  );
  const [requirement] = action.choiceRequirements ?? [];
  const exactContinuation =
    input.side === "corp" &&
    choice.side === "corp" &&
    choice.kind === "select_option" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    sourceStateVersion === input.playerView.stateVersion &&
    choice.choiceId ===
      `v162_scored_agenda_free_rez_${input.playerView.stateVersion}` &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    portfolio !== undefined &&
    portfolio.side === "corp" &&
    // Opening Priority Requisition's Engine-owned choice is the single
    // committed score transition. The resident executor therefore remains
    // bound to the exact pre-score state, one version earlier.
    portfolio.stateVersion === input.playerView.stateVersion - 1 &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    moduleState.signal?.agendaInstanceId === sourceAgendaId &&
    continuation?.family === "corp_scored_agenda_on_score" &&
    continuation.targetCardId === sourceAgendaId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    sourceAgenda?.known === true &&
    sourceAgenda.type === "agenda" &&
    sourceProfile !== undefined &&
    binding?.sourceCapabilityId === sourceProfile.sourceCapabilityId &&
    binding.targetPurpose === sourceProfile.targetPurpose &&
    targetCard?.known === true &&
    targetCard.type === "ice" &&
    targetCard.rezzed === false &&
    targetCard.definitionId === binding.targetDefinitionId &&
    binding.selectedOptionId ===
      `rez_${binding.targetCardId}_${binding.selectedVariantId}` &&
    matchingTargetOptions.length === 1 &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === selectableOptions.length &&
    selectableOptions.every((option) =>
      requirement.optionIds.includes(option.id),
    );
  if (!exactContinuation) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "continuation",
      removalCondition:
        "Bind the scored-agenda free-rez target and exact rez variant to the immediately preceding resident Corp score executor, canonical source capability, exact visible ICE and current Engine choice contract.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return [matchingTargetOptions[0]!.id];
}

export function residentCorpScoredAgendaHqShuffleBinding(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): { planInstanceId: string; selectedOptionIds: string[] } {
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
          hqAgendaShuffleChoiceBinding?: {
            sourceCapabilityId?: unknown;
            creditPerAgendaPoint?: unknown;
            selectedCardInstanceIds?: unknown;
          };
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const choiceContinuation = choice.continuation;
  const knownHqAgendaIds = input.playerView.own.gripOrHq
    .filter((card) => card.known && card.type === "agenda")
    .map((card) => card.instanceId)
    .sort();
  const boundSelection = continuation?.hqAgendaShuffleChoiceBinding;
  const boundCardInstanceIds = Array.isArray(
    boundSelection?.selectedCardInstanceIds,
  )
    ? boundSelection.selectedCardInstanceIds.filter(
        (cardId): cardId is string => typeof cardId === "string",
      )
    : [];
  const selectedOptionIds = boundCardInstanceIds.flatMap((cardId) => {
    const option = selectableOptions.find(
      (candidate) => candidate.value === cardId,
    );
    return option ? [option.id] : [];
  });
  const allOptionIds = selectableOptions.map((option) => option.id);
  const [choiceRequirement] = action.choiceRequirements ?? [];
  const optionAgendaIds = selectableOptions
    .map((option) =>
      typeof option.value === "string" ? option.value : undefined,
    )
    .filter((cardId): cardId is string => cardId !== undefined)
    .sort();
  const exactContinuation =
    choiceContinuation?.family === "corp_scored_agenda_hq_shuffle" &&
    choiceContinuation.createdAtStateVersion ===
      input.playerView.stateVersion &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    choiceRequirement?.choiceId === choice.choiceId &&
    choiceRequirement.minSelections === choice.minSelections &&
    choiceRequirement.maxSelections === choice.maxSelections &&
    choiceRequirement.optionIds.length === allOptionIds.length &&
    choiceRequirement.optionIds.every(
      (optionId, index) => optionId === allOptionIds[index],
    ) &&
    portfolio !== undefined &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    moduleState.signal?.agendaInstanceId ===
      choiceContinuation.agendaInstanceId &&
    continuation?.family === "corp_scored_agenda_on_score" &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    choiceContinuation.originActionId === continuation.selectedActionId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    continuation.targetCardId === choiceContinuation.agendaInstanceId &&
    portfolio.stateVersion + 1 === input.playerView.stateVersion &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 0 &&
    choice.maxSelections === selectableOptions.length &&
    optionAgendaIds.length === selectableOptions.length &&
    optionAgendaIds.length === knownHqAgendaIds.length &&
    optionAgendaIds.every(
      (cardId, index) => cardId === knownHqAgendaIds[index],
    ) &&
    input.playerView.own.scoreArea.some(
      (card) =>
        card.known &&
        card.type === "agenda" &&
        card.instanceId === choiceContinuation.agendaInstanceId,
    ) &&
    (() => {
      const sourceAgenda = input.playerView.own.scoreArea.find(
        (card) => card.instanceId === choiceContinuation.agendaInstanceId,
      );
      const profile = corpScoredAgendaHqShuffleProfile(
        sourceAgenda?.definitionId,
      );
      return (
        profile !== undefined &&
        boundSelection?.sourceCapabilityId === profile.sourceCapabilityId &&
        boundSelection.creditPerAgendaPoint === profile.creditPerAgendaPoint &&
        Array.isArray(boundSelection.selectedCardInstanceIds) &&
        boundCardInstanceIds.length ===
          boundSelection.selectedCardInstanceIds.length &&
        new Set(boundCardInstanceIds).size === boundCardInstanceIds.length &&
        boundCardInstanceIds.every((cardId) =>
          knownHqAgendaIds.includes(cardId),
        ) &&
        selectedOptionIds.length === boundCardInstanceIds.length
      );
    })();
  if (!exactContinuation || !executor) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "Bind the scored-agenda HQ shuffle to the immediately preceding resident Corp score executor, exact scored agenda, state version and complete visible HQ-agenda option set.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return { planInstanceId: executor.instanceId, selectedOptionIds };
}

function advancementChoiceOptionTargetsCard(
  value: PendingChoiceOptions[number]["value"],
  targetCardId: string,
): boolean {
  if (typeof value !== "string") return false;
  const moveParts = value.split("|");
  if (moveParts.length === 3 && !value.includes(":")) {
    return moveParts[1] === targetCardId;
  }
  return value.split("|").some((placement) => {
    const [cardId, amount] = placement.split(":");
    return (
      cardId === targetCardId &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > 0
    );
  });
}

function advancementChoiceOptionMatchesPlacements(
  value: PendingChoiceOptions[number]["value"],
  placements: Array<{ targetCardId: string; amount: number }>,
): boolean {
  if (typeof value !== "string" || !value.includes(":")) return false;
  const valueSignature = value
    .split("|")
    .map((placement) => {
      const [cardId, amount] = placement.split(":");
      return `${cardId}:${Number(amount)}`;
    })
    .sort()
    .join("|");
  const plannedSignature = placements
    .map((placement) => `${placement.targetCardId}:${placement.amount}`)
    .sort()
    .join("|");
  return valueSignature === plannedSignature;
}
