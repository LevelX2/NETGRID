import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  DeckCapabilityProfile,
  EconomyBankTool,
} from "../../deck-capabilities";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/hand-development-evaluation";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { assessRunnerDevelopmentCashOutAdmission } from "../../runtime/runner-development-cashout-admission";
import { assessRunnerRunFundingAdmission } from "../../runtime/runner-run-funding-admission";
import { runnerDefinitionRequiresTargetedBypassPlan } from "../run-window/runner-targeted-bypass-plan";
import { runnerNoRunRecurringEconomyProfile } from "../../runtime/runner-canonical-card-facts";
import { createRunnerCreditDemand } from "../../plans/credit-demand";
import { searchFundingRoutes } from "../../plans/funding-route";
import { runnerCreditBankProspectivePlan } from "./credit-bank-prospective-planning";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

/** Facts/routes from other owners, bound to the same decision input and candidates.
 * These services never choose a bank phase or execute a bank action.
 */
export type RunnerCreditBankServices = {
  hasExactRunUrgency: (target: RunnerRunTargetEvaluation) => boolean;
  requiredPostRunReserve: (
    target: RunnerRunTargetEvaluation,
  ) => number | undefined;
  terminalVisibleHazardFundingGap: (
    target: RunnerRunTargetEvaluation,
  ) => number | undefined;
  isDirectlyMandatoryRun: (target: RunnerRunTargetEvaluation) => boolean;
  terminalKnownPathFundingGap: (
    target: RunnerRunTargetEvaluation,
  ) => number | undefined;
  quoteRunAfterCashout: (
    target: RunnerRunTargetEvaluation,
    actionId: string,
  ) => RunnerRunTargetEvaluation | undefined;
  developmentFundingRoute: (target: RunnerHandDevelopmentEvaluation) => {
    actionIds: string[];
    evidenceCodes: string[];
  };
};

