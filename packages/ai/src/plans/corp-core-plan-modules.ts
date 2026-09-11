import { scoreModule } from "../corp/score/score-plan-module";

import type { AiDecisionInput, VisibleCorpRezCostQuote } from "@netgrid/shared";

import { remoteModule } from "../corp/scoring-remote/scoring-remote-plan-module";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

import { economyModule } from "../corp/economy/economy-plan-module";

import {
  corpEconomyCandidateHasExecutablePayload,
  economyCandidates,
  immediateCorpLiquidCreditGain,
} from "../corp/economy/economy-routes";

import type { CorpCentralDefenseAllocation } from "../runtime/corp-central-defense-allocation";

import { assessFundingOnlyIceStaging } from "../runtime/corp-defense-staging-policy";

import {
  exactCorpIceRezRoutesEqual,
  projectExactCorpIceRezRoute,
  type CorpExactIceRezRouteProjection,
} from "../runtime/corp-exact-ice-rez-route";

import {
  assessBestFundedCorpScoreProtection,
  type KnownCorpFundedIceInstallRouteProjection,
} from "../runtime/corp-funded-score-protection";

import {
  compareExactProbabilities,
  type ExactProbability,
} from "../runtime/corp-score-protection-assessment";

import {
  assessment,
  candidateTargetIds,
  corpDomainIfAvailable,
  domain,
  proposal,
  state,
} from "./corp-core-module-support";

import { DefenseState } from "./corp-core-plan-contracts";

import {
  CorpDefenseSignal,
  CorpGenericDefenseSignal,
  CorpScoreProtectionDrawSignal,
  CorpScoreProtectionInstallSignal,
  CorpScoreProtectionStagingInstallSignal,
} from "./corp-defense-contracts";

import {
  corpGenericDefensePriorityClass,
  genericDefenseFundingRequirement,
  genericDefenseFundingRequirementIsCurrent,
} from "./corp-defense-funding-contract";

import { CorpScorePriorityClass } from "./corp-score-contracts";

import { corpScorePriorityClass } from "../corp/score/corp-score-priority";

import type { PriorityClass, ResourceGap } from "./plan-assessment";

import { planInstanceIdForProposal } from "./plan-instance";

import { PlanResolutionFailure } from "./plan-resolution-failure";

import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";

export type { CorpRemoteProjectSignal } from "../corp/scoring-remote/scoring-remote-types";

export type { CorpExactIceRezRouteProjection };

export const CORP_CORE_ACTION_OWNERSHIP = {
  "install.agenda": "corp.score_agenda",
  "score.advance_card": "corp.score_agenda",
  "score.agenda": "corp.score_agenda",
  "install.ice": "corp.defend_servers",
  "economy.gain_credit": "corp.economy",
} as const;

export function createCorpCorePlanModules(): PlanModule[] {
  return [scoreModule(), remoteModule(), defenseModule(), economyModule()];
}

export function corpCoreActionOwner(
  semanticFamily: keyof typeof CORP_CORE_ACTION_OWNERSHIP,
): (typeof CORP_CORE_ACTION_OWNERSHIP)[typeof semanticFamily] {
  return CORP_CORE_ACTION_OWNERSHIP[semanticFamily];
}

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

