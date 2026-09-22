import { assessCorpTerminalAgendaDefense } from "./corp-terminal-agenda-defense";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import {
  assessment,
  candidateTargetIds,
  corpDomainIfAvailable,
  domain,
  proposal,
  state,
} from "../../plans/corp-core-module-support";
import { DefenseState } from "../../plans/corp-core-plan-contracts";
import {
  CorpDefenseSignal,
  CorpGenericDefenseSignal,
  CorpScoreProtectionDrawSignal,
  CorpScoreProtectionInstallSignal,
  CorpScoreProtectionStagingInstallSignal,
  CorpTerminalProtectionInstallSignal,
} from "../../plans/corp-defense-contracts";
import {
  corpGenericDefensePriorityClass,
  genericDefenseFundingRequirement,
  genericDefenseFundingRequirementIsCurrent,
} from "../../plans/corp-defense-funding-contract";
import { CorpScorePriorityClass } from "../../plans/corp-score-contracts";
import type { PriorityClass, ResourceGap } from "../../plans/plan-assessment";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  exactCorpIceRezRoutesEqual,
  projectExactCorpIceRezRoute,
  type CorpExactIceRezRouteProjection,
} from "../../runtime/corp-exact-ice-rez-route";
import {
  assessBestFundedCorpScoreProtection,
  type KnownCorpFundedIceInstallRouteProjection,
} from "../../runtime/corp-funded-score-protection";
import { compareExactProbabilities } from "../../runtime/corp-score-protection-assessment";
import {
  corpEconomyCandidateHasExecutablePayload,
  economyCandidates,
  immediateCorpLiquidCreditGain,
} from "../economy/economy-routes";
import { corpScorePriorityClass } from "../score/corp-score-priority";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { assessFundingOnlyIceStaging } from "./corp-defense-staging-policy";
import { prepareSelectedCorpIceInstallation } from "./corp-ice-install-cost-support";
import { corpPostPassIceLifecycleComponent } from "./post-pass-ice-lifecycle";
import {
  canonicalSubtypeArray,
  canonicalSubtypeCsv,
  definitionIdListsAreDisjoint,
  isGenericDefenseSignal,
  isScoreProtectionDrawSignal,
  isScoreProtectionInstallSignal,
  isScoreProtectionStagingInstallSignal,
  isTerminalProtectionInstallSignal,
  isValidDefenseSignal,
  knownExactInstallRouteCreditCost,
  knownNonNegativeInteger,
  selectedInstalledRezCreditsFromCurrentQuote,
  selectedPostInstallRezCreditsFromCurrentQuote,
  selectedRezCostsAreUnique,
  selectedRezCostSetsEqual,
  technicalCompare,
  validDefenseSignals,
  validDefinitionIdArray,
  validMandatoryInstalledRezCosts,
  validPostInstallProjectedServerBinding,
  validPostInstallRezQuoteModifiers,
} from "./defense-validation";

