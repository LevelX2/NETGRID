import { currentCorpRestrictedCreditBanks } from "../runtime/corp-restricted-credit-reserve";
import { CorpGenericDefenseSignal } from "./corp-defense-contracts";
import type { PlanSchedulerContext } from "./plan-scheduler";

export function corpGenericDefensePriorityClass(
  genericSignals: readonly CorpGenericDefenseSignal[],
): "P2" | "P3" | "P5" | "P6" {
  if (
    genericSignals.some(
      (signal) =>
        signal.urgent &&
        (signal.phase === "install_ice" ||
          signal.phase === "install_defense_support" ||
          signal.phase === "fund_rez_reserve" ||
          signal.phase === "resolve_install_targets" ||
          signal.phase === "resolve_run_redirect" ||
          signal.phase === "resolve_program_trash" ||
          signal.phase === "resolve_post_pass_ice_lifecycle" ||
          (signal.phase === "draw_for_ice" &&
            signal.centralPressure === "terminal") ||
          signal.phase === "activate_run_defense" ||
          signal.phase === "pass_encounter" ||
          (signal.phase === "rez_response" &&
            signal.rezWindowVerdict === "productive")),
    )
  )
    return "P2";
  if (
    genericSignals.some(
      (signal) =>
        signal.immediateInstallSupport ||
        (signal.phase === "install_ice" &&
          (signal.installRoute?.progressKind ===
            "scoreline_central_tax_allocation" ||
            signal.centralPressure === "material" ||
            signal.centralPressure === "acute")),
    )
  ) {
    return "P3";
  }
  if (
    genericSignals.some(
      (signal) =>
        signal.phase === "rez_response" &&
        signal.rezWindowVerdict === "productive",
    )
  )
    return "P5";
  if (
    genericSignals.some(
      (signal) =>
        (signal.serverId === "hq" || signal.serverId === "rd") &&
        signal.value > 8,
    )
  )
    return "P5";
  return "P6";
}

export function genericDefenseFundingRequirement(
  signal: CorpGenericDefenseSignal,
  currentCredits?: number,
):
  | Readonly<{
      gap: number;
      targetCredits?: number;
      iceInstanceId: string;
    }>
  | undefined {
  if (
    signal.phase === "install_ice" &&
    signal.installRoute?.disposition === "funding_only"
  ) {
    const projection = signal.installRoute.projection;
    const gap = projection.after.minimumAdditionalCreditsToSatisfy;
    if (typeof gap !== "number" || !Number.isSafeInteger(gap) || gap <= 0) {
      return undefined;
    }
    return {
      gap,
      ...(typeof currentCredits === "number" &&
      Number.isSafeInteger(currentCredits) &&
      currentCredits >= 0
        ? { targetCredits: currentCredits + gap }
        : {}),
      iceInstanceId: projection.sourceCardInstanceId,
    };
  }
  const reserve = signal.rezReserveNeed;
  if (
    signal.phase !== "fund_rez_reserve" ||
    !signal.targetIceInstanceId ||
    !reserve ||
    !Number.isSafeInteger(reserve.currentCredits) ||
    !Number.isSafeInteger(reserve.requiredCredits) ||
    !Number.isSafeInteger(reserve.fundingGap) ||
    reserve.currentCredits < 0 ||
    reserve.requiredCredits <= reserve.currentCredits ||
    reserve.fundingGap !==
      reserve.requiredCredits -
        reserve.currentCredits -
        (reserve.storedRestrictedCredits ?? 0)
  ) {
    return undefined;
  }
  return {
    gap: reserve.fundingGap,
    targetCredits:
      reserve.requiredCredits - (reserve.storedRestrictedCredits ?? 0),
    iceInstanceId: signal.targetIceInstanceId,
  };
}

export function genericDefenseFundingRequirementIsCurrent(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  requirement: Readonly<{
    gap: number;
    targetCredits?: number;
    iceInstanceId: string;
  }>,
): boolean {
  if (signal.phase === "install_ice") {
    return (
      signal.installRoute?.disposition === "funding_only" &&
      signal.installRoute.projection.targetServerId === signal.serverId &&
      signal.installRoute.projection.sourceCardInstanceId ===
        requirement.iceInstanceId
    );
  }
  const reserve = signal.rezReserveNeed;
  const ice = context.input.playerView.servers
    .find((server) => server.id === signal.serverId)
    ?.ice.find(
      (candidate) => candidate.instanceId === requirement.iceInstanceId,
    );
  const quote = ice?.effectiveRezCostQuote;
  return (
    signal.phase === "fund_rez_reserve" &&
    reserve?.observedAtStateVersion === context.input.playerView.stateVersion &&
    reserve.currentCredits === context.input.playerView.own.credits &&
    reserve.requiredCredits - (reserve.storedRestrictedCredits ?? 0) ===
      requirement.targetCredits &&
    ice?.rezzed !== true &&
    quote?.context === "installed" &&
    quote.cardId === requirement.iceInstanceId &&
    quote.targetServerId === signal.serverId &&
    quote.projectedServerId === signal.serverId &&
    quote.expiresAtStateVersion === context.input.playerView.stateVersion &&
    quote.complete === true &&
    quote.mandatoryAdditionalCosts.agendaPoints === 0 &&
    quote.finalCredits === reserve.requiredCredits &&
    (reserve.storedRestrictedCredits ?? 0) ===
      Math.max(
        0,
        ...currentCorpRestrictedCreditBanks(context.input)
          .filter(
            (bank) =>
              bank.advancementCounters > 0 &&
              bank.generalCreditsAvailable ===
                context.input.playerView.own.credits,
          )
          .map((bank) => bank.creditsPerCounter),
      )
  );
}
