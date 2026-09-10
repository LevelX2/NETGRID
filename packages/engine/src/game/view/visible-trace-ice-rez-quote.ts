import type {
  GameState,
  LegalAction,
  VisibleCard,
  VisibleCorpTraceIceRezQuote,
} from "@netgrid/shared";
import { projectInstalledCorpIceRezCost } from "../payment";
import { visibleCorpCard, visibleRunnerRigCardForViewer } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";
import { visibleCurrentIceBreakExchange } from "./visible-rez-resource-exchange-quote";
import {
  visibleRunnerTraceBidCapacity,
  visibleRunnerTraceSupportQuote,
} from "./visible-runner-trace-support-quote";
import {
  traceComparisonIsSuccessful,
  traceCorpBaseStrength,
} from "../trace/trace-rules-profile";

/** Exact current X-rez response, never a claim about a hard ETR subroutine.
 * A zero-Corp-bid guarantee avoids inventing a future trace spending policy.
 * Unsupported/hidden response families receive no guarantee.
 */
export function visibleCorpTraceIceRezQuotes(
  state: GameState,
  ice: VisibleCard,
  actions: readonly LegalAction[],
): VisibleCorpTraceIceRezQuote[] {
  const id = ice.instanceId;
  const run = state.run;
  const server = state.corp.servers.find((s) => s.ice.includes(id));
  if (
    !ice.known ||
    ice.rezzed ||
    !server ||
    !run ||
    run.phase !== "approach_ice" ||
    run.approachedIceId !== id ||
    run.attackedServerId !== server.id ||
    state.traceRulesProfile !== "modern_open"
  )
    return [];
  const maximumRunnerStrength = visibleRunnerMaximumTraceStrength(state);
  if (maximumRunnerStrength === undefined) return [];
  const cost = projectInstalledCorpIceRezCost(state, id);
  if (
    !cost?.complete ||
    cost.costKind !== "variable" ||
    cost.variableParameter.kind !== "x_strength" ||
    !cost.variableParameter.traceLimitFromValue
  )
    return [];
  const parameter = cost.variableParameter;
  return actions.flatMap((action) => {
    const value = action.payload?.variableRezValue;
    if (
      action.type !== "rez_ice" ||
      action.source !== id ||
      action.side !== "corp" ||
      action.expiresAtStateVersion !== state.stateVersion ||
      action.payload?.variableRezKind !== "x_strength" ||
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < parameter.minValue ||
      value > parameter.maxValue
    )
      return [];
    const rezCredits = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
    const additional = value * parameter.additionalCreditsPerValue;
    if (
      action.choiceRequirements?.length ||
      action.targetRequirements.length ||
      action.costs.some((c) => (c.clicks ?? 0) !== 0) ||
      rezCredits !== cost.finalCredits + additional ||
      action.payload.rezCostPaid !== rezCredits ||
      action.payload.effectiveTraceLimitAfterRez !== value
    )
      return [];
    const source = state.cardInstances[id]!;
    const projected: GameState = {
      ...state,
      cardInstances: {
        ...state.cardInstances,
        [id]: {
          ...source,
          rezzed: true,
          variableIceState: {
            family: "x_strength",
            value,
            strength: value,
            traceLimit: value,
            additionalCostPaid: additional,
            cap: parameter.maxValue,
          },
        },
      },
    };
    const visible = visibleCorpCard(projected, id, "corp", "ice");
    const effective = visibleEffectiveIceRunQuote(projected, id, visible);
    if (
      !effective ||
      effective.conditionalEncounterEffects?.length ||
      effective.encounterTemporaryTraceCredits ||
      effective.subroutines.length !== 1
    )
      return [];
    const subroutine = effective.subroutines[0]!;
    if (
      subroutine.type !== "initiate_trace" ||
      subroutine.traceSuccessEffect?.type !== "end_run_and_run_lock" ||
      subroutine.traceLimit === undefined
    )
      return [];
    const strength = traceCorpBaseStrength({
      traceRulesProfile: "modern_open",
      traceLimit: subroutine.traceLimit,
    });
    const breakExchange = visibleCurrentIceBreakExchange(
      projected,
      id,
      visible,
      effective,
      1,
    );
    if (!breakExchange.complete) return [];
    const breakerCanPass =
      breakExchange.runnerBreak?.canPayFromCurrentCredits === true;
    return [
      {
        actionId: action.actionId,
        sourceCardInstanceId: id,
        targetServerId: server.id,
        stateVersion: state.stateVersion,
        runId: run.runId,
        rezCredits,
        variableValue: value,
        corpBid: 0,
        corpTraceStrength: strength,
        maximumRunnerTraceStrength: maximumRunnerStrength,
        runnerCanBreak: breakerCanPass,
        guaranteedRunEnd:
          !breakerCanPass &&
          traceComparisonIsSuccessful(
            state.traceRulesProfile,
            strength,
            maximumRunnerStrength,
          ),
      },
    ];
  });
}

/** Upper bound from public installed support only; unknown stays unknown. */
export function visibleRunnerMaximumTraceStrength(
  state: GameState,
): number | undefined {
  if (state.traceRulesProfile !== "modern_open") return undefined;
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
  const support = visibleRunnerTraceSupportQuote(state);
  if (
    support.postBidLinkOptions.length ||
    support.traceSuccessCancelOptions.length
  )
    return undefined;
  const capacity = visibleRunnerTraceBidCapacity(state, "runner");
  return Math.max(
    ...support.baseLinkOptions
      .filter((o) => o.activationCost <= capacity)
      .map((o) => o.baseLink + capacity - o.activationCost),
  );
}
