import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { publicServerLabel } from "../view/server-view";
import type { PublicContextForActionDependencies } from "./public-context-dependencies";

export function applyPublicRunStartAndAccessContext(
  state: GameState,
  legalAction: LegalAction,
  context: Record<string, unknown>,
  cardId: CardInstanceId | undefined,
  deps: Pick<
    PublicContextForActionDependencies,
    "v1915InstalledAccessBonus" | "runnerHqAccessBonus"
  >,
): void {
  if (
    legalAction.type === "access_card" &&
    cardId &&
    state.cardInstances[cardId]
  ) {
    const instance = state.cardInstances[cardId];
    if (instance?.zone.side === "corp" && instance.zone.zone === "serverRoot") {
      const serverId = instance.zone.serverId;
      const server = state.corp.servers.find(
        (candidate) => candidate.id === serverId,
      );
      const index = server?.root.indexOf(cardId) ?? -1;
      if (server && index >= 0) {
        context.accessedCardPositionKey = `root:${index}`;
        context.accessedArea = "root";
        context.accessedIndex = index;
      }
    }
  }
  if (legalAction.type === "start_run" && state.run) {
    context.serverId = state.run.attackedServerId;
    const runAccessCount = Math.max(1, Math.floor(state.run.accessCount ?? 1));
    const runInstalledAccessBonus =
      deps.v1915InstalledAccessBonus(state, state.run.attackedServerId) +
      (state.run.attackedServerId === "hq"
        ? deps.runnerHqAccessBonus(state)
        : 0);
    context.baseAccessCount = Math.max(
      1,
      runAccessCount - runInstalledAccessBonus,
    );
    context.installedAccessBonus = runInstalledAccessBonus;
    context.effectiveAccessCount = runAccessCount;
  }
  for (const key of [
    "baseAccessCount",
    "installedAccessBonus",
    "effectiveAccessCount",
    "accessIndex",
    "vacuumLinkDieRoll",
    "vacuumLinkRewindApplied",
    "vacuumLinkRewindRezzedIceBack",
    "vacuumLinkTargetIceIndex",
    "rezzedIceRewindDieRoll",
    "rezzedIceRewindApplied",
    "rezzedIceRewindChoiceOpened",
    "rezzedIceRewindChoice",
    "rezzedIceRewindRezzedIceBack",
    "rezzedIceRewindTargetIceIndex",
    "temporaryDiscountedRunEndDerez",
    "derezzedCount",
    "runFortPassPass",
    "runRootRezPass",
    "runApproachRootRezPass",
    "highlighterCounterCount",
    "highlighterAccessBonus",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number" || typeof value === "boolean")
      context[key] = value;
  }
  if (
    typeof legalAction.payload?.installedAccessBonusSourceDefinitionIds ===
    "string"
  )
    context.installedAccessBonusSourceDefinitionIds =
      legalAction.payload.installedAccessBonusSourceDefinitionIds;
  if (legalAction.payload?.runnerEventRun === true)
    context.runnerEventRun = true;
}

export function applyPublicSubroutineBreakContext(
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (legalAction.type === "break_subroutine") {
    if (legalAction.subroutineIndexes)
      context.subroutineIndexes = legalAction.subroutineIndexes;
    for (const key of [
      "subroutineIndex",
      "targetIceDefinitionId",
      "targetIceTitle",
      "breakSubroutineBaseCost",
      "breakSubroutineAdditionalCost",
      "breakSubroutineTotalCost",
      "breakAllMatchingSubroutines",
      "breakerEndsRunAfterBreak",
      "randomBreakOutcomeKind",
      "randomBreakOutcomeRoll",
      "randomBreakOutcomeSuccess",
      "randomBreakOutcomeDamageAmount",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
}

export function applyPublicRunContinuationContext(
  state: GameState,
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (
    legalAction.type === "jack_out" &&
    legalAction.payload?.runnerCostPenaltySupportWindowOpened !== true
  ) {
    if (typeof legalAction.payload?.serverId === "string")
      context.serverId = legalAction.payload.serverId;
    if (typeof legalAction.payload?.jackOutIcePosition === "number")
      context.jackOutIcePosition = legalAction.payload.jackOutIcePosition;
    if (legalAction.payload?.jackOutBeforeAccess === true)
      context.jackOutBeforeAccess = true;
  }
  if (legalAction.type === "continue_run") {
    context.result = state.run ? "continued" : "ended";
    if (state.run) {
      context.serverId = state.run.attackedServerId;
      if (state.run.position.kind === "ice") {
        context.runDestination = "ice";
        context.runDestinationIcePosition = state.run.position.iceIndex + 1;
      } else {
        context.runDestination = "root";
      }
      const attackedServerLabel = publicServerLabel(
        state,
        state.run.attackedServerId,
      );
      if (attackedServerLabel) context.serverLabel = attackedServerLabel;
    }
    if (typeof legalAction.payload?.trashedCardDefinitionId === "number")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload?.trashedCardType === "string")
      context.trashedCardType = legalAction.payload.trashedCardType;
    if (typeof legalAction.payload?.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (legalAction.payload?.encounterContinue === true) {
      context.encounterContinue = true;
      context.unbrokenSubroutineCount =
        legalAction.payload.unbrokenSubroutineCount;
      context.encounterWillEndRun = legalAction.payload.encounterWillEndRun;
    }
    if (
      legalAction.payload?.corpPostPassIceAbility === "return_passed_ice_to_hq"
    ) {
      context.corpPostPassIceAbility = "return_passed_ice_to_hq";
      for (const key of [
        "sourceDefinitionId",
        "passedIceDefinitionId",
        "serverLabel",
        "decision",
        "paymentAmount",
        "paidCredits",
        "returnedToHq",
        "returnedCardDefinitionId",
        "gainCredits",
        "gainedCredits",
        "corpCreditsAfter",
      ]) {
        const value = legalAction.payload?.[key];
        if (value !== undefined) context[key] = value;
      }
    }
    if (
      legalAction.payload?.postPassFutureStrengthAbility ===
      "cancel_future_ice_strength_bonus"
    ) {
      for (const key of [
        "postPassFutureStrengthAbility",
        "sourceDefinitionId",
        "passedIceDefinitionId",
        "serverLabel",
        "decision",
        "paymentAmount",
        "paidCredits",
        "strengthBonusAmount",
        "futureEncounterIceStrengthBonus",
        "runnerCreditsAfter",
      ]) {
        const value = legalAction.payload?.[key];
        if (value !== undefined) context[key] = value;
      }
    }
    for (const key of [
      "unsuccessfulRunCorpCreditBonus",
      "corpCreditsGained",
      "corpCreditsAfter",
      "jackOutAdditionalCost",
      "passIceTrashProgramPrompt",
      "passIceTrashProgramCandidateCount",
      "temporaryTraceCredits",
      "temporaryTraceCreditsReturned",
      "temporaryTraceCreditsSourceDefinitionId",
      "temporaryCreditsReturned",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    if (legalAction.payload?.bartmossPostEncounterChecked === true) {
      context.bartmossPostEncounterChecked = true;
      context.bartmossPostEncounterOutcomes =
        legalAction.payload.bartmossPostEncounterOutcomes;
    }
  }
}