function defenseModule(): PlanModule {
  return {
    moduleId: "corp.defend_servers",
    side: "corp",
    discover: (context) => {
      const currentDomain = domain(context);
      const signals = validDefenseSignals(currentDomain.defenseNeeds, context);
      if (signals.length === 0) return [];
      const selectedBand = selectedDefensePortfolioBand(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const candidates = selectedBand.candidates;
      const priorityClass = selectedBand.priorityClass;
      const scoreProtectionRoute =
        selectedBand.kind === "score" ? selectedBand.route : undefined;
      const remoteProtectionRoute = selectedRemoteProtectionRoute(selectedBand);
      const ownPriorityClass: PriorityClass = scoreProtectionRoute
        ? "P5"
        : priorityClass;
      const parentNeedId = scoreProtectionRoute
        ? exactScoreProtectionParentNeedId(context, scoreProtectionRoute.signal)
        : undefined;
      const resourceGaps = defenseResourceGaps(selectedBand);
      return [
        proposal({
          moduleId: "corp.defend_servers",
          dedupeKey: "server-defense-portfolio",
          moduleState: {
            kind: "defense",
            signals,
            ...(currentDomain.centralDefenseAllocation
              ? {
                  centralAllocation: currentDomain.centralDefenseAllocation,
                }
              : {}),
            ...(currentDomain.centralDefenseHqHoldCadence
              ? {
                  hqHoldCadence: currentDomain.centralDefenseHqHoldCadence,
                }
              : {}),
            ...(currentDomain.centralDefenseHqHoldSelection
              ? {
                  hqHoldSelection: currentDomain.centralDefenseHqHoldSelection,
                }
              : {}),
          } satisfies DefenseState,
          priorityClass: ownPriorityClass,
          target: { kind: "capability", id: "allocate_server_defense" },
          routeExists: candidates.length > 0,
          supportable: resourceGaps.length > 0,
          evidenceCode: defensePortfolioEvidenceCode(
            context,
            signals,
            currentDomain.centralDefenseAllocation,
          ),
          ...(scoreProtectionRoute
            ? {
                parentInstanceId: planInstanceIdForProposal({
                  moduleId: "corp.score_agenda",
                  dedupeKey: scoreProtectionRoute.signal.parentProjectId,
                }),
                parentNeedId: parentNeedId!,
              }
            : remoteProtectionRoute
              ? {
                  parentInstanceId: planInstanceIdForProposal({
                    moduleId: "corp.establish_scoring_remote",
                    dedupeKey: remoteProtectionRoute.parentProjectId!,
                  }),
                  parentNeedId: exactRemoteProtectionParentNeedId(
                    context,
                    remoteProtectionRoute,
                  ),
                }
              : {}),
          persistencePolicy:
            priorityClass === "P2" || priorityClass === "P3"
              ? "locked_sequence"
              : scoreProtectionRoute
                ? "flexible_support"
                : remoteProtectionRoute
                  ? "flexible_support"
                  : "sticky_goal",
        }),
      ];
    },
    assess: (instance, context, portfolio) => {
      state<DefenseState>(instance);
      const currentDomain = domain(context);
      const signals = validDefenseSignals(currentDomain.defenseNeeds, context);
      const selectedBand = selectedDefensePortfolioBand(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const priorityClass: PriorityClass =
        selectedBand.kind === "score" ? "P5" : selectedBand.priorityClass;
      const candidates = defensePortfolioCandidates(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const resourceGaps = defenseResourceGaps(selectedBand);
      return {
        ...assessment(
          instance,
          priorityClass,
          resourceGaps.length === 0 && candidates.length > 0,
          defensePortfolioAssessmentValue(
            context,
            signals,
            priorityClass,
            currentDomain.centralDefenseAllocation,
          ),
          portfolio.executorInstanceId,
          resourceGaps,
        ),
        evidenceCodes: [
          defensePortfolioEvidenceCode(
            context,
            signals,
            currentDomain.centralDefenseAllocation,
          ),
        ],
      };
    },
    materialize: (instance, _assessment, context) => {
      state<DefenseState>(instance);
      const currentDomain = domain(context);
      const signals = validDefenseSignals(currentDomain.defenseNeeds, context);
      const selectedBand = selectedDefensePortfolioBand(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const scoreProtectionRoute =
        selectedBand.kind === "score" ? selectedBand.route : undefined;
      const remoteProtectionRoute = selectedRemoteProtectionRoute(selectedBand);
      const candidates = defensePortfolioCandidates(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const engineRandomizedIceInstallNearTie =
        engineRandomizedCentralIceInstallNearTie(
          context,
          candidates,
          currentDomain.centralDefenseAllocation,
        );
      const semanticActionTypes = [
        ...new Set(
          candidates.map((entry) => entry.candidate.semanticActionType),
        ),
      ];
      return {
        step: {
          stepId: `${instance.instanceId}:${
            scoreProtectionRoute
              ? "develop_score_protection"
              : remoteProtectionRoute
                ? "improve_remote_protection_path"
                : "allocate"
          }`,
          capability: {
            capabilityId: scoreProtectionRoute
              ? "develop_score_protection"
              : remoteProtectionRoute
                ? "improve_remote_protection_path"
                : "allocate_server_defense",
            semanticActionTypes,
          },
          ...(remoteProtectionRoute
            ? {
                target: {
                  kind: "server" as const,
                  id: remoteProtectionRoute.serverId,
                },
              }
            : scoreProtectionRoute?.signal.kind ===
                  "score_protection_install" ||
                scoreProtectionRoute?.signal.kind ===
                  "score_protection_staging_install"
              ? {
                  target: {
                    kind: "server" as const,
                    id: scoreProtectionRoute.signal.serverId,
                  },
                }
              : {}),
          purpose: scoreProtectionRoute
            ? `Develop exact current protection for resident score project ${scoreProtectionRoute.signal.parentProjectId}, then observe and revalidate its next route.`
            : remoteProtectionRoute
              ? `Improve the exact ordered protection path for resident remote project ${remoteProtectionRoute.parentProjectId}, then re-quote maturity.`
              : "Allocate the best currently available defense resource across all visible server needs.",
        },
        candidates,
        ...(engineRandomizedIceInstallNearTie
          ? { engineRandomizedIceInstallNearTie }
          : {}),
      };
    },
  };
}

function engineRandomizedCentralIceInstallNearTie(
  context: PlanSchedulerContext,
  candidates: PlanMaterialization["candidates"],
  allocation: CorpCentralDefenseAllocation | undefined,
): PlanMaterialization["engineRandomizedIceInstallNearTie"] | undefined {
  if (
    allocation?.status !== "known" ||
    allocation.canonicalNearTieCandidateServerIds.length !== 2 ||
    allocation.canonicalNearTieCandidateServerIds[0] !== "hq" ||
    allocation.canonicalNearTieCandidateServerIds[1] !== "rd"
  ) {
    return undefined;
  }
  const candidateForServer = (
    serverId: "hq" | "rd",
  ): PlanMaterialization["candidates"][number] | undefined =>
    candidates
      .filter(({ candidate }) => {
        if (
          candidate.semanticActionType !== "install.card" ||
          !candidateTargetIds(candidate).includes(serverId)
        ) {
          return false;
        }
        const action = context.input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        return (
          action?.type === "install_card" &&
          action.side === "corp" &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.payload?.placement === "ice" &&
          action.payload.serverId === serverId &&
          (action.choiceRequirements?.length ?? 0) === 0 &&
          action.targetRequirements.length === 0
        );
      })
      .sort((left, right) =>
        left.candidate.actionId.localeCompare(right.candidate.actionId),
      )[0];
  const hq = candidateForServer("hq");
  const rd = candidateForServer("rd");
  if (!hq || !rd || hq.candidate.actionId === rd.candidate.actionId) {
    return undefined;
  }
  return {
    kind: "engine_randomized_ice_install_selection",
    candidates: [
      { actionId: hq.candidate.actionId, targetServerId: "hq" },
      { actionId: rd.candidate.actionId, targetServerId: "rd" },
    ],
  };
}

function defensePortfolioEvidenceCode(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): string {
  const selectedBand = selectedDefensePortfolioBand(
    context,
    signals,
    centralAllocation,
  );
  if (selectedBand.kind === "score") {
    return selectedBand.route.signal.evidenceCode;
  }
  const selectedActionId = selectedBand.candidates[0]?.candidate.actionId;
  if (!selectedActionId) return "visible_server_defense_portfolio";
  return (
    [...selectedBand.eligibleSignals]
      .filter((signal) =>
        defenseCandidates(context, signal).some(
          (route) => route.candidate.actionId === selectedActionId,
        ),
      )
      .sort(
        (left, right) =>
          right.value - left.value ||
          left.defenseId.localeCompare(right.defenseId),
      )[0]?.evidenceCode ?? "visible_server_defense_portfolio"
  );
}

function defensePriority(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): PriorityClass {
  return selectedDefensePortfolioBand(context, signals, centralAllocation)
    .priorityClass;
}

function defensePriorityRank(priorityClass: PriorityClass): number {
  switch (priorityClass) {
    case "P1":
      return 1;
    case "P2":
      return 2;
    case "P3":
      return 3;
    case "P4":
      return 4;
    case "P5":
      return 5;
    case "P6":
      return 6;
  }
}

function defenseCandidates(
  context: PlanSchedulerContext,
  signal: CorpDefenseSignal,
): PlanMaterialization["candidates"] {
  if (!isValidDefenseSignal(signal)) return [];
  if (signal.kind === "score_protection_staging_install") {
    return context.actionCandidates
      .filter((candidate) => {
        if (
          candidate.actionId !== signal.actionId ||
          candidate.semanticActionType !== "install.card" ||
          candidate.sourceCardInstanceId !== signal.sourceCardInstanceId ||
          candidate.sourceDefinitionId !== signal.sourceDefinitionId ||
          !candidateTargetIds(candidate).includes(signal.serverId)
        ) {
          return false;
        }
        const action = context.input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        const totalClicks = action?.costs.reduce(
          (sum, cost) => sum + (cost.clicks ?? 0),
          0,
        );
        const totalCredits = action?.costs.reduce(
          (sum, cost) => sum + (cost.credits ?? 0),
          0,
        );
        return (
          action?.type === "install_card" &&
          action.side === "corp" &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.payload?.placement === "ice" &&
          action.payload.serverId === signal.serverId &&
          action.targetRequirements.length === 0 &&
          (action.choiceRequirements?.length ?? 0) === 0 &&
          totalClicks === 1 &&
          typeof totalCredits === "number" &&
          Number.isSafeInteger(totalCredits) &&
          totalCredits >= 0 &&
          totalCredits <= context.input.playerView.own.credits
        );
      })
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.kind === "score_protection_install") {
    if (
      signal.projection.actionId !== signal.actionId ||
      signal.projection.sourceCardInstanceId !== signal.sourceCardInstanceId ||
      signal.projection.sourceDefinitionId !== signal.sourceDefinitionId ||
      signal.projection.targetServerId !== signal.serverId ||
      signal.projection.effect !== signal.effect ||
      !exactInstallProjectionIsCurrent(context, signal.projection)
    ) {
      return [];
    }
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.actionId &&
          candidate.semanticActionType === "install.card" &&
          candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.sourceDefinitionId &&
          candidateTargetIds(candidate).includes(signal.serverId) &&
          scoreProtectionInstallActionMatches(context, candidate, signal),
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.kind === "score_protection_draw") {
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.actionId &&
          context.input.legalActions.some(
            (action) => action.actionId === candidate.actionId,
          ) &&
          corpCandidateProjectsCardDraw(candidate),
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.phase === "fund_rez_reserve") return [];
  if (signal.phase === "install_ice") {
    const route = signal.installRoute;
    const exactCandidates = exactGenericDefenseInstallCandidates(
      context,
      signal,
    );
    const stagingAssessment = assessFundingOnlyIceStaging({
      input: context.input,
      signal,
      productiveAlternativeExists: genericDefenseProductiveAlternativeExists(
        context,
        signal,
      ),
      fundingAlternativeExists: genericDefenseFundingAlternativeExists(
        context,
        signal,
      ),
    });
    if (
      !route ||
      (route.disposition !== "productive" && !stagingAssessment.admissible) ||
      !exactInstallProjectionMatchesSignal(context, signal, route.projection)
    ) {
      return [];
    }
    return exactCandidates.map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.phase === "rez_response" && signal.rezRoute) {
    if (!exactIceRezRouteIsCurrent(context, signal, signal.rezRoute)) {
      return [];
    }
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.rezRoute!.actionId &&
          candidate.semanticActionType === "corp_window.rez" &&
          candidate.sourceCardInstanceId ===
            signal.rezRoute!.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.rezRoute!.sourceDefinitionId,
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (
    (signal.phase === "resolve_install_targets" ||
      signal.phase === "resolve_run_redirect") &&
    signal.choiceResolution
  ) {
    const resolution = signal.choiceResolution;
    return context.actionCandidates
      .filter(
        (candidate) =>
          signal.actionIds?.includes(candidate.actionId) === true &&
          candidate.semanticActionType === "choice.resolve" &&
          context.input.legalActions.some(
            (action) =>
              action.actionId === candidate.actionId &&
              action.side === "corp" &&
              action.type === "resolve_choice" &&
              action.timingPoint === context.input.playerView.timingPoint &&
              action.expiresAtStateVersion ===
                context.input.playerView.stateVersion &&
              action.choiceRequirements?.length === 1 &&
              action.choiceRequirements[0]?.choiceId === resolution.choiceId,
          ),
      )
      .map((candidate) => ({ candidate, stepValue: signal.value }));
  }
  if (signal.phase === "resolve_post_pass_ice_lifecycle") {
    const routes = context.actionCandidates
      .filter((candidate) => {
        if (signal.actionIds?.includes(candidate.actionId) !== true) {
          return false;
        }
        const action = context.input.legalActions.find(
          (entry) => entry.actionId === candidate.actionId,
        );
        const sourceDefinitionId = signal.sourceDefinitionIds[0];
        const creditCost = action
          ? legalActionResourceCost(action, "credits")
          : undefined;
        const decision = action?.payload?.decision;
        const paymentAmount = action?.payload?.paymentAmount;
        return (
          signal.sourceDefinitionIds.length === 1 &&
          signal.targetIceInstanceId !== undefined &&
          candidate.actionType === "continue_run" &&
          candidate.semanticActionType === "run.continue" &&
          action?.type === "continue_run" &&
          action.side === "corp" &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.source === signal.targetIceInstanceId &&
          action.payload?.corpPostPassIceAbility ===
            "return_passed_ice_to_hq" &&
          action.payload.sourceDefinitionId === sourceDefinitionId &&
          action.payload.serverId === signal.serverId &&
          ((decision === "pay" &&
            knownNonNegativeInteger(paymentAmount) &&
            paymentAmount > 0 &&
            creditCost === paymentAmount) ||
            (decision === "return_to_hq" &&
              paymentAmount === undefined &&
              creditCost === 0) ||
            (decision === "decline" &&
              paymentAmount === undefined &&
              creditCost === 0))
        );
      })
      .map((candidate) => ({ candidate, stepValue: signal.value }));
    return routes;
  }
  return context.actionCandidates
    .filter((candidate) => {
      if (
        signal.actionIds !== undefined &&
        !signal.actionIds.includes(candidate.actionId)
      ) {
        return false;
      }
      if (
        signal.sourceDefinitionIds.length > 0 &&
        !signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? "")
      )
        return false;
      if (signal.phase === "install_defense_support")
        return (
          candidate.semanticActionType === "install.card" &&
          candidateTargetIds(candidate).includes(signal.serverId)
        );
      if (signal.phase === "draw_for_ice")
        return corpCandidateProjectsCardDraw(candidate);
      if (signal.phase === "pass_encounter")
        return (
          candidate.semanticActionType === "run.continue" &&
          context.input.playerView.timingPoint === "run.encounter_ice" &&
          context.input.legalActions.some(
            (action) =>
              action.actionId === candidate.actionId &&
              action.side === "corp" &&
              action.source === "game_rule" &&
              action.expiresAtStateVersion ===
                context.input.playerView.stateVersion,
          )
        );
      if (signal.phase === "activate_run_defense")
        return (
          candidate.actionType === "activated_card_ability" ||
          candidate.semanticActionType === "card_ability.trigger" ||
          candidate.semanticActionType === "run.end_by_corp" ||
          candidate.semanticActionType === "play.corp_operation"
        );
      return (
        candidate.semanticActionType ===
          (signal.phase === "decline_rez"
            ? "corp_window.decline_rez"
            : "corp_window.rez") &&
        (!signal.targetIceInstanceId ||
          candidate.sourceCardInstanceId === signal.targetIceInstanceId ||
          candidateTargetIds(candidate).includes(signal.targetIceInstanceId))
      );
    })
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function exactGenericDefenseInstallCandidates(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
): ActionSemanticCandidate[] {
  const route = signal.installRoute;
  if (
    signal.phase !== "install_ice" ||
    !route ||
    !exactInstallProjectionMatchesSignal(context, signal, route.projection)
  ) {
    return [];
  }
  return context.actionCandidates.filter(
    (candidate) =>
      candidate.actionId === route.projection.actionId &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId ===
        route.projection.sourceCardInstanceId &&
      candidate.sourceDefinitionId === route.projection.sourceDefinitionId &&
      candidateTargetIds(candidate).includes(route.projection.targetServerId) &&
      scoreProtectionInstallActionMatches(context, candidate, route.projection),
  );
}

function genericDefenseProductiveAlternativeExists(
  context: PlanSchedulerContext,
  fundingOnlySignal: CorpGenericDefenseSignal,
): boolean {
  const currentDomain = corpDomainIfAvailable(context);
  return (
    currentDomain?.defenseNeeds.some(
      (signal) =>
        signal !== fundingOnlySignal &&
        signal.kind === "generic" &&
        signal.phase === "install_ice" &&
        signal.installRoute?.disposition === "productive" &&
        exactGenericDefenseInstallCandidates(context, signal).length > 0,
    ) === true
  );
}

function genericDefenseFundingAlternativeExists(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
): boolean {
  if (signal.restrictedRezFunding) {
    const provider = corpDomainIfAvailable(context)?.economyNeeds.find(
      (need) =>
        need.kind === "parent_funding" &&
        need.parentNeedId === signal.defenseId &&
        need.parentPlanInstanceId ===
          planInstanceIdForProposal({
            moduleId: "corp.defend_servers",
            dedupeKey: "server-defense-portfolio",
          }) &&
        need.restrictedCreditFunding !== undefined,
    );
    return (
      provider !== undefined && economyCandidates(context, provider).length > 0
    );
  }
  const requirement = genericDefenseFundingRequirement(
    signal,
    context.input.playerView.own.credits,
  );
  if (
    !requirement ||
    !genericDefenseFundingRequirementIsCurrent(context, signal, requirement)
  )
    return false;
  const expectedNeedId = `defense-reserve:${signal.serverId}:${requirement.iceInstanceId}`;
  const need = corpDomainIfAvailable(context)?.economyNeeds.find(
    (candidate) =>
      candidate.kind === "parent_funding" &&
      candidate.needId === expectedNeedId &&
      candidate.parentNeedId === signal.defenseId &&
      candidate.immediateDefenseConversion === true &&
      candidate.gap === requirement.gap &&
      candidate.incrementalDefenseReserve?.targetCredits ===
        requirement.targetCredits &&
      candidate.incrementalDefenseReserve?.serverId === signal.serverId &&
      candidate.incrementalDefenseReserve?.iceInstanceId ===
        requirement.iceInstanceId,
  );
  return (
    need?.actionIds.some((actionId) =>
      context.actionCandidates.some(
        (candidate) =>
          candidate.actionId === actionId &&
          (immediateCorpLiquidCreditGain(candidate) > 0 ||
            (need.kind === "parent_funding" &&
              need.restrictedCreditPreparations?.some(
                (preparation) => preparation.actionId === actionId,
              ) === true)) &&
          corpEconomyCandidateHasExecutablePayload(context.input, candidate),
      ),
    ) === true
  );
}

function exactIceRezRouteIsCurrent(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  route: CorpExactIceRezRouteProjection,
): boolean {
  if (
    route.targetServerId !== signal.serverId ||
    route.actionId !== signal.actionIds?.[0] ||
    signal.actionIds?.length !== 1 ||
    route.sourceCardInstanceId !== signal.targetIceInstanceId
  ) {
    return false;
  }
  const candidate = context.actionCandidates.find(
    (candidate) => candidate.actionId === route.actionId,
  );
  const sourceCard = context.input.playerView.servers
    .flatMap((server) => server.ice)
    .find((card) => card.instanceId === route.sourceCardInstanceId);
  if (!candidate || !sourceCard) return false;
  const expected = projectExactCorpIceRezRoute({
    input: context.input,
    candidate,
    sourceCard,
    targetServerId: signal.serverId,
    bluffDefenseNeed: route.bluffDefenseNeed,
  });
  return expected !== undefined && exactCorpIceRezRoutesEqual(route, expected);
}

function scoreProtectionInstallActionMatches(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  signal:
    | CorpScoreProtectionInstallSignal
    | KnownCorpFundedIceInstallRouteProjection,
): boolean {
  const source = authoritativeDefensePlacementSource(context, candidate);
  if (!source) return false;
  const payload = source.action.payload;
  const targetServerId =
    "serverId" in signal ? signal.serverId : signal.targetServerId;
  return (
    payload?.placement === "ice" &&
    payload.cardId === signal.sourceCardInstanceId &&
    (payload.sourceDefinitionId === undefined ||
      payload.sourceDefinitionId === signal.sourceDefinitionId) &&
    payload.serverId === targetServerId
  );
}

function exactInstallProjectionMatchesSignal(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  projection: KnownCorpFundedIceInstallRouteProjection,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.actionId !== signal.actionIds?.[0] ||
    signal.actionIds.length !== 1 ||
    projection.targetServerId !== signal.serverId ||
    signal.sourceDefinitionIds.length !== 1 ||
    signal.sourceDefinitionIds[0] !== projection.sourceDefinitionId ||
    !exactInstallProjectionIsCurrent(
      context,
      projection,
      signal.installRoute?.progressKind === "staged_central_defense",
      signal.installRoute?.progressKind ===
        "scoreline_central_tax_allocation" ||
        signal.installRoute?.progressKind ===
          "score_material_capacity_release" ||
        signal.installRoute?.progressKind ===
          "agenda_capacity_defense_conversion" ||
        signal.installRoute?.progressKind ===
          "funded_structured_central_defense",
    )
  ) {
    return false;
  }
  return true;
}

function exactInstallProjectionIsCurrent(
  context: PlanSchedulerContext,
  projection: KnownCorpFundedIceInstallRouteProjection,
  useMinimumSatisfyingRoute = false,
  useExactPostInstallSourceQuote = false,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.before.knowledge !== "known" ||
    projection.after.knowledge !== "known" ||
    !knownNonNegativeInteger(context.input.playerView.own.credits) ||
    !knownNonNegativeInteger(context.input.playerView.own.clicks) ||
    projection.before.availableCorpCredits !==
      context.input.playerView.own.credits ||
    projection.before.availableCorpClicks !==
      context.input.playerView.own.clicks
  ) {
    return false;
  }
  const action = context.input.legalActions.find(
    (candidate) => candidate.actionId === projection.actionId,
  );
  const routeRezCosts =
    useMinimumSatisfyingRoute && projection.selectedRezCosts.length === 0
      ? (projection.after.minimumSatisfyingRezCosts ?? [])
      : projection.selectedRezCosts;
  const afterRouteRezCosts =
    useMinimumSatisfyingRoute && projection.selectedRezCosts.length === 0
      ? (projection.after.minimumSatisfyingRezCosts ?? [])
      : projection.after.selectedRezCosts;
  const projectedRezCost = routeRezCosts.find(
    (selected) =>
      selected.iceInstanceId === projection.sourceCardInstanceId &&
      selected.iceDefinitionId === projection.sourceDefinitionId &&
      selected.source === "engine_rez_cost_quote",
  );
  const projectedServerId =
    action?.payload?.postInstallRezQuoteProjectedServerId;
  const selectedPostInstallRezChoiceIsCurrent = useExactPostInstallSourceQuote
    ? action?.payload?.postInstallRezQuoteComplete === true
    : action?.payload && projectedRezCost
      ? postInstallRezSelectionMatchesCurrentQuote(
          action.payload,
          projectedRezCost,
        )
      : false;
  const selectedRezCostsAreCurrent =
    useExactPostInstallSourceQuote ||
    (selectedRezCostSetsEqual(routeRezCosts, afterRouteRezCosts) &&
      selectedRezCostsAreUnique(routeRezCosts) &&
      routeRezCosts.every((selected) =>
        selected.iceInstanceId === projection.sourceCardInstanceId
          ? selected === projectedRezCost
          : currentInstalledRezQuoteMatchesSelection(
              context,
              selected,
              projectedServerId,
            ),
      ));
  return (
    action?.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.side === "corp" &&
    action.type === "install_card" &&
    action.source === projection.sourceCardInstanceId &&
    action.payload?.placement === "ice" &&
    action.payload.cardId === projection.sourceCardInstanceId &&
    action.payload.serverId === projection.targetServerId &&
    action.payload.postInstallRezQuoteComplete === true &&
    action.payload.postInstallRezQuoteCardId ===
      projection.sourceCardInstanceId &&
    action.payload.postInstallRezQuoteTargetServerId ===
      projection.targetServerId &&
    action.payload.postInstallRezQuoteExpiresAtStateVersion ===
      context.input.playerView.stateVersion &&
    validPostInstallProjectedServerBinding(
      projection.targetServerId,
      action.payload.postInstallRezQuoteProjectedServerId,
    ) &&
    knownNonNegativeInteger(action.payload.postInstallRezQuoteBaseCredits) &&
    knownNonNegativeInteger(action.payload.postInstallRezQuoteFinalCredits) &&
    knownNonNegativeInteger(
      action.payload.postInstallRezQuoteMandatoryAgendaPointCost,
    ) &&
    action.payload.postInstallRezQuoteMandatoryAgendaPointCost === 0 &&
    action.payload.postInstallRezQuoteMandatoryAdditionalCostKind ===
      undefined &&
    validPostInstallRezQuoteModifiers(action.payload) &&
    selectedPostInstallRezChoiceIsCurrent &&
    selectedRezCostsAreCurrent &&
    legalActionResourceCost(action, "credits") === projection.installCredits &&
    legalActionResourceCost(action, "clicks") === projection.installClicks
  );
}

function selectedRezCostsAreUnique(
  costs: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
): boolean {
  return (
    costs.length > 0 &&
    new Set(costs.map((cost) => cost.iceInstanceId)).size === costs.length
  );
}

function selectedRezCostSetsEqual(
  left: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
  right: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
): boolean {
  if (left.length !== right.length) return false;
  const rightByInstanceId = new Map(
    right.map((cost) => [cost.iceInstanceId, cost] as const),
  );
  return (
    rightByInstanceId.size === right.length &&
    left.every((cost) => {
      const matching = rightByInstanceId.get(cost.iceInstanceId);
      return (
        matching?.iceDefinitionId === cost.iceDefinitionId &&
        matching.credits === cost.credits &&
        matching.source === cost.source
      );
    })
  );
}

function currentInstalledRezQuoteMatchesSelection(
  context: PlanSchedulerContext,
  selected: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"][number],
  projectedServerId: unknown,
): boolean {
  if (
    typeof projectedServerId !== "string" ||
    selected.source !== "engine_rez_cost_quote"
  ) {
    return false;
  }
  const matches = context.input.playerView.servers.flatMap((server) =>
    server.ice
      .filter((ice) => ice.instanceId === selected.iceInstanceId)
      .map((ice) => ({ ice, serverId: server.id })),
  );
  if (matches.length !== 1) return false;
  const match = matches[0]!;
  const quote = match.ice.effectiveRezCostQuote;
  const selectedInstalledRezCredits =
    quote?.complete === true
      ? selectedInstalledRezCreditsFromCurrentQuote(quote)
      : undefined;
  if (
    match.serverId !== projectedServerId ||
    match.ice.known !== true ||
    match.ice.type !== "ice" ||
    match.ice.definitionId !== selected.iceDefinitionId ||
    match.ice.rezzed !== false ||
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== selected.iceInstanceId ||
    quote.targetServerId !== projectedServerId ||
    quote.projectedServerId !== projectedServerId ||
    quote.expiresAtStateVersion !== context.input.playerView.stateVersion ||
    !knownNonNegativeInteger(quote.baseCredits) ||
    !knownNonNegativeInteger(quote.finalCredits) ||
    selectedInstalledRezCredits === undefined ||
    selectedInstalledRezCredits !== selected.credits ||
    !validMandatoryInstalledRezCosts(quote.mandatoryAdditionalCosts) ||
    !validDefinitionIdArray(quote.reductionSourceDefinitionIds) ||
    !validDefinitionIdArray(quote.increaseSourceDefinitionIds)
  ) {
    return false;
  }
  const reductions = quote.reductionSourceDefinitionIds ?? [];
  const increases = quote.increaseSourceDefinitionIds ?? [];
  return (
    definitionIdListsAreDisjoint(reductions, increases) &&
    (quote.baseCredits === quote.finalCredits ||
      reductions.length + increases.length > 0)
  );
}

const POST_INSTALL_VARIABLE_REZ_FIELDS = [
  "postInstallRezQuoteVariableRezKind",
  "postInstallRezQuoteVariableAdditionalCreditsPerValue",
  "postInstallRezQuoteVariableMinValue",
  "postInstallRezQuoteVariableMaxValue",
  "postInstallRezQuoteVariableMinValueFinalCredits",
  "postInstallRezQuoteVariableMaxValueFinalCredits",
  "postInstallRezQuoteVariableEffectiveStrengthFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
  "postInstallRezQuoteVariableMinSubroutines",
  "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
  "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
  "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
  "postInstallRezQuoteVariableBaseSubtypes",
  "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
  "postInstallRezQuoteVariableAlternateSubtypes",
  "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
  "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
] as const;

function selectedPostInstallRezCreditsFromCurrentQuote(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): number | undefined {
  const finalBaseCredits = payload.postInstallRezQuoteFinalCredits;
  if (!knownNonNegativeInteger(finalBaseCredits)) return undefined;
  if (payload.postInstallRezQuoteCostKind === "fixed") {
    return postInstallVariableRezFieldsAreAbsent(payload)
      ? finalBaseCredits
      : undefined;
  }
  if (payload.postInstallRezQuoteCostKind !== "variable") return undefined;
  const kind = payload.postInstallRezQuoteVariableRezKind;
  if (kind === "x_strength") return undefined;
  if (kind === "paid_end_the_run_subroutines") {
    if (
      !postInstallVariableRezFieldsMatchFamily(payload, [
        "postInstallRezQuoteVariableRezKind",
        "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
        "postInstallRezQuoteVariableMinSubroutines",
        "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
        "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
        "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
      ])
    ) {
      return undefined;
    }
    return selectedVariableRezCredits(
      {
        kind,
        additionalCreditsPerSubroutine:
          payload.postInstallRezQuoteVariableAdditionalCreditsPerSubroutine,
        minSubroutines: payload.postInstallRezQuoteVariableMinSubroutines,
        minSubroutinesFinalCredits:
          payload.postInstallRezQuoteVariableMinSubroutinesFinalCredits,
        firstEndTheRunSubroutineCount:
          payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount,
        firstEndTheRunFinalCredits:
          payload.postInstallRezQuoteVariableFirstEndTheRunFinalCredits,
      },
      finalBaseCredits,
    );
  }
  if (kind !== "alternate_subtype") return undefined;
  if (
    !postInstallVariableRezFieldsMatchFamily(payload, [
      "postInstallRezQuoteVariableRezKind",
      "postInstallRezQuoteVariableBaseSubtypes",
      "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
      "postInstallRezQuoteVariableAlternateSubtypes",
      "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
      "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
    ])
  ) {
    return undefined;
  }
  return selectedVariableRezCredits(
    {
      kind,
      baseSubtypes: canonicalSubtypeCsv(
        payload.postInstallRezQuoteVariableBaseSubtypes,
      ),
      baseSubtypesFinalCredits:
        payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits,
      alternateSubtypes: canonicalSubtypeCsv(
        payload.postInstallRezQuoteVariableAlternateSubtypes,
      ),
      alternateSubtypesAdditionalCredits:
        payload.postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits,
      alternateSubtypesFinalCredits:
        payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits,
    },
    finalBaseCredits,
  );
}

function postInstallRezSelectionMatchesCurrentQuote(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
  selection: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"][number],
): boolean {
  if (payload.postInstallRezQuoteCostKind === "fixed") {
    return (
      selection.variableRezChoice === undefined &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (payload.postInstallRezQuoteCostKind !== "variable") return false;
  const choice = selection.variableRezChoice;
  if (!choice) {
    return (
      selection.credits ===
      selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (choice.kind === "paid_end_the_run_subroutines") {
    return (
      choice.subroutineCount ===
        payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (
    choice.kind !== "alternate_subtype" ||
    payload.postInstallRezQuoteVariableRezKind !== "alternate_subtype"
  ) {
    return false;
  }
  const selectedSubtypes = canonicalSubtypeArray(choice.selectedSubtypes);
  const baseSubtypes = canonicalSubtypeCsv(
    payload.postInstallRezQuoteVariableBaseSubtypes,
  );
  const alternateSubtypes = canonicalSubtypeCsv(
    payload.postInstallRezQuoteVariableAlternateSubtypes,
  );
  if (!selectedSubtypes || !baseSubtypes || !alternateSubtypes) return false;
  const selectedKey = selectedSubtypes.join(",");
  if (selectedKey === baseSubtypes.join(",")) {
    return (
      selection.credits ===
      payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits
    );
  }
  return (
    selectedKey === alternateSubtypes.join(",") &&
    selection.credits ===
      payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits
  );
}

function selectedInstalledRezCreditsFromCurrentQuote(
  quote: VisibleCorpRezCostQuote,
): number | undefined {
  if (quote.complete !== true || !knownNonNegativeInteger(quote.finalCredits)) {
    return undefined;
  }
  if (quote.costKind === "fixed") return quote.finalCredits;
  return selectedVariableRezCredits(
    quote.variableParameter,
    quote.finalCredits,
  );
}

function selectedVariableRezCredits(
  value: unknown,
  finalBaseCredits: number,
): number | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !knownNonNegativeInteger(finalBaseCredits)
  ) {
    return undefined;
  }
  const parameter = value as Record<string, unknown>;
  if (parameter.kind === "x_strength") return undefined;
  if (parameter.kind === "paid_end_the_run_subroutines") {
    const additionalCreditsPerSubroutine =
      parameter.additionalCreditsPerSubroutine;
    const minSubroutines = parameter.minSubroutines;
    const minSubroutinesFinalCredits = parameter.minSubroutinesFinalCredits;
    const firstEndTheRunSubroutineCount =
      parameter.firstEndTheRunSubroutineCount;
    const firstEndTheRunFinalCredits = parameter.firstEndTheRunFinalCredits;
    return knownPositiveInteger(additionalCreditsPerSubroutine) &&
      knownNonNegativeInteger(minSubroutines) &&
      knownNonNegativeInteger(minSubroutinesFinalCredits) &&
      minSubroutinesFinalCredits ===
        safeRezCreditTotal(
          finalBaseCredits,
          minSubroutines,
          additionalCreditsPerSubroutine,
        ) &&
      knownPositiveInteger(firstEndTheRunSubroutineCount) &&
      firstEndTheRunSubroutineCount === Math.max(1, minSubroutines) &&
      knownNonNegativeInteger(firstEndTheRunFinalCredits) &&
      firstEndTheRunFinalCredits ===
        safeRezCreditTotal(
          finalBaseCredits,
          firstEndTheRunSubroutineCount,
          additionalCreditsPerSubroutine,
        )
      ? firstEndTheRunFinalCredits
      : undefined;
  }
  if (parameter.kind !== "alternate_subtype") return undefined;
  const baseSubtypes = canonicalSubtypeArray(parameter.baseSubtypes);
  const alternateSubtypes = canonicalSubtypeArray(parameter.alternateSubtypes);
  const baseSubtypesFinalCredits = parameter.baseSubtypesFinalCredits;
  const alternateSubtypesAdditionalCredits =
    parameter.alternateSubtypesAdditionalCredits;
  const alternateSubtypesFinalCredits = parameter.alternateSubtypesFinalCredits;
  return baseSubtypes &&
    alternateSubtypes &&
    baseSubtypes.join(",") !== alternateSubtypes.join(",") &&
    knownNonNegativeInteger(baseSubtypesFinalCredits) &&
    baseSubtypesFinalCredits === finalBaseCredits &&
    knownPositiveInteger(alternateSubtypesAdditionalCredits) &&
    knownNonNegativeInteger(alternateSubtypesFinalCredits) &&
    alternateSubtypesFinalCredits ===
      safeRezCreditTotal(
        finalBaseCredits,
        1,
        alternateSubtypesAdditionalCredits,
      )
    ? alternateSubtypesFinalCredits
    : undefined;
}

function postInstallVariableRezFieldsAreAbsent(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): boolean {
  return POST_INSTALL_VARIABLE_REZ_FIELDS.every(
    (field) => payload[field] === undefined,
  );
}

function postInstallVariableRezFieldsMatchFamily(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
  allowedFields: readonly (typeof POST_INSTALL_VARIABLE_REZ_FIELDS)[number][],
): boolean {
  const allowed = new Set(allowedFields);
  return POST_INSTALL_VARIABLE_REZ_FIELDS.every(
    (field) => payload[field] === undefined || allowed.has(field),
  );
}

function canonicalSubtypeCsv(value: unknown): string[] | undefined {
  return typeof value === "string"
    ? canonicalSubtypeArray(value.split(","))
    : undefined;
}

function canonicalSubtypeArray(value: unknown): string[] | undefined {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (subtype, index) =>
        typeof subtype !== "string" ||
        !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(subtype) ||
        (index > 0 && value[index - 1]! >= subtype),
    )
  ) {
    return undefined;
  }
  return value as string[];
}

function safeRezCreditTotal(
  baseCredits: number,
  quantity: number,
  creditsPerUnit: number,
): number | undefined {
  const additionalCredits = quantity * creditsPerUnit;
  const totalCredits = baseCredits + additionalCredits;
  return knownNonNegativeInteger(additionalCredits) &&
    knownNonNegativeInteger(totalCredits)
    ? totalCredits
    : undefined;
}

function knownPositiveInteger(value: unknown): value is number {
  return knownNonNegativeInteger(value) && value > 0;
}

function validMandatoryInstalledRezCosts(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const costs = value as Record<string, unknown>;
  return (
    Object.keys(costs).length === 1 &&
    knownNonNegativeInteger(costs.agendaPoints) &&
    costs.agendaPoints === 0
  );
}

function validDefinitionIdArray(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    Array.isArray(value) &&
    value.every(
      (id, index) =>
        typeof id === "string" &&
        id.length > 0 &&
        (index === 0 || value[index - 1]! < id),
    )
  );
}

function definitionIdListsAreDisjoint(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const leftIds = new Set(left);
  return right.every((id) => !leftIds.has(id));
}

function validPostInstallRezQuoteModifiers(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): boolean {
  const reductionIds = commaSeparatedDefinitionIds(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseIds = commaSeparatedDefinitionIds(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  if (reductionIds === undefined || increaseIds === undefined) return false;
  return (
    definitionIdListsAreDisjoint(reductionIds, increaseIds) &&
    (payload.postInstallRezQuoteBaseCredits ===
      payload.postInstallRezQuoteFinalCredits ||
      reductionIds.length + increaseIds.length > 0)
  );
}

function validPostInstallProjectedServerBinding(
  targetServerId: string,
  projectedServerId: unknown,
): boolean {
  return targetServerId === "new_remote"
    ? typeof projectedServerId === "string" &&
        /^remote_[1-9]\d*$/.test(projectedServerId)
    : projectedServerId === targetServerId;
}

function validCommaSeparatedDefinitionIds(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "string" || value.length === 0) return false;
  const ids = value.split(",");
  return ids.every(
    (id, index) => id.length > 0 && (index === 0 || ids[index - 1]! < id),
  );
}

function commaSeparatedDefinitionIds(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (!validCommaSeparatedDefinitionIds(value)) return undefined;
  return (value as string).split(",");
}

function legalActionResourceCost(
  action: AiDecisionInput["legalActions"][number],
  resource: "credits" | "clicks",
): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    const amount = cost[resource] ?? 0;
    if (!knownNonNegativeInteger(amount)) return undefined;
    total += amount;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

function defensePortfolioCandidates(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): PlanMaterialization["candidates"] {
  return selectedDefensePortfolioBand(context, signals, centralAllocation)
    .candidates;
}

type SelectedDefensePortfolioBand =
  | Readonly<{
      kind: "score";
      route: SelectedScoreProtectionRoute;
      priorityClass: CorpScorePriorityClass;
      candidates: PlanMaterialization["candidates"];
    }>
  | Readonly<{
      kind: "generic";
      eligibleSignals: readonly CorpGenericDefenseSignal[];
      priorityClass: "P2" | "P3" | "P5" | "P6";
      candidates: PlanMaterialization["candidates"];
    }>;

function exactScoreProtectionParentNeedId(
  context: PlanSchedulerContext,
  signal: Exclude<CorpDefenseSignal, CorpGenericDefenseSignal>,
): string {
  const project = domain(context).scoreProjects.find(
    (candidate) => candidate.projectId === signal.parentProjectId,
  );
  const protectionNeed = project?.protectionNeed;
  if (
    !signal.parentNeedId.trim() ||
    (project !== undefined &&
      (!protectionNeed ||
        protectionNeed.needId !== signal.parentNeedId ||
        protectionNeed.parentProjectId !== project.projectId ||
        protectionNeed.targetServerId !== signal.serverId ||
        signal.delegatedPriorityClass !== corpScorePriorityClass(project) ||
        protectionNeed.observedAtStateVersion !==
          context.input.playerView.stateVersion))
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: [signal.actionId],
      owner: "support_graph",
      planInstanceId: planInstanceIdForProposal({
        moduleId: "corp.defend_servers",
        dedupeKey: "server-defense-portfolio",
      }),
      removalCondition:
        "Bind the global defense provider to the exact current protection need of its score parent.",
    });
  }
  return signal.parentNeedId;
}

function selectedRemoteProtectionRoute(
  selectedBand: SelectedDefensePortfolioBand,
): CorpGenericDefenseSignal | undefined {
  if (selectedBand.kind !== "generic" || selectedBand.candidates.length === 0) {
    return undefined;
  }
  const selectedActionIds = new Set(
    selectedBand.candidates.map(({ candidate }) => candidate.actionId),
  );
  const routes = selectedBand.eligibleSignals.filter(
    (signal) =>
      signal.parentKind === "remote" &&
      signal.parentProjectId !== undefined &&
      signal.parentNeedId !== undefined &&
      signal.actionIds?.some((actionId) => selectedActionIds.has(actionId)),
  );
  return routes.length === 1 ? routes[0] : undefined;
}

function exactRemoteProtectionParentNeedId(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
): string {
  const project = domain(context).remoteProjects.find(
    (candidate) => candidate.projectId === signal.parentProjectId,
  );
  const need = project?.need;
  if (
    signal.parentKind !== "remote" ||
    !signal.parentProjectId ||
    !signal.parentNeedId ||
    !need ||
    need.needId !== signal.parentNeedId ||
    need.parentProjectId !== project.projectId ||
    need.targetServerId !== signal.serverId ||
    need.observedAtStateVersion !== context.input.playerView.stateVersion ||
    need.capability !== "improve_remote_protection_path"
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: signal.actionIds ?? [],
      owner: "support_graph",
      planInstanceId: planInstanceIdForProposal({
        moduleId: "corp.defend_servers",
        dedupeKey: "server-defense-portfolio",
      }),
      removalCondition:
        "Bind remote-defense support only to the exact current state-bound protection need of the resident scoring-remote parent.",
    });
  }
  return signal.parentNeedId;
}

function defenseResourceGaps(
  selectedBand: SelectedDefensePortfolioBand,
): ResourceGap[] {
  if (selectedBand.kind !== "generic" || selectedBand.candidates.length > 0)
    return [];
  return selectedBand.eligibleSignals.flatMap((signal) => {
    if (signal.restrictedRezFunding)
      return [
        {
          needId: signal.defenseId,
          capability: "fund_corp_install_or_rez",
          minimum: signal.restrictedRezFunding.gap,
          available: 0,
          deadline: "current_turn",
        } satisfies ResourceGap,
      ];
    const requirement = genericDefenseFundingRequirement(signal);
    if (!requirement) return [];
    return [
      {
        needId: signal.defenseId,
        capability: signal.rezReserveNeed ? "fund_corp_rez_reserve" : "credits",
        minimum: requirement.gap,
        available: 0,
        deadline: signal.urgent ? "current_turn" : "multi_turn",
      } satisfies ResourceGap,
    ];
  });
}

function selectedDefensePortfolioBand(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): SelectedDefensePortfolioBand {
  const validSignals = validDefenseSignals(signals, context);
  const genericSignals = validSignals.filter(isGenericDefenseSignal);
  const selectedGenericBand = selectedGenericDefensePortfolioBand(
    context,
    genericSignals,
    centralAllocation,
  );
  const scoreProtectionRoute = selectedScoreProtectionRoute(
    context,
    validSignals,
  );
  const scorelineCentralTaxSignals = genericSignals.filter(
    (signal) =>
      signal.phase === "install_ice" &&
      signal.installRoute?.progressKind === "scoreline_central_tax_allocation",
  );
  const scorelineCentralTaxCandidates = genericDefensePortfolioCandidates(
    context,
    scorelineCentralTaxSignals,
    centralAllocation,
  );
  if (
    scoreProtectionRoute?.signal.kind === "score_protection_draw" &&
    scorelineCentralTaxCandidates.length > 0
  ) {
    return {
      kind: "generic",
      eligibleSignals: scorelineCentralTaxSignals,
      priorityClass: "P3",
      candidates: scorelineCentralTaxCandidates,
    };
  }
  const genericPriority = selectedGenericBand.priorityClass;
  const genericCandidates = selectedGenericBand.candidates;
  const genericBandAvailable =
    genericCandidates.length > 0 || selectedGenericBand.supportable;
  const scoreCandidates = scoreProtectionRoute
    ? [
        {
          candidate: scoreProtectionRoute.candidate,
          stepValue:
            scoreProtectionRoute.signal.kind === "score_protection_install" &&
            scoreProtectionRoute.signal.effect === "satisfied"
              ? 2
              : 1,
        },
      ]
    : [];
  if (
    scoreProtectionRoute &&
    (!genericBandAvailable ||
      defensePriorityRank(scoreProtectionRoute.signal.delegatedPriorityClass) <
        defensePriorityRank(genericPriority) ||
      ((scoreProtectionRoute.signal.kind === "score_protection_install" ||
        // A qualitative staging backstop may inherit its parent's tie only
        // when its own risk model supports the route. An unmodelled access
        // path cannot displace a same-band, exact central-defense route.
        (scoreProtectionRoute.signal.kind ===
          "score_protection_staging_install" &&
          scoreProtectionRoute.signal.evidenceCode.includes(
            "development_risk_unmodeled_access_path",
          ) === false)) &&
        defensePriorityRank(
          scoreProtectionRoute.signal.delegatedPriorityClass,
        ) === defensePriorityRank(genericPriority)))
  ) {
    return {
      kind: "score",
      route: scoreProtectionRoute,
      priorityClass: scoreProtectionRoute.signal.delegatedPriorityClass,
      candidates: scoreCandidates,
    };
  }
  if (genericBandAvailable || !scoreProtectionRoute) {
    return {
      kind: "generic",
      eligibleSignals: selectedGenericBand.eligibleSignals,
      priorityClass: genericPriority,
      candidates: genericCandidates,
    };
  }
  return {
    kind: "score",
    route: scoreProtectionRoute,
    priorityClass: scoreProtectionRoute.signal.delegatedPriorityClass,
    candidates: scoreCandidates,
  };
}

function selectedGenericDefensePortfolioBand(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): Readonly<{
  eligibleSignals: readonly CorpGenericDefenseSignal[];
  priorityClass: "P2" | "P3" | "P5" | "P6";
  candidates: PlanMaterialization["candidates"];
  supportable: boolean;
}> {
  const windowEligibleSignals = allocatedCentralPlacementSignals(
    context,
    urgentDefenseBand(context, signals),
    centralAllocation,
  );
  const priorityClasses = ["P2", "P3", "P5", "P6"] as const;
  for (const priorityClass of priorityClasses) {
    const prioritySignals = windowEligibleSignals.filter(
      (signal) => corpGenericDefensePriorityClass([signal]) === priorityClass,
    );
    if (prioritySignals.length === 0) continue;
    const candidates = genericDefensePortfolioCandidates(
      context,
      prioritySignals,
      centralAllocation,
    );
    const supportable = genericDefenseBandHasExactFundingSupport(
      context,
      prioritySignals,
    );
    if (candidates.length > 0 || supportable) {
      return {
        eligibleSignals: prioritySignals,
        priorityClass,
        candidates,
        supportable,
      };
    }
  }
  const priorityClass = corpGenericDefensePriorityClass(windowEligibleSignals);
  return {
    eligibleSignals: windowEligibleSignals.filter(
      (signal) => corpGenericDefensePriorityClass([signal]) === priorityClass,
    ),
    priorityClass,
    candidates: [],
    supportable: false,
  };
}

function allocatedCentralPlacementSignals(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
  allocation: CorpCentralDefenseAllocation | undefined,
): readonly CorpGenericDefenseSignal[] {
  if (
    allocation?.status !== "known" ||
    allocation.canonicalNearTieCandidateServerIds.length === 2
  ) {
    return signals;
  }
  const selectedPlacementSignals = signals.filter(
    (signal) =>
      isDefensePlacementPhase(signal.phase) &&
      signal.serverId === allocation.selectedServerId,
  );
  const selectedPlacementActionable = selectedPlacementSignals.some(
    (signal) =>
      defenseCandidates(context, signal).length > 0 ||
      genericDefenseFundingAlternativeExists(context, signal),
  );
  if (!selectedPlacementActionable) return signals;
  return signals.filter(
    (signal) =>
      !isDefensePlacementPhase(signal.phase) ||
      (signal.serverId !== "hq" && signal.serverId !== "rd") ||
      signal.serverId === allocation.selectedServerId,
  );
}

function genericDefenseBandHasExactFundingSupport(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
): boolean {
  return signals.some((signal) =>
    genericDefenseFundingAlternativeExists(context, signal),
  );
}

function genericDefensePortfolioCandidates(
  context: PlanSchedulerContext,
  eligibleSignals: readonly CorpGenericDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): PlanMaterialization["candidates"] {
  const targetChoiceSignals = eligibleSignals.filter(
    (signal) => signal.phase === "resolve_install_targets",
  );
  if (targetChoiceSignals.length > 0) {
    return selectedDirectDefenseRoute(context, targetChoiceSignals);
  }
  const urgentRezSignals = eligibleSignals.filter(
    (signal) => signal.urgent && !isDefensePlacementPhase(signal.phase),
  );
  if (urgentRezSignals.length > 0) {
    return selectedDirectDefenseRoute(context, urgentRezSignals);
  }
  if (eligibleSignals.some((signal) => signal.urgent)) {
    return selectedExactGenericDefenseRoutes(
      context,
      eligibleSignals,
      centralAllocation,
    );
  }
  const lockedInstallSequenceSignals = eligibleSignals.filter(
    (signal) => signal.immediateInstallSupport === true,
  );
  if (lockedInstallSequenceSignals.length > 0) {
    const rezHeads = lockedInstallSequenceSignals.filter(
      (signal) => signal.phase === "rez_response",
    );
    if (rezHeads.length > 0) {
      return selectedDirectDefenseRoute(context, rezHeads);
    }
    return selectedExactGenericDefenseRoutes(
      context,
      lockedInstallSequenceSignals,
      centralAllocation,
    );
  }

  const allocatedPlacements = selectedExactGenericDefenseRoutes(
    context,
    eligibleSignals.filter((signal) => isDefensePlacementPhase(signal.phase)),
    centralAllocation,
  );
  const rezCandidates = selectedDirectDefenseRoute(
    context,
    eligibleSignals.filter((signal) => !isDefensePlacementPhase(signal.phase)),
  );
  return rezCandidates.length > 0 ? rezCandidates : allocatedPlacements;
}

function selectedDirectDefenseRoute(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
): PlanMaterialization["candidates"] {
  const exactRezRoutes = signals
    .filter(
      (
        signal,
      ): signal is CorpGenericDefenseSignal & {
        rezRoute: CorpExactIceRezRouteProjection;
      } => signal.phase === "rez_response" && signal.rezRoute !== undefined,
    )
    .flatMap((signal) =>
      defenseCandidates(context, signal).map((route) => ({
        ...route,
        projection: signal.rezRoute,
      })),
    )
    .sort(compareExactIceRezRoutes);
  if (exactRezRoutes[0]) {
    return [
      {
        candidate: exactRezRoutes[0].candidate,
        stepValue: exactRezRoutes[0].stepValue,
      },
    ];
  }
  return dedupeDefenseCandidates(context, signals)
    .sort(
      (left, right) =>
        right.stepValue - left.stepValue ||
        technicalCompare(left.candidate.actionId, right.candidate.actionId),
    )
    .slice(0, 1);
}

function compareExactIceRezRoutes(
  left: {
    candidate: ActionSemanticCandidate;
    projection: CorpExactIceRezRouteProjection;
  },
  right: {
    candidate: ActionSemanticCandidate;
    projection: CorpExactIceRezRouteProjection;
  },
): number {
  if (left.projection.effect !== right.projection.effect) {
    return left.projection.effect === "satisfied" ? -1 : 1;
  }
  const probabilityComparison =
    left.projection.after && right.projection.after
      ? compareExactProbabilities(
          left.projection.after.runnerAccessSuccessProbability,
          right.projection.after.runnerAccessSuccessProbability,
        )
      : undefined;
  if (probabilityComparison !== undefined && probabilityComparison !== 0) {
    return probabilityComparison;
  }
  return (
    left.projection.totalRezCredits - right.projection.totalRezCredits ||
    technicalCompare(left.candidate.actionId, right.candidate.actionId)
  );
}

function selectedExactGenericDefenseRoutes(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
  allocation: CorpCentralDefenseAllocation | undefined,
): PlanMaterialization["candidates"] {
  const exactIceRoutes = signals
    .filter(
      (
        signal,
      ): signal is CorpGenericDefenseSignal & {
        phase: "install_ice";
        installRoute: {
          disposition: "productive" | "funding_only";
          projection: KnownCorpFundedIceInstallRouteProjection;
        };
      } =>
        signal.phase === "install_ice" &&
        (signal.installRoute?.disposition === "productive" ||
          signal.installRoute?.disposition === "funding_only"),
    )
    .flatMap((signal) =>
      defenseCandidates(context, signal).map((route) => ({
        ...route,
        signal,
        projection: signal.installRoute.projection,
      })),
    );
  const supportRoutes = dedupeDefenseCandidates(
    context,
    signals.filter((signal) => signal.phase === "install_defense_support"),
  );
  if (exactIceRoutes.length === 0) {
    return supportRoutes
      .sort(
        (left, right) =>
          right.stepValue - left.stepValue ||
          technicalCompare(left.candidate.actionId, right.candidate.actionId),
      )
      .slice(0, 1);
  }
  const centralServerForRoute = (
    route: (typeof exactIceRoutes)[number],
  ): "hq" | "rd" | undefined =>
    route.projection.targetServerId === "hq" ||
    route.projection.targetServerId === "rd"
      ? route.projection.targetServerId
      : undefined;
  const hqRoutes = exactIceRoutes.filter(
    (route) => centralServerForRoute(route) === "hq",
  );
  const rdRoutes = exactIceRoutes.filter(
    (route) => centralServerForRoute(route) === "rd",
  );
  const boundedUnknownAllocationCentralRoutes = exactIceRoutes.filter(
    (route) =>
      centralServerForRoute(route) !== undefined &&
      (route.signal.installRoute?.progressKind ===
        "score_material_capacity_release" ||
        route.signal.installRoute?.progressKind ===
          "agenda_capacity_defense_conversion" ||
        route.signal.installRoute?.progressKind ===
          "funded_structured_central_defense"),
  );
  let eligibleRoutes = exactIceRoutes;
  if (hqRoutes.length > 0 || rdRoutes.length > 0) {
    if (
      allocation?.status !== "known" &&
      hqRoutes.length > 0 &&
      rdRoutes.length > 0
    ) {
      eligibleRoutes = [
        ...exactIceRoutes.filter(
          (route) => centralServerForRoute(route) === undefined,
        ),
        ...boundedUnknownAllocationCentralRoutes,
      ];
    } else if (
      allocation?.status === "known" &&
      allocation.canonicalNearTieCandidateServerIds.length === 2 &&
      hqRoutes.length > 0 &&
      rdRoutes.length > 0
    ) {
      eligibleRoutes = [
        [...hqRoutes].sort(compareGenericExactInstallRoutes)[0]!,
        [...rdRoutes].sort(compareGenericExactInstallRoutes)[0]!,
      ];
    } else if (allocation?.status === "known") {
      const selectedCentralRoutes =
        allocation.selectedServerId === "hq" ? hqRoutes : rdRoutes;
      const fallbackCentralRoutes =
        allocation.selectedServerId === "hq" ? rdRoutes : hqRoutes;
      const fallbackServerId =
        allocation.selectedServerId === "hq" ? "rd" : "hq";
      const selectedPressure =
        allocation.evidence[allocation.selectedServerId].threat;
      const allocationLocked =
        (selectedPressure === "acute" || selectedPressure === "terminal") &&
        selectedCentralAccessRiskRemains(context, allocation);
      const fallbackServer = context.input.playerView.servers.find(
        (server) => server.id === fallbackServerId,
      );
      const knownCorpHandOverflow =
        Number.isSafeInteger(context.input.playerView.own.gripOrHq.length) &&
        Number.isSafeInteger(context.input.playerView.own.maxHandSize) &&
        context.input.playerView.own.gripOrHq.length >
          context.input.playerView.own.maxHandSize;
      const fallbackHasIndependentValue =
        fallbackServer?.ice.length === 0 ||
        allocation.evidence[fallbackServerId].threat !== "none" ||
        knownCorpHandOverflow;
      const allocatedCentralRoutes =
        selectedCentralRoutes.length > 0
          ? selectedCentralRoutes
          : fallbackCentralRoutes.length > 0 &&
              !allocationLocked &&
              fallbackHasIndependentValue
            ? fallbackCentralRoutes
            : [];
      // The allocation orders HQ against R&D. It must not remove an exact
      // route for Archives or another independently assessed server.
      eligibleRoutes = [
        ...exactIceRoutes.filter(
          (route) =>
            centralServerForRoute(route) === undefined &&
            (!allocationLocked ||
              route.signal.urgent ||
              isVisibleAgendaExposureDefense(route.signal)),
        ),
        ...allocatedCentralRoutes,
      ];
    }
  }
  if (
    allocation?.status === "known" &&
    allocation.canonicalNearTieCandidateServerIds.length === 2
  ) {
    return eligibleRoutes.map(({ candidate, stepValue }) => ({
      candidate,
      stepValue,
    }));
  }
  const selected = [...eligibleRoutes].sort(
    compareGenericExactInstallRoutes,
  )[0];
  return selected
    ? [{ candidate: selected.candidate, stepValue: selected.stepValue }]
    : supportRoutes;
}

function selectedCentralAccessRiskRemains(
  context: PlanSchedulerContext,
  allocation: Extract<CorpCentralDefenseAllocation, { status: "known" }>,
): boolean {
  const server = context.input.playerView.servers.find(
    (candidate) => candidate.id === allocation.selectedServerId,
  );
  if (!server) return true;
  const assessment = assessBestFundedCorpScoreProtection({
    serverIce: server.ice,
    runnerRig: context.input.playerView.opponent.rig ?? [],
    runnerSetAside: context.input.playerView.specialZones?.setAside ?? [],
    ...(context.input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: context.input.playerView.opponent.memoryUsed }
      : {}),
    ...(context.input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: context.input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: context.input.playerView.opponent.credits,
    targetServerId: allocation.selectedServerId,
    observedAtStateVersion: context.input.playerView.stateVersion,
    availableCorpCredits: context.input.playerView.own.credits,
    availableCorpClicks: context.input.playerView.own.clicks,
    availableCorpAgendaPoints: context.input.playerView.own.agendaPoints,
    scoreReserve: { creditBreakdown: [], hardClickReserve: 0 },
    maximumRunnerAccessSuccessProbability: {
      numerator: 0,
      denominator: 1,
    },
  });
  if (assessment.knowledge === "unknown") return true;
  return (
    compareExactProbabilities(
      assessment.protection.runnerAccessSuccessProbability,
      { numerator: 0, denominator: 1 },
    ) !== 0
  );
}

function compareGenericExactInstallRoutes(
  left: {
    candidate: ActionSemanticCandidate;
    signal: CorpGenericDefenseSignal;
    projection: KnownCorpFundedIceInstallRouteProjection;
  },
  right: {
    candidate: ActionSemanticCandidate;
    signal: CorpGenericDefenseSignal;
    projection: KnownCorpFundedIceInstallRouteProjection;
  },
): number {
  const urgencyComparison =
    genericDefenseRouteUrgencyRank(right.signal) -
    genericDefenseRouteUrgencyRank(left.signal);
  if (urgencyComparison !== 0) return urgencyComparison;
  if (
    left.signal.installRoute?.disposition !==
    right.signal.installRoute?.disposition
  ) {
    return left.signal.installRoute?.disposition === "productive" ? -1 : 1;
  }
  if (left.projection.effect !== right.projection.effect) {
    return left.projection.effect === "satisfied" ? -1 : 1;
  }
  const probabilityComparison = compareExactProbabilities(
    left.projection.after.protection.runnerAccessSuccessProbability,
    right.projection.after.protection.runnerAccessSuccessProbability,
  );
  if (probabilityComparison !== undefined && probabilityComparison !== 0) {
    return probabilityComparison;
  }
  const runnerCreditTaxComparison =
    left.projection.after.protection.runnerCreditsRemainingOnBestAccessPath -
    right.projection.after.protection.runnerCreditsRemainingOnBestAccessPath;
  if (runnerCreditTaxComparison !== 0) return runnerCreditTaxComparison;
  const costComparison =
    knownExactInstallRouteCreditCost(left.projection) -
    knownExactInstallRouteCreditCost(right.projection);
  return (
    costComparison ||
    technicalCompare(left.candidate.actionId, right.candidate.actionId)
  );
}

function genericDefenseRouteUrgencyRank(
  signal: CorpGenericDefenseSignal,
): number {
  if (isVisibleAgendaExposureDefense(signal)) return 600;
  if (signal.centralPressure === "terminal") return 500;
  if (signal.centralPressure === "acute") return 400;
  if (signal.urgent) return 300;
  if (signal.centralPressure === "material") return 200;
  return 0;
}

function isVisibleAgendaExposureDefense(
  signal: CorpGenericDefenseSignal,
): boolean {
  return signal.evidenceCode.includes("visible_agenda_exposure_defense");
}

export function corpDefensePortfolioHasExecutableRoute(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): boolean {
  return (
    defensePortfolioCandidates(context, signals, centralAllocation).length > 0
  );
}

type SelectedScoreProtectionRoute = {
  signal:
    | CorpScoreProtectionInstallSignal
    | CorpScoreProtectionStagingInstallSignal
    | CorpScoreProtectionDrawSignal;
  candidate: ActionSemanticCandidate;
};

function selectedScoreProtectionRoute(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
): SelectedScoreProtectionRoute | undefined {
  const scoreSignals = signals.filter(
    (
      signal,
    ): signal is
      | CorpScoreProtectionInstallSignal
      | CorpScoreProtectionStagingInstallSignal
      | CorpScoreProtectionDrawSignal =>
      isScoreProtectionInstallSignal(signal) ||
      isScoreProtectionStagingInstallSignal(signal) ||
      isScoreProtectionDrawSignal(signal),
  );
  const parentIds = [
    ...new Set(scoreSignals.map((signal) => signal.parentProjectId)),
  ].sort(technicalCompare);
  const parentRoutes: SelectedScoreProtectionRoute[] = [];
  for (const parentProjectId of parentIds) {
    const parentSignals = scoreSignals.filter(
      (signal) => signal.parentProjectId === parentProjectId,
    );
    const directInstallRoute = parentSignals
      .filter(isScoreProtectionInstallSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )
      .sort(compareScoreProtectionInstallRoutes)[0];
    if (directInstallRoute) {
      parentRoutes.push(directInstallRoute);
      continue;
    }
    const stagingInstallRoute = parentSignals
      .filter(isScoreProtectionStagingInstallSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )
      .sort((left, right) =>
        technicalCompare(left.candidate.actionId, right.candidate.actionId),
      )[0];
    if (stagingInstallRoute) {
      parentRoutes.push(stagingInstallRoute);
      continue;
    }
    const drawRoute = parentSignals
      .filter(isScoreProtectionDrawSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )
      .sort(compareScoreProtectionDrawRoutes)[0];
    if (drawRoute) parentRoutes.push(drawRoute);
  }
  return parentRoutes.sort(
    (left, right) =>
      defensePriorityRank(left.signal.delegatedPriorityClass) -
        defensePriorityRank(right.signal.delegatedPriorityClass) ||
      technicalCompare(
        left.signal.parentProjectId,
        right.signal.parentProjectId,
      ),
  )[0];
}

function compareScoreProtectionDrawRoutes(
  left: SelectedScoreProtectionRoute,
  right: SelectedScoreProtectionRoute,
): number {
  const leftProjection = exactScoreProtectionDrawProjection(left.candidate);
  const rightProjection = exactScoreProtectionDrawProjection(right.candidate);
  if (leftProjection && rightProjection) {
    const densityComparison =
      rightProjection.cardsDrawn * leftProjection.clickCost -
      leftProjection.cardsDrawn * rightProjection.clickCost;
    if (densityComparison !== 0) return densityComparison;
    const cardsDrawnComparison =
      rightProjection.cardsDrawn - leftProjection.cardsDrawn;
    if (cardsDrawnComparison !== 0) return cardsDrawnComparison;
    const creditCostComparison =
      leftProjection.creditCost - rightProjection.creditCost;
    if (creditCostComparison !== 0) return creditCostComparison;
    const handDeltaComparison =
      leftProjection.netHandDelta - rightProjection.netHandDelta;
    if (handDeltaComparison !== 0) return handDeltaComparison;
  } else if (leftProjection || rightProjection) {
    return leftProjection ? -1 : 1;
  }
  return technicalCompare(left.candidate.actionId, right.candidate.actionId);
}

function exactScoreProtectionDrawProjection(
  candidate: ActionSemanticCandidate,
):
  | {
      cardsDrawn: number;
      clickCost: number;
      creditCost: number;
      netHandDelta: number;
    }
  | undefined {
  if (candidate.semanticActionType === "draw.card") {
    return { cardsDrawn: 1, clickCost: 1, creditCost: 0, netHandDelta: 1 };
  }
  const cardsDrawn = candidate.economyProjection?.cardsDrawn;
  const clickCost = candidate.costProfile.clickCost;
  const creditCost = candidate.costProfile.creditCost;
  const netHandDelta = candidate.economyProjection?.netHandDelta;
  return Number.isSafeInteger(cardsDrawn) &&
    (cardsDrawn ?? 0) > 0 &&
    Number.isSafeInteger(clickCost) &&
    (clickCost ?? 0) > 0 &&
    Number.isSafeInteger(creditCost) &&
    (creditCost ?? -1) >= 0 &&
    Number.isSafeInteger(netHandDelta) &&
    (netHandDelta ?? -1) >= 0
    ? {
        cardsDrawn: cardsDrawn!,
        clickCost: clickCost!,
        creditCost: creditCost!,
        netHandDelta: netHandDelta!,
      }
    : undefined;
}

function compareScoreProtectionInstallRoutes(
  left: SelectedScoreProtectionRoute & {
    signal: CorpScoreProtectionInstallSignal;
  },
  right: SelectedScoreProtectionRoute & {
    signal: CorpScoreProtectionInstallSignal;
  },
): number {
  const leftProjection = left.signal.projection;
  const rightProjection = right.signal.projection;
  if (leftProjection.effect !== rightProjection.effect) {
    return leftProjection.effect === "satisfied" ? -1 : 1;
  }
  const probabilityComparison = compareExactProbabilities(
    leftProjection.after.protection.runnerAccessSuccessProbability,
    rightProjection.after.protection.runnerAccessSuccessProbability,
  );
  if (probabilityComparison !== undefined && probabilityComparison !== 0) {
    return probabilityComparison;
  }
  const runnerCreditTaxComparison =
    leftProjection.after.protection.runnerCreditsRemainingOnBestAccessPath -
    rightProjection.after.protection.runnerCreditsRemainingOnBestAccessPath;
  if (runnerCreditTaxComparison !== 0) return runnerCreditTaxComparison;
  if (
    knownExactInstallRouteCreditCost(leftProjection) !==
    knownExactInstallRouteCreditCost(rightProjection)
  ) {
    return (
      knownExactInstallRouteCreditCost(leftProjection) -
      knownExactInstallRouteCreditCost(rightProjection)
    );
  }
  return technicalCompare(left.candidate.actionId, right.candidate.actionId);
}

function exactInstallRouteCreditCost(
  projection: KnownCorpFundedIceInstallRouteProjection,
): number | undefined {
  let total = projection.installCredits;
  if (!knownNonNegativeInteger(total)) return undefined;
  for (const selected of projection.selectedRezCosts) {
    if (!knownNonNegativeInteger(selected.credits)) return undefined;
    total += selected.credits;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

function knownExactInstallRouteCreditCost(
  projection: KnownCorpFundedIceInstallRouteProjection,
): number {
  return exactInstallRouteCreditCost(projection) ?? Number.MAX_SAFE_INTEGER;
}

export type CorpDefenseActionDisposition = {
  actionId: string;
  evidenceCode: string;
};

export type CorpDefensePlacementDisposition = CorpDefenseActionDisposition;

export function corpDefenseMaterializedActionIds(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): ReadonlySet<string> {
  const validSignals = validDefenseSignals(signals, context);
  return new Set(
    defensePortfolioCandidates(context, validSignals, centralAllocation).map(
      (route) => route.candidate.actionId,
    ),
  );
}

export function corpDefenseActionDispositions(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpDefenseActionDisposition[] {
  const validSignals = validDefenseSignals(signals, context);
  const materializedRoutes = defensePortfolioCandidates(
    context,
    validSignals,
    centralAllocation,
  );
  const materializedActionIds = new Set(
    materializedRoutes.map((route) => route.candidate.actionId),
  );
  const selectedBand = selectedDefensePortfolioBand(
    context,
    validSignals,
    centralAllocation,
  );
  const eligibleSignals =
    selectedBand.kind === "generic" ? selectedBand.eligibleSignals : [];
  const scoreProtectionSignals = validSignals.filter(
    (
      signal,
    ): signal is
      | CorpScoreProtectionInstallSignal
      | CorpScoreProtectionStagingInstallSignal
      | CorpScoreProtectionDrawSignal => signal.kind !== "generic",
  );
  const selectedAllocation = materializedRoutes
    .flatMap((route) =>
      validSignals
        .filter((signal) =>
          defenseCandidates(context, signal).some(
            (candidate) =>
              candidate.candidate.actionId === route.candidate.actionId,
          ),
        )
        .map((signal) => ({ route, signal })),
    )
    .sort(
      (left, right) =>
        right.route.stepValue - left.route.stepValue ||
        defenseSignalOrderingValue(right.signal) -
          defenseSignalOrderingValue(left.signal) ||
        technicalCompare(left.signal.defenseId, right.signal.defenseId) ||
        technicalCompare(
          left.route.candidate.actionId,
          right.route.candidate.actionId,
        ),
    )[0];
  const placementSignals = validSignals
    .filter(isGenericDefenseSignal)
    .filter((signal) => isDefensePlacementPhase(signal.phase));
  const byActionId = new Map<string, CorpDefenseActionDisposition>();
  for (const candidate of context.actionCandidates) {
    if (materializedActionIds.has(candidate.actionId)) {
      continue;
    }
    if (isSharedCorpSupportBasicAction(candidate)) {
      continue;
    }
    const rejectedScoreProtectionSignal = scoreProtectionSignals.find(
      (signal) =>
        defenseCandidates(context, signal).some(
          (route) => route.candidate.actionId === candidate.actionId,
        ),
    );
    if (rejectedScoreProtectionSignal && selectedAllocation) {
      byActionId.set(candidate.actionId, {
        actionId: candidate.actionId,
        evidenceCode: `corp_score_protection_route_rejected:${rejectedScoreProtectionSignal.parentProjectId}:selected:${selectedAllocation.route.candidate.actionId}`,
      });
      continue;
    }
    if (candidate.semanticActionType !== "install.card") {
      const matchingSignals = validSignals
        .filter(isGenericDefenseSignal)
        .filter((signal) =>
          defenseCandidates(context, signal).some(
            (route) => route.candidate.actionId === candidate.actionId,
          ),
        )
        .sort(
          (left, right) =>
            Number(right.urgent) - Number(left.urgent) ||
            right.value - left.value ||
            technicalCompare(left.defenseId, right.defenseId),
        );
      if (matchingSignals.length === 0 || !selectedAllocation) continue;
      const rejectedSignal = matchingSignals[0]!;
      const remainsInPriorityBand = matchingSignals.some((signal) =>
        eligibleSignals.includes(signal),
      );
      byActionId.set(candidate.actionId, {
        actionId: candidate.actionId,
        evidenceCode: `${
          remainsInPriorityBand
            ? "corp_defense_global_allocation_rejected"
            : "corp_defense_global_priority_band_rejected"
        }:${rejectedSignal.serverId}:${rejectedSignal.defenseId}:selected:${selectedAllocation.signal.serverId}:${selectedAllocation.signal.defenseId}:${selectedAllocation.route.candidate.actionId}`,
      });
      continue;
    }
    const fundingOnlyInstall = placementSignals.find(
      (signal) =>
        signal.phase === "install_ice" &&
        signal.installRoute?.disposition === "funding_only" &&
        signal.installRoute.projection.actionId === candidate.actionId,
    );
    if (fundingOnlyInstall) {
      byActionId.set(candidate.actionId, {
        actionId: candidate.actionId,
        evidenceCode: `corp_defense_exact_route_requires_parent_funding:${fundingOnlyInstall.serverId}:${fundingOnlyInstall.defenseId}`,
      });
      continue;
    }
    const matchingPlacements = placementSignals
      .filter(
        (signal) =>
          (signal.phase === "install_ice" &&
            signal.installRoute?.projection.actionId === candidate.actionId) ||
          (signal.phase !== "install_ice" &&
            defenseCandidates(context, signal).some(
              (route) => route.candidate.actionId === candidate.actionId,
            )),
      )
      .sort(
        (left, right) =>
          defenseSignalOrderingValue(right) -
            defenseSignalOrderingValue(left) ||
          technicalCompare(left.serverId, right.serverId),
      );
    if (matchingPlacements.length === 0) continue;
    const selected = matchingPlacements[0]!;
    byActionId.set(candidate.actionId, {
      actionId: candidate.actionId,
      evidenceCode: selectedAllocation
        ? `corp_defense_global_allocation_rejected:${selected.serverId}:${selected.defenseId}:reason:${defenseAlternativeSelectionReason(selected, selectedAllocation.signal)}:selected:${selectedAllocation.signal.serverId}:${selectedAllocation.signal.defenseId}:${selectedAllocation.route.candidate.actionId}`
        : `corp_defense_global_allocation_rejected:${selected.serverId}:${selected.defenseId}:reason:no_executable_selected_route:${candidate.actionId}`,
    });
  }
  return [...byActionId.values()];
}

function defenseAlternativeSelectionReason(
  rejected: CorpGenericDefenseSignal,
  selected: CorpDefenseSignal,
): string {
  if (selected.kind !== "generic") return "bound_score_protection_priority";
  const selectedPriority = defensePriorityRank(
    corpGenericDefensePriorityClass([selected]),
  );
  const rejectedPriority = defensePriorityRank(
    corpGenericDefensePriorityClass([rejected]),
  );
  if (selectedPriority < rejectedPriority) return "higher_priority_band";
  const urgencyDifference =
    genericDefenseRouteUrgencyRank(selected) -
    genericDefenseRouteUrgencyRank(rejected);
  if (urgencyDifference > 0) return "higher_state_bound_urgency";
  const selectedProjection =
    selected.phase === "install_ice"
      ? selected.installRoute?.projection
      : undefined;
  const rejectedProjection =
    rejected.phase === "install_ice"
      ? rejected.installRoute?.projection
      : undefined;
  if (selectedProjection && rejectedProjection) {
    if (selectedProjection.effect !== rejectedProjection.effect) {
      return "greater_exact_need_reduction";
    }
    const probabilityComparison = compareExactProbabilities(
      selectedProjection.after.protection.runnerAccessSuccessProbability,
      rejectedProjection.after.protection.runnerAccessSuccessProbability,
    );
    if (probabilityComparison !== undefined && probabilityComparison < 0) {
      return "lower_engine_quoted_access_probability";
    }
    if (
      selectedProjection.after.protection
        .runnerCreditsRemainingOnBestAccessPath <
      rejectedProjection.after.protection.runnerCreditsRemainingOnBestAccessPath
    ) {
      return "higher_engine_quoted_run_credit_tax";
    }
    if (
      knownExactInstallRouteCreditCost(selectedProjection) <
      knownExactInstallRouteCreditCost(rejectedProjection)
    ) {
      return "lower_exact_install_and_rez_cost";
    }
  }
  if (selected.value > rejected.value)
    return "higher_state_bound_defense_value";
  return "equal_state_bound_value_canonical_order";
}

export function corpDefensePlacementDispositions(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpDefensePlacementDisposition[] {
  return corpDefenseActionDispositions(context, signals, centralAllocation);
}

function isSharedCorpSupportBasicAction(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.sourceKind === "basic_action" &&
    (candidate.semanticActionType === "draw.card" ||
      candidate.semanticActionType === "economy.gain_credit")
  );
}

function dedupeDefenseCandidates(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
): PlanMaterialization["candidates"] {
  const byActionId = new Map<
    string,
    PlanMaterialization["candidates"][number]
  >();
  for (const signal of signals) {
    for (const candidate of defenseCandidates(context, signal)) {
      const previous = byActionId.get(candidate.candidate.actionId);
      if (!previous || candidate.stepValue > previous.stepValue) {
        byActionId.set(candidate.candidate.actionId, candidate);
      }
    }
  }
  return [...byActionId.values()];
}

function authoritativeDefensePlacementSource(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
):
  | {
      action: AiDecisionInput["legalActions"][number];
      sourceCardInstanceId: string;
    }
  | undefined {
  const sourceCardInstanceId = candidate.sourceCardInstanceId;
  if (!sourceCardInstanceId || candidate.sourceKind !== "card") {
    return undefined;
  }
  const action = context.input.legalActions.find(
    (candidateAction) => candidateAction.actionId === candidate.actionId,
  );
  if (!action || action.source !== sourceCardInstanceId) {
    return undefined;
  }
  if (
    typeof action.payload?.cardId === "string" &&
    action.payload.cardId !== sourceCardInstanceId
  ) {
    return undefined;
  }
  if (
    candidate.sourceDefinitionId !== undefined &&
    typeof action.payload?.sourceDefinitionId === "string" &&
    action.payload.sourceDefinitionId !== candidate.sourceDefinitionId
  ) {
    return undefined;
  }
  return { action, sourceCardInstanceId };
}

function knownNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function validDefenseSignals(
  signals: readonly CorpDefenseSignal[],
  context: PlanSchedulerContext,
): CorpDefenseSignal[] {
  const invalid = signals.find((signal) => !isValidDefenseSignal(signal));
  if (!invalid) return [...signals];
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds: defenseSignalActionIds(invalid),
    owner: "plan_module",
    removalCondition: `Replace incomplete or legacy Corp defense signal ${String(
      (invalid as { defenseId?: unknown }).defenseId ?? "unknown",
    )} with a complete discriminated defense contract.`,
  });
}

function defenseSignalActionIds(signal: CorpDefenseSignal): string[] {
  const value = signal as unknown as Record<string, unknown>;
  if (
    (value.kind === "score_protection_install" ||
      value.kind === "score_protection_staging_install" ||
      value.kind === "score_protection_draw") &&
    nonEmptyString(value.actionId)
  ) {
    return [value.actionId];
  }
  return Array.isArray(value.actionIds)
    ? value.actionIds.filter(nonEmptyString)
    : [];
}

function isValidDefenseSignal(
  signal: CorpDefenseSignal,
): signal is CorpDefenseSignal {
  const value = signal as unknown as Record<string, unknown>;
  if (
    !nonEmptyString(value.defenseId) ||
    !nonEmptyString(value.serverId) ||
    !nonEmptyString(value.evidenceCode)
  ) {
    return false;
  }
  if (value.kind === "generic") {
    const installRoute = value.installRoute as
      | Record<string, unknown>
      | undefined;
    const validatesInstallRoute =
      value.phase === "install_ice" ||
      (value.phase === "install_defense_support" && installRoute !== undefined);
    return (
      hasOnlyKeys(value, GENERIC_DEFENSE_SIGNAL_KEYS) &&
      genericDefensePhase(value.phase) &&
      (value.restrictedRezFunding === undefined ||
        (value.phase === "rez_response" &&
          value.rezWindowVerdict === "productive" &&
          signal.kind === "generic" &&
          signal.restrictedRezFunding !== undefined &&
          knownNonNegativeInteger(signal.restrictedRezFunding.gap) &&
          signal.restrictedRezFunding.gap > 0 &&
          Array.isArray(signal.restrictedRezFunding.quotes) &&
          signal.restrictedRezFunding.quotes.length > 0 &&
          signal.restrictedRezFunding.quotes.every(
            (quote) =>
              quote.consumer?.actionType === "rez_ice" &&
              quote.consumer.currentRunAccessBlock !== undefined &&
              quote.consumer.availableBeforePayout === false &&
              quote.consumer.sourceCardInstanceId ===
                signal.targetIceInstanceId &&
              quote.consumer.serverId === signal.serverId,
          ) &&
          signal.actionIds?.length === 0)) &&
      Array.isArray(value.sourceDefinitionIds) &&
      value.sourceDefinitionIds.every(nonEmptyString) &&
      (value.actionIds === undefined ||
        (Array.isArray(value.actionIds) &&
          value.actionIds.every(nonEmptyString))) &&
      typeof value.urgent === "boolean" &&
      (value.centralPressure === undefined ||
        value.centralPressure === "material" ||
        value.centralPressure === "acute" ||
        value.centralPressure === "terminal") &&
      typeof value.value === "number" &&
      Number.isFinite(value.value) &&
      (validatesInstallRoute
        ? installRoute !== undefined &&
          hasOnlyKeys(
            installRoute,
            new Set([
              "disposition",
              "progressKind",
              "rezFundingGap",
              "projection",
            ]),
          ) &&
          (installRoute.disposition === "productive" ||
            installRoute.disposition === "funding_only") &&
          (installRoute.progressKind === undefined ||
            installRoute.progressKind === "engine_certified_access" ||
            installRoute.progressKind === "funded_structured_central_defense" ||
            installRoute.progressKind === "scoreline_central_tax_allocation" ||
            installRoute.progressKind === "staged_central_defense" ||
            installRoute.progressKind === "score_material_capacity_release" ||
            installRoute.progressKind ===
              "agenda_capacity_defense_conversion" ||
            installRoute.progressKind === "funding_required") &&
          (installRoute.rezFundingGap === undefined ||
            knownNonNegativeInteger(installRoute.rezFundingGap)) &&
          validKnownInstallProjection(installRoute.projection)
        : installRoute === undefined) &&
      (value.phase === "fund_rez_reserve"
        ? validCorpRezReserveNeed(value.rezReserveNeed) &&
          nonEmptyString(value.targetIceInstanceId) &&
          value.centralPressure === "terminal" &&
          value.urgent === true
        : value.rezReserveNeed === undefined) &&
      (value.choiceResolution === undefined ||
        (value.phase === "resolve_install_targets" &&
          validAgendaPurgeDefenseChoiceResolution(
            value.choiceResolution,
            value,
          )) ||
        (value.phase === "resolve_run_redirect" &&
          validClassicDeflectorDefenseChoiceResolution(
            value.choiceResolution,
            value,
          ))) &&
      (value.phase !== "resolve_post_pass_ice_lifecycle" ||
        (value.sourceDefinitionIds.length === 1 &&
          Array.isArray(value.actionIds) &&
          value.actionIds.length > 0 &&
          nonEmptyString(value.targetIceInstanceId))) &&
      (value.rezRoute === undefined ||
        (value.phase === "rez_response" &&
          validExactIceRezRoute(value.rezRoute))) &&
      (value.parentKind === undefined
        ? value.parentProjectId === undefined &&
          value.parentNeedId === undefined &&
          value.sourceCardInstanceId === undefined
        : value.parentKind === "remote" &&
          value.phase === "install_defense_support" &&
          nonEmptyString(value.parentProjectId) &&
          nonEmptyString(value.parentNeedId) &&
          nonEmptyString(value.sourceCardInstanceId)) &&
      validGenericDrawAttemptState(value.drawAttemptState)
    );
  }
  if (value.kind === "score_protection_install") {
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_INSTALL_SIGNAL_KEYS) &&
      value.phase === "install_ice" &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      nonEmptyString(value.sourceCardInstanceId) &&
      nonEmptyString(value.sourceDefinitionId) &&
      (value.effect === "progress" || value.effect === "satisfied") &&
      validExactProbability(value.runnerAccessSuccessProbability) &&
      knownNonNegativeInteger(value.totalInstallAndRezCredits) &&
      validKnownInstallProjection(value.projection) &&
      exactInstallRouteCreditCost(
        value.projection as KnownCorpFundedIceInstallRouteProjection,
      ) === value.totalInstallAndRezCredits &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .actionId === value.actionId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .sourceCardInstanceId === value.sourceCardInstanceId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .sourceDefinitionId === value.sourceDefinitionId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .targetServerId === value.serverId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection).effect ===
        value.effect &&
      exactProbabilityValuesEqual(
        value.runnerAccessSuccessProbability,
        (value.projection as KnownCorpFundedIceInstallRouteProjection).after
          .protection.runnerAccessSuccessProbability,
      )
    );
  }
  if (value.kind === "score_protection_staging_install") {
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_STAGING_INSTALL_SIGNAL_KEYS) &&
      value.phase === "install_ice" &&
      nonEmptyString(value.serverId) &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      nonEmptyString(value.sourceCardInstanceId) &&
      nonEmptyString(value.sourceDefinitionId)
    );
  }
  if (value.kind === "score_protection_draw") {
    const attempt = value.drawAttemptState as
      | Record<string, unknown>
      | undefined;
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_DRAW_SIGNAL_KEYS) &&
      value.phase === "draw_for_ice" &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      (value.cleanupReplacementDraw === undefined ||
        typeof value.cleanupReplacementDraw === "boolean") &&
      attempt !== undefined &&
      hasOnlyKeys(attempt, SCORE_PROTECTION_DRAW_ATTEMPT_KEYS) &&
      nonEmptyString(attempt.turnKey) &&
      attempt.remainingAttempts === 1 &&
      (attempt.selectedAtStateVersion === undefined ||
        knownNonNegativeInteger(attempt.selectedAtStateVersion))
    );
  }
  return false;
}

