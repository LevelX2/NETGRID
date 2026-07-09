import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";

import { progressionEntriesWithRunTargets } from "./progression-action-sequence";

describe("progressionEntriesWithRunTargets", () => {
  it("carries run targets only for exact follow-up action types", () => {
    const sequence = progressionEntriesWithRunTargets([
      action("start_run", "rd"),
      action("access_card"),
      action("access_card_noise"),
    ]);

    expect(sequence[1]?.targetServerId).toBe("rd");
    expect(sequence[2]?.targetServerId).toBeUndefined();
  });
});

function action(
  actionType: string,
  targetServerId?: string,
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "runner",
    actionType,
    ...(targetServerId ? { targetServerId } : {}),
  } as unknown as AiSimulationSummary["actionSequence"][number];
}
