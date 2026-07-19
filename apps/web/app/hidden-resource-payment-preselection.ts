import type {
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
  VisibleRunnerPaymentSupportAbility,
} from "@netgrid/shared";

export type HiddenResourcePaymentPreselection = {
  matchId: string;
  side: Extract<Side, "runner">;
  sourceCardId: string;
  abilityIndex: number;
  timing: "runner_cost_penalty_support";
  selectedTurnSerial: number;
  selectedRunId?: string;
};

export type PaymentSupportPreselectionResolution =
  | { kind: "waiting" }
  | { kind: "invalid"; windowId: string }
  | { kind: "match"; windowId: string; action: LegalAction };

export type PendingPaymentSupportContinuation = {
  matchId: string;
  windowId: string;
  originalActionId: string;
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
        candidate.abilityIndex === input.ability.abilityIndex &&
        candidate.timing === input.ability.timing,
    )
  )
    return null;
  return {
    matchId: input.matchId,
    side: "runner",
    sourceCardId: input.card.instanceId,
    abilityIndex: input.ability.abilityIndex,
    timing: input.ability.timing,
    selectedTurnSerial: input.view.turnSerial ?? 0,
    ...(input.view.run?.runId ? { selectedRunId: input.view.run.runId } : {}),
  };
}

export function hiddenResourcePaymentPreselectionEquals(
  selection: HiddenResourcePaymentPreselection | null,
  cardId: string,
  abilityIndex: number,
): boolean {
  return Boolean(
    selection?.sourceCardId === cardId &&
    selection.abilityIndex === abilityIndex,
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
        ability.abilityIndex === selection.abilityIndex &&
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
    return { kind: "invalid", windowId: [...windowIds].sort()[0] ?? "" };
  const windowId = [...windowIds][0]!;
  const matches = legalActions.filter(
    (action) =>
      action.type === "activated_card_ability" &&
      action.source === selection.sourceCardId &&
      action.payload?.cardId === selection.sourceCardId &&
      action.payload?.cardImplementationAbilityIndex ===
        selection.abilityIndex &&
      action.payload?.cardImplementationAbilityTiming === selection.timing &&
      action.payload?.costPenaltySupportWindowId === windowId,
  );
  return matches.length === 1
    ? { kind: "match", windowId, action: matches[0]! }
    : { kind: "invalid", windowId };
}

export function paymentSupportSubmitKey(
  matchId: string,
  windowId: string,
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
  const originalActionId =
    supportAction.payload?.costPenaltySupportOriginalActionId;
  if (
    supportAction.type !== "activated_card_ability" ||
    supportAction.payload?.cardImplementationAbilityTiming !==
      "runner_cost_penalty_support" ||
    typeof windowId !== "string" ||
    windowId.length === 0 ||
    typeof originalActionId !== "string" ||
    originalActionId.length === 0
  )
    return null;
  return {
    matchId,
    windowId,
    originalActionId,
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
      action.actionId === pending.originalActionId &&
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

function paymentSupportWindowId(action: LegalAction): string | null {
  const supportWindowId = action.payload?.costPenaltySupportWindowId;
  if (typeof supportWindowId === "string" && supportWindowId.length > 0)
    return supportWindowId;
  const continuationWindowId = action.payload?.runnerCostPenaltySupportWindowId;
  return typeof continuationWindowId === "string" &&
    continuationWindowId.length > 0
    ? continuationWindowId
    : null;
}
