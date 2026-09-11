import {
  runnerCandidateExecutesProgramSearch,
  runnerProgramSearchSourceCardInstanceId,
} from "../../runtime/runner-program-search-facts";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
} from "../../runtime/runner-action-source-facts";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type {
  BreakerCapability,
  DeckCapabilityProfile,
} from "../../deck-capabilities";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import {
  runnerRolesCoverCoverageGap,
  type RunnerCoverageGapSignal,
} from "../../plans/runner-coverage-contracts";
import {
  quoteRunnerBreakerUpgradeEconomics,
  type RunnerBreakerUpgradeEconomicQuote,
} from "./runner-breaker-upgrade-economics";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { coverageSupportActionIds } from "./coverage-support";
import { runnerVisibleDeckBreaker } from "./coverage-card-facts";
import type { RunnerCoverageServices } from "./coverage-services";
export type RunnerBreakerCoverageUpgrade = Readonly<{
  requiredRole: RunnerCoverageGapSignal["requiredRole"];
  visibleAnswer?: VisibleCard;
  deckHasAlternative: true;
  targetDefinitionId: string;
  searchActionId?: string;
  recoveryMode: "install_visible_upgrade" | "search_known_upgrade";
  memorySupportActionId?: string;
  memorySupportDefinitionId?: string;
  economicQuote: RunnerBreakerUpgradeEconomicQuote;
  evidenceCodes: string[];
}>;

export type RunnerBreakerUpgradeMemorySupportRoute = Readonly<{
  actionId: string;
  definitionId: string;
  additionalMu: number;
  creditCost: number;
  clickCost: number;
}>;

