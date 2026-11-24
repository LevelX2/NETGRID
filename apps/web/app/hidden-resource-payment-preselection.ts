import {
  isCanonicalCapabilityId,
  isRunnerPaymentWindowId,
  type CanonicalCapabilityId,
  type RunId,
  type RunnerPaymentWindowId,
  type Side,
  type VisibleCard,
  type VisibleRunnerPaymentSupportAbility,
} from "@netgrid/shared";
import type { LegalAction, PlayerView } from "../lib/presented-player-view";

type PaymentSupportAbilityIdentity = {
  sourceAbilityId: CanonicalCapabilityId;
  capabilityKey: string;
};

export type HiddenResourcePaymentPreselection =
  PaymentSupportAbilityIdentity & {
    matchId: string;
    side: Extract<Side, "runner">;
    sourceCardId: string;
    timing: "runner_cost_penalty_support";
    selectedTurnSerial: number;
    selectedRunId?: RunId;
  };

function samePaymentSupportAbilityIdentity(
  left: PaymentSupportAbilityIdentity,
  right: PaymentSupportAbilityIdentity,
): boolean {
  return (
    isCanonicalCapabilityId(left.sourceAbilityId) &&
    left.capabilityKey.length > 0 &&
    right.sourceAbilityId === left.sourceAbilityId &&
    right.capabilityKey === left.capabilityKey
  );
}

export type PaymentSupportPreselectionResolution =
  | { kind: "waiting" }
  | { kind: "invalid"; windowId: RunnerPaymentWindowId }
  | { kind: "match"; windowId: RunnerPaymentWindowId; action: LegalAction };

export type PendingPaymentSupportContinuation = {
  matchId: string;
  windowId: RunnerPaymentWindowId;
  supportSubmittedAtStateVersion: number;
};

export type PaymentSupportContinuationResolution =
  | { kind: "waiting" }
  | { kind: "invalid" }
  | { kind: "match"; action: LegalAction };

export function createHiddenResourcePaymentPreselection(input: {
  matchId: string;
  view: PlayerView;
  card: VisibleCard;
  ability: VisibleRunnerPaymentSupportAbility;
}): HiddenResourcePaymentPreselection | null {
  if (
    input.view.side !== "runner" ||
    !input.card.known ||
    !input.card.runnerPaymentSupportAbilities?.some(
      (candidate) =>
        samePaymentSupportAbilityIdentity(candidate, input.ability) &&
        candidate.timing === input.ability.timing,
    )
  )
    return null;
  return {
    matchId: input.matchId,
    side: "runner",
    sourceCardId: input.card.instanceId,
    sourceAbilityId: input.ability.sourceAbilityId,
    capabilityKey: input.ability.capabilityKey,
    timing: input.ability.timing,
    selectedTurnSerial: input.view.turnSerial ?? 0,
    ...(input.view.run?.runId ? { selectedRunId: input.view.run.runId } : {}),
  };
}

export function hiddenResourcePaymentPreselectionEquals(
  selection: HiddenResourcePaymentPreselection | null,
  cardId: string,
  ability: PaymentSupportAbilityIdentity,
): boolean {
  return Boolean(
    selection?.sourceCardId === cardId &&
    samePaymentSupportAbilityIdentity(selection, ability),
  );
}

export function hiddenResourcePaymentPreselectionIsAvailable(
  selection: HiddenResourcePaymentPreselection,
  matchId: string,
  view: PlayerView,
): boolean {
  if (
    selection.matchId !== matchId ||
    selection.side !== "runner" ||
    view.side !== "runner" ||
    (view.turnSerial ?? 0) !== selection.selectedTurnSerial ||
    (selection.selectedRunId !== undefined &&
      view.run?.runId !== selection.selectedRunId)
  )
    return false;
  const source = view.own.rig?.find(
    (card) => card.instanceId === selection.sourceCardId,
  );
  return Boolean(
    source?.runnerPaymentSupportAbilities?.some(
      (ability) =>
        samePaymentSupportAbilityIdentity(ability, selection) &&
        ability.timing === selection.timing,
    ),
  );
}

