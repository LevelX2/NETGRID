import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import {
  knownNonNegativeInteger,
  nonEmptyString,
  technicalCompare,
} from "./defense-validation";

export function corpAgendaPurgeDefenseChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  centralAllocation: CorpCentralDefenseAllocation | undefined,
): CorpGenericDefenseSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    choice?.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "hidden_info_barrier" ||
    choice.stateVersion !== input.playerView.stateVersion
  ) {
    return undefined;
  }
  const sourceMatch =
    /^card_implementation\.agenda_purge_install_targets:([^:]+):([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const revealedCardIds =
    sourceMatch?.[2]?.split(",").filter((cardId) => cardId.length > 0) ?? [];
  const sourceStateVersion = Number(sourceMatch?.[3]);
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceAgendaId &&
          card.known &&
          card.type === "agenda" &&
          nonEmptyString(card.definitionId),
      )
    : undefined;
  const action = input.legalActions.find(
    (legalAction) =>
      legalAction.side === "corp" &&
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
  const actionChoiceContractIsExact =
    requirement !== undefined &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  if (
    !sourceAgendaId ||
    !sourceAgenda?.definitionId ||
    !action ||
    !candidate ||
    !actionChoiceContractIsExact ||
    sourceStateVersion !== input.playerView.stateVersion ||
    revealedCardIds.length === 0 ||
    new Set(revealedCardIds).size !== revealedCardIds.length ||
    choice.minSelections <= 0 ||
    choice.minSelections !== choice.maxSelections
  ) {
    return undefined;
  }

  const targetServerIds = input.playerView.servers.map((server) => server.id);
  const allowedTargetServerIds = new Set([...targetServerIds, "new_remote"]);
  const revealedCardIdSet = new Set(revealedCardIds);
  const optionsByCardId = new Map<
    string,
    Map<
      string,
      Array<{
        optionId: string;
        serverId: string;
        rezVariantId: string;
        creditCost: number;
      }>
    >
  >();
  for (const option of choice.options.filter(
    (candidateOption) => candidateOption.selectable !== false,
  )) {
    const parts =
      typeof option.value === "string" ? option.value.split("|") : [];
    const [cardId, serverId, rezVariantId] = parts;
    const creditCost = option.metadata?.creditCost;
    if (
      parts.length !== 3 ||
      !cardId ||
      !serverId ||
      !rezVariantId ||
      !knownNonNegativeInteger(creditCost) ||
      !revealedCardIdSet.has(cardId) ||
      !allowedTargetServerIds.has(serverId) ||
      option.id !== `agenda_purge_${cardId}_${serverId}_${rezVariantId}`
    ) {
      return undefined;
    }
    const byServer =
      optionsByCardId.get(cardId) ??
      new Map<
        string,
        Array<{
          optionId: string;
          serverId: string;
          rezVariantId: string;
          creditCost: number;
        }>
      >();
    const variants = byServer.get(serverId) ?? [];
    if (variants.some((variant) => variant.rezVariantId === rezVariantId)) {
      return undefined;
    }
    variants.push({
      optionId: option.id,
      serverId,
      rezVariantId,
      creditCost,
    });
    byServer.set(serverId, variants);
    optionsByCardId.set(cardId, byServer);
  }
  if (
    optionsByCardId.size !== choice.minSelections ||
    [...optionsByCardId.values()].some((byServer) => byServer.size === 0)
  ) {
    return undefined;
  }

  const plannedLayers = new Map<string, number>();
  let remainingCredits = input.playerView.own.credits;
  const targets: Array<{
    cardId: string;
    serverId: string;
    optionId: string;
  }> = [];
  for (const [cardId, byServer] of optionsByCardId.entries()) {
    const serverId = [...byServer.keys()].sort((left, right) => {
      const difference =
        corpAgendaPurgeDefenseTargetValue(
          input,
          right,
          centralAllocation,
          plannedLayers,
        ) -
        corpAgendaPurgeDefenseTargetValue(
          input,
          left,
          centralAllocation,
          plannedLayers,
        );
      return difference || technicalCompare(left, right);
    })[0]!;
    const selectedVariant = byServer
      .get(serverId)!
      .filter((variant) => variant.creditCost <= remainingCredits)
      .sort(
        (left, right) =>
          left.creditCost - right.creditCost ||
          technicalCompare(left.optionId, right.optionId),
      )[0];
    if (!selectedVariant) return undefined;
    remainingCredits -= selectedVariant.creditCost;
    plannedLayers.set(serverId, (plannedLayers.get(serverId) ?? 0) + 1);
    targets.push({
      cardId,
      serverId,
      optionId: selectedVariant.optionId,
    });
  }
  if (targets.length !== choice.minSelections || !targets[0]) return undefined;

  return {
    kind: "generic",
    defenseId: `agenda-purge-install-targets:${choice.choiceId}`,
    serverId: targets[0].serverId,
    phase: "resolve_install_targets",
    sourceDefinitionIds: [sourceAgenda.definitionId],
    actionIds: [action.actionId],
    urgent: true,
    value: 1_000,
    evidenceCode: "agenda_purge_ice_allocation_owned_by_corp_defend_servers",
    choiceResolution: {
      kind: "agenda_purge_install_targets",
      choiceId: choice.choiceId,
      sourceAgendaId,
      sourceStateVersion,
      revealedCardIds,
      targets,
    },
  };
}

type ClassicDeflectorChoiceContext = Readonly<{
  runId: string;
  sourceIceInstanceId: string;
  subroutineIndex: number;
  sourceDefinitionId: string;
  subroutineId: string;
  targetProfile: "archives" | "any_data_fort" | "subsidiary_data_fort";
  creditCost: number;
  autoBreakIfNoTarget: boolean;
}>;

export function corpClassicDeflectorDefenseChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  centralAllocation: CorpCentralDefenseAllocation | undefined,
  requiredCreditFloor: number,
): CorpGenericDefenseSignal | undefined {
  const choice = input.playerView.pendingChoice;
  const context = choice
    ? parseClassicDeflectorChoiceContext(choice.source)
    : undefined;
  if (
    input.side !== "corp" ||
    choice?.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    !context ||
    !knownNonNegativeInteger(requiredCreditFloor)
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) =>
      legalAction.side === "corp" &&
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
  const run = input.playerView.run;
  const sourceServer = run
    ? input.playerView.servers.find(
        (server) =>
          server.id === run.position?.serverId &&
          run.position.kind === "ice" &&
          server.ice[run.position.iceIndex]?.instanceId ===
            context.sourceIceInstanceId,
      )
    : undefined;
  const sourceIce = sourceServer?.ice.find(
    (ice) => ice.instanceId === context.sourceIceInstanceId,
  );
  const quotedSubroutine =
    sourceIce?.effectiveRunQuote?.subroutines[context.subroutineIndex];
  if (
    !action ||
    !candidate ||
    !exactActionBinding ||
    !run ||
    run.phase !== "encounter_ice" ||
    run.encounteredIce?.instanceId !== context.sourceIceInstanceId ||
    sourceIce?.definitionId !== context.sourceDefinitionId ||
    sourceIce.rezzed !== true ||
    sourceIce.effectiveRunQuote?.iceInstanceId !==
      context.sourceIceInstanceId ||
    sourceIce.effectiveRunQuote.iceDefinitionId !==
      context.sourceDefinitionId ||
    quotedSubroutine?.id !== context.subroutineId ||
    quotedSubroutine.type !== "deflect_run" ||
    quotedSubroutine.deflectorTarget !== context.targetProfile ||
    (quotedSubroutine.deflectorCost ?? 0) !== context.creditCost ||
    (quotedSubroutine.deflectorAutoBreakIfNoTarget === true) !==
      context.autoBreakIfNoTarget
  ) {
    return undefined;
  }

  const eligibleServerIds = input.playerView.servers
    .filter((server) =>
      context.targetProfile === "archives"
        ? server.id === "archives"
        : context.targetProfile === "subsidiary_data_fort"
          ? server.id.startsWith("remote_")
          : true,
    )
    .map((server) => server.id);
  const eligibleServerIdSet = new Set<string>(eligibleServerIds);
  const optionsByServerId = new Map<string, string>();
  let declineOptionId: string | undefined;
  for (const option of choice.options) {
    if (option.selectable === false || typeof option.value !== "string") {
      return undefined;
    }
    if (option.value === "decline") {
      if (declineOptionId || option.id !== "decline") return undefined;
      declineOptionId = option.id;
      continue;
    }
    if (
      !eligibleServerIdSet.has(option.value) ||
      option.id !== `server_${option.value}` ||
      optionsByServerId.has(option.value)
    ) {
      return undefined;
    }
    optionsByServerId.set(option.value, option.id);
  }
  if (
    optionsByServerId.size !== eligibleServerIds.length ||
    eligibleServerIds.some((serverId) => !optionsByServerId.has(serverId)) ||
    context.creditCost > 0 !== (declineOptionId !== undefined)
  ) {
    return undefined;
  }

  const redirectTargets = eligibleServerIds
    .filter((serverId) => serverId !== run.attackedServerId)
    .sort((left, right) => {
      const difference =
        classicDeflectorServerExposure(input, left, centralAllocation) -
        classicDeflectorServerExposure(input, right, centralAllocation);
      return difference || technicalCompare(left, right);
    });
  const selectedServerId = redirectTargets[0];
  const sourceExposure =
    classicDeflectorServerExposure(
      input,
      run.attackedServerId,
      centralAllocation,
    ) + 1_000;
  const targetExposure = selectedServerId
    ? classicDeflectorServerExposure(input, selectedServerId, centralAllocation)
    : Number.POSITIVE_INFINITY;
  const canPay =
    input.playerView.own.credits - context.creditCost >= requiredCreditFloor;
  const redirectIsProductive =
    selectedServerId !== undefined &&
    (context.creditCost === 0 ||
      (canPay && sourceExposure - targetExposure > context.creditCost * 250));
  const selectedOptionId = redirectIsProductive
    ? optionsByServerId.get(selectedServerId!)
    : declineOptionId;
  if (!selectedOptionId) return undefined;

  return {
    kind: "generic",
    defenseId: `classic-deflector:${choice.choiceId}`,
    serverId: redirectIsProductive ? selectedServerId! : run.attackedServerId,
    phase: "resolve_run_redirect",
    sourceDefinitionIds: [context.sourceDefinitionId],
    actionIds: [action.actionId],
    urgent: true,
    value: 1_000 + Math.max(0, sourceExposure - targetExposure),
    evidenceCode: "classic_deflector_redirect_owned_by_corp_defend_servers",
    choiceResolution: {
      kind: "classic_deflector_redirect",
      choiceId: choice.choiceId,
      sourceStateVersion: input.playerView.stateVersion,
      runId: context.runId,
      sourceIceInstanceId: context.sourceIceInstanceId,
      sourceDefinitionId: context.sourceDefinitionId,
      subroutineIndex: context.subroutineIndex,
      subroutineId: context.subroutineId,
      targetProfile: context.targetProfile,
      creditCost: context.creditCost,
      autoBreakIfNoTarget: context.autoBreakIfNoTarget,
      selectedOptionId,
      disposition: redirectIsProductive ? "redirect" : "decline",
      ...(redirectIsProductive ? { selectedServerId } : {}),
    },
  };
}

