import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../../runtime/public-event-history";

/** Admission evidence for the pressure owner's information route, never an
 * ICE identity/quote or a replacement for current Engine reachability. */
export function runnerRepeatedFreeStopProbeEvidence(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): string | undefined {
  const view = input.playerView;
  const action = input.legalActions.find(
    (a) => a.actionId === evaluation.actionId,
  );
  if (
    input.side !== "runner" ||
    view.run ||
    (evaluation.targetServerId !== "hq" &&
      evaluation.targetServerId !== "rd") ||
    evaluation.runCommitment !== "probe_only" ||
    evaluation.routeQuote?.reachability === "guaranteed_access" ||
    evaluation.accessPayoff !== "unknown" ||
    action?.type !== "start_run" ||
    action.source !== "basic_action" ||
    !Number.isSafeInteger(view.turnSerial)
  )
    return undefined;

  let active: { serverId: string; zeroRezObserved: boolean } | undefined;
  let stoppedEventId: string | undefined;
  for (const event of mergedPublicHistory(input)) {
    if (event.turnSerial !== view.turnSerial) continue;
    const p = event.publicPayload;
    const type = typeof p.actionType === "string" ? p.actionType : event.type;
    if (type === "start_run" && p.actor === "runner") {
      const serverId = serverIdFromEvent(event);
      active = serverId ? { serverId, zeroRezObserved: false } : undefined;
      continue;
    }
    if (active) {
      // Declining an optional rez neither changes the defense nor converts
      // the run. Keep the already observed free rez through this window.
      if (
        type === "decline_rez" &&
        p.actor === "corp" &&
        !p.resolvedEffects?.length
      )
        continue;
      if (
        type === "rez_ice" &&
        p.actor === "corp" &&
        serverIdFromEvent(event) === active.serverId &&
        p.rezCostPaid === 0
      ) {
        active.zeroRezObserved = true;
        continue;
      }
      if (
        type === "continue_run" &&
        p.actor === "runner" &&
        p.result === "ended" &&
        p.encounterContinue === true &&
        p.encounterWillEndRun === true &&
        active.zeroRezObserved &&
        active.serverId === evaluation.targetServerId
      ) {
        stoppedEventId = event.eventId;
        active = undefined;
        continue;
      }
      // A paid defense, break, access, choice or other conversion is a
      // different experiment. Its benefit is not classified as a free stop.
      active = undefined;
      stoppedEventId = undefined;
      continue;
    }
    // Draw and financing do not change installed route tools or the
    // opponent's defense. Current guaranteed access above always overrides
    // this observation; any other board/effect change requires a new probe.
    if (
      p.actor === "runner" &&
      (type === "draw_card" ||
        type === "gain_credit" ||
        type === "remove_tag" ||
        (type === "play_event" &&
          p.effectKind === "gain_credits" &&
          p.resolvedEffects !== undefined &&
          p.resolvedEffects.length > 0 &&
          p.resolvedEffects.every(
            (effect) =>
              effect.kind === "gain_credits" && effect.side === "runner",
          )))
    )
      continue;
    stoppedEventId = undefined;
  }
  return stoppedEventId
    ? `runner_central_information_probe_free_stop_already_observed:${evaluation.targetServerId}:${stoppedEventId}`
    : undefined;
}
