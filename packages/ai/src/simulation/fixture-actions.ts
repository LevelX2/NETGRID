import { applyAction, getLegalActions } from "@netgrid/engine";
import { type GameState, type LegalAction, type Side } from "@netgrid/shared";
import { selectableChoiceOptions } from "../runtime/choice-option";

type FixtureActionResult =
  | { ok: true; state: GameState }
  | { ok: false; message: string };

export function applyFixtureAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
  label: string,
): FixtureActionResult {
  const legalAction = getLegalActions(state, side).find(predicate);
  if (!legalAction) {
    return { ok: false, message: `missing_legal_action:${label}` };
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${label}:${state.stateVersion}:${legalAction.actionId}`,
  });
  if (!result.ok) {
    return {
      ok: false,
      message: `${label}:${result.error.code}:${result.error.message}`,
    };
  }
  return { ok: true, state: result.state };
}

export function applyFixtureChoiceFirstOption(
  state: GameState,
  side: Side,
  label: string,
): FixtureActionResult {
  const pendingChoice = state.pendingChoice;
  if (!pendingChoice || pendingChoice.side !== side)
    return { ok: false, message: `missing_pending_choice:${label}` };
  const optionId = selectableChoiceOptions(pendingChoice.options)[0]?.id;
  if (optionId === undefined || optionId === null)
    return { ok: false, message: `missing_choice_option:${label}` };
  const choiceAction = getLegalActions(state, side).find(
    (action) => action.type === "resolve_choice",
  );
  if (!choiceAction)
    return { ok: false, message: `missing_resolve_choice_action:${label}` };
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: choiceAction.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: pendingChoice.choiceId,
      selectedOptionIds: [String(optionId)],
    },
    idempotencyKey: `${label}:${state.stateVersion}:${choiceAction.actionId}`,
  });
  if (!result.ok) {
    return {
      ok: false,
      message: `${label}:${result.error.code}:${result.error.message}`,
    };
  }
  return { ok: true, state: result.state };
}
