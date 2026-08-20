import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { corpActiveRemoteScorelineState } from "./semantic-runtime-corp-score-state";

describe("corpActiveRemoteScorelineState", () => {
  it("does not invent a completed scoreline when the advancement requirement is unknown", () => {
    const input = {
      playerView: {
        servers: [
          {
            id: "remote_1",
            ice: [],
            root: [
              {
                instanceId: "unknown-agenda",
                definitionId: "unknown-agenda",
                known: true,
                type: "agenda",
                advancementCounters: 2,
              },
            ],
          },
        ],
      },
    } as unknown as AiDecisionInput;

    expect(corpActiveRemoteScorelineState(input)).toBeUndefined();
  });
});
