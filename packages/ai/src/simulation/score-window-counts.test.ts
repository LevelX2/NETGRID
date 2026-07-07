import { describe, expect, it } from "vitest";

import {
  countPassiveActionWithScoreLineAvailable,
  countUnsafeScoreChosen,
} from "./score-window-counts";

describe("score window counts", () => {
  it("does not count a final corp score closeout as unsafe", () => {
    const summaries = [
      {
        winner: "corp",
        actionSequence: [
          {
            side: "corp",
            actionType: "score_agenda",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowRunnerAccessThreatHigh: true,
          },
        ],
      },
    ];

    expect(countUnsafeScoreChosen(summaries)).toBe(0);
  });

  it("counts non-final unsafe score choices", () => {
    const summaries = [
      {
        winner: "runner",
        actionSequence: [
          {
            side: "corp",
            actionType: "score_agenda",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowRunnerAccessThreatHigh: true,
          },
          {
            side: "runner",
            actionType: "start_run",
          },
        ],
      },
    ];

    expect(countUnsafeScoreChosen(summaries)).toBe(1);
  });

  it("does not count passive setup windows without a concrete scoreline action", () => {
    const summaries = [
      {
        actionSequence: [
          {
            side: "corp",
            actionType: "gain_credit",
            corpScoreTerminalWindow: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForEconomy: true,
          },
        ],
      },
    ];

    expect(countPassiveActionWithScoreLineAvailable(summaries)).toBe(0);
  });

  it("does not count agenda-install-only windows blocked by runner contest", () => {
    const summaries = [
      {
        actionSequence: [
          {
            side: "corp",
            actionType: "gain_credit",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowAgendaInstallLegal: true,
            corpScoreTerminalWindowProtectedRemoteReady: true,
            corpScoreTerminalWindowCreditsSufficient: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForEconomy: true,
            corpScoreConversionFixGateBlockedByRunnerContest: true,
          },
        ],
      },
    ];

    expect(countPassiveActionWithScoreLineAvailable(summaries)).toBe(0);
  });

  it("counts passive skips when score or final advance is legal", () => {
    const summaries = [
      {
        actionSequence: [
          {
            side: "corp",
            actionType: "draw_card",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowScoreLegal: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForDraw: true,
          },
          {
            side: "corp",
            actionType: "gain_credit",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowAdvanceToScoreLegal: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForEconomy: true,
          },
        ],
      },
    ];

    expect(countPassiveActionWithScoreLineAvailable(summaries)).toBe(2);
  });

  it("counts safe ready-remote agenda installs as passive scoreline opportunities", () => {
    const summaries = [
      {
        actionSequence: [
          {
            side: "corp",
            actionType: "gain_credit",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowAgendaInstallLegal: true,
            corpScoreTerminalWindowProtectedRemoteReady: true,
            corpScoreTerminalWindowRemoteContestLow: true,
            corpScoreTerminalWindowCreditsSufficient: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForEconomy: true,
          },
        ],
      },
    ];

    expect(countPassiveActionWithScoreLineAvailable(summaries)).toBe(1);
  });
});