function validAgendaPurgeDefenseChoiceResolution(
  resolutionValue: unknown,
  signalValue: Record<string, unknown>,
): boolean {
  if (!resolutionValue || typeof resolutionValue !== "object") return false;
  const resolution = resolutionValue as Record<string, unknown>;
  const revealedCardIds = resolution.revealedCardIds;
  const targets = resolution.targets;
  const actionIds = signalValue.actionIds;
  if (
    !hasOnlyKeys(
      resolution,
      new Set([
        "kind",
        "choiceId",
        "sourceAgendaId",
        "sourceStateVersion",
        "revealedCardIds",
        "targets",
      ]),
    ) ||
    resolution.kind !== "agenda_purge_install_targets" ||
    !nonEmptyString(resolution.choiceId) ||
    !nonEmptyString(resolution.sourceAgendaId) ||
    !knownNonNegativeInteger(resolution.sourceStateVersion) ||
    !Array.isArray(revealedCardIds) ||
    revealedCardIds.length === 0 ||
    !revealedCardIds.every(nonEmptyString) ||
    new Set(revealedCardIds).size !== revealedCardIds.length ||
    !Array.isArray(targets) ||
    targets.length === 0 ||
    !Array.isArray(actionIds) ||
    actionIds.length !== 1 ||
    !nonEmptyString(actionIds[0])
  ) {
    return false;
  }
  const targetRecords = targets as Array<Record<string, unknown>>;
  return (
    targetRecords.every(
      (target) =>
        target !== null &&
        typeof target === "object" &&
        hasOnlyKeys(target, new Set(["cardId", "serverId", "optionId"])) &&
        nonEmptyString(target.cardId) &&
        revealedCardIds.includes(target.cardId) &&
        nonEmptyString(target.serverId) &&
        nonEmptyString(target.optionId),
    ) &&
    new Set(targetRecords.map((target) => target.cardId)).size ===
      targetRecords.length &&
    new Set(targetRecords.map((target) => target.optionId)).size ===
      targetRecords.length &&
    signalValue.serverId === targetRecords[0]?.serverId
  );
}

