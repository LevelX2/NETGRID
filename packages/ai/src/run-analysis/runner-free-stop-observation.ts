import type { AiDecisionInput } from "@netgrid/shared";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../runtime/public-event-history";

/** Same-turn public outcome only. Each run owner decides whether this
 * observation excludes its current route; no hidden ICE is reconstructed. */
export function runnerObservedFreeStopEventId(
  input: AiDecisionInput,
  targetServerId: string,
): string | undefined {
  const view = input.playerView;
  if (
    input.side !== "runner" ||
    view.run ||
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
        active.serverId === targetServerId
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
    // opponent's defense. Owners separately check current guaranteed access;
    // any other board/effect change requires a new probe.
    if (
      p.actor === "runner" &&
      (type === "draw_card" ||
        type === "gain_credit" ||
        type === "remove_tag" ||
        ((type === "play_event" ||
          type === "activated_card_ability" ||
          type === "trigger_ability") &&
          (p.effectKind === "gain_credits" ||
            p.effectKind === "counter_change") &&
          p.resolvedEffects !== undefined &&
          p.resolvedEffects.length > 0 &&
          p.resolvedEffects.every(
            (effect) =>
              effect.side === "runner" &&
              (effect.kind === "gain_credits" ||
                ((effect.kind === "add_hosted_credits" ||
                  effect.kind === "take_hosted_credits") &&
                  effect.counterType === "bit")),
          )))
    )
      continue;
    stoppedEventId = undefined;
  }
  return stoppedEventId;
}
