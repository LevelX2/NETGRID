import { describe, expect, it } from "vitest";
import { planIntentConvertedWithin } from "./plan-conversion-predicates";

describe("planIntentConvertedWithin", () => {
  it("matches plan kinds by bounded terms", () => {
    const sequence = [
      { side: "runner", actionType: "draw_card" },
      { side: "runner", actionType: "start_run", targetServerId: "rd" },
      { side: "runner", actionType: "steal_agenda", targetServerId: "rd" },
    ];
    expect(converted(sequence, "setup_plan")).toBe(true);
    expect(converted(sequence, "setupish_noise")).toBe(false);
  });
});

function converted(
  sequence: Array<{
    side: string;
    actionType: string;
    targetServerId?: string;
  }>,
  planKind: string,
): boolean {
  return planIntentConvertedWithin(
    sequence,
    0,
    planKind,
    () => false,
    () => false,
  );
}
