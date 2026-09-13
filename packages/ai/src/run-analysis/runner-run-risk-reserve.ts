import type { RunnerPrerunReserveQuote } from "./runner-run-target-types";
import type { VisibleCard } from "@netgrid/shared";

export function quoteRunnerRunRiskReserve(params: {
  purpose: RunnerPrerunReserveQuote["purpose"];
  riskTolerance: RunnerPrerunReserveQuote["riskTolerance"];
  visibleCoverage: RunnerPrerunReserveQuote["visibleCoverage"];
  knownPathCost: number;
  creditsAfterKnownPath: number;
  unknownIceCount: number;
  unknownIcePositions: number[];
  corpRezCredits: number;
  corpRezExposureActive: boolean;
  riskCreditBuffer: number;
  runnerGripCount: number;
  informationProbeAllowed: boolean;
  runnerRig: readonly VisibleCard[] | undefined;
}): RunnerPrerunReserveQuote {
  const programs = params.runnerRig?.filter((card) => card.type === "program");
  const exposureKnown =
    programs !== undefined &&
    programs.every(
      (card) =>
        card.known &&
        Number.isSafeInteger(card.installCost) &&
        card.installCost! >= 0,
    );
  const programInvestmentCredits = exposureKnown
    ? programs!.reduce((sum, card) => sum + card.installCost!, 0)
    : undefined;
  // A policy reserve for the public investment at stake, not a quote of any
  // hidden ICE. Corp liquidity limits the exposure premium. Prior safe access
  // does not certify this newly exposed rig or the current rez budget.
  const programReserve =
    params.unknownIceCount > 0 &&
    params.corpRezExposureActive &&
    params.riskTolerance !== "matchpoint_with_stable_universal_coverage" &&
    programInvestmentCredits !== undefined
      ? Math.min(params.corpRezCredits, programInvestmentCredits)
      : 0;
  const baseRequiredCredits =
    params.unknownIceCount > 0 && params.corpRezExposureActive
      ? params.riskCreditBuffer
      : 0;
  const ordinaryRequiredCredits =
    baseRequiredCredits === 0
      ? 0
      : params.riskTolerance === "matchpoint_with_stable_universal_coverage"
        ? Math.max(1, baseRequiredCredits - 1)
        : baseRequiredCredits;
  const requiredCredits = Math.max(ordinaryRequiredCredits, programReserve);
  const creditGap = Math.max(0, requiredCredits - params.creditsAfterKnownPath);
  const requiredHandBuffer =
    params.unknownIceCount === 0 || !params.corpRezExposureActive
      ? 0
      : params.riskTolerance === "matchpoint_with_stable_universal_coverage" ||
          params.visibleCoverage === "stable_universal"
        ? 2
        : params.visibleCoverage === "risky_universal"
          ? 4
          : 3;
  const handBufferGap = Math.max(
    0,
    requiredHandBuffer - params.runnerGripCount,
  );
  const status =
    params.unknownIceCount === 0 || !params.corpRezExposureActive
      ? ("not_required" as const)
      : !exposureKnown
        ? ("blocked" as const)
        : creditGap === 0 && handBufferGap === 0
          ? ("satisfied" as const)
          : params.informationProbeAllowed &&
              params.creditsAfterKnownPath >= programReserve
            ? ("information_probe_only" as const)
            : ("blocked" as const);
  return {
    purpose: params.purpose,
    status,
    riskTolerance: params.riskTolerance,
    knownPathCost: params.knownPathCost,
    creditsAfterKnownPath: params.creditsAfterKnownPath,
    unknownIceCount: params.unknownIceCount,
    unknownIcePositions: params.unknownIcePositions,
    corpRezCredits: params.corpRezCredits,
    visibleCoverage: params.visibleCoverage,
    requiredCredits,
    creditGap,
    requiredHandBuffer,
    handBufferGap,
    evidence: [
      `prerun_reserve_purpose:${params.purpose}`,
      `prerun_reserve_status:${status}`,
      `prerun_reserve_risk_tolerance:${params.riskTolerance}`,
      `prerun_reserve_known_path_cost:${params.knownPathCost}`,
      `prerun_reserve_credits_after_known_path:${params.creditsAfterKnownPath}`,
      `prerun_reserve_unknown_ice_count:${params.unknownIceCount}`,
      `prerun_reserve_unknown_ice_positions:${params.unknownIcePositions.join("|") || "none"}`,
      `prerun_reserve_corp_rez_credits:${params.corpRezCredits}`,
      `prerun_reserve_corp_rez_exposure_active:${params.corpRezExposureActive}`,
      `prerun_reserve_visible_coverage:${params.visibleCoverage}`,
      `prerun_reserve_required_credits:${requiredCredits}`,
      `prerun_reserve_credit_gap:${creditGap}`,
      `prerun_reserve_required_hand_buffer:${requiredHandBuffer}`,
      `prerun_reserve_hand_buffer_gap:${handBufferGap}`,
      `prerun_reserve_program_exposure_known:${exposureKnown}`,
      `prerun_reserve_program_count:${programs?.length ?? "unknown"}`,
      `prerun_reserve_program_install_investment_credits:${programInvestmentCredits ?? "unknown"}`,
      `prerun_reserve_program_investment_buffer:${programReserve}`,
    ],
  };
}
