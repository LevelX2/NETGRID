import { expect, it } from "vitest";
import { runnerVirusCounterEffectThreshold } from "../../index";

it.each([
  ["doom", 1],
  ["crumble", 2],
  ["garbage", 2],
  ["highlighter", 2],
  ["scaldan", 1],
  ["tax", 2],
  ["vienna", 1],
  ["pipe", 1],
  ["boardwalk", 2],
  ["successful_hq_run_pair_credit", 2],
  ["cascade", 2],
  ["cockroach", 2],
  ["thought", 3],
  ["fait", 2],
  ["gremlin", 2],
  ["incubate", 1],
  ["pattel", 1],
  ["pox", 2],
  ["skivviss", 1],
] as const)(
  "quotes the native positive-effect threshold of %s",
  (kind, threshold) => {
    expect(runnerVirusCounterEffectThreshold(kind)).toBe(threshold);
  },
);

it("does not invent an active threshold for missing counter mechanics", () => {
  for (const kind of [undefined, "unregistered-counter"]) {
    let failure: unknown;
    try {
      runnerVirusCounterEffectThreshold(kind);
    } catch (error) {
      failure = error;
    }
    expect(failure).toMatchObject({
      code: "runner_virus_counter_effect_threshold_unavailable",
    });
  }
});
