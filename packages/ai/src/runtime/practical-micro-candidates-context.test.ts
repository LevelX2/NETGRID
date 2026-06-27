import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";

import { createPracticalMicroCandidatesContext } from "./practical-micro-candidates-context";

describe("createPracticalMicroCandidatesContext", () => {
  it("uses structured stale-punish signals and ignores label-only punish text", () => {
    const context = createContext();
    const labelOnlyPunish = corpAction({
      actionId: "label-only-punish",
      type: "play_operation",
      label: "Closed Accounts punish tagged runner",
    });
    const structuredPunish = corpAction({
      actionId: "structured-punish",
      type: "play_operation",
      label: "Use ability",
      payload: { tagPunishAction: true },
    });
    const advance = corpAction({
      actionId: "advance",
      type: "advance_card",
      label: "Advance",
    });

    expect(
      context.practicalMicroRuntimeCandidates(
        corpInput([labelOnlyPunish, advance]),
        decision("label-only-punish"),
      ),
    ).toEqual([]);

    expect(
      context.practicalMicroRuntimeCandidates(
        corpInput([structuredPunish, advance]),
        decision("structured-punish"),
      ),
    ).toEqual([
      expect.objectContaining({
        ruleId: "corp_stale_punish_deactivation",
        actionId: "advance",
      }),
    ]);
  });
});

function createContext() {
  return createPracticalMicroCandidatesContext({
    visibleSourceCard: () => undefined,
    isVisibleIcebreakerProgram: () => false,
    visibleBreakerCardCanAddressIce: () => false,
    serverId: () => undefined,
    knownPathAssessment: () => ({
      assessedKnownIceCount: 0,
      canReachAccess: false,
    }),
    rolesForAction: () => [],
    scoreTerminalWindow: () => ({
      terminalWindow: false,
      blockedByCheapContest: false,
      blockedByCredits: false,
      blockedByRunnerContest: false,
      blockedByHqThreat: false,
      scoreActionIds: [],
      advanceToScoreActionIds: [],
      agendaInstallActionIds: [],
      evidence: [],
    }),
    actionTypeIsReactive: () => false,
    runnerRunTargets: () => [],
    runnerRunTargetPlausibleForMultiRun: () => false,
    runnerRunTargetHighPayoff: () => false,
  });
}

function corpInput(legalActions: LegalAction[]): AiDecisionInput {
  const playerView = {
    side: "corp",
    opponent: { tags: 0 },
    own: { rig: [], gripOrHq: [], heapOrArchives: [], scoreArea: [] },
    servers: [],
  } as unknown as PlayerView;
  return {
    side: "corp",
    legalActions,
    playerView,
  } as unknown as AiDecisionInput;
}

function corpAction(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "corp",
    type: "play_operation",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}

function decision(actionId: string): AiDecision {
  return {
    actionId,
    reasonCode: "runtime",
    explanation: "Runtime decision",
    consideredActionIds: [actionId],
    fallbackUsed: false,
  };
}
