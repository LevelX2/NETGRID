import { describe, expect, it } from "vitest";

import {
  createRemoteAccessOutcomeMemoryEntry,
  declinedTrashOutcomePlanEvidence,
  evaluateRemoteAccessOutcomeMemory,
  remoteAccessOutcomePlanEvidence,
  remoteAccessOutcomeEvidence,
} from "./remote-access-outcome";

describe("remote access outcome memory", () => {
  it("suppresses plan bonus after declined trash on an unchanged known remote", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    const status = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
    });

    expect(status).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
    });
    expect(status.evidence).toEqual(
      expect.arrayContaining([
        "remote_access_outcome_decision:declined_trash",
        "remote_access_outcome_suppresses_plan_bonus:true",
      ]),
    );
  });

  it("invalidates declined trash memory when the remote root changes", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    expect(
      evaluateRemoteAccessOutcomeMemory(entry, {
        currentKnownRootDefinitionIds: ["simple_agenda"],
      }),
    ).toMatchObject({
      applies: false,
      invalidationReason: "remote_changed",
      suppressesPlanBonus: false,
    });
  });

  it("invalidates declined trash memory when credits or reserve improve", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    expect(
      evaluateRemoteAccessOutcomeMemory(entry, {
        currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
        creditsOrReserveImproved: true,
      }),
    ).toMatchObject({
      applies: false,
      invalidationReason: "credits_or_reserve_improved",
      suppressesPlanBonus: false,
    });
  });

  it("does not suppress plan bonus for successful agenda or trash outcomes", () => {
    const stolen = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "simple_agenda",
      accessDecision: "stolen",
      reason: "agenda_payoff",
      stateVersion: 15,
    });
    const trashed = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_2",
      knownRootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      accessDecision: "trashed",
      reason: "trash_affordable",
      stateVersion: 18,
    });

    expect(
      evaluateRemoteAccessOutcomeMemory(stolen, {
        currentKnownRootDefinitionIds: ["simple_agenda"],
      }).suppressesPlanBonus,
    ).toBe(false);
    expect(
      evaluateRemoteAccessOutcomeMemory(trashed, {
        currentKnownRootDefinitionIds: [
          "onr_v1_309_bbs-whispering-campaign",
        ],
      }).suppressesPlanBonus,
    ).toBe(false);
  });

  it("formats declined-trash plan evidence from structured memory status", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });
    const status = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
    });

    expect(remoteAccessOutcomePlanEvidence(status)).toEqual([
      "remote_access_outcome_no_plan_bonus:true",
      "remote_access_outcome_memory_applied:declined_trash",
    ]);
  });

  it("keeps the deprecated declined-trash evidence bridge status-gated", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });
    const status = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
    });

    expect(declinedTrashOutcomePlanEvidence(status.evidence)).toEqual([
      "remote_access_outcome_no_plan_bonus:true",
      "remote_access_outcome_memory_applied:declined_trash",
    ]);
    expect(declinedTrashOutcomePlanEvidence(remoteAccessOutcomeEvidence(entry))).toEqual(
      [],
    );
    const invalidated = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["different-card"],
    });
    expect(declinedTrashOutcomePlanEvidence(invalidated.evidence)).toEqual([]);
  });
});
