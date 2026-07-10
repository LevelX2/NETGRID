import { describe, expect, it } from "vitest";
import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { runnerRecentStartRunsOnServer } from "./runner-run-history";

describe("runnerRecentStartRunsOnServer", () => {
  it("keeps Runner run history across unrelated Corp installs", () => {
    const count = runnerRecentStartRunsOnServer(input(), "hq", {
      publicHistory: () => [
        event("runner", "start_run", 18, "hq"),
        event("corp", "install_card", 19),
      ],
      eventVersion: (entry) => entry.stateVersionAfter ?? 0,
      serverIdFromEvent: (entry) =>
        typeof entry.publicPayload.serverId === "string"
          ? entry.publicPayload.serverId
          : undefined,
    });

    expect(count).toBe(1);
  });

  it("resets run history when the Runner changes its installed capability", () => {
    const count = runnerRecentStartRunsOnServer(input(), "hq", {
      publicHistory: () => [
        event("runner", "start_run", 18, "hq"),
        event("runner", "install_card", 19),
      ],
      eventVersion: (entry) => entry.stateVersionAfter ?? 0,
      serverIdFromEvent: (entry) =>
        typeof entry.publicPayload.serverId === "string"
          ? entry.publicPayload.serverId
          : undefined,
    });

    expect(count).toBe(0);
  });
});

function input(): AiDecisionInput {
  return { playerView: { stateVersion: 20 } } as AiDecisionInput;
}

function event(
  actor: "corp" | "runner",
  actionType: string,
  version: number,
  serverId?: string,
): PublicGameEvent {
  return {
    eventId: `${actor}-${actionType}-${version}`,
    type: actionType,
    stateVersionBefore: version - 1,
    stateVersionAfter: version,
    stateHashAfter: `hash-${version}`,
    publicPayload: { actor, actionType, ...(serverId ? { serverId } : {}) },
  } as PublicGameEvent;
}