export function runnerCreditBankSignals(
  input: AiDecisionInputWithDeckCapabilities,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  economy: RunnerEconomyPosture,
  runTargets: readonly RunnerRunTargetEvaluation[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  minimumHandBuffer: number,
  services: RunnerCreditBankServices,
): RunnerCreditBankSignal[] {
  const tools = (deckCapabilities.runner?.economyBankTools ?? []).filter(
    (tool) =>
      tool.status === "in_hand" ||
      tool.status === "installed" ||
      tool.buildActionLegal ||
      tool.cashOutActionLegal ||
      candidates.some(
        (candidate) =>
          candidate.sourceDefinitionId === tool.cardId &&
          (tool.sourceCardInstanceId === undefined ||
            candidate.sourceCardInstanceId === tool.sourceCardInstanceId) &&
          (candidate.planOwnerBinding?.owner === "runner.credit_bank" ||
            runnerCandidateProvidesCreditBankBuild(candidate)),
      ),
  );
  const portfolioStoredCredits = tools.reduce(
    (sum, tool) =>
      sum +
      Math.max(0, tool.portfolioStoredAmount ?? tool.currentBankAmount ?? 0),
    0,
  );
  const signals = tools.flatMap((tool): RunnerCreditBankSignal[] => {
    const currentStoredCredits = Math.max(0, tool.currentBankAmount ?? 0);
    const estimatedPayout = Math.max(0, tool.estimatedPayout ?? 0);
    const exactBankOwnerCandidates = candidates.filter(
      (candidate) =>
        candidate.sourceDefinitionId === tool.cardId &&
        (tool.sourceCardInstanceId === undefined ||
          candidate.sourceCardInstanceId === tool.sourceCardInstanceId) &&
        (candidate.planOwnerBinding?.owner === "runner.credit_bank" ||
          runnerCandidateProvidesCreditBankBuild(candidate)),
    );
    const buildActionIds = exactBankOwnerCandidates
      .filter(
        (candidate) =>
          candidate.planOwnerBinding?.route === "build" ||
          (candidate.planOwnerBinding === undefined &&
            runnerCandidateProvidesCreditBankBuild(candidate)),
      )
      .map((candidate) => candidate.actionId)
      .sort();
    const cashOutActionIds = exactBankOwnerCandidates
      .filter((candidate) => candidate.planOwnerBinding?.route === "cash_out")
      .map((candidate) => candidate.actionId)
      .sort();
    const buildActionLegal = buildActionIds.length > 0;
    const cashOutActionLegal = cashOutActionIds.length > 0;
    const installActionIds = candidates
      .filter((candidate) => {
        if (
          candidate.semanticActionType !== "install.card" ||
          candidate.sourceDefinitionId !== tool.cardId
        ) {
          return false;
        }
        if (!tool.sourceCardInstanceId) return true;
        const action = input.legalActions.find(
          (entry) => entry.actionId === candidate.actionId,
        );
        const sourceCardInstanceId =
          candidate.sourceCardInstanceId ??
          (typeof action?.payload?.cardId === "string"
            ? action.payload.cardId
            : typeof action?.source === "string"
              ? action.source
              : undefined);
        return sourceCardInstanceId === tool.sourceCardInstanceId;
      })
      .map((candidate) => candidate.actionId);
    if (tool.status === "in_hand" && installActionIds.length > 0) {
      const prospectivePlan =
        tool.sourceCardInstanceId !== undefined &&
        input.planningStateIdentity !== undefined
          ? runnerCreditBankProspectivePlan({
              sourceDefinitionId: tool.cardId,
              sourceCardInstanceId: tool.sourceCardInstanceId,
              currentCredits: input.playerView.own.credits,
              currentActions: input.playerView.own.clicks,
              stateIdentity: input.planningStateIdentity,
            })
          : undefined;
      const handEvaluation = handDevelopment.find(
        (evaluation) =>
          evaluation.definitionId === tool.cardId &&
          evaluation.legalActionId !== undefined &&
          installActionIds.includes(evaluation.legalActionId),
      );
      const unsatisfiedActivationPrerequisites =
        handEvaluation?.activationPrerequisites.filter(
          (prerequisite) => !prerequisite.satisfied,
        ) ?? [];
      const delayedInstallWithoutFundingNeed =
        handEvaluation !== undefined &&
        handEvaluation.activationPrerequisites.length === 0 &&
        handEvaluation.liquidityTiming !== "immediate" &&
        !economy.fundingNeed &&
        input.playerView.own.credits >= economy.desiredCreditReserve;
      if (
        prospectivePlan === undefined ||
        prospectivePlan.install.projection !== "feasible_in_projection" ||
        unsatisfiedActivationPrerequisites.length > 0 ||
        delayedInstallWithoutFundingNeed
      )
        return [
          {
            bankId: tool.sourceCardInstanceId ?? tool.cardId,
            phase: "hold" as const,
            actionIds: [],
            rejectedActionIds: installActionIds,
            priorityClass: "P5" as const,
            currentStoredCredits,
            portfolioStoredCredits,
            estimatedPayout,
            value: 0,
            evidenceCodes: [
              ...(prospectivePlan === undefined
                ? ["runner_credit_bank_prospective_projection_unknown"]
                : prospectivePlan.install.projection === "blocked"
                  ? ["runner_credit_bank_prospective_install_blocked"]
                  : []),
              ...unsatisfiedActivationPrerequisites.map(
                (prerequisite) =>
                  `runner_credit_bank_install_prerequisite_unsatisfied:${prerequisite.kind}`,
              ),
              ...(delayedInstallWithoutFundingNeed
                ? ["runner_credit_bank_install_deferred_reserve_satisfied"]
                : []),
              ...tool.evidence,
            ],
          },
        ];
      const plausibleFollowupWindow = input.playerView.own.clicks >= 2;
      if (!plausibleFollowupWindow)
        return [
          {
            bankId: tool.sourceCardInstanceId ?? tool.cardId,
            phase: "install" as const,
            actionIds: installActionIds,
            priorityClass: "P5" as const,
            currentStoredCredits,
            portfolioStoredCredits,
            estimatedPayout,
            prospectivePlan,
            value: 180,
            evidenceCodes: [
              "runner_credit_bank_install_resident_without_same_turn_build",
              ...prospectivePlan.evidenceCodes,
              ...tool.evidence,
            ],
          },
        ];
      return [
        {
          bankId: tool.sourceCardInstanceId ?? tool.cardId,
          phase: "install" as const,
          actionIds: installActionIds,
          priorityClass: "P5" as const,
          currentStoredCredits,
          portfolioStoredCredits,
          estimatedPayout,
          prospectivePlan,
          value: 350,
          evidenceCodes: [
            "runner_credit_bank_install_ready",
            ...prospectivePlan.evidenceCodes,
            ...tool.evidence,
          ],
        },
      ];
    }

    const convertibleRunFundingRoute = runnerCreditBankRunFundingRoute({
      input,
      candidates,
      economy,
      runTargets,
      cashOutActionIds,
      estimatedPayout,
      services,
    });
    const convertibleRunFundingNeed = convertibleRunFundingRoute !== undefined;
    const developmentCashOutAdmission = assessRunnerDevelopmentCashOutAdmission(
      {
        evaluations: handDevelopment,
        currentCredits: input.playerView.own.credits,
        estimatedPayout,
        clicksRemaining: input.playerView.own.clicks,
        gripCount: input.playerView.own.gripOrHq.length,
        minimumHandBuffer,
      },
    );
    const developmentCashOutTarget =
      developmentCashOutAdmission.route === undefined
        ? undefined
        : handDevelopment.find(
            (evaluation) =>
              evaluation.cardInstanceId ===
              developmentCashOutAdmission.route!.targetCardInstanceId,
          );
    const developmentCashOutFundingRoute =
      developmentCashOutTarget &&
      runnerDevelopmentCashOutTargetCanMaterialize(developmentCashOutTarget)
        ? services.developmentFundingRoute(developmentCashOutTarget)
        : undefined;
    const exactCashOutActionIds = new Set(cashOutActionIds);
    const materializedDevelopmentCashOutActionIds =
      developmentCashOutFundingRoute?.actionIds.filter((actionId) =>
        exactCashOutActionIds.has(actionId),
      ) ?? [];
    const convertibleDevelopmentFundingNeed =
      developmentCashOutAdmission.admitted &&
      materializedDevelopmentCashOutActionIds.length > 0;
    const matureBankDevelopmentFundingRoute =
      runnerMatureCreditBankDevelopmentFundingRoute({
        input,
        handDevelopment,
        currentStoredCredits,
        estimatedPayout,
      });
    const matureBankDevelopmentFundingNeed =
      matureBankDevelopmentFundingRoute !== undefined;
    const urgentCreditFloor =
      input.playerView.own.credits <= 2 ||
      input.playerView.own.credits < economy.minimumCreditFloor;
    const efficientLiquidityNeed =
      cashOutActionLegal &&
      estimatedPayout > 1 &&
      currentStoredCredits > 0 &&
      input.playerView.own.credits < economy.desiredCreditReserve;
    // The bank remains the sole action owner. Development plans contribute a
    // typed, visible funding route; they never execute the cashout themselves.
    // A mature bank may also replace a repeated basic-credit funding sequence
    // even when the eventual install remains deferred by another guard.
    const shouldCashOut =
      cashOutActionLegal &&
      estimatedPayout > 0 &&
      (convertibleRunFundingNeed ||
        convertibleDevelopmentFundingNeed ||
        matureBankDevelopmentFundingNeed ||
        efficientLiquidityNeed);
    if (shouldCashOut) {
      const concreteFundingNeed =
        convertibleRunFundingNeed ||
        convertibleDevelopmentFundingNeed ||
        matureBankDevelopmentFundingNeed;
      return [
        {
          bankId: tool.sourceCardInstanceId ?? tool.cardId,
          phase: "cash_out" as const,
          actionIds: cashOutActionIds,
          rejectedActionIds: buildActionIds,
          priorityClass: concreteFundingNeed
            ? ("P2" as const)
            : ("P4" as const),
          currentStoredCredits,
          portfolioStoredCredits,
          estimatedPayout,
          value: concreteFundingNeed
            ? 1_200 + estimatedPayout
            : 700 + estimatedPayout,
          ...(convertibleRunFundingRoute?.runFunding
            ? { runFunding: convertibleRunFundingRoute.runFunding }
            : {}),
          evidenceCodes: [
            ...(convertibleRunFundingRoute?.evidenceCodes ?? []),
            ...(convertibleRunFundingNeed
              ? ["runner_credit_bank_cashout_for_run_funding"]
              : []),
            ...(convertibleDevelopmentFundingNeed
              ? ["runner_credit_bank_cashout_for_development_funding"]
              : []),
            ...(matureBankDevelopmentFundingRoute?.evidenceCodes ?? []),
            ...(efficientLiquidityNeed && !concreteFundingNeed
              ? ["runner_credit_bank_cashout_for_click_efficient_liquidity"]
              : []),
            ...tool.evidence,
            ...(developmentCashOutAdmission.route?.evidenceCodes ?? []),
          ],
        },
      ];
    }

    const clickLimitedStoredLiquidity = Math.min(
      currentStoredCredits,
      estimatedPayout * Math.max(0, input.playerView.own.clicks),
    );
    const combinedCreditAccess =
      input.playerView.own.credits + clickLimitedStoredLiquidity;
    const alreadyBuiltThisTurn = creditBankBuiltThisTurn(input, tool);
    const shouldBuild =
      buildActionLegal &&
      !alreadyBuiltThisTurn &&
      !convertibleRunFundingNeed &&
      !convertibleDevelopmentFundingNeed &&
      (!urgentCreditFloor || input.playerView.own.clicks === 1) &&
      input.playerView.own.credits < 15 &&
      combinedCreditAccess < 20 &&
      currentStoredCredits < 12;
    if (!shouldBuild)
      return [
        {
          bankId: tool.sourceCardInstanceId ?? tool.cardId,
          phase: "hold" as const,
          actionIds: [],
          rejectedActionIds: [
            ...buildActionIds,
            ...(convertibleDevelopmentFundingNeed ? [] : cashOutActionIds),
          ],
          priorityClass: "P5" as const,
          currentStoredCredits,
          portfolioStoredCredits,
          estimatedPayout,
          value: 0,
          evidenceCodes: [
            developmentCashOutAdmission.admitted &&
            !convertibleDevelopmentFundingNeed
              ? `runner_credit_bank_cashout_delegation_missing_exact_route:${developmentCashOutAdmission.route?.targetCardInstanceId ?? "unknown"}`
              : alreadyBuiltThisTurn
                ? "runner_credit_bank_hold_instance_built_this_turn"
                : combinedCreditAccess >= 20 || currentStoredCredits >= 12
                  ? "runner_credit_bank_hold_comfortable_value"
                  : convertibleDevelopmentFundingNeed
                    ? "runner_credit_bank_cashout_delegated_to_development_plan"
                    : "runner_credit_bank_hold_no_current_conversion_need",
            ...(developmentCashOutAdmission.route?.evidenceCodes ?? []),
            ...(developmentCashOutAdmission.admitted &&
            !convertibleDevelopmentFundingNeed
              ? [...(developmentCashOutFundingRoute?.evidenceCodes ?? [])]
              : []),
            ...developmentCashOutAdmission.rejectionCodes,
            ...tool.evidence,
          ],
        },
      ];
    return [
      {
        bankId: tool.sourceCardInstanceId ?? tool.cardId,
        phase: "build" as const,
        actionIds: buildActionIds,
        rejectedActionIds: convertibleDevelopmentFundingNeed
          ? []
          : cashOutActionIds,
        priorityClass:
          currentStoredCredits === 0 ? ("P4" as const) : ("P5" as const),
        currentStoredCredits,
        portfolioStoredCredits,
        estimatedPayout,
        value:
          (currentStoredCredits === 0 ? 60 : 40) +
          Math.max(0, 12 - currentStoredCredits),
        evidenceCodes: [
          currentStoredCredits === 0
            ? "runner_credit_bank_first_load"
            : "runner_credit_bank_continue_to_value_target",
          ...(currentStoredCredits === 0
            ? ["runner_credit_bank_first_load_establishes_engine_value"]
            : []),
          ...(urgentCreditFloor && input.playerView.own.clicks === 1
            ? ["runner_credit_bank_last_click_deferred_value"]
            : []),
          ...tool.evidence,
        ],
      },
    ];
  });
  // One exact parent need has one provider. Choose among sufficient current
  // bank payouts here, before publishing proposals to the support graph.
  const providers = new Map<string, RunnerCreditBankSignal>();
  for (const signal of signals
    .filter((signal) => signal.runFunding)
    .sort(
      (left, right) =>
        left.runFunding!.routeAssessment.totalClickCost -
          right.runFunding!.routeAssessment.totalClickCost ||
        right.estimatedPayout - left.estimatedPayout ||
        left.bankId.localeCompare(right.bankId),
    )) {
    if (!providers.has(signal.runFunding!.needId))
      providers.set(signal.runFunding!.needId, signal);
  }
  return signals.map((signal) => {
    const provider = signal.runFunding
      ? providers.get(signal.runFunding.needId)
      : undefined;
    if (!provider || provider === signal) return signal;
    const { runFunding, ...resident } = signal;
    return {
      ...resident,
      phase: "hold" as const,
      actionIds: [],
      rejectedActionIds: [
        ...signal.actionIds,
        ...(signal.rejectedActionIds ?? []),
      ],
      priorityClass: "P5" as const,
      value: 0,
      evidenceCodes: [
        `runner_credit_bank_equivalent_run_funding_owned_by:${provider.bankId}`,
      ],
    };
  });
}

function runnerCandidateProvidesCreditBankBuild(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.planOwnerBinding === undefined &&
    candidate.economyProjection?.kind === "stored_credit_build" &&
    candidate.economyProjection.storedCreditsAdded !== undefined &&
    candidate.economyProjection.storedCreditsAdded > 0 &&
    candidate.functionalEffects?.some(
      (effect) =>
        effect.kind === "counter_economy" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.economyMode === "bank_load" &&
        effect.resource === "credits",
    ) === true
  );
}