export function resolveHiddenResourcePaymentPreselection(
  selection: HiddenResourcePaymentPreselection,
  legalActions: readonly LegalAction[],
): PaymentSupportPreselectionResolution {
  const windowIds = new Set(
    legalActions.flatMap((action) => {
      const windowId = paymentSupportWindowId(action);
      return windowId ? [windowId] : [];
    }),
  );
  if (windowIds.size === 0) return { kind: "waiting" };
  if (windowIds.size !== 1)
    return { kind: "invalid", windowId: Math.min(...windowIds) };
  const windowId = [...windowIds][0]!;
  const matches = legalActions.filter(
    (action) =>
      action.type === "activated_card_ability" &&
      action.source === selection.sourceCardId &&
      action.payload?.cardId === selection.sourceCardId &&
      action.payload?.cardImplementationAbilityId ===
        selection.sourceAbilityId &&
      action.payload?.cardImplementationAbilityKey ===
        selection.capabilityKey &&
      action.abilityRef?.sourceCardInstanceId === selection.sourceCardId &&
      action.abilityRef.sourceAbilityId === selection.sourceAbilityId &&
      action.payload?.cardImplementationAbilityTiming === selection.timing &&
      action.payload?.costPenaltySupportWindowId === windowId,
  );
  return matches.length === 1
    ? { kind: "match", windowId, action: matches[0]! }
    : { kind: "invalid", windowId };
}

export function paymentSupportSubmitKey(
  matchId: string,
  windowId: RunnerPaymentWindowId,
  action: LegalAction,
): string {
  return `${matchId}:${windowId}:${action.actionId}`;
}

export function shouldSubmitPaymentSupportAction(
  lastSubmittedKey: string | null,
  nextSubmitKey: string,
): boolean {
  return lastSubmittedKey !== nextSubmitKey;
}

export function pendingPaymentSupportContinuation(
  matchId: string,
  supportAction: LegalAction,
  stateVersion: number,
): PendingPaymentSupportContinuation | null {
  const windowId = supportAction.payload?.costPenaltySupportWindowId;
  if (
    supportAction.type !== "activated_card_ability" ||
    supportAction.payload?.cardImplementationAbilityTiming !==
      "runner_cost_penalty_support" ||
    !isRunnerPaymentWindowId(windowId)
  )
    return null;
  return {
    matchId,
    windowId,
    supportSubmittedAtStateVersion: stateVersion,
  };
}

export function resolvePaymentSupportContinuation(
  pending: PendingPaymentSupportContinuation,
  currentStateVersion: number,
  legalActions: readonly LegalAction[],
): PaymentSupportContinuationResolution {
  if (currentStateVersion <= pending.supportSubmittedAtStateVersion)
    return { kind: "waiting" };
  const currentActions = legalActions.filter(
    (action) => action.expiresAtStateVersion === currentStateVersion,
  );
  if (currentActions.length === 0) return { kind: "waiting" };
  const matches = currentActions.filter(
    (action) =>
      action.payload?.runnerCostPenaltySupportContinuation === true &&
      action.payload?.runnerCostPenaltySupportWindowId === pending.windowId,
  );
  return matches.length === 1
    ? { kind: "match", action: matches[0]! }
    : { kind: "invalid" };
}

export function actionBelongsToRunnerPaymentSupportWindow(
  action: LegalAction,
): boolean {
  return paymentSupportWindowId(action) !== null;
}

function paymentSupportWindowId(
  action: LegalAction,
): RunnerPaymentWindowId | null {
  const supportWindowId = action.payload?.costPenaltySupportWindowId;
  if (isRunnerPaymentWindowId(supportWindowId)) return supportWindowId;
  const continuationWindowId = action.payload?.runnerCostPenaltySupportWindowId;
  return isRunnerPaymentWindowId(continuationWindowId)
    ? continuationWindowId
    : null;
}