function validClassicDeflectorDefenseChoiceResolution(
  resolutionValue: unknown,
  signalValue: Record<string, unknown>,
): boolean {
  if (!resolutionValue || typeof resolutionValue !== "object") return false;
  const resolution = resolutionValue as Record<string, unknown>;
  const actionIds = signalValue.actionIds;
  const disposition = resolution.disposition;
  const selectedServerId = resolution.selectedServerId;
  return (
    hasOnlyKeys(
      resolution,
      new Set([
        "kind",
        "choiceId",
        "sourceStateVersion",
        "runId",
        "sourceIceInstanceId",
        "sourceDefinitionId",
        "subroutineIndex",
        "subroutineId",
        "targetProfile",
        "creditCost",
        "autoBreakIfNoTarget",
        "selectedOptionId",
        "disposition",
        "selectedServerId",
      ]),
    ) &&
    resolution.kind === "classic_deflector_redirect" &&
    nonEmptyString(resolution.choiceId) &&
    knownNonNegativeInteger(resolution.sourceStateVersion) &&
    nonEmptyString(resolution.runId) &&
    nonEmptyString(resolution.sourceIceInstanceId) &&
    nonEmptyString(resolution.sourceDefinitionId) &&
    knownNonNegativeInteger(resolution.subroutineIndex) &&
    nonEmptyString(resolution.subroutineId) &&
    (resolution.targetProfile === "archives" ||
      resolution.targetProfile === "any_data_fort" ||
      resolution.targetProfile === "subsidiary_data_fort") &&
    knownNonNegativeInteger(resolution.creditCost) &&
    typeof resolution.autoBreakIfNoTarget === "boolean" &&
    nonEmptyString(resolution.selectedOptionId) &&
    (disposition === "redirect" || disposition === "decline") &&
    (disposition === "redirect"
      ? nonEmptyString(selectedServerId) &&
        resolution.selectedOptionId === `server_${selectedServerId}` &&
        signalValue.serverId === selectedServerId
      : selectedServerId === undefined &&
        resolution.selectedOptionId === "decline") &&
    Array.isArray(actionIds) &&
    actionIds.length === 1 &&
    nonEmptyString(actionIds[0])
  );
}

