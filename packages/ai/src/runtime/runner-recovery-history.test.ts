import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { runnerActionLooksLikeRecovery } from "./runner-recovery-history";

describe("runnerActionLooksLikeRecovery", () => {
  it("uses source metadata and roles but ignores label-only recovery text", () => {
    const input = {} as AiDecisionInput;
    const labelOnly = action({
      actionId: "label-only-recovery",
      label: "Junkyard BBS recovery",
    });
    const sourceBacked = action({
      actionId: "source-backed-recovery",
      label: "Use ability",
    });
    const roleBacked = action({
      actionId: "role-backed-recovery",
      label: "Use ability",
    });

    expect(
      runnerActionLooksLikeRecovery(input, labelOnly, dependencies()),
    ).toBe(false);
    expect(
      runnerActionLooksLikeRecovery(
        input,
        sourceBacked,
        dependencies({
          sourceCard: { definitionId: "onr_v1_165_junkyard-bbs" },
        }),
      ),
    ).toBe(true);
    expect(
      runnerActionLooksLikeRecovery(
        input,
        roleBacked,
        dependencies({ roles: ["trash_recovery"] }),
      ),
    ).toBe(true);
  });
});

function dependencies(options: {
  sourceCard?: Partial<VisibleCard>;
  roles?: readonly string[];
} = {}) {
  return {
    sourceCard: () => options.sourceCard as VisibleCard | undefined,
    rolesForAction: () => options.roles ?? [],
  };
}

function action(overrides: Partial<LegalAction> = {}): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
