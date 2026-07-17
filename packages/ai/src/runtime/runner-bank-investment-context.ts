import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { planPortfolioTurnKey } from "../plans/plan-portfolio";
import { runnerBankInvestmentCommitmentScoreComponents as buildRunnerBankInvestmentCommitmentScoreComponents } from "./runner-economy-commitment-score";
import type { RunnerHandFundingTarget } from "./runner-hand-funding-target";
import { mergedPublicHistory } from "./public-event-history";
import { rolesMatch } from "./role-match";

const RUNNER_BANK_FIRST_LOAD_TARGET = 3;
const RUNNER_BANK_URGENT_CASHOUT_TARGET = 6;
const RUNNER_BANK_VALUE_CASHOUT_TARGET = 12;
const RUNNER_BANK_COMFORTABLE_BUILD_CREDITS = 15;
const RUNNER_BANK_COMFORTABLE_LIQUID_CREDITS = 20;
const RUNNER_BANK_BACKGROUND_REPEAT_OPPORTUNITY_COST = 700;
const RUNNER_BANK_SHORT_HORIZON_PRIORITY = -2200;

type RunnerBankInvestmentCommitmentStatus =
  | "inactive"
  | "install_ready"
  | "install_deferred"
  | "build_first_load"
  | "build_second_load"
  | "short_horizon_hold"
  | "over_target_hold"
  | "hold"
  | "cashout_ready"
  | "cashout_deferred"
  | "abandoned";

type RunnerBankInvestmentCommitmentAssessment = {
  active: boolean;
  status: RunnerBankInvestmentCommitmentStatus;
  bankSource: string;
  storedCredits: number;
  desiredBankTarget: number;
  combinedCreditAccess: number;
  comfortableCreditPool: boolean;
  overDesiredTarget: boolean;
  buildActionLegal: boolean;
  cashOutActionLegal: boolean;
  concreteFundingNeed: boolean;
  criticalReserve: boolean;
  cashOutThresholdMet: boolean;
  backgroundActionsUsedThisTurn: number;
  backgroundCadenceReached: boolean;
  meaningfulAlternativeAvailable: boolean;
  shortHorizon: boolean;
  runOverride?: string;
  buildBankPriority: number;
  cashOutPriority: number;
  installProjection?: RunnerBankInstallProjection;
};

type RunnerBankInstallProjection = {
  plausible: boolean;
  creditsAfterInstall: number;
  clicksAfterInstall: number;
  reservedRunClicks: number;
  canLoadAfterInstallThisTurn: boolean;
};

type RunnerBankDefinitionLike = {
  title?: string;
  rulesText?: string;
  mechanics?: unknown;
};

type RunnerBankHintEffectLike = {
  kind?: string;
  resource?: string;
  target?: string;
  timing?: string;
};

export type RunnerBankInvestmentContextDependencies = {
  previousPlan: (input: AiDecisionInput) =>
    | {
        type?: string;
        portfolioRole?: "background";
        portfolioLifecycle?: string;
        actionsUsedThisTurn?: number;
        turnKey?: string;
      }
    | undefined;
  runnerHandFundingTarget: (
    input: AiDecisionInput,
  ) => RunnerHandFundingTarget | undefined;
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  definitionForCardId: (
    definitionId: string,
  ) => RunnerBankDefinitionLike | undefined;
  hintEffectsForDefinition: (
    definitionId: string,
  ) => readonly RunnerBankHintEffectLike[];
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  serverId: (action: LegalAction) => string | undefined;
  definitionType: (definitionId: string) => string | undefined;
  runnerRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string,
  ) => RunnerRunTargetEvaluation | undefined;
  runnerRunTargetHighPayoff: (
    evaluation: Pick<RunnerRunTargetEvaluation, "accessPayoff">,
  ) => boolean;
};