function isGenericDefenseSignal(
  signal: CorpDefenseSignal,
): signal is CorpGenericDefenseSignal {
  return signal.kind === "generic";
}

function isScoreProtectionInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionInstallSignal {
  return signal.kind === "score_protection_install";
}

function isScoreProtectionStagingInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionStagingInstallSignal {
  return signal.kind === "score_protection_staging_install";
}

function isScoreProtectionDrawSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionDrawSignal {
  return signal.kind === "score_protection_draw";
}

function genericDefensePhase(
  value: unknown,
): value is CorpGenericDefenseSignal["phase"] {
  return (
    value === "install_ice" ||
    value === "install_defense_support" ||
    value === "resolve_install_targets" ||
    value === "resolve_run_redirect" ||
    value === "resolve_post_pass_ice_lifecycle" ||
    value === "draw_for_ice" ||
    value === "fund_rez_reserve" ||
    value === "rez_response" ||
    value === "activate_run_defense" ||
    value === "pass_encounter" ||
    value === "decline_rez"
  );
}

function validCorpRezReserveNeed(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const reserve = value as Record<string, unknown>;
  return (
    hasOnlyKeys(
      reserve,
      new Set([
        "observedAtStateVersion",
        "currentCredits",
        "requiredCredits",
        "fundingGap",
        "storedRestrictedCredits",
      ]),
    ) &&
    knownNonNegativeInteger(reserve.observedAtStateVersion) &&
    knownNonNegativeInteger(reserve.currentCredits) &&
    knownNonNegativeInteger(reserve.requiredCredits) &&
    knownNonNegativeInteger(reserve.fundingGap) &&
    (reserve.storedRestrictedCredits === undefined ||
      knownNonNegativeInteger(reserve.storedRestrictedCredits)) &&
    (reserve.fundingGap as number) > 0 &&
    (reserve.requiredCredits as number) -
      (reserve.currentCredits as number) -
      ((reserve.storedRestrictedCredits as number | undefined) ?? 0) ===
      reserve.fundingGap
  );
}