function runnerDevelopmentCashOutTargetCanMaterialize(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    ((evaluation.availability === "missing_credits" &&
      evaluation.deferReason === "missing_credits") ||
      (evaluation.availability === "legal_now" &&
        evaluation.deferReason === "preserve_credit_floor")) &&
    evaluation.fundingNeed !== undefined &&
    evaluation.definitionId !== undefined &&
    !runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId) &&
    runnerNoRunRecurringEconomyProfile(evaluation.definitionId) === undefined &&
    !evaluation.activationPrerequisites.some(
      (prerequisite) => prerequisite.kind === "same_turn_access",
    )
  );
}

function runnerMatureCreditBankDevelopmentFundingRoute(params: {
  input: AiDecisionInput;
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  currentStoredCredits: number;
  estimatedPayout: number;
}): { evidenceCodes: string[] } | undefined {
  if (
    params.currentStoredCredits < 12 ||
    params.estimatedPayout <= 0 ||
    params.input.playerView.own.clicks < 2
  ) {
    return undefined;
  }
  const basicCreditActionIds = new Set(
    params.input.legalActions
      .filter(
        (action) =>
          action.side === "runner" &&
          action.type === "gain_credit" &&
          action.source === "basic_action",
      )
      .map((action) => action.actionId),
  );
  if (basicCreditActionIds.size === 0) return undefined;
  const basicFundingClickBudget = Math.max(
    0,
    params.input.playerView.own.clicks - 1,
  );

  for (const evaluation of [...params.handDevelopment].sort(
    (left, right) =>
      right.priority - left.priority ||
      left.cardInstanceId.localeCompare(right.cardInstanceId),
  )) {
    const fundingNeed = evaluation.fundingNeed;
    if (
      !(
        (evaluation.availability === "missing_credits" &&
          evaluation.deferReason === "missing_credits") ||
        (evaluation.availability === "legal_now" &&
          evaluation.deferReason === "preserve_credit_floor")
      ) ||
      !evaluation.evidence.includes("duplicate_installed:false") ||
      evaluation.currentNeed === "none" ||
      evaluation.currentNeed === "later" ||
      evaluation.developmentRole === "unknown" ||
      evaluation.developmentRole === "duplicate_or_low_value" ||
      evaluation.activationPrerequisites.some(
        (prerequisite) => !prerequisite.satisfied,
      ) ||
      !fundingNeed ||
      fundingNeed.missingCredits < 2 ||
      fundingNeed.missingCredits > params.estimatedPayout ||
      fundingNeed.missingCredits > basicFundingClickBudget
    ) {
      continue;
    }
    return {
      evidenceCodes: [
        "runner_credit_bank_cashout_for_mature_development_funding",
        `runner_credit_bank_funding_target:${evaluation.cardInstanceId}`,
        `runner_credit_bank_funding_missing_credits:${fundingNeed.missingCredits}`,
        `runner_credit_bank_value_target_reached:${params.currentStoredCredits}`,
        `runner_credit_bank_replaced_basic_credit_clicks:${fundingNeed.missingCredits}`,
      ],
    };
  }
  return undefined;
}