export type RunnerBankInvestmentContext = {
  runnerBankInvestmentCommitmentScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  runnerBankInvestmentCommitmentEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  isRunnerBankCashOutAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerBankCashOutIsUsefulNow: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerBankHasConcreteFundingNeed: (input: AiDecisionInput) => boolean;
  runnerBankCommitmentRunOverride: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function createRunnerBankInvestmentContext(
  dependencies: RunnerBankInvestmentContextDependencies,
): RunnerBankInvestmentContext {
  function runnerBankInvestmentCommitmentScoreComponents(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent[] {
    return buildRunnerBankInvestmentCommitmentScoreComponents(input, action, {
      assessment: runnerBankInvestmentCommitmentAssessment,
      evidence: runnerBankInvestmentCommitmentEvidence,
      isBuildAction: isRunnerBankBuildAction,
      isCashOutAction: isRunnerBankCashOutAction,
      isInstallAction: isRunnerBankInstallAction,
      runOverride: runnerBankCommitmentRunOverride,
    });
  }

  function runnerBankInvestmentCommitmentEvidence(
    input: AiDecisionInput,
    action: LegalAction,
  ): string[] {
    if (input.side !== "runner" || action.side !== "runner") return [];
    const isBankRelevantAction =
      isRunnerBankBuildAction(input, action) ||
      isRunnerBankCashOutAction(input, action) ||
      isRunnerBankInstallAction(input, action) ||
      action.type === "start_run";
    if (!isBankRelevantAction) return [];
    const assessment = runnerBankInvestmentCommitmentAssessment(input, action);
    const planContinuity = dependencies.previousPlan(input);
    if (!assessment.active && assessment.status === "inactive") return [];
    return [
      `bankCommitmentActive:${assessment.active}`,
      `bankSource:${assessment.bankSource}`,
      `bankStoredCredits:${assessment.storedCredits}`,
      `desiredBankTarget:${assessment.desiredBankTarget}`,
      `bankCombinedCreditAccess:${assessment.combinedCreditAccess}`,
      `buildBankPriority:${assessment.buildBankPriority}`,
      `cashOutPriority:${assessment.cashOutPriority}`,
      `bankCommitmentStatus:${assessment.status}`,
      `bankComfortableCreditPool:${assessment.comfortableCreditPool}`,
      `bankOverDesiredTarget:${assessment.overDesiredTarget}`,
      `bankBuildLegal:${assessment.buildActionLegal}`,
      `bankCashOutLegal:${assessment.cashOutActionLegal}`,
      `bankConcreteFundingNeed:${assessment.concreteFundingNeed}`,
      `bankTerminalContestFundingNeed:${runnerBankHasTerminalContestFundingNeed(input)}`,
      `bankCriticalReserve:${assessment.criticalReserve}`,
      `bankCashOutThreshold:${assessment.cashOutThresholdMet}`,
      `bankBackgroundActionsThisTurn:${assessment.backgroundActionsUsedThisTurn}`,
      `bankBackgroundCadenceReached:${assessment.backgroundCadenceReached}`,
      `bankMeaningfulAlternativeAvailable:${assessment.meaningfulAlternativeAvailable}`,
      `bankShortHorizon:${assessment.shortHorizon}`,
      ...(assessment.installProjection
        ? [
            `bankProjectedCreditsAfterInstall:${assessment.installProjection.creditsAfterInstall}`,
            `bankProjectedClicksAfterInstall:${assessment.installProjection.clicksAfterInstall}`,
            `bankProjectedReservedRunClicks:${assessment.installProjection.reservedRunClicks}`,
            `bankProjectedLoadThisTurn:${assessment.installProjection.canLoadAfterInstallThisTurn}`,
          ]
        : []),
      ...(isRunnerBankBuildAction(input, action) &&
      assessment.buildBankPriority > 0
        ? [`why_bank_build_over_run:${assessment.status}`]
        : []),
      ...(action.type === "start_run" && assessment.runOverride
        ? [`why_run_over_bank_build:${assessment.runOverride}`]
        : action.type === "start_run" &&
            assessment.active &&
            assessment.buildActionLegal &&
            assessment.buildBankPriority > 0
          ? ["why_bank_build_over_run:low_value_run"]
          : []),
      ...(isRunnerBankInstallAction(input, action) &&
      assessment.status === "install_deferred"
        ? ["why_bank_install_deferred:no_plausible_followup_load"]
        : []),
      ...(isRunnerBankCashOutAction(input, action)
        ? [
            `why_cashout_now:${
              runnerBankCashOutIsUsefulNow(input, action)
                ? assessment.criticalReserve
                  ? "critical_reserve"
                  : assessment.concreteFundingNeed
                    ? "concrete_funding_need"
                    : "bank_threshold"
                : "no_funding_need"
            }`,
          ]
        : []),
      ...(planContinuity?.portfolioRole === "background"
        ? [
            "bankPortfolioRole:background",
            `bankPortfolioLifecycle:${planContinuity.portfolioLifecycle ?? "unknown"}`,
            `bankPortfolioActionsThisTurn:${assessment.backgroundActionsUsedThisTurn}`,
            `bankPortfolioTurnKey:${planContinuity.turnKey ?? "unknown"}`,
          ]
        : []),
    ];
  }

  function runnerBankInvestmentCommitmentAssessment(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerBankInvestmentCommitmentAssessment {
    const storedCredits = runnerBankStoredCredits(input, action);
    const buildActionLegal = input.legalActions.some((candidate) =>
      isRunnerBankBuildAction(input, candidate),
    );
    const cashOutActionLegal = input.legalActions.some((candidate) =>
      isRunnerBankCashOutAction(input, candidate),
    );
    const concreteFundingNeed = runnerBankHasConcreteFundingNeed(input);
    const criticalReserve = input.playerView.own.credits < 5;
    const comfortableCreditPool = runnerBankHasComfortableCreditPool(
      input,
      storedCredits,
      cashOutActionLegal,
    );
    const desiredBankTarget = runnerBankDesiredTarget(storedCredits, {
      comfortableCreditPool,
      concreteFundingNeed,
      criticalReserve,
    });
    const combinedCreditAccess = input.playerView.own.credits + storedCredits;
    const overDesiredTarget =
      storedCredits > 0 && storedCredits >= desiredBankTarget;
    const cashOutThresholdMet =
      storedCredits >= desiredBankTarget && !comfortableCreditPool;
    const runOverride =
      action.type === "start_run"
        ? runnerBankCommitmentRunOverride(input, action)
        : undefined;
    const previousPlan = dependencies.previousPlan(input);
    const bankSource = runnerBankSourceLabel(input, action);
    const backgroundCadence = runnerBankBackgroundCadenceAssessment(
      input,
      action,
    );
    const shortHorizon = runnerBankHasShortInvestmentHorizon(input);
    const stableBuildWindow =
      input.playerView.own.clicks >= 1 &&
      !concreteFundingNeed &&
      input.playerView.own.credits < RUNNER_BANK_COMFORTABLE_BUILD_CREDITS;
    const active =
      buildActionLegal ||
      cashOutActionLegal ||
      isRunnerBankInstallAction(input, action) ||
      previousPlan?.type === "runner.build_credit_bank";

    if (!active) {
      return {
        active: false,
        status: "inactive",
        bankSource,
        storedCredits,
        desiredBankTarget,
        combinedCreditAccess,
        comfortableCreditPool,
        overDesiredTarget,
        buildActionLegal,
        cashOutActionLegal,
        concreteFundingNeed,
        criticalReserve,
        cashOutThresholdMet,
        ...backgroundCadence,
        shortHorizon,
        ...(runOverride ? { runOverride } : {}),
        buildBankPriority: 0,
        cashOutPriority: 0,
      };
    }

    if (
      previousPlan?.type === "runner.build_credit_bank" &&
      !buildActionLegal &&
      !cashOutActionLegal
    ) {
      return {
        active: true,
        status: "abandoned",
        bankSource,
        storedCredits,
        desiredBankTarget,
        combinedCreditAccess,
        comfortableCreditPool,
        overDesiredTarget,
        buildActionLegal,
        cashOutActionLegal,
        concreteFundingNeed,
        criticalReserve,
        cashOutThresholdMet,
        ...backgroundCadence,
        shortHorizon,
        ...(runOverride ? { runOverride } : {}),
        buildBankPriority: -800,
        cashOutPriority: -1200,
      };
    }

    if (isRunnerBankInstallAction(input, action)) {
      const installProjection = runnerBankInstallProjection(input, action);
      const plausibleFollowup = installProjection.plausible;
      return {
        active: plausibleFollowup,
        status: plausibleFollowup ? "install_ready" : "install_deferred",
        bankSource,
        storedCredits,
        desiredBankTarget,
        combinedCreditAccess,
        comfortableCreditPool,
        overDesiredTarget,
        buildActionLegal,
        cashOutActionLegal,
        concreteFundingNeed,
        criticalReserve,
        cashOutThresholdMet,
        ...backgroundCadence,
        shortHorizon,
        installProjection,
        ...(runOverride ? { runOverride } : {}),
        buildBankPriority: plausibleFollowup ? 900 : -1600,
        cashOutPriority: 0,
      };
    }

    if (isRunnerBankCashOutAction(input, action)) {
      const criticalCashOutReady =
        criticalReserve && storedCredits >= RUNNER_BANK_FIRST_LOAD_TARGET;
      const usefulNow =
        criticalCashOutReady || concreteFundingNeed || cashOutThresholdMet;
      return {
        active: true,
        status: usefulNow ? "cashout_ready" : "cashout_deferred",
        bankSource,
        storedCredits,
        desiredBankTarget,
        combinedCreditAccess,
        comfortableCreditPool,
        overDesiredTarget,
        buildActionLegal,
        cashOutActionLegal,
        concreteFundingNeed,
        criticalReserve,
        cashOutThresholdMet,
        ...backgroundCadence,
        shortHorizon,
        ...(runOverride ? { runOverride } : {}),
        buildBankPriority: 0,
        cashOutPriority: usefulNow
          ? criticalReserve
            ? 1250
            : concreteFundingNeed
              ? 1100
              : 650
          : -2200,
      };
    }

    if (buildActionLegal && stableBuildWindow) {
      const firstLoad = storedCredits <= 0;
      if (!firstLoad && overDesiredTarget) {
        return {
          active: true,
          status: "over_target_hold",
          bankSource,
          storedCredits,
          desiredBankTarget,
          combinedCreditAccess,
          comfortableCreditPool,
          overDesiredTarget,
          buildActionLegal,
          cashOutActionLegal,
          concreteFundingNeed,
          criticalReserve,
          cashOutThresholdMet,
          ...backgroundCadence,
          shortHorizon,
          ...(runOverride ? { runOverride } : {}),
          buildBankPriority: -1800,
          cashOutPriority: cashOutActionLegal
            ? cashOutThresholdMet
              ? 650
              : -900
            : 0,
        };
      }
      const baselineBuildPriority = firstLoad
        ? input.playerView.own.clicks <= 1
          ? 2300
          : 1250
        : input.playerView.own.clicks <= 1
          ? 600
          : 1550;
      const shortHorizonWithoutFundingNeed =
        shortHorizon && !concreteFundingNeed;
      const repeatedBuildHasOpportunityCost =
        backgroundCadence.backgroundCadenceReached &&
        backgroundCadence.meaningfulAlternativeAvailable;
      return {
        active: true,
        status: shortHorizonWithoutFundingNeed
          ? "short_horizon_hold"
          : firstLoad
            ? "build_first_load"
            : "build_second_load",
        bankSource,
        storedCredits,
        desiredBankTarget,
        combinedCreditAccess,
        comfortableCreditPool,
        overDesiredTarget,
        buildActionLegal,
        cashOutActionLegal,
        concreteFundingNeed,
        criticalReserve,
        cashOutThresholdMet,
        ...backgroundCadence,
        shortHorizon,
        ...(runOverride ? { runOverride } : {}),
        buildBankPriority: shortHorizonWithoutFundingNeed
          ? RUNNER_BANK_SHORT_HORIZON_PRIORITY
          : repeatedBuildHasOpportunityCost
            ? baselineBuildPriority -
              RUNNER_BANK_BACKGROUND_REPEAT_OPPORTUNITY_COST
            : baselineBuildPriority,
        cashOutPriority: -1600,
      };
    }

    return {
      active: true,
      status: "hold",
      bankSource,
      storedCredits,
      desiredBankTarget,
      combinedCreditAccess,
      comfortableCreditPool,
      overDesiredTarget,
      buildActionLegal,
      cashOutActionLegal,
      concreteFundingNeed,
      criticalReserve,
      cashOutThresholdMet,
      ...backgroundCadence,
      shortHorizon,
      ...(runOverride ? { runOverride } : {}),
      buildBankPriority: buildActionLegal ? -300 : 0,
      cashOutPriority: cashOutActionLegal ? -900 : 0,
    };
  }

  function runnerBankCashOutIsUsefulNow(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    const assessment = runnerBankInvestmentCommitmentAssessment(input, action);
    return (
      (assessment.criticalReserve &&
        assessment.storedCredits >= RUNNER_BANK_FIRST_LOAD_TARGET) ||
      assessment.concreteFundingNeed ||
      assessment.cashOutThresholdMet
    );
  }

  function runnerBankHasComfortableCreditPool(
    input: AiDecisionInput,
    _storedCredits: number,
    _cashOutActionLegal: boolean,
  ): boolean {
    return (
      input.playerView.own.credits >= RUNNER_BANK_COMFORTABLE_LIQUID_CREDITS
    );
  }

  function runnerBankDesiredTarget(
    storedCredits: number,
    context: {
      comfortableCreditPool: boolean;
      concreteFundingNeed: boolean;
      criticalReserve: boolean;
    },
  ): number {
    if (storedCredits <= 0) return RUNNER_BANK_FIRST_LOAD_TARGET;
    if (context.criticalReserve || context.concreteFundingNeed)
      return RUNNER_BANK_URGENT_CASHOUT_TARGET;
    return RUNNER_BANK_VALUE_CASHOUT_TARGET;
  }

  function isRunnerBankInstallAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (
      input.side !== "runner" ||
      action.side !== "runner" ||
      action.type !== "install_card"
    )
      return false;
    return runnerCardLooksLikeCreditBank(
      input,
      dependencies.findVisibleCard(input, action.source),
    );
  }

  function isRunnerBankBuildAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (
      input.side !== "runner" ||
      action.side !== "runner" ||
      (action.type !== "trigger_ability" &&
        action.type !== "activated_card_ability")
    )
      return false;
    const text = runnerBankActionText(input, action);
    const sourceIsCreditBank = runnerActionSourceLooksLikeCreditBank(
      input,
      action,
    );
    if (
      sourceIsCreditBank &&
      action.payload?.cardImplementationAddsHostedCredits === true
    ) {
      return true;
    }
    return runnerBankTokensIndicateBuildAction(text, sourceIsCreditBank);
  }

  function runnerBankTokensIndicateBuildAction(
    text: string,
    sourceIsCreditBank: boolean,
  ): boolean {
    const tokens = runnerBankTextTokens(text);
    if (
      sourceIsCreditBank &&
      runnerBankTokensIncludeAny(tokens, [
        "legen",
        "put",
        "load",
        "add",
        "build",
        "counter",
      ])
    ) {
      return true;
    }
    return (
      runnerBankTokensIncludeOrdered(tokens, ["put", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["load", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["add", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["build", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "counter"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "load"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "build"])
    );
  }

  function isRunnerBankCashOutAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (
      input.side !== "runner" ||
      action.side !== "runner" ||
      (action.type !== "trigger_ability" &&
        action.type !== "activated_card_ability")
    )
      return false;
    const text = runnerBankActionText(input, action);
    const sourceIsCreditBank = runnerActionSourceLooksLikeCreditBank(
      input,
      action,
    );
    if (action.payload?.cardImplementationTakesHostedCredits === true) {
      return true;
    }
    return runnerBankTokensIndicateCashOutAction(text, sourceIsCreditBank);
  }

  function runnerBankTokensIndicateCashOutAction(
    text: string,
    sourceIsCreditBank: boolean,
  ): boolean {
    const tokens = runnerBankTextTokens(text);
    if (
      sourceIsCreditBank &&
      runnerBankTokensIncludeAny(tokens, [
        "nehmen",
        "take",
        "cash",
        "withdraw",
        "payout",
      ])
    ) {
      return true;
    }
    return (
      runnerBankTokensIncludeOrdered(tokens, ["take", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["cash", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["withdraw", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["payout", "bank"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "take"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "cash"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "withdraw"]) ||
      runnerBankTokensIncludeOrdered(tokens, ["bank", "payout"])
    );
  }

  function runnerBankActionText(
    input: AiDecisionInput,
    action: LegalAction,
  ): string {
    const resourceAbility =
      typeof action.payload?.resourceAbility === "string"
        ? action.payload.resourceAbility
        : "";
    const payloadSignals = [
      action.payload?.cardImplementationAddsHostedCredits === true
        ? "build_credit_bank"
        : "",
      action.payload?.cardImplementationTakesHostedCredits === true
        ? "cash_out_credit_bank"
        : "",
    ];
    return [resourceAbility, ...payloadSignals]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function runnerActionSourceLooksLikeCreditBank(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    return runnerCardLooksLikeCreditBank(
      input,
      dependencies.findVisibleCard(input, action.source),
    );
  }

  function runnerCardLooksLikeCreditBank(
    input: AiDecisionInput,
    card: VisibleCard | undefined,
  ): boolean {
    if (!card?.definitionId) return false;
    const roles = dependencies.rolesForCardId(card.definitionId);
    const definition = dependencies.definitionForCardId(card.definitionId);
    const mechanics = Array.isArray(definition?.mechanics)
      ? definition.mechanics.join(" ")
      : "";
    const hintEffects = dependencies
      .hintEffectsForDefinition(card.definitionId)
      .map((effect) =>
        [effect.kind, effect.resource, effect.target, effect.timing]
          .filter(Boolean)
          .join(":"),
      )
      .join(" ");
    const text = [definition?.rulesText, mechanics, hintEffects, ...roles]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      rolesMatch(roles, ["economy"]) && runnerTextLooksLikeCreditBank(text)
    );
  }

  function runnerTextLooksLikeCreditBank(text: string): boolean {
    const tokens = runnerBankTextTokens(text);
    return (
      runnerBankTokensIncludePhrase(tokens, ["stored", "credit"]) ||
      runnerBankTokensIncludePhrase(tokens, ["stored", "credits"]) ||
      runnerBankTokensIncludePhrase(tokens, ["counter", "bank"]) ||
      runnerBankTokensIncludePhrase(tokens, [
        "temporary",
        "resource",
        "bank",
      ]) ||
      runnerBankTokensIncludePhrase(tokens, ["finite", "economy", "pool"]) ||
      runnerBankTokensIncludeCreditCounterPair(tokens)
    );
  }

  function runnerBankStoredCredits(
    input: AiDecisionInput,
    action: LegalAction,
  ): number {
    const sourceCard = dependencies.findVisibleCard(input, action.source);
    const sourceAmount =
      sourceCard &&
      (runnerCardLooksLikeCreditBank(input, sourceCard) ||
        isRunnerBankBuildAction(input, action) ||
        isRunnerBankCashOutAction(input, action))
        ? runnerVisibleCardStoredCredits(sourceCard)
        : undefined;
    if (sourceAmount !== undefined) return sourceAmount;
    const bankAmounts = (input.playerView.own.rig ?? [])
      .filter((card) => runnerCardLooksLikeCreditBank(input, card))
      .map(runnerVisibleCardStoredCredits);
    return bankAmounts.length > 0 ? Math.max(...bankAmounts) : 0;
  }

  function runnerVisibleCardStoredCredits(card: VisibleCard): number {
    const counterValues = [
      card.counters?.bit,
      card.counters?.power,
      card.counters?.recurring_credit,
      ...(card.counterDisplays ?? [])
        .filter((display) => {
          const text = [
            display.displayKind,
            display.usageHint,
            display.label,
            display.ariaLabel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return runnerBankDisplayTextLooksStoredCredit(text);
        })
        .map((display) => display.amount),
    ]
      .filter((value): value is number => typeof value === "number")
      .map((value) => Math.max(0, Math.floor(value)));
    return counterValues.length > 0 ? Math.max(...counterValues) : 0;
  }

  function runnerBankDisplayTextLooksStoredCredit(text: string): boolean {
    return runnerBankTokensIncludeAny(runnerBankTextTokens(text), [
      "stored",
      "credit",
      "credits",
      "spendable",
      "bank",
    ]);
  }

  function runnerBankSourceLabel(
    input: AiDecisionInput,
    action: LegalAction,
  ): string {
    const definitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (definitionId) return definitionId;
    const sourceCard = dependencies.findVisibleCard(input, action.source);
    if (sourceCard?.definitionId) return sourceCard.definitionId;
    return "credit_bank";
  }

  function runnerBankBackgroundCadenceAssessment(
    input: AiDecisionInput,
    action: LegalAction,
  ): Pick<
    RunnerBankInvestmentCommitmentAssessment,
    | "backgroundActionsUsedThisTurn"
    | "backgroundCadenceReached"
    | "meaningfulAlternativeAvailable"
  > {
    const previousPlan = dependencies.previousPlan(input);
    const currentTurnKey = planPortfolioTurnKey(input);
    const rememberedActions =
      previousPlan?.portfolioRole === "background" &&
      previousPlan.turnKey === currentTurnKey
        ? Math.max(0, previousPlan.actionsUsedThisTurn ?? 0)
        : 0;
    const observedActions = runnerBankBuildActionsObservedThisTurn(
      input,
      action,
    );
    const backgroundActionsUsedThisTurn = Math.max(
      rememberedActions,
      observedActions,
    );
    return {
      backgroundActionsUsedThisTurn,
      backgroundCadenceReached: backgroundActionsUsedThisTurn >= 1,
      meaningfulAlternativeAvailable:
        runnerBankMeaningfulAlternativeAvailable(input),
    };
  }

  function runnerBankBuildActionsObservedThisTurn(
    input: AiDecisionInput,
    action: LegalAction,
  ): number {
    const sourceDefinitionId =
      dependencies.sourceDefinitionIdForAction(input, action) ??
      dependencies.findVisibleCard(input, action.source)?.definitionId;
    if (!sourceDefinitionId) return 0;
    const history = mergedPublicHistory(input);
    let turnBoundary = -1;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const payload = history[index]!.publicPayload;
      if (
        payload.actor === "corp" &&
        (payload.actionType === "end_turn" ||
          history[index]!.type === "end_turn")
      ) {
        turnBoundary = index;
        break;
      }
    }
    return history.slice(turnBoundary + 1).filter((event) => {
      const payload = event.publicPayload;
      const eventSource =
        typeof payload.sourceDefinitionId === "string"
          ? payload.sourceDefinitionId
          : typeof payload.cardDefinitionId === "string"
            ? payload.cardDefinitionId
            : undefined;
      if (payload.actor !== "runner" || eventSource !== sourceDefinitionId)
        return false;
      const actionType =
        typeof payload.actionType === "string"
          ? payload.actionType
          : event.type;
      if (
        actionType !== "activated_card_ability" &&
        actionType !== "trigger_ability"
      ) {
        return false;
      }
      if (
        typeof payload.hostedCreditsAdded === "number" &&
        payload.hostedCreditsAdded > 0
      ) {
        return true;
      }
      if (
        typeof payload.addedCounterAmount === "number" &&
        payload.addedCounterAmount > 0
      ) {
        return true;
      }
      const effects = Array.isArray(payload.resolvedEffects)
        ? payload.resolvedEffects
        : [];
      return effects.some(
        (effect) =>
          typeof effect === "object" &&
          effect !== null &&
          "kind" in effect &&
          effect.kind === "add_hosted_credits",
      );
    }).length;
  }

  function runnerBankMeaningfulAlternativeAvailable(
    input: AiDecisionInput,
  ): boolean {
    const meaningfulDraw = input.legalActions.some(
      (action) =>
        action.side === "runner" &&
        action.type === "draw_card" &&
        input.playerView.own.stackOrRdCount > 0 &&
        input.playerView.own.gripOrHq.length < input.playerView.own.maxHandSize,
    );
    if (meaningfulDraw) return true;
    return input.legalActions.some(
      (action) =>
        action.side === "runner" &&
        action.type === "start_run" &&
        runnerBankCommitmentRunOverride(input, action) !== undefined,
    );
  }

  function runnerBankHasShortInvestmentHorizon(
    input: AiDecisionInput,
  ): boolean {
    return (
      input.playerView.opponent.agendaPoints >=
      Math.max(0, input.playerView.agendaPointsToWin - 2)
    );
  }

  function runnerBankHasConcreteFundingNeed(input: AiDecisionInput): boolean {
    if (runnerBankHasTerminalContestFundingNeed(input)) return true;
    if (input.playerView.own.clicks < 2) return false;
    const largestCashOut = runnerBankLargestLegalCashOut(input);
    if (largestCashOut < RUNNER_BANK_URGENT_CASHOUT_TARGET) return false;
    const handFundingTarget = dependencies.runnerHandFundingTarget(input);
    if (
      handFundingTarget &&
      handFundingTarget.missingCredits > 0 &&
      handFundingTarget.missingCredits <= largestCashOut
    ) {
      return true;
    }
    const credits = input.playerView.own.credits;
    return input.legalActions.some((action) => {
      if (action.side !== "runner") return false;
      if (isRunnerBankCashOutAction(input, action)) return false;
      if (action.type !== "install_card" && action.type !== "play_event")
        return false;
      const actionCost = dependencies.actionCreditCost(action);
      if (actionCost <= credits || actionCost > credits + largestCashOut)
        return false;
      const roles = dependencies.rolesForAction(input, action);
      return rolesMatch(roles, [
        "breaker_",
        "memory",
        "economy",
        "pressure",
        "setup",
      ]);
    });
  }

  function runnerBankLargestLegalCashOut(input: AiDecisionInput): number {
    const payouts = input.legalActions
      .filter((action) => isRunnerBankCashOutAction(input, action))
      .map((action) => runnerBankStoredCredits(input, action));
    return payouts.length > 0 ? Math.max(...payouts) : 0;
  }

  function runnerBankHasTerminalContestFundingNeed(
    input: AiDecisionInput,
  ): boolean {
    if (
      input.playerView.opponent.agendaPoints <
        input.playerView.agendaPointsToWin - 1 ||
      input.playerView.own.clicks < 2
    ) {
      return false;
    }
    const cashOutAction = input.legalActions.find((action) =>
      isRunnerBankCashOutAction(input, action),
    );
    if (
      !cashOutAction ||
      runnerBankStoredCredits(input, cashOutAction) <
        RUNNER_BANK_FIRST_LOAD_TARGET
    ) {
      return false;
    }
    return input.legalActions.some((action) => {
      if (action.type !== "start_run") return false;
      const serverId = dependencies.serverId(action);
      if (!serverId?.startsWith("remote_")) return false;
      const evaluation = dependencies.runnerRunTargetEvaluation(
        input,
        action,
        serverId,
      );
      return (
        evaluation?.scoreThreat === true &&
        evaluation.pathPassability === "blocked_unpayable"
      );
    });
  }

  function runnerBankInstallProjection(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerBankInstallProjection {
    const installClickCost = Math.max(
      1,
      action.costs?.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) ?? 0,
    );
    const reservedRunClicks = input.legalActions.some(
      (candidate) =>
        candidate.type === "start_run" &&
        Boolean(runnerBankCommitmentRunOverride(input, candidate)),
    )
      ? 1
      : 0;
    const creditsAfterInstall =
      input.playerView.own.credits - dependencies.actionCreditCost(action);
    const clicksAfterInstall = input.playerView.own.clicks - installClickCost;
    const canLoadAfterInstallThisTurn =
      clicksAfterInstall - reservedRunClicks >= 1;
    const preservesConcreteFunding =
      !runnerBankHasConcreteFundingNeed(input) || creditsAfterInstall >= 4;
    const liquidPoolAlreadyComfortable =
      input.playerView.own.credits >= RUNNER_BANK_COMFORTABLE_BUILD_CREDITS;
    return {
      plausible:
        creditsAfterInstall >= 0 &&
        canLoadAfterInstallThisTurn &&
        preservesConcreteFunding &&
        !liquidPoolAlreadyComfortable,
      creditsAfterInstall,
      clicksAfterInstall,
      reservedRunClicks,
      canLoadAfterInstallThisTurn,
    };
  }

  function runnerBankCommitmentRunOverride(
    input: AiDecisionInput,
    action: LegalAction,
  ): string | undefined {
    if (action.type !== "start_run") return undefined;
    const serverId = dependencies.serverId(action);
    if (!serverId) return undefined;
    const server = input.playerView.servers.find(
      (entry) => entry.id === serverId,
    );
    if (
      server?.root.some(
        (card) =>
          card.known &&
          (card.type === "agenda" ||
            (card.definitionId &&
              dependencies.definitionType(card.definitionId) === "agenda")),
      )
    )
      return "known_agenda";
    if (
      server?.root.some(
        (card) => card.known && (card.advancementCounters ?? 0) > 0,
      )
    )
      return "remote_score_threat";
    const evaluation = dependencies.runnerRunTargetEvaluation(
      input,
      action,
      serverId,
    );
    if (!evaluation) return undefined;
    if (dependencies.runnerRunTargetHighPayoff(evaluation)) {
      return `high_payoff:${evaluation.accessPayoff}`;
    }
    if (
      evaluation.recommendation === "run_now" &&
      evaluation.accessPayoff !== "unknown" &&
      evaluation.knownAccessState !== "known_no_current_payoff"
    ) {
      return `run_now:${evaluation.accessPayoff}`;
    }
    return undefined;
  }

  return {
    runnerBankInvestmentCommitmentScoreComponents,
    runnerBankInvestmentCommitmentEvidence,
    isRunnerBankCashOutAction,
    runnerBankCashOutIsUsefulNow,
    runnerBankHasConcreteFundingNeed,
    runnerBankCommitmentRunOverride,
  };
}

function runnerBankTextTokens(text: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of text.toLocaleLowerCase("en-US")) {
    if (isAsciiLetterOrDigit(character)) {
      current += character;
    } else if (current.length > 0) {
      tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "0" && character <= "9")
  );
}

function runnerBankTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function runnerBankTokensIncludeOrdered(
  tokens: readonly string[],
  orderedTokens: readonly [string, string],
): boolean {
  const firstIndex = tokens.indexOf(orderedTokens[0]);
  if (firstIndex < 0) return false;
  return tokens.slice(firstIndex + 1).includes(orderedTokens[1]);
}

function runnerBankTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((token, offset) => tokens[index + offset] === token),
  );
}

function runnerBankTokensIncludeCreditCounterPair(
  tokens: readonly string[],
): boolean {
  return (
    runnerBankTokensIncludeOrdered(tokens, ["credit", "counter"]) ||
    runnerBankTokensIncludeOrdered(tokens, ["credits", "counter"]) ||
    runnerBankTokensIncludeOrdered(tokens, ["counter", "credit"]) ||
    runnerBankTokensIncludeOrdered(tokens, ["counter", "credits"])
  );
}