function scorePriorityClass(value: unknown): value is CorpScorePriorityClass {
  return value === "P1" || value === "P2" || value === "P3" || value === "P4";
}

function validExactProbability(value: unknown): value is ExactProbability {
  if (!value || typeof value !== "object") return false;
  const probability = value as Record<string, unknown>;
  return (
    knownNonNegativeInteger(probability.numerator) &&
    knownNonNegativeInteger(probability.denominator) &&
    probability.denominator > 0 &&
    probability.numerator <= probability.denominator
  );
}

function validKnownInstallProjection(
  value: unknown,
): value is KnownCorpFundedIceInstallRouteProjection {
  if (!value || typeof value !== "object") return false;
  const projection = value as Record<string, unknown>;
  const before = projection.before as Record<string, unknown> | undefined;
  const after = projection.after as Record<string, unknown> | undefined;
  const afterProtection = after?.protection as
    | Record<string, unknown>
    | undefined;
  return (
    projection.knowledge === "known" &&
    (projection.effect === "no_progress" ||
      projection.effect === "progress" ||
      projection.effect === "satisfied") &&
    nonEmptyString(projection.actionId) &&
    nonEmptyString(projection.sourceCardInstanceId) &&
    nonEmptyString(projection.sourceDefinitionId) &&
    nonEmptyString(projection.targetServerId) &&
    before?.knowledge === "known" &&
    after?.knowledge === "known" &&
    afterProtection?.knowledge === "known" &&
    validExactProbability(afterProtection.runnerAccessSuccessProbability) &&
    knownNonNegativeInteger(projection.installCredits) &&
    knownNonNegativeInteger(projection.installClicks) &&
    projection.installCostSource === "legal_action_agreed_projection" &&
    Array.isArray(projection.selectedRezCosts) &&
    projection.selectedRezCosts.every((selected) => {
      if (!selected || typeof selected !== "object") return false;
      const rezCost = selected as Record<string, unknown>;
      return (
        nonEmptyString(rezCost.iceInstanceId) &&
        nonEmptyString(rezCost.iceDefinitionId) &&
        knownNonNegativeInteger(rezCost.credits) &&
        rezCost.source === "engine_rez_cost_quote"
      );
    }) &&
    knownNonNegativeInteger(projection.creditsAfterDefense) &&
    knownNonNegativeInteger(projection.clicksAfterDefense) &&
    typeof projection.preservesScoreCreditReserve === "boolean" &&
    typeof projection.preservesHardClickReserve === "boolean" &&
    typeof projection.preservesReserves === "boolean" &&
    typeof projection.funded === "boolean" &&
    exactInstallRouteCreditCost(
      value as KnownCorpFundedIceInstallRouteProjection,
    ) !== undefined
  );
}

