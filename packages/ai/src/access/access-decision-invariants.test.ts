import { describe, expect, it } from "vitest";
import {
  accessDecisionInvariantViolations,
  assertAccessDecisionInvariants,
} from "./access-decision-invariants";

describe("access decision invariants", () => {
  it("accepts valid steal, trash and decline projections", () => {
    expect(
      accessDecisionInvariantViolations({
        target: "agenda",
        intendedAccessAction: "steal",
      }),
    ).toEqual([]);
    expect(
      accessDecisionInvariantViolations({
        target: "asset",
        intendedAccessAction: "trash",
        trashCost: 4,
        generalTrashCost: 0,
      }),
    ).toEqual([]);
    expect(
      accessDecisionInvariantViolations({
        target: "asset",
        intendedAccessAction: "decline",
      }),
    ).toEqual([]);
  });

  it("rejects incompatible target and intent combinations", () => {
    expect(() =>
      assertAccessDecisionInvariants({
        target: "asset",
        intendedAccessAction: "steal",
      }),
    ).toThrow(/steal_requires_agenda_target/);
    expect(() =>
      assertAccessDecisionInvariants({
        target: "agenda",
        intendedAccessAction: "trash",
      }),
    ).toThrow(/agenda_cannot_be_trashed/);
  });

  it("requires trash intent for free trash and trash cost waivers", () => {
    expect(
      accessDecisionInvariantViolations({
        target: "asset",
        intendedAccessAction: "decline",
        trashCost: 4,
        generalTrashCost: 0,
      }),
    ).toEqual([
      "free_trash_requires_trash_intent",
      "trash_cost_waiver_requires_trash_intent",
    ]);
  });

  it("keeps target-choice dry runs from materializing selections", () => {
    expect(
      accessDecisionInvariantViolations({
        target: "asset",
        intendedAccessAction: "decline",
        targetChoiceWouldSelect: {
          selectedChoicesCreated: true,
          selectedTargetsCreated: true,
        },
      }),
    ).toEqual([
      "dry_run_must_not_create_selected_choices",
      "dry_run_must_not_create_selected_targets",
    ]);
  });
});