function parseClassicDeflectorChoiceContext(
  source: string,
): ClassicDeflectorChoiceContext | undefined {
  const parts = source.split(":");
  if (
    parts.length !== 9 ||
    parts[0] !== "card_implementation.classic_deflector" ||
    !parts[1] ||
    !parts[2] ||
    !parts[4] ||
    !parts[5] ||
    (parts[6] !== "archives" &&
      parts[6] !== "any_data_fort" &&
      parts[6] !== "subsidiary_data_fort")
  ) {
    return undefined;
  }
  const subroutineIndex = Number(parts[3]);
  const creditCost = Number(parts[7]);
  if (
    !knownNonNegativeInteger(subroutineIndex) ||
    !knownNonNegativeInteger(creditCost) ||
    (parts[8] !== "0" && parts[8] !== "1")
  ) {
    return undefined;
  }
  try {
    return {
      runId: decodeURIComponent(parts[1]),
      sourceIceInstanceId: decodeURIComponent(parts[2]),
      subroutineIndex,
      sourceDefinitionId: decodeURIComponent(parts[4]),
      subroutineId: decodeURIComponent(parts[5]),
      targetProfile: parts[6],
      creditCost,
      autoBreakIfNoTarget: parts[8] === "1",
    };
  } catch {
    return undefined;
  }
}

