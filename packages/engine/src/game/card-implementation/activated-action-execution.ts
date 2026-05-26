import type { GameState, LegalAction } from "@netgrid/shared";

export type ActivatedCardImplementationExecutionHost = {
  state: GameState;
  action: {
    legalAction: LegalAction;
  };
  callbacks: {
    handleCorpTraceDamageActivatedAbility: (legalAction: LegalAction) => boolean;
    handleScoredAgendaActivatedAbilityAction: (
      legalAction: LegalAction,
    ) => boolean;
    resolveActivatedCardImplementationAbility: (
      legalAction: LegalAction,
    ) => boolean;
  };
};

export type ActivatedCardImplementationExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
  pendingChoiceStarted?: boolean;
  resolvedPayload?: LegalAction["payload"];
};

function handledResult(
  host: ActivatedCardImplementationExecutionHost,
  pendingChoiceBefore: GameState["pendingChoice"],
): ActivatedCardImplementationExecutionResult {
  return {
    handled: true,
    actionType: host.action.legalAction.type,
    pendingChoiceStarted:
      host.state.pendingChoice !== pendingChoiceBefore &&
      Boolean(host.state.pendingChoice),
    resolvedPayload: host.action.legalAction.payload,
  };
}

export function handleActivatedCardImplementationAction(
  host: ActivatedCardImplementationExecutionHost,
): ActivatedCardImplementationExecutionResult {
  const legalAction = host.action.legalAction;
  if (legalAction.type !== "activated_card_ability") return { handled: false };
  const pendingChoiceBefore = host.state.pendingChoice;
  if (host.callbacks.handleCorpTraceDamageActivatedAbility(legalAction))
    return handledResult(host, pendingChoiceBefore);
  if (host.callbacks.handleScoredAgendaActivatedAbilityAction(legalAction))
    return handledResult(host, pendingChoiceBefore);
  if (!host.callbacks.resolveActivatedCardImplementationAbility(legalAction))
    throw new Error("Die aktivierte Kartenfaehigkeit ist nicht gueltig.");
  return handledResult(host, pendingChoiceBefore);
}
