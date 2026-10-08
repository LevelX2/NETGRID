import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { runnerRigAfterEncounter } from "./runner-rig-after-encounter";

const boon = (extra: Partial<VisibleCard> = {}): VisibleCard => ({
  instanceId: "boon", definitionId: "onr_v1_002_boon-1-0", known: true,
  strength: 4, strengthAfterEncounter: 3,
  randomRunStrengthState: { status: "resolved", actualStrength: 3, currentStrengthAdjustment: 1 },
  ...extra,
});
describe("public random breaker facts across an encounter", () => {
  it.each([[4, 3, 3, 1, 0], [3, 2, 2, 1, 0], [2, 1, 1, 1, 0], [3, 2, 4, -1, -2]])(
    "projects strength %i to %i while preserving observed die %i",
    (strength, boundary, die, adjustment, nextAdjustment) => {
      const card = boon({ strength, strengthAfterEncounter: boundary,
        randomRunStrengthState: { status: "resolved", actualStrength: die, currentStrengthAdjustment: adjustment } });
      const before = structuredClone(card);
      expect(runnerRigAfterEncounter([card])[0]).toMatchObject({ strength: boundary,
        randomRunStrengthState: { status: "resolved", actualStrength: die, currentStrengthAdjustment: nextAdjustment } });
      expect(card).toEqual(before);
    },
  );
  it("preserves an unresolved future die and untouched cards", () => {
    const random = { status: "unresolved" as const };
    const unresolved = boon({ randomRunStrengthState: random });
    const ordinary = { instanceId: "ordinary", known: true };
    const result = runnerRigAfterEncounter([unresolved, ordinary]);
    expect(result[0]?.randomRunStrengthState).toEqual(random);
    expect(result[1]).toBe(ordinary);
  });
  it.each([NaN, Infinity, 1.5])("fails closed on invalid Engine boundary %s", (value) => {
    expect(() => runnerRigAfterEncounter([boon({ strengthAfterEncounter: value })])).toThrow(
      "Invalid public breaker encounter-boundary strength.");
  });
  it.each([
    { actualStrength: 3, currentStrengthAdjustment: 0 },
    { actualStrength: 2.5, currentStrengthAdjustment: 1.5 },
  ])("does not repair an inconsistent incoming public die fact", (fact) => {
    expect(() => runnerRigAfterEncounter([boon({ randomRunStrengthState: { status: "resolved", ...fact } })])).toThrow(
      "Invalid public breaker encounter-boundary strength.");
  });
});
