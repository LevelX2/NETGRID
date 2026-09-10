import type {
  CardInstanceId,
  GameState,
  LegalAction,
  VisibleCorpPassTaxRezQuote,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  availableRunnerRunCredits,
  runDurationPaymentHost,
} from "../run/run-duration-payment";
import { visibleRunnerRigCardForViewer } from "./card-view";

/** Pure current-window facts. No assumption that the Runner will continue/pay. */
export function visibleCorpPassTaxRezQuote(
  state: GameState,
  id: CardInstanceId,
  legalActions: readonly LegalAction[],
): VisibleCorpPassTaxRezQuote | undefined {
  const card = state.cardInstances[id];
  const run = state.run;
  const server = state.corp.servers.find((s) => s.root.includes(id));
  if (
    !card ||
    card.rezzed ||
    !server ||
    !run ||
    run.attackedServerId !== server.id ||
    run.position.kind !== "ice"
  )
    return undefined;
  // In the movement window the position is already the next unpassed ICE.
  if (!["approach_ice", "encounter_ice", "movement"].includes(run.phase))
    return undefined;
  const effects =
    cardImplementationForDefinitionId(
      card.definitionId,
    )?.fortRunWindows?.filter(
      (e) => e.kind === "runner_pay_or_end_run_after_passing_ice_on_this_fort",
    ) ?? [];
  if (effects.length !== 1) return undefined;
  const amount = effects[0]!.amount;
  if (!Number.isSafeInteger(amount) || amount <= 0) return undefined;
  const action = legalActions.find(
    (a) =>
      a.side === "corp" &&
      a.type === "rez_card" &&
      a.source === id &&
      a.expiresAtStateVersion === state.stateVersion,
  );
  if (
    !action ||
    action.targetRequirements.length ||
    action.choiceRequirements?.length
  )
    return undefined;
  if (
    action.costs.some(
      (c) =>
        (c.clicks ?? 0) !== 0 ||
        !Number.isSafeInteger(c.credits ?? 0) ||
        (c.credits ?? 0) < 0,
    )
  )
    return undefined;
  // Hidden support must not change a public affordability claim or leak its value.
  const installed = [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
  if (
    installed.some(
      (id) => !visibleRunnerRigCardForViewer(state, id, "corp").known,
    )
  )
    return undefined;
  const remainingPasses = run.position.iceIndex + 1;
  if (remainingPasses <= 0 || remainingPasses > server.ice.length)
    return undefined;
  return {
    actionId: action.actionId,
    sourceCardInstanceId: id,
    targetServerId: server.id,
    stateVersion: state.stateVersion,
    runId: run.runId,
    rezCredits: action.costs.reduce((n, c) => n + (c.credits ?? 0), 0),
    creditsPerPass: amount,
    remainingPasses,
    remainingPassCredits: remainingPasses * amount,
    runnerSpendableCredits: availableRunnerRunCredits(
      runDurationPaymentHost(state),
    ),
  };
}
