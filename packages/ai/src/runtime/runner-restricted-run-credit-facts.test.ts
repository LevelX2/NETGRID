import { expect, it } from "vitest";
import {
  runnerRestrictedRunCreditProfile,
  runnerRestrictedRunCreditProfileFromPlanningCard,
} from "./runner-canonical-card-facts";
it.each([
  ["onr_classic_048_omnitech-spinal-tap-cybermodem", 2],
  ["onr_proteus_134_cortical-cybermodem", 2],
  ["onr_v1_119_arasaka-portable-prototype", 3],
  ["onr_v1_122_artemis-2020", 2],
  ["onr_v1_137_parraline-5750", 1],
  ["onr_v1_140_raven-microcyb-eagle", 1],
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
    runnerRestrictedRunCreditProfile("onr_v1_071_vewy-vewy-quiet")?.uses,
  ).toEqual(["using_icebreaker_during_run_non_noisy"]);
  expect(
    runnerRestrictedRunCreditProfile("onr_v1_124_corolla-speed-chip")?.uses,
  ).toEqual(["using_killer_during_run"]);
  expect(
    runnerRestrictedRunCreditProfile("onr_proteus_139_eurocorpse-tm-spin-chip"),
  ).toBeUndefined();
  expect(
    runnerRestrictedRunCreditProfile("onr_classic_052_zetatech-portastation"),
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
