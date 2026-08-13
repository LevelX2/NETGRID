import type {
  CardInstanceId,
  DamageType,
  GameState,
  ImminentEvent,
  LegalAction,
} from "@netgrid/shared";
import {
  addTagPublicContextFromPayload,
  createAddTagImminentEvent,
  createDamageImminentEvent,
  createRunnerInstalledTrashImminentEvent,
  openPdcaDamageReplacementChoice,
  resolveAddTagImminentEvent,
  resolveDamageImminentEvent,
  resolveRunnerInstalledTrashImminentEvent,
  setDamagePayload,
} from "./damage-event-resolution";
import {
  openEventModificationWindow,
  resolveEventModificationChoice,
} from "./prevention-window";
import { simultaneousInstalledProgramTrashIds } from "../state/microtech-backup";
import {
  openReplacementWindow,
  resolveReplacementChoice,
} from "./damage-replacement";
import { runnerInstalledCardIds } from "./damage-runtime-context";

export function openDamageResolutionWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  // Reihenfolge ist regelrelevant: vollständige Replacements gehen vor
  // Prevention/Boosts; PDCA ist der letzte kartenspezifische Ersatzpfad.
  if (openReplacementWindow(state, event, legalAction)) return true;
  if (applyPermanentMeatDamagePrevention(state, event, legalAction))
    return false;
  return (
    openEventModificationWindow(state, event, legalAction) ||
    openPdcaDamageReplacementChoice(state, event, legalAction)
  );
}

function applyPermanentMeatDamagePrevention(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const originalAmount = Number(event.payload.amount ?? 0);
  if (
    state.runnerPermanentMeatDamagePrevention !== true ||
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    event.payload.damageType !== "meat" ||
    !Number.isInteger(originalAmount) ||
    originalAmount <= 0
  )
    return false;
  event.payload = { ...event.payload, amount: 0 };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    eventModificationDecision: "automatic",
    eventModificationOutcome: "prevented",
    eventModificationSource: "permanent_meat_damage_prevention",
    originalAmount,
    preventedAmount: originalAmount,
    finalAmount: 0,
  };
  return true;
}

export function resolveDamageOperation(
  state: GameState,
  legalAction: LegalAction,
  damageType: DamageType,
  amount: number,
  source: string,
): void {
  const request = {
    damageId: `${state.matchId}.${state.stateVersion}.${source}`,
    damageType,
    amount,
    source: `operation:${source}`,
  };
  const event = createDamageImminentEvent(state, request);
  if (openDamageResolutionWindow(state, event, legalAction)) return;
  const summary = resolveDamageImminentEvent(state, event);
  setDamagePayload(legalAction, summary);
  const payload = (legalAction.payload ??= {});
  if (typeof event.payload.baseDamageAmount === "number")
    payload.baseDamageAmount = event.payload.baseDamageAmount;
  if (typeof event.payload.damageAmountModifier === "number")
    payload.damageAmountModifier = event.payload.damageAmountModifier;
}

export function addRunnerTagsWithPrevention(
  state: GameState,
  legalAction: LegalAction,
  amount: number,
  source: string,
): boolean {
  if (amount <= 0) return false;
  const oneShotAvoidance = Math.max(
    0,
    Math.floor(state.runnerTagAvoidanceCredits ?? 0),
  );
  if (oneShotAvoidance > 0) {
    state.runnerTagAvoidanceCredits = oneShotAvoidance - 1;
    const remainingTags = Math.max(0, amount - 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      tagsAdded: 0,
      preventedTags: 1,
      runnerTagsAfter: state.runner.tags,
      tagAvoidanceCreditsAfter: state.runnerTagAvoidanceCredits,
    };
    if (remainingTags <= 0) return false;
    const remainingEvent = createAddTagImminentEvent(
      state,
      remainingTags,
      source,
      addTagPublicContextFromPayload(legalAction.payload),
    );
    if (openEventModificationWindow(state, remainingEvent, legalAction))
      return true;
    resolveAddTagImminentEvent(state, remainingEvent, legalAction);
    return false;
  }
  const event = createAddTagImminentEvent(
    state,
    amount,
    source,
    addTagPublicContextFromPayload(legalAction.payload),
  );
  if (openEventModificationWindow(state, event, legalAction)) return true;
  resolveAddTagImminentEvent(state, event, legalAction);
  return false;
}

export function openRunnerInstalledTrashPreventionWindow(
  state: GameState,
  legalAction: LegalAction,
  targetCardIds: CardInstanceId[],
  source: string,
): boolean {
  const installedTargets = targetCardIds.filter((cardId) =>
    runnerInstalledCardIds(state).includes(cardId),
  );
  if (installedTargets.length === 0) return false;
  const simultaneousProgramTargets = simultaneousInstalledProgramTrashIds(
    state,
    installedTargets,
  );
  const event = createRunnerInstalledTrashImminentEvent(
    state,
    [...new Set([...installedTargets, ...simultaneousProgramTargets])],
    source,
  );
  return openEventModificationWindow(state, event, legalAction);
}

export {
  aggregateDamageSummaries,
  createAddTagImminentEvent,
  createDamageImminentEvent,
  createRunnerInstalledTrashImminentEvent,
  doDamage,
  openPdcaDamageReplacementChoice,
  resolveDamageImminentEvent,
  resolvePdcaDamageReplacementChoice,
  resolveRunnerInstalledTrashImminentEvent,
  setDamagePayload,
} from "./damage-event-resolution";
export {
  configureDamageCoreHost,
  hiddenRunnerResourceRevealPayload,
  resetDamageCoreHostForTests,
  type DamageCoreHost,
  type DamageSummary,
} from "./damage-runtime-context";
export {
  damagePreventionSourcesForDefinition,
  isRunnerHardwareDeckDefinition,
} from "./prevention-sources";
export {
  openEventModificationWindow,
  resolveEventModificationChoice,
} from "./prevention-window";
export {
  openReplacementWindow,
  resolveReplacementChoice,
} from "./damage-replacement";