export function runnerBreakerCoverageUpgrade(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  deckCapabilities: DeckCapabilityProfile,
  economy: RunnerEconomyPosture,
  services: RunnerCoverageServices,
): RunnerBreakerCoverageUpgrade | undefined {
  if (
    evaluation.runActionProjection?.sourceKind !== "basic_action" ||
    evaluation.targetKind === "remote" ||
    evaluation.targetServerId === "archives" ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.pathCost <= 0 ||
    !Number.isSafeInteger(evaluation.pathCost) ||
    evaluation.scoreThreat ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoff === "known_low_value" ||
    evaluation.accessPayoffContestable === false ||
    !services.runnerCentralPressureHasMaterialMarginalValue(
      input,
      evaluation,
    ) ||
    !services.runnerCentralPressureCadence(
      input,
      evaluation.targetServerId as "hq" | "rd",
    ).routeAvailable
  ) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === evaluation.targetServerId,
  );
  if (
    !server ||
    server.ice.length === 0 ||
    server.ice.some((ice) => !ice.known || ice.rezzed !== true)
  ) {
    return undefined;
  }
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  if (
    !Number.isSafeInteger(memoryUsed) ||
    !Number.isSafeInteger(memoryLimit) ||
    (memoryUsed ?? -1) < 0 ||
    (memoryLimit ?? -1) < 0
  ) {
    return undefined;
  }
  const memoryAvailable = Math.max(
    0,
    (memoryLimit as number) - (memoryUsed as number),
  );
  const installedDefinitionIds = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      card.definitionId ? [card.definitionId] : [],
    ),
  );
  const upgradeCandidates = (deckCapabilities.runner?.breakerInventory ?? [])
    .flatMap((breaker) => {
      const visibleAnswer = input.playerView.own.gripOrHq.find(
        (card) => card.known && card.definitionId === breaker.cardId,
      );
      const knownInDeck =
        breaker.quantityKnownInDeck > 0 &&
        breaker.locations.includes("in_deck");
      if (
        breaker.confidence !== "high" ||
        installedDefinitionIds.has(breaker.cardId) ||
        (!visibleAnswer && !knownInDeck) ||
        breaker.risks.length > 0 ||
        breaker.restrictions.length > 0
      ) {
        return [];
      }
      const projectedBreaker = runnerVisibleDeckBreaker(breaker);
      const candidateMemoryCost = projectedBreaker?.memoryCost;
      if (
        !projectedBreaker ||
        !Number.isSafeInteger(candidateMemoryCost) ||
        (candidateMemoryCost ?? -1) < 0
      ) {
        return [];
      }
      const requiredRole = runnerBreakerUpgradeRequiredRole(breaker, server);
      if (
        !requiredRole ||
        !runnerRolesCoverCoverageGap(
          rolesForDeckDoctrineCard(breaker.cardId),
          requiredRole,
        )
      ) {
        return [];
      }
      const memoryDeficit = Math.max(
        0,
        (candidateMemoryCost as number) - memoryAvailable,
      );
      const memorySupportRoutes: readonly (
        | RunnerBreakerUpgradeMemorySupportRoute
        | undefined
      )[] =
        memoryDeficit > 0
          ? runnerBreakerUpgradeMemorySupportRoutes(
              input,
              candidates,
              memoryDeficit,
            )
          : [undefined];
      if (memorySupportRoutes.length === 0) return [];
      const currentInstallRoute = visibleAnswer
        ? runnerVisibleBreakerUpgradeInstallRoute(
            input,
            candidates,
            visibleAnswer,
          )
        : undefined;
      const installRoute =
        currentInstallRoute ??
        (visibleAnswer && memoryDeficit > 0
          ? runnerVisibleBreakerUpgradeMemoryBlockedInstallRoute(
              input,
              candidates,
              visibleAnswer,
            )
          : undefined);
      const searchRoute = visibleAnswer
        ? undefined
        : runnerBreakerUpgradeSearchRoute(
            input,
            candidates,
            deckCapabilities,
            requiredRole,
            breaker.cardId,
          );
      if (visibleAnswer && !installRoute) return [];
      if (!visibleAnswer && !searchRoute) return [];
      const installCreditCost =
        installRoute?.creditCost ?? projectedBreaker.installCost;
      if (
        !Number.isSafeInteger(installCreditCost) ||
        (installCreditCost ?? -1) < 0
      ) {
        return [];
      }
      const path = assessKnownRezzedIcePath(
        server.ice,
        [...(input.playerView.own.rig ?? []), projectedBreaker],
        Math.max(evaluation.pathCost, input.playerView.own.credits),
        server.root,
        input.playerView.opponent.credits,
      );
      const projectedPathCost = path.visibleBreakCost;
      if (
        !path.canReachAccess ||
        !Number.isSafeInteger(projectedPathCost) ||
        (projectedPathCost ?? -1) < 0
      ) {
        return [];
      }
      return memorySupportRoutes.flatMap((memorySupportRoute) => {
        const economicQuote = quoteRunnerBreakerUpgradeEconomics({
          phase: economy.creditReservePolicy.phase,
          scoreThreat: evaluation.scoreThreat,
          currentPathCost: evaluation.pathCost,
          projectedPathCost: projectedPathCost as number,
          plannedRunHorizon: 2,
          installCreditCost: installCreditCost as number,
          searchCreditCost: visibleAnswer ? 0 : (searchRoute?.creditCost ?? 0),
          installActionClicks: installRoute?.clickCost ?? 1,
          searchActionClicks: visibleAnswer ? 0 : (searchRoute?.clickCost ?? 0),
          memorySupportCreditCost: memorySupportRoute?.creditCost ?? 0,
          memorySupportActionClicks: memorySupportRoute?.clickCost ?? 0,
          memorySupportAdditionalMu: memorySupportRoute?.additionalMu ?? 0,
          consumesSearchCard:
            !visibleAnswer && searchRoute?.consumesCard === true,
          currentCredits: input.playerView.own.credits,
          desiredCreditReserve: economy.desiredCreditReserve,
          memoryAvailable,
          candidateMemoryCost: candidateMemoryCost as number,
        });
        if (!economicQuote.admitted) return [];
        const answer = visibleAnswer
          ? {
              ...visibleAnswer,
              installCost: installCreditCost as number,
            }
          : undefined;
        return [
          {
            requiredRole,
            ...(answer ? { visibleAnswer: answer } : {}),
            deckHasAlternative: true as const,
            targetDefinitionId: breaker.cardId,
            ...(!answer && searchRoute
              ? { searchActionId: searchRoute.actionId }
              : {}),
            ...(memorySupportRoute
              ? {
                  memorySupportActionId: memorySupportRoute.actionId,
                  memorySupportDefinitionId: memorySupportRoute.definitionId,
                }
              : {}),
            recoveryMode: answer
              ? ("install_visible_upgrade" as const)
              : ("search_known_upgrade" as const),
            economicQuote,
            evidenceCodes: [
              `coverage_upgrade_target:${evaluation.targetServerId}`,
              `coverage_upgrade_breaker:${breaker.cardId}`,
              `coverage_upgrade_required_role:${requiredRole}`,
              "coverage_upgrade_no_replacement_required:true",
              ...(memorySupportRoute
                ? [
                    `coverage_upgrade_memory_support:${memorySupportRoute.definitionId}`,
                    `coverage_upgrade_memory_support_action:${memorySupportRoute.actionId}`,
                    `coverage_upgrade_memory_support_mu:${memorySupportRoute.additionalMu}`,
                  ]
                : []),
              ...economicQuote.evidence,
            ],
          },
        ];
      });
    })
    .sort(
      (left, right) =>
        right.economicQuote.netValueBeforeSafetyMargin -
          left.economicQuote.netValueBeforeSafetyMargin ||
        left.economicQuote.projectedPathCost -
          right.economicQuote.projectedPathCost ||
        left.economicQuote.totalInvestment -
          right.economicQuote.totalInvestment ||
        left.targetDefinitionId.localeCompare(right.targetDefinitionId),
    );
  return upgradeCandidates[0];
}

