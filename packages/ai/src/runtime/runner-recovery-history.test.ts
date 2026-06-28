import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import {
  runnerActionLooksLikeRecovery,
  runnerRecentRecoveryActions,
} from "./runner-recovery-history";

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
    expect(
      runnerActionLooksLikeRecovery(
        input,
        roleBacked,
        dependencies({
          sourceCard: { definitionId: "junkyardish-bbsish" },
          roles: ["trashcan_recoveryish"],
        }),
      ),
    ).toBe(false);
  });

  it("counts recent recovery events by bounded payload tokens", () => {
    const input = {
      playerView: { stateVersion: 20 },
    } as AiDecisionInput;
    const count = runnerRecentRecoveryActions(input, undefined, {
      publicHistory: () => [
        event({ actor: "runner", note: "junkyard bbs" }, 18),
        event({ actor: "runner", note: "junkyardish trashcan" }, 19),
      ],
      eventVersion: (entry) => Number(entry.publicPayload.version),
      sourceDefinitionIdForAction: () => undefined,
    });

    expect(count).toBe(1);
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

function event(
  publicPayload: Record<string, string | number | boolean>,
  version: number,
): PublicGameEvent {
  return {
    type: "trigger_ability",
    publicPayload: {
      ...publicPayload,
      version,
    },
  } as unknown as PublicGameEvent;
}
