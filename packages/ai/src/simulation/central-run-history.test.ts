import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { expect, it } from "vitest";
import {
  centralRunStreakWithoutValueForMetrics,
  recentCentralRunSameTargetWithoutRefresh,
} from "./central-run-history";

it("counts an actual event run and distinguishes a Runner draw from a Corp draw", () => {
  const eventRun = event(1, "play_event", {
    actor: "runner",
    resolvedEffects: [
      {
        effectId: "1.start",
        kind: "start_run",
        visibility: "public",
        side: "runner",
        serverId: "rd",
        runId: 1,
      },
    ],
  });
  const ownDraw = event(2, "draw_card", { actor: "runner" });
  const corpDraw = event(3, "mandatory_draw", { actor: "corp" });

  expect(
    centralRunStreakWithoutValueForMetrics(input([eventRun, ownDraw]), "rd"),
  ).toBe(1);
  expect(
    recentCentralRunSameTargetWithoutRefresh(input([eventRun, ownDraw]), "rd"),
  ).toBe(true);
  expect(
    centralRunStreakWithoutValueForMetrics(
      input([eventRun, ownDraw, corpDraw]),
      "rd",
    ),
  ).toBe(0);
  expect(
    recentCentralRunSameTargetWithoutRefresh(
      input([eventRun, ownDraw, corpDraw]),
      "rd",
    ),
  ).toBe(false);
});

function event(
  version: number,
  type: string,
  publicPayload: PublicGameEvent["publicPayload"],
): PublicGameEvent {
  return {
    eventId: version + 1,
    type,
    stateVersionBefore: version - 1,
    stateVersionAfter: version,
    stateHashAfter: "fnv1a:test",
    publicPayload,
  };
}

function input(events: PublicGameEvent[]): AiDecisionInput {
  return {
    side: "runner",
    eventTail: events,
    playerView: { stateVersion: 3, publicEvents: [] },
  } as unknown as AiDecisionInput;
}