export function defenseModule(): PlanModule {
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
                  "score_protection_terminal_install" ||
                scoreProtectionRoute?.signal.kind ===
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
  if (signal.kind === "score_protection_terminal_install") {
    const parent = corpDomainIfAvailable(context)?.scoreProjects.find(
      (project) => project.projectId === signal.parentProjectId,
    );
    const quote = assessCorpTerminalAgendaDefense(
      context.input,
      signal.serverId,
      signal.parentProjectId,
    );
    const install = quote?.install;
    if (
      (parent &&
        (!parent.terminalDefense ||
          parent.protectionNeed?.needId !== signal.parentNeedId)) ||
      quote?.observedAtStateVersion !== context.input.playerView.stateVersion ||
      install?.actionId !== signal.actionId ||
      install.sourceCardInstanceId !== signal.sourceCardInstanceId ||
      install.sourceDefinitionId !== signal.sourceDefinitionId ||
      signal.phase !==
        (install.placement === "ice"
          ? "install_ice"
          : "install_defense_support")
    )
      return [];
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.actionId &&
          candidate.semanticActionType === "install.card" &&
          candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.sourceDefinitionId &&
          candidateTargetIds(candidate).includes(signal.serverId),
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
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
      signal.phase === "resolve_run_redirect" ||
      signal.phase === "resolve_program_trash") &&
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
          typeof action.payload.postPassIceTrashedUnlessReturned ===
            "boolean" &&
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
    return routes.map(({ candidate }) => ({
      candidate,
      stepValue: corpPostPassIceLifecycleComponent(
        context.input.legalActions.find(
          (action) => action.actionId === candidate.actionId,
        )!,
      )!.value,
    }));
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
  const scorelineCentralTaxSignalsWithSupport = [
    ...scorelineCentralTaxSignals,
    ...genericSignals.filter(
      (signal) =>
        signal.iceInstallCostSupportActionId !== undefined &&
        scorelineCentralTaxSignals.some((install) =>
          install.actionIds?.includes(signal.iceInstallCostSupportActionId!),
        ),
    ),
  ];
  const scorelineCentralTaxCandidates = genericDefensePortfolioCandidates(
    context,
    scorelineCentralTaxSignalsWithSupport,
    centralAllocation,
  );
  if (
    scoreProtectionRoute?.signal.kind === "score_protection_draw" &&
    scorelineCentralTaxCandidates.length > 0
  ) {
    return {
      kind: "generic",
      eligibleSignals: scorelineCentralTaxSignalsWithSupport,
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
      ((scoreProtectionRoute.signal.kind ===
        "score_protection_terminal_install" ||
        scoreProtectionRoute.signal.kind === "score_protection_install" ||
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
    urgentDefenseBand(
      context,
      signals.filter(
        (signal) => signal.iceInstallCostSupportActionId === undefined,
      ),
    ),
    centralAllocation,
  );
  const priorityClasses = ["P2", "P3", "P5", "P6"] as const;
  for (const priorityClass of priorityClasses) {
    const prioritySignals = windowEligibleSignals.filter(
      (signal) => corpGenericDefensePriorityClass([signal]) === priorityClass,
    );
    if (prioritySignals.length === 0) continue;
    const prioritySignalsWithSupport = [
      ...prioritySignals,
      ...signals.filter(
        (signal) =>
          signal.iceInstallCostSupportActionId !== undefined &&
          prioritySignals.some((install) =>
            install.actionIds?.includes(signal.iceInstallCostSupportActionId!),
          ),
      ),
    ];
    const candidates = genericDefensePortfolioCandidates(
      context,
      prioritySignalsWithSupport,
      centralAllocation,
    );
    const supportable = genericDefenseBandHasExactFundingSupport(
      context,
      prioritySignals,
    );
    if (candidates.length > 0 || supportable) {
      return {
        eligibleSignals: prioritySignalsWithSupport,
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
  const selected = genericDefensePortfolioWithoutInstallPreparation(
    context,
    eligibleSignals.filter(
      (signal) => signal.iceInstallCostSupportActionId === undefined,
    ),
    centralAllocation,
  );
  return prepareSelectedCorpIceInstallation(context, selected, eligibleSignals);
}

function genericDefensePortfolioWithoutInstallPreparation(
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
    | CorpTerminalProtectionInstallSignal
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
      | CorpTerminalProtectionInstallSignal
      | CorpScoreProtectionDrawSignal =>
      isTerminalProtectionInstallSignal(signal) ||
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
    const terminalInstallRoute = parentSignals
      .filter(isTerminalProtectionInstallSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )[0];
    if (terminalInstallRoute) {
      parentRoutes.push(terminalInstallRoute);
      continue;
    }
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
      | CorpTerminalProtectionInstallSignal
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

function defenseSignalOrderingValue(signal: CorpDefenseSignal): number {
  if (signal.kind === "generic") return signal.value;
  if (signal.kind === "score_protection_install") {
    return signal.effect === "satisfied" ? 2 : 1;
  }
  if (signal.kind === "score_protection_staging_install") return 1;
  return 0;
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