function creditBankBuiltThisTurn(
  input: AiDecisionInput,
  tool: EconomyBankTool,
): boolean {
  const sourceCardInstanceId = tool.sourceCardInstanceId;
  if (!sourceCardInstanceId) return false;

  const events = uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  ).sort(
    (left, right) =>
      left.stateVersionAfter - right.stateVersionAfter ||
      left.eventId.localeCompare(right.eventId),
  );
  const currentTurnSerial = input.playerView.turnSerial;
  if (
    currentTurnSerial === undefined ||
    !Number.isSafeInteger(currentTurnSerial) ||
    currentTurnSerial < 0
  ) {
    return false;
  }
  return events.some((event) => {
    const resolvedEffects = Array.isArray(event.publicPayload?.resolvedEffects)
      ? event.publicPayload.resolvedEffects
      : [];
    const bankLoadEffects = resolvedEffects.filter(
      (effect) => effect.kind === "add_hosted_credits",
    );
    if (
      event.type !== "activated_card_ability" ||
      event.turnSerial !== currentTurnSerial ||
      event.publicPayload?.actor !== "runner" ||
      event.publicPayload?.sourceCardInstanceId !== sourceCardInstanceId ||
      event.publicPayload?.sourceDefinitionId !== tool.cardId ||
      bankLoadEffects.length === 0
    ) {
      return false;
    }
    return true;
  });
}