function classicDeflectorServerExposure(
  input: AiDecisionInput,
  serverId: string,
  centralAllocation: CorpCentralDefenseAllocation | undefined,
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return Number.POSITIVE_INFINITY;
  const ownAgendaCount =
    serverId === "hq"
      ? input.playerView.own.gripOrHq.filter((card) => card.type === "agenda")
          .length
      : serverId === "archives"
        ? input.playerView.own.heapOrArchives.filter(
            (card) => card.type === "agenda",
          ).length
        : server.root.filter((card) => card.known && card.type === "agenda")
            .length;
  const centralBase = serverId === "rd" ? 1_500 : serverId === "hq" ? 1_000 : 0;
  const allocationPressure =
    centralAllocation?.status === "known" &&
    centralAllocation.selectedServerId === serverId
      ? 2_000
      : 0;
  const visibleRootValue = server.root.length * 250;
  const outermostRezzedIce = [...server.ice]
    .reverse()
    .find((ice) => ice.rezzed === true);
  const rezzedIceProtection = outermostRezzedIce ? 1_000 : 0;
  return (
    ownAgendaCount * 5_000 +
    centralBase +
    allocationPressure +
    visibleRootValue -
    rezzedIceProtection
  );
}

function corpAgendaPurgeDefenseTargetValue(
  input: AiDecisionInput,
  serverId: string,
  centralAllocation: CorpCentralDefenseAllocation | undefined,
  plannedLayers: ReadonlyMap<string, number>,
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const installedLayers = server?.ice.length ?? 0;
  const additionalLayers = plannedLayers.get(serverId) ?? 0;
  const layerPenalty = (installedLayers + additionalLayers) * 1_500;
  if (serverId === "new_remote") return -layerPenalty;
  const visibleAgendaCount =
    server?.root.filter((card) => card.known && card.type === "agenda")
      .length ?? 0;
  if (serverId.startsWith("remote_") && visibleAgendaCount > 0) {
    return 5_000 + visibleAgendaCount * 250 - layerPenalty;
  }
  if (
    centralAllocation?.status === "known" &&
    serverId === centralAllocation.selectedServerId
  ) {
    return 4_000 - layerPenalty;
  }
  if (serverId === "hq" || serverId === "rd") {
    return (
      (centralAllocation?.status === "known" ? 3_000 : 2_750) - layerPenalty
    );
  }
  if (serverId.startsWith("remote_") && (server?.root.length ?? 0) > 0) {
    return 2_500 - layerPenalty;
  }
  if (serverId === "archives") return 750 - layerPenalty;
  if (serverId.startsWith("remote_")) return 500 - layerPenalty;
  return 250 - layerPenalty;
}
