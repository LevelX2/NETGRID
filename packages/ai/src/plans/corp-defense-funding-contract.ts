import { currentCorpRestrictedCreditBanks } from "../runtime/corp-restricted-credit-reserve";
import type { CorpGenericDefenseSignal } from "./corp-defense-contracts";
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
          signal.phase === "resolve_rez_or_trash" ||
          signal.phase === "resolve_program_trash" ||
          signal.phase === "resolve_hardware_trash" ||
          signal.phase === "resolve_post_pass_ice_lifecycle" ||
          (signal.phase === "draw_for_ice" &&
            signal.centralPressure === "terminal") ||
          signal.phase === "activate_run_defense" ||
          signal.phase === "recover_exposed_agenda" ||
          signal.phase === "pass_encounter" ||
          (signal.phase === "rez_response" &&
            signal.rezWindowVerdict === "productive")),
    )
  )
    return "P2";
  if (
    genericSignals.some(
      (signal) =>
        // Current executability does not make ordinary remote prebuild expire.
        // Its exact parent remains P6; score support has a separate delegated
        // contract, and concrete central pressure retains its own priority.
        (signal.immediateInstallSupport && signal.parentKind !== "remote") ||
        (signal.phase === "install_defense_support" &&
          signal.protectedCentralServerId !== undefined &&
          signal.centralPressure === "material") ||
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
    (signal.installRoute?.disposition === "funding_only" ||
      (signal.installRoute?.disposition === "productive" &&
        !signal.installRoute.projection.funded))
  ) {
    const projection = signal.installRoute.projection;
    const gap =
      projection.after.minimumAdditionalCreditsToSatisfy ??
      signal.installRoute.rezFundingGap;
    if (typeof gap !== "number" || !Number.isSafeInteger(gap) || gap <= 0) {
      return undefined;
    }
    const targetCredits = currentCredits === undefined
      ? undefined
      : currentCredits + gap;
    if (
      currentCredits !== undefined &&
      (!Number.isSafeInteger(currentCredits) ||
        currentCredits < 0 ||
        !Number.isSafeInteger(targetCredits))
    ) return undefined;
    return {
      gap,
      ...(targetCredits !== undefined ? { targetCredits } : {}),
      iceInstanceId: projection.sourceCardInstanceId,
    };
  }
  const reserve = signal.rezReserveNeed;
  const restrictedCredits = reserve?.storedRestrictedCredits ?? 0;
  if (
    signal.phase !== "fund_rez_reserve" ||
    !signal.targetIceInstanceId ||
    !reserve ||
    !Number.isSafeInteger(reserve.currentCredits) ||
    !Number.isSafeInteger(reserve.requiredCredits) ||
    !Number.isSafeInteger(reserve.fundingGap) ||
    reserve.fundingGap <= 0 ||
    !Number.isSafeInteger(restrictedCredits) ||
    restrictedCredits < 0 ||
    reserve.currentCredits < 0 ||
    reserve.requiredCredits <= reserve.currentCredits ||
    reserve.fundingGap !==
      reserve.requiredCredits - reserve.currentCredits - restrictedCredits
  ) {
    return undefined;
  }
  return {
    gap: reserve.fundingGap,
    targetCredits: reserve.requiredCredits - restrictedCredits,
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
  const expected = genericDefenseFundingRequirement(
    signal,
    context.input.playerView.own.credits,
  );
  if (
    !expected ||
    expected.gap !== requirement.gap ||
    expected.targetCredits !== requirement.targetCredits ||
    expected.iceInstanceId !== requirement.iceInstanceId
  ) return false;
  if (signal.phase === "install_ice") {
    return signal.installRoute?.projection.targetServerId === signal.serverId;
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
