import { describe, expect, it } from "vitest";

import {
  chronicleActionTypeBelongsToRunContext,
  chroniclePaymentSupportBelongsToRunPayload,
  chroniclePaymentSupportFollowingRunGroupLabel,
  chronicleResolveChoiceBelongsToRunPayload,
  groupChronicleEntriesForRender,
  orderChronicleEntriesForDisplay,
  type ChronicleGroupableEntry,
} from "./chronicleGrouping";

function entry(
  id: string,
  groupLabel: string,
  groupKind: ChronicleGroupableEntry["groupKind"],
  groupInstanceKey?: string,
): ChronicleGroupableEntry {
  return {
    groupLabel,
    groupKind,
    turnGroupLabel: "Zug 2 - Runner",
    ...(groupInstanceKey ? { groupInstanceKey } : {}),
    item: { id },
  };
}

function debtEntry(
  id: string,
  actionType: string,
  start?: number,
  actionDebtAdded?: number,
): ChronicleGroupableEntry {
  return {
    groupLabel: "Zug 7 - Korp",
    groupKind: "corp",
    turnGroupLabel: "Zug 7 - Korp",
    actionType,
    ...(actionDebtAdded ? { actionDebtAdded } : {}),
    item: {
      id,
      actor: "corp",
      ...(start ? { actionUse: { start, end: start } } : {}),
    },
  };
}

describe("groupChronicleEntriesForRender", () => {
  it("keeps root-card rez actions inside the active run group", () => {
    expect(chronicleActionTypeBelongsToRunContext("rez_card")).toBe(true);
    expect(chronicleActionTypeBelongsToRunContext("install_card")).toBe(false);
  });

  it("keeps MU-checkpoint cleanup inside the completed access run", () => {
    expect(
      chronicleResolveChoiceBelongsToRunPayload({
        runnerMemoryCheckpointResolved: true,
        trashedProgramCount: 1,
        trashedCardDefinitionIds: "simple_decoder",
      }),
    ).toBe(true);
  });

  it("keeps Fall Guy tag avoidance eligible for the active run group", () => {
    expect(
      chronicleResolveChoiceBelongsToRunPayload({
        eventModificationKind: "avoid",
        eventModificationDecision: "apply",
        eventModificationOutcome: "avoided",
        imminentEventType: "add_tag",
        sourceDefinitionId: "onr_v1_161_fall-guy",
      }),
    ).toBe(true);
  });

  it("keeps Hidden-Bank payment support in the active run group", () => {
    expect(
      chroniclePaymentSupportBelongsToRunPayload({
        cardImplementationAbility: "activated",
        cardImplementationAbilityTiming: "runner_cost_penalty_support",
      }),
    ).toBe(true);
    expect(
      chroniclePaymentSupportBelongsToRunPayload({
        cardImplementationAbility: "activated",
        cardImplementationAbilityTiming: "runner_main",
      }),
    ).toBe(false);
    expect(
      chroniclePaymentSupportFollowingRunGroupLabel(
        {
          cardImplementationAbility: "activated",
          cardImplementationAbilityTiming: "runner_cost_penalty_support",
        },
        "Run auf HQ",
      ),
    ).toBe("Run auf HQ");
    expect(
      chroniclePaymentSupportFollowingRunGroupLabel(
        {
          cardImplementationAbility: "activated",
          cardImplementationAbilityTiming: "runner_cost_penalty_support",
        },
        null,
      ),
    ).toBeNull();
  });

  it("keeps consecutive runs on the same target as separate render groups", () => {
    const groups = groupChronicleEntriesForRender([
      entry("evt_run_2_end", "Run auf HQ", "run", "run:evt_run_2_start"),
      entry("evt_run_2_start", "Run auf HQ", "run", "run:evt_run_2_start"),
      entry("evt_run_1_end", "Run auf HQ", "run", "run:evt_run_1_start"),
      entry("evt_run_1_start", "Run auf HQ", "run", "run:evt_run_1_start"),
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      "Run auf HQ",
      "Run auf HQ",
    ]);
    expect(
      groups.map((group) =>
        group.entries.map((groupEntry) => groupEntry.item?.id),
      ),
    ).toEqual([
      ["evt_run_2_end", "evt_run_2_start"],
      ["evt_run_1_end", "evt_run_1_start"],
    ]);
  });

  it("still merges adjacent non-run groups by their visible label", () => {
    const groups = groupChronicleEntriesForRender([
      entry("evt_gain_1", "Zug 1 - Korp", "corp"),
      entry("evt_gain_2", "Zug 1 - Korp", "corp"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entries.map((groupEntry) => groupEntry.item?.id)).toEqual(
      ["evt_gain_1", "evt_gain_2"],
    );
  });

  it("keeps Runner-virus purge first when reading the newest-first display bottom-up", () => {
    const ordered = orderChronicleEntriesForDisplay([
      debtEntry("evt_end_turn", "end_turn"),
      debtEntry("evt_forgo_3", "forgo_action", 3),
      debtEntry("evt_forgo_2", "forgo_action", 2),
      debtEntry("evt_purge", "purge_runner_virus_counters", undefined, 3),
      debtEntry("evt_forgo_1", "forgo_action", 1),
      debtEntry("evt_gain", "gain_credit", 4),
    ]);

    expect(ordered.map((item) => item.item?.id)).toEqual([
      "evt_end_turn",
      "evt_forgo_3",
      "evt_forgo_2",
      "evt_forgo_1",
      "evt_purge",
      "evt_gain",
    ]);
  });
});
