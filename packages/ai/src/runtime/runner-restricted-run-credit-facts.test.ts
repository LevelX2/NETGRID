import { expect, it } from "vitest";
import {
  runnerRestrictedRunCreditProfile,
  runnerRestrictedRunCreditProfileFromPlanningCard,
} from "./runner-canonical-card-facts";
it.each([
  [52, 2],
  [192, 2],
  [331, 3],
  [334, 2],
  [349, 1],
  [352, 1],
])(
  "projects the canonical generic breaker pool of %s without treating it as liquid bank",
  (id, capacity) => {
    expect(runnerRestrictedRunCreditProfile(id as string)).toEqual({
      capacity,
      uses: ["using_icebreaker_during_run"],
      refreshTiming: "start_of_runner_turn",
    });
  },
);
it("preserves non-noisy and killer restrictions and the distinct host/event owners", () => {
  expect(
    runnerRestrictedRunCreditProfile(283)?.uses,
  ).toEqual(["using_icebreaker_during_run_non_noisy"]);
  expect(
    runnerRestrictedRunCreditProfile(336)?.uses,
  ).toEqual(["using_killer_during_run"]);
  expect(
    runnerRestrictedRunCreditProfile(197),
  ).toBeUndefined();
  expect(
    runnerRestrictedRunCreditProfile(56),
  ).toBeUndefined();
});
it("derives the use qualifier for a differently named canonical fixture", () => {
  const card = {
    planning: {
      side: "runner",
      engine: {
        restrictedHostedCreditSource: {
          capacity: 4,
          usableFor: ["using_icebreaker_during_run", "increase_link"],
          refresh: {
            timing: "start_of_runner_turn",
            mode: "refill_to_capacity_if_used",
          },
        },
      },
    },
  };
  expect(
    runnerRestrictedRunCreditProfileFromPlanningCard(card as never),
  ).toEqual({
    capacity: 4,
    uses: ["using_icebreaker_during_run"],
    refreshTiming: "start_of_runner_turn",
  });
  delete (
    card.planning.engine.restrictedHostedCreditSource as { refresh?: unknown }
  ).refresh;
  expect(
    runnerRestrictedRunCreditProfileFromPlanningCard(card as never),
  ).toBeUndefined();
});