function validExactIceRezRoute(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const route = value as Record<string, unknown>;
  const quote = route.quote as Record<string, unknown> | undefined;
  const before = route.before as Record<string, unknown> | undefined;
  const after = route.after as Record<string, unknown> | undefined;
  const resourceExchange = route.resourceExchange as
    | Record<string, unknown>
    | undefined;
  const hasKnownHolisticAssessment =
    before?.knowledge === "known" &&
    after?.knowledge === "known" &&
    validExactProbability(before.runnerAccessSuccessProbability) &&
    validExactProbability(after.runnerAccessSuccessProbability);
  const hasExactResourceExchange =
    route.routeKind === "exact_resource_exchange" &&
    resourceExchange !== undefined &&
    knownNonNegativeInteger(resourceExchange.runnerRequiredCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerPumpCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerBreakCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerBreakUses) &&
    nonEmptyString(resourceExchange.runnerBreakerInstanceId) &&
    nonEmptyString(resourceExchange.runnerBreakerDefinitionId) &&
    Array.isArray(resourceExchange.runnerConsumedCardInstanceIds) &&
    resourceExchange.runnerConsumedCardInstanceIds.every(nonEmptyString) &&
    (resourceExchange.layeredCentralPathTax === undefined ||
      (resourceExchange.layeredCentralPathTax === true &&
        knownNonNegativeInteger(resourceExchange.otherRezzedIceCount) &&
        (resourceExchange.otherRezzedIceCount as number) > 0)) &&
    (resourceExchange.runnerRandomConsequences === undefined ||
      (Array.isArray(resourceExchange.runnerRandomConsequences) &&
        resourceExchange.runnerRandomConsequences.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const consequence = entry as Record<string, unknown>;
          return (
            consequence.kind === "post_encounter_self_trash_check" &&
            nonEmptyString(consequence.cardId) &&
            nonEmptyString(consequence.definitionId) &&
            knownNonNegativeInteger(consequence.numerator) &&
            (consequence.numerator as number) > 0 &&
            knownNonNegativeInteger(consequence.denominator) &&
            (consequence.denominator as number) >=
              (consequence.numerator as number)
          );
        })));
  const accessBlock = route.accessBlock as Record<string, unknown> | undefined;
  const hasExactAccessBlock =
    route.routeKind === "access_reduction" &&
    accessBlock !== undefined &&
    knownNonNegativeInteger(accessBlock.hardEndTheRunSubroutineCount) &&
    (accessBlock.hardEndTheRunSubroutineCount as number) > 0 &&
    (accessBlock.reason === "no_visible_eligible_breaker" ||
      accessBlock.reason === "visible_break_route_unaffordable");
  const trace = route.traceAccessBlock as Record<string, unknown> | undefined;
  const hasExactTraceBlock =
    route.routeKind === "trace_access_block" &&
    trace !== undefined &&
    trace.actionId === route.actionId &&
    trace.sourceCardInstanceId === route.sourceCardInstanceId &&
    trace.targetServerId === route.targetServerId &&
    trace.stateVersion === quote?.expiresAtStateVersion &&
    nonEmptyString(trace.runId) &&
    trace.rezCredits === quote?.finalCredits &&
    knownNonNegativeInteger(trace.variableValue) &&
    trace.corpBid === 0 &&
    knownNonNegativeInteger(trace.corpTraceStrength) &&
    knownNonNegativeInteger(trace.maximumRunnerTraceStrength) &&
    trace.corpTraceStrength > trace.maximumRunnerTraceStrength &&
    trace.runnerCanBreak === false &&
    trace.guaranteedRunEnd === true;
  const hasExactMarginalDefenseThreat =
    route.routeKind === "qualitative_encounter_defense" &&
    (route.marginalDefenseThreat === "visible_agenda_remote" ||
      route.marginalDefenseThreat === "terminal_central_access");
  const bluff = route.bluffDefenseNeed as Record<string, unknown> | undefined;
  const hasBoundBluffDefense =
    bluff !== undefined &&
    bluff.serverId === route.targetServerId &&
    bluff.iceInstanceId === route.sourceCardInstanceId &&
    bluff.observedAtStateVersion === quote?.expiresAtStateVersion &&
    nonEmptyString(bluff.sourceInstanceId) &&
    knownNonNegativeInteger(bluff.requiredCredits) &&
    knownNonNegativeInteger(bluff.encounterCredits) &&
    bluff.fundingGap === 0 &&
    (bluff.outcome === "access_cost" ||
      bluff.outcome === "visible_stop" ||
      bluff.outcome === "paid_encounter_opportunity");
  const freeCurrentEncounterDefense = route.freeCurrentEncounterDefense as
    | Record<string, unknown>
    | undefined;
  const hasExactFreeCurrentEncounterDefense =
    route.routeKind === "qualitative_encounter_defense" &&
    freeCurrentEncounterDefense?.effect ===
      "meaningful_tax_or_damage_or_disruption" &&
    freeCurrentEncounterDefense.evidenceSource ===
      "visible_corp_ice_defense_profile" &&
    quote?.finalCredits === 0;
  return (
    nonEmptyString(route.actionId) &&
    nonEmptyString(route.sourceCardInstanceId) &&
    nonEmptyString(route.sourceDefinitionId) &&
    nonEmptyString(route.targetServerId) &&
    quote?.context === "installed" &&
    quote.complete === true &&
    quote.cardId === route.sourceCardInstanceId &&
    quote.targetServerId === route.targetServerId &&
    knownNonNegativeInteger(quote.expiresAtStateVersion) &&
    knownNonNegativeInteger(quote.finalCredits) &&
    (hasKnownHolisticAssessment ||
      hasExactResourceExchange ||
      hasExactAccessBlock ||
      hasExactTraceBlock ||
      hasBoundBluffDefense ||
      hasExactMarginalDefenseThreat ||
      hasExactFreeCurrentEncounterDefense) &&
    (route.effect === "progress" || route.effect === "satisfied") &&
    knownNonNegativeInteger(route.totalRezCredits) &&
    quote.finalCredits === route.totalRezCredits
  );
}

