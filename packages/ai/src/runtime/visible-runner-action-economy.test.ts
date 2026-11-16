import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { visibleRunnerExposureCreditValue } from "./visible-runner-action-economy";

describe("visible Runner exposure income", () => {
  const shortTerm = "onr_v1_178_short-term-contract";
  const broker = "onr_v1_154_broker";
  const filter = "onr_v1_045_newsgroup-filter";

  it.each([
    [1, 3, 3],
    [3, 3, 4],
    [12, 3, 6],
    [12, 0, 0],
  ])(
    "values Short-Term Contract with %i bits over %i actions",
    (bits, actions, total) => {
      expect(
        visibleRunnerExposureCreditValue(
          input([card(shortTerm, bits)]),
          actions,
        ),
      ).toBe(total);
    },
  );

  it("shares the action budget between finite and repeatable income", () => {
    const rig = [card(shortTerm, 3), card(broker, 6), card(filter)];
    expect(visibleRunnerExposureCreditValue(input(rig), 3)).toBe(10);
    expect(visibleRunnerExposureCreditValue(input(rig.slice(0, 2)), 3)).toBe(9);
  });

  it("requires visible stored credits and a known usable source", () => {
    const rig = [card(broker), { ...card(filter), known: false }];
    expect(visibleRunnerExposureCreditValue(input(rig), 3)).toBe(3);
  });
});

function card(definitionId: string, bits?: number): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    known: true,
    ...(bits === undefined ? {} : { counters: { bit: bits } }),
  };
}

function input(rig: VisibleCard[]): AiDecisionInput {
  return { side: "corp", playerView: { opponent: { rig } } } as AiDecisionInput;
}