export function runnerBreakerUpgradeSearchRoute(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
  targetDefinitionId: string,
):
  | {
      actionId: string;
      creditCost: number;
      clickCost: number;
      consumesCard: boolean;
    }
  | undefined {
  const legalSearchToolDefinitionIds = new Set(
    (deckCapabilities.runner?.searchAccess.tools ?? [])
      .filter(
        (tool) =>
          tool.canSearchBreakers && tool.legalNow && tool.status !== "in_deck",
      )
      .map((tool) => tool.cardId),
  );
  const exactTargetSearchActionIds = new Set(
    coverageSupportActionIds(
      input,
      candidates,
      deckCapabilities,
      requiredRole,
      {
        deckHasStackAnswerOverride: true,
        targetDefinitionIdOverride: targetDefinitionId,
      },
    ).directSearchActionIds,
  );
  return candidates
    .flatMap((candidate) => {
      const sourceDefinitionId = runnerCandidateSourceDefinitionId(
        input,
        candidate,
      );
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (
        !sourceDefinitionId ||
        !legalSearchToolDefinitionIds.has(sourceDefinitionId) ||
        !exactTargetSearchActionIds.has(candidate.actionId) ||
        !runnerCandidateExecutesProgramSearch(input, candidate) ||
        !action ||
        !runnerProgramSearchSourceCardInstanceId(input, candidate)
      ) {
        return [];
      }
      const clickCost = action.costs.reduce(
        (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
        0,
      );
      return [
        {
          actionId: candidate.actionId,
          creditCost: legalActionCreditCost(action),
          clickCost,
          consumesCard: action.type === "play_event",
        },
      ];
    })
    .sort(
      (left, right) =>
        left.creditCost +
          left.clickCost +
          Number(left.consumesCard) -
          (right.creditCost + right.clickCost + Number(right.consumesCard)) ||
        left.actionId.localeCompare(right.actionId),
    )[0];
}

export function runnerVisibleBreakerUpgradeInstallRoute(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  card: VisibleCard,
): { actionId: string; creditCost: number; clickCost: number } | undefined {
  return candidates
    .flatMap((candidate) => {
      if (candidate.semanticActionType !== "install.card") return [];
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (
        !action ||
        runnerInstallSourceInstanceId(candidate, action) !== card.instanceId ||
        action.payload?.runnerProgramTrashBeforeInstall === true ||
        candidate.actionId.endsWith(".runner_program_trash_before_install")
      ) {
        return [];
      }
      return [
        {
          actionId: candidate.actionId,
          creditCost: legalActionCreditCost(action),
          clickCost: action.costs.reduce(
            (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
            0,
          ),
        },
      ];
    })
    .sort(
      (left, right) =>
        left.creditCost +
          left.clickCost -
          (right.creditCost + right.clickCost) ||
        left.actionId.localeCompare(right.actionId),
    )[0];
}

export function runnerVisibleBreakerUpgradeMemoryBlockedInstallRoute(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  card: VisibleCard,
): { actionId: string; creditCost: number; clickCost: number } | undefined {
  return candidates
    .flatMap((candidate) => {
      if (candidate.semanticActionType !== "install.card") return [];
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (
        !action ||
        runnerInstallSourceInstanceId(candidate, action) !== card.instanceId ||
        (action.payload?.runnerProgramTrashBeforeInstall !== true &&
          !candidate.actionId.endsWith(".runner_program_trash_before_install"))
      ) {
        return [];
      }
      return [
        {
          actionId: candidate.actionId,
          creditCost: legalActionCreditCost(action),
          clickCost: action.costs.reduce(
            (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
            0,
          ),
        },
      ];
    })
    .sort(
      (left, right) =>
        left.creditCost +
          left.clickCost -
          (right.creditCost + right.clickCost) ||
        left.actionId.localeCompare(right.actionId),
    )[0];
}

export function runnerBreakerUpgradeMemorySupportRoutes(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  requiredAdditionalMu: number,
): RunnerBreakerUpgradeMemorySupportRoute[] {
  if (!Number.isSafeInteger(requiredAdditionalMu) || requiredAdditionalMu <= 0)
    return [];
  return candidates
    .flatMap((candidate) => {
      if (candidate.semanticActionType !== "install.card") return [];
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (!action || action.side !== "runner" || action.type !== "install_card")
        return [];
      const sourceInstanceId = runnerInstallSourceInstanceId(candidate, action);
      const card = input.playerView.own.gripOrHq.find(
        (entry) =>
          entry.known !== false && entry.instanceId === sourceInstanceId,
      );
      const definition = card?.definitionId
        ? CARD_DEFINITIONS_BY_ID[card.definitionId]
        : undefined;
      const additionalMu = Math.max(
        0,
        card?.memoryLimitBonus ?? definition?.memoryLimitBonus ?? 0,
      );
      if (
        !card?.definitionId ||
        !Number.isSafeInteger(additionalMu) ||
        additionalMu < requiredAdditionalMu
      ) {
        return [];
      }
      return [
        {
          actionId: action.actionId,
          definitionId: card.definitionId,
          additionalMu,
          creditCost: legalActionCreditCost(action),
          clickCost: action.costs.reduce(
            (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
            0,
          ),
        },
      ];
    })
    .sort(
      (left, right) =>
        left.creditCost +
          left.clickCost -
          (right.creditCost + right.clickCost) ||
        left.additionalMu - right.additionalMu ||
        left.definitionId.localeCompare(right.definitionId) ||
        left.actionId.localeCompare(right.actionId),
    );
}

export function runnerBreakerUpgradeRequiredRole(
  breaker: BreakerCapability,
  server: AiDecisionInput["playerView"]["servers"][number],
): RunnerCoverageGapSignal["requiredRole"] | undefined {
  const subtypes = new Set(
    server.ice.flatMap((ice) =>
      (ice.subtypes ?? []).map((subtype) =>
        subtype.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_"),
      ),
    ),
  );
  for (const [coverage, role, subtype] of [
    ["wall", "breaker_wall", "wall"],
    ["code_gate", "breaker_code_gate", "code_gate"],
    ["sentry", "breaker_sentry", "sentry"],
    ["ap", "breaker_ap", "ap"],
    ["trace", "breaker_trace", "trace"],
  ] as const) {
    if (breaker.coverage.includes(coverage) && subtypes.has(subtype)) {
      return role;
    }
  }
  if (breaker.coverage.includes("universal")) return "breaker_universal";
  return undefined;
}

export function runnerBreakerUpgradeSupportActions(
  support: ReturnType<typeof coverageSupportActionIds>,
  searchActionId: string | undefined,
): ReturnType<typeof coverageSupportActionIds> {
  const acceptedSearchActionIds = new Set(
    searchActionId ? [searchActionId] : [],
  );
  const directSearchChoiceBindings = support.directSearchChoiceBindings?.filter(
    (binding) => acceptedSearchActionIds.has(binding.actionId),
  );
  return {
    directSearchActionIds: support.directSearchActionIds.filter((actionId) =>
      acceptedSearchActionIds.has(actionId),
    ),
    ...(directSearchChoiceBindings ? { directSearchChoiceBindings } : {}),
    rejectedSearchActionIds: [
      ...new Set([
        ...(support.rejectedSearchActionIds ?? []),
        ...support.directSearchActionIds.filter(
          (actionId) => !acceptedSearchActionIds.has(actionId),
        ),
        ...support.searchEngineSetupActionIds,
      ]),
    ],
    searchEngineSetupActionIds: [],
    drawForAnswerActionIds: [],
  };
}

export function runnerBreakerUpgradeSignalQuote(
  upgrade: RunnerBreakerCoverageUpgrade,
): NonNullable<RunnerCoverageGapSignal["upgradeQuote"]> {
  const quote = upgrade.economicQuote;
  return {
    schemaVersion: quote.schemaVersion,
    targetDefinitionId: upgrade.targetDefinitionId,
    currentKnownPathCost: quote.currentPathCost,
    projectedKnownPathCost: quote.projectedPathCost,
    savingsPerRun: quote.savingsPerRun,
    plannedRunHorizon: quote.plannedRunHorizon,
    grossRunSavings: quote.grossRunSavings,
    upfrontCreditCost: quote.upfrontCreditCost,
    totalInvestment: quote.totalInvestment,
    netValueBeforeSafetyMargin: quote.netValueBeforeSafetyMargin,
    requiredNetSafetyMargin: quote.requiredNetSafetyMargin,
    projectedLiquidCreditsAfterUpgradeAndRun:
      quote.projectedLiquidCreditsAfterUpgradeAndRun,
    desiredCreditReserve: quote.desiredCreditReserve,
    memoryAvailable: quote.memoryAvailable,
    memorySupportAdditionalMu: quote.memorySupportAdditionalMu,
    memorySupportCreditCost: quote.memorySupportCreditCost,
    memorySupportActionClicks: quote.memorySupportActionClicks,
    projectedMemoryAvailable: quote.projectedMemoryAvailable,
    candidateMemoryCost: quote.candidateMemoryCost,
  };
}
