import type { RunnerPrerunReserveQuote } from "./runner-run-target-types";

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
}): RunnerPrerunReserveQuote {
  const baseRequiredCredits =
    params.unknownIceCount > 0 && params.corpRezExposureActive
      ? params.riskCreditBuffer
      : 0;
  const requiredCredits =
    baseRequiredCredits === 0
      ? 0
      : params.riskTolerance === "matchpoint_with_stable_universal_coverage"
        ? Math.max(1, baseRequiredCredits - 1)
        : baseRequiredCredits;
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
      : creditGap === 0 && handBufferGap === 0
        ? ("satisfied" as const)
        : params.informationProbeAllowed
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
    ],
  };
}
