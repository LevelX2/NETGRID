import { describe, expect, it } from "vitest";

import { countUnsafeScoreChosen } from "./score-window-counts";

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
});
