import { describe, expect, it } from "vitest";
import {
  accessOutcomeMemoryEvidence,
  createAccessOutcomeMemory,
  readAccessOutcomeMemory,
  rememberAccessOutcome,
  resetAccessOutcomeMemoryForMatch,
} from "./access-outcome-memory";

describe("access outcome memory", () => {
  it("remembers and reads a side-safe access outcome by match, side, profile and server", () => {
    const key = {
      matchId: "match-1",
      side: "runner" as const,
      profileId: "runner-ai",
      serverId: "remote_1",
    };
    const memory = rememberAccessOutcome(createAccessOutcomeMemory(), key, {
      remoteFingerprint: "remote:fingerprint:1",
      observedDecision: "decline",
      reason: "reserve_would_break",
      creditsAtOutcome: 4,
      desiredReserveAtOutcome: 5,
      generalTrashCost: 4,
      stateVersion: 12,
    });

    expect(readAccessOutcomeMemory(memory, key)).toMatchObject({
      ...key,
      remoteFingerprint: "remote:fingerprint:1",
      observedDecision: "decline",
      reason: "reserve_would_break",
    });
    expect(accessOutcomeMemoryEvidence(memory.records[0]!)).toEqual(
      expect.arrayContaining([
        "access_outcome_memory_server:remote_1",
        "access_outcome_memory_decision:decline",
        "access_outcome_memory_reason:reserve_would_break",
      ]),
    );
  });

  it("replaces existing records for the same key", () => {
    const key = {
      matchId: "match-1",
      side: "runner" as const,
      profileId: "runner-ai",
      serverId: "remote_1",
    };
    const first = rememberAccessOutcome(createAccessOutcomeMemory(), key, {
      remoteFingerprint: "old",
      observedDecision: "decline",
      reason: "low_value_target",
      creditsAtOutcome: 3,
      desiredReserveAtOutcome: 5,
      stateVersion: 10,
    });
    const second = rememberAccessOutcome(first, key, {
      remoteFingerprint: "new",
      observedDecision: "trash",
      reason: "trash_affordable",
      creditsAtOutcome: 8,
      desiredReserveAtOutcome: 5,
      stateVersion: 14,
    });

    expect(second.records).toHaveLength(1);
    expect(readAccessOutcomeMemory(second, key)?.remoteFingerprint).toBe("new");
  });

  it("resets all records for a match", () => {
    const memory = rememberAccessOutcome(
      rememberAccessOutcome(
        createAccessOutcomeMemory(),
        {
          matchId: "match-1",
          side: "runner",
          profileId: "runner-ai",
          serverId: "remote_1",
        },
        {
          remoteFingerprint: "a",
          observedDecision: "decline",
          reason: "low_value_target",
          creditsAtOutcome: 2,
          desiredReserveAtOutcome: 4,
          stateVersion: 1,
        },
      ),
      {
        matchId: "match-2",
        side: "runner",
        profileId: "runner-ai",
        serverId: "remote_1",
      },
      {
        remoteFingerprint: "b",
        observedDecision: "trash",
        reason: "trash_affordable",
        creditsAtOutcome: 8,
        desiredReserveAtOutcome: 4,
        stateVersion: 1,
      },
    );

    expect(resetAccessOutcomeMemoryForMatch(memory, "match-1").records).toEqual([
      expect.objectContaining({ matchId: "match-2" }),
    ]);
  });
});