function runnerCreditBankRunFundingRoute(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  economy: RunnerEconomyPosture;
  runTargets: readonly RunnerRunTargetEvaluation[];
  cashOutActionIds: readonly string[];
  estimatedPayout: number;
  services: RunnerCreditBankServices;
}):
  | {
      evidenceCodes: string[];
      runFunding?: RunnerCreditBankSignal["runFunding"];
    }
  | undefined {
  const remainingFundingClicks = Math.max(
    0,
    params.input.playerView.own.clicks - 1,
  );
  if (remainingFundingClicks <= 0 || params.cashOutActionIds.length === 0) {
    return undefined;
  }
  const cashOutActionIds = new Set(params.cashOutActionIds);
  for (const evaluation of [...params.runTargets].sort((left, right) => {
    const urgencyDelta =
      Number(params.services.hasExactRunUrgency(right)) -
      Number(params.services.hasExactRunUrgency(left));
    return (
      urgencyDelta ||
      right.score - left.score ||
      left.actionId.localeCompare(right.actionId)
    );
  })) {
    if (
      evaluation.accessTargetKind === "archives" ||
      evaluation.knownAccessState === "known_no_current_payoff"
    ) {
      continue;
    }
    const requiredPostRunReserve =
      params.services.requiredPostRunReserve(evaluation);
    const admission = assessRunnerRunFundingAdmission({
      target: evaluation,
      runTargets: params.runTargets,
      economy: params.economy,
      urgentScoreThreat: params.services.hasExactRunUrgency(evaluation),
      ...(requiredPostRunReserve !== undefined
        ? { requiredPostRunReserve }
        : {}),
    });
    const terminalVisibleHazardFundingGap =
      params.services.terminalVisibleHazardFundingGap(evaluation);
    const directlySafeSameServerSibling = params.runTargets.some(
      (candidate) =>
        candidate.actionId !== evaluation.actionId &&
        candidate.targetServerId === evaluation.targetServerId &&
        params.services.isDirectlyMandatoryRun(candidate),
    );
    if (
      (!admission.admitted && terminalVisibleHazardFundingGap === undefined) ||
      directlySafeSameServerSibling
    ) {
      continue;
    }
    const fundedTerminalTarget =
      params.services.terminalKnownPathFundingGap(evaluation) !== undefined
        ? params.cashOutActionIds
            .map((actionId) =>
              params.services.quoteRunAfterCashout(evaluation, actionId),
            )
            .find(
              (target) =>
                target !== undefined &&
                target.pathPassability === "reachable" &&
                target.routeQuote?.reachability === "guaranteed_access" &&
                target.routeQuote.unknownIceCount === 0 &&
                target.routeQuote.conditionalReasons.length === 0 &&
                target.prerunReserveQuote?.status !== "blocked" &&
                target.creditsAfterRun >= 0 &&
                (target.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
                target.visibleTraceTagHazardUnavoidable !== true,
            )
        : undefined;
    const exactUrgentConvertibleTarget =
      params.services.hasExactRunUrgency(evaluation) &&
      (fundedTerminalTarget !== undefined ||
        evaluation.score > 0 ||
        (terminalVisibleHazardFundingGap !== undefined &&
          terminalVisibleHazardFundingGap <= params.estimatedPayout)) &&
      evaluation.recommendation === "gain_credits_first";
    if (!exactUrgentConvertibleTarget) continue;
    const conversionFundingGap = fundedTerminalTarget
      ? Math.max(
          0,
          params.estimatedPayout - fundedTerminalTarget.creditsAfterRun,
        )
      : (terminalVisibleHazardFundingGap ?? admission.concreteFundingGap);
    if (conversionFundingGap <= 0) continue;
    const demand = createRunnerCreditDemand({
      demandId: `run-support:${evaluation.actionId}`,
      sourcePlanId:
        evaluation.accessTargetKind === "remote"
          ? `runner.contest_remote:${evaluation.targetServerId}`
          : `runner.pressure_central:${evaluation.targetServerId}`,
      purpose: "foreground_plan",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentCredits: params.input.playerView.own.credits,
      targetCredits: params.input.playerView.own.credits + conversionFundingGap,
      evidence: [
        `run_funding_target:${evaluation.targetServerId}`,
        `run_funding_action:${evaluation.actionId}`,
        `run_funding_gap:${conversionFundingGap}`,
      ],
    });
    const route = searchFundingRoutes({
      demand,
      // This certificate belongs to the bank payout itself. An unrelated
      // loan must not prune it before the bank's route can be materialized.
      candidates: fundedTerminalTarget
        ? params.candidates.filter((candidate) =>
            cashOutActionIds.has(candidate.actionId),
          )
        : params.candidates,
      remainingClicks: remainingFundingClicks,
      maxSteps: remainingFundingClicks,
      maxRoutes: 16,
    }).routes.find(
      (candidateRoute) =>
        candidateRoute.status === "covered_guaranteed" &&
        candidateRoute.horizon === "same_turn" &&
        candidateRoute.steps[0]?.actionId !== undefined &&
        cashOutActionIds.has(candidateRoute.steps[0].actionId),
    );
    if (route) {
      return {
        ...(fundedTerminalTarget
          ? {
              runFunding: {
                parentPlanInstanceId: `plan:runner.contest_remote:${encodeURIComponent(`remote:${evaluation.targetServerId}`)}`,
                needId: `run-support:remote:${evaluation.targetServerId}`,
                runActionId: evaluation.actionId,
                stateVersion: params.input.playerView.stateVersion,
                gap: conversionFundingGap,
                routeAssessment: {
                  stateVersion: params.input.playerView.stateVersion,
                  routeId: route.routeId,
                  status: route.status,
                  reliability: route.reliability,
                  horizon: route.horizon,
                  projectedGap: route.projectedGap,
                  totalClickCost: route.totalClickCost,
                  firstStepActionId: route.steps[0]!.actionId!,
                  evidenceCodes: route.evidence,
                },
              },
            }
          : {}),
        evidenceCodes: [
          `runner_credit_bank_bound_run_action:${evaluation.actionId}`,
          `runner_credit_bank_bound_run_target:${evaluation.targetServerId}`,
          `runner_credit_bank_bound_funding_demand:${demand.demandId}`,
          `runner_credit_bank_bound_funding_route:${route.routeId}`,
          `runner_credit_bank_bound_funding_gap:${conversionFundingGap}`,
          ...(fundedTerminalTarget
            ? ["runner_credit_bank_complete_terminal_path_after_cashout"]
            : []),
          ...(terminalVisibleHazardFundingGap !== undefined
            ? [
                `runner_credit_bank_terminal_visible_hazard_gap:${terminalVisibleHazardFundingGap}`,
              ]
            : [
                `runner_credit_bank_bound_admission_gap:${admission.concreteFundingGap}`,
                ...admission.evidenceCodes,
              ]),
        ],
      };
    }
  }
  return undefined;
}

function uniqueBy<T>(
  values: readonly T[],
  keyForValue: (value: T) => string,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}