function exactProbabilityValuesEqual(
  left: unknown,
  right: ExactProbability,
): boolean {
  if (!left || typeof left !== "object") return false;
  const probability = left as Record<string, unknown>;
  return (
    probability.numerator === right.numerator &&
    probability.denominator === right.denominator
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

const GENERIC_DEFENSE_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "sourceDefinitionIds",
  "parentKind",
  "parentProjectId",
  "parentNeedId",
  "sourceCardInstanceId",
  "actionIds",
  "targetIceInstanceId",
  "followupIceInstanceId",
  "urgent",
  "centralPressure",
  "immediateInstallSupport",
  "rezWindowVerdict",
  "installRoute",
  "rezReserveNeed",
  "rezRoute",
  "restrictedRezFunding",
  "value",
  "evidenceCode",
  "choiceResolution",
  "drawAttemptState",
]);

const SCORE_PROTECTION_INSTALL_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "sourceCardInstanceId",
  "sourceDefinitionId",
  "effect",
  "runnerAccessSuccessProbability",
  "totalInstallAndRezCredits",
  "projection",
  "evidenceCode",
]);

const SCORE_PROTECTION_STAGING_INSTALL_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "sourceCardInstanceId",
  "sourceDefinitionId",
  "evidenceCode",
]);

const SCORE_PROTECTION_DRAW_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "cleanupReplacementDraw",
  "drawAttemptState",
  "evidenceCode",
]);

const SCORE_PROTECTION_DRAW_ATTEMPT_KEYS = new Set([
  "turnKey",
  "remainingAttempts",
  "selectedAtStateVersion",
]);

function validGenericDrawAttemptState(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const attempt = value as Record<string, unknown>;
  return (
    hasOnlyKeys(attempt, SCORE_PROTECTION_DRAW_ATTEMPT_KEYS) &&
    nonEmptyString(attempt.turnKey) &&
    (attempt.remainingAttempts === 0 || attempt.remainingAttempts === 1) &&
    (attempt.selectedAtStateVersion === undefined ||
      knownNonNegativeInteger(attempt.selectedAtStateVersion))
  );
}

function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function defenseSignalOrderingValue(signal: CorpDefenseSignal): number {
  if (signal.kind === "generic") return signal.value;
  if (signal.kind === "score_protection_install") {
    return signal.effect === "satisfied" ? 2 : 1;
  }
  if (signal.kind === "score_protection_staging_install") return 1;
  return 0;
}

function technicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function defensePortfolioAssessmentValue(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  _priorityClass: PriorityClass,
  centralAllocation?: CorpCentralDefenseAllocation,
): number {
  const selectedBand = selectedDefensePortfolioBand(
    context,
    signals,
    centralAllocation,
  );
  if (selectedBand.kind === "score") {
    return selectedBand.route.signal.kind === "score_protection_install" &&
      selectedBand.route.signal.effect === "satisfied"
      ? 2
      : 1;
  }
  const selectedCandidate = selectedBand.candidates[0];
  if (!selectedCandidate) return 0;
  const selectedSignal = selectedBand.eligibleSignals.find((signal) =>
    defenseCandidates(context, signal).some(
      ({ candidate }) =>
        candidate.actionId === selectedCandidate.candidate.actionId,
    ),
  );
  if (selectedSignal?.phase === "install_ice") {
    return selectedSignal.installRoute?.projection.effect === "satisfied"
      ? 2
      : 1;
  }
  return Math.max(1, selectedCandidate.stepValue);
}

function isDefensePlacementPhase(phase: CorpDefenseSignal["phase"]): boolean {
  return (
    phase === "install_ice" ||
    phase === "install_defense_support" ||
    phase === "resolve_install_targets"
  );
}

function dedupeRouteCandidates(
  candidates: PlanMaterialization["candidates"],
): PlanMaterialization["candidates"] {
  const byActionId = new Map<
    string,
    PlanMaterialization["candidates"][number]
  >();
  for (const candidate of candidates) {
    const previous = byActionId.get(candidate.candidate.actionId);
    if (!previous || candidate.stepValue > previous.stepValue) {
      byActionId.set(candidate.candidate.actionId, candidate);
    }
  }
  return [...byActionId.values()];
}

function urgentDefenseBand(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
): readonly CorpGenericDefenseSignal[] {
  const exactWindowSignals = exactRezWindowAlternatives(signals);
  const urgentWindowSignals = exactWindowSignals.filter(
    (signal) =>
      signal.urgent &&
      (signal.phase === "rez_response" ||
        signal.phase === "decline_rez" ||
        signal.phase === "activate_run_defense" ||
        signal.phase === "pass_encounter" ||
        signal.phase === "resolve_post_pass_ice_lifecycle") &&
      defenseCandidates(context, signal).length > 0,
  );
  if (urgentWindowSignals.length > 0) return urgentWindowSignals;
  return exactWindowSignals;
}

function exactRezWindowAlternatives(
  signals: readonly CorpGenericDefenseSignal[],
): readonly CorpGenericDefenseSignal[] {
  const productiveRezExists = signals.some(
    (signal) =>
      signal.phase === "rez_response" &&
      signal.rezWindowVerdict === "productive",
  );
  return signals.filter((signal) => {
    if (
      signal.phase === "rez_response" &&
      signal.rezWindowVerdict === "nonproductive"
    ) {
      return false;
    }
    if (signal.phase === "decline_rez" && productiveRezExists) {
      return false;
    }
    return true;
  });
}

function corpCandidateProjectsCardDraw(
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType === "draw.card") return true;
  const cardsDrawn = candidate.economyProjection?.cardsDrawn;
  return (
    typeof cardsDrawn === "number" &&
    Number.isFinite(cardsDrawn) &&
    cardsDrawn > 0
  );
}
