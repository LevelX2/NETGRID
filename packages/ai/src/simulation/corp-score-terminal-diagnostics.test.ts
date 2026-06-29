import { describe, expect, it, vi } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  createCorpScoreTerminalChosenFamily,
  createCorpScoreTerminalDiagnosticsForSimulationAction,
} from "./corp-score-terminal-diagnostics";

const { assessCorpScoreTerminalWindowMock } = vi.hoisted(() => ({
  assessCorpScoreTerminalWindowMock: vi.fn(),
}));

vi.mock("../legacy/legacy-entrypoints", () => ({
  assessCorpScoreTerminalWindow: assessCorpScoreTerminalWindowMock,
}));

describe("createCorpScoreTerminalChosenFamily", () => {
  it("matches economy roles by bounded role terms", () => {
    const familyForRoles = (roles: string[]) =>
      createCorpScoreTerminalChosenFamily(() => roles)(
        {} as AiDecisionInput,
        action("play_operation"),
      );

    expect(familyForRoles(["economy_operation"])).toBe("economy");
    expect(familyForRoles(["microeconomy_noise"])).toBe("unknown");
  });

  it("matches terminal action ids exactly in simulation diagnostics", () => {
    assessCorpScoreTerminalWindowMock.mockReturnValue({
      terminalWindow: true,
      scoreActionIds: ["score-action"],
      advanceToScoreActionIds: ["advance-action"],
      agendaInstallActionIds: ["install-action"],
      protectedRemoteIds: [],
      remoteContestLow: false,
      creditsSufficient: true,
      runnerAccessThreatHigh: false,
      blockedByCheapContest: false,
      blockedByCredits: false,
      blockedByRunnerContest: false,
      blockedByHqThreat: false,
      evidence: ["terminal:true"],
    });
    const diagnostics = createCorpScoreTerminalDiagnosticsForSimulationAction(
      () => "unknown",
    );

    expect(
      diagnostics(input(), action("advance_card", "score-action")),
    ).toMatchObject({
      corpScoreTerminalScoreTaken: true,
    });
    expect(diagnostics(input(), action("advance_card", "score"))).toMatchObject(
      {
        corpScoreTerminalSkipped: true,
      },
    );
    expect(
      diagnostics(input(), action("advance_card", "score")),
    ).not.toHaveProperty("corpScoreTerminalScoreTaken");
  });
});

function action(
  type: LegalAction["type"],
  actionId = "action",
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: "Use action",
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function input(): AiDecisionInput {
  return {
    side: "corp",
  } as AiDecisionInput;
}
