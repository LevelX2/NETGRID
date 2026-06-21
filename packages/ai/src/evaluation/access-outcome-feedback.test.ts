import { describe, expect, it } from "vitest";
import {
  createObservedAccessOutcome,
  createProjectedAccessOutcome,
} from "../access/access-outcome-projection";
import { compareProjectedAndObservedAccessOutcome } from "./access-outcome-feedback";

describe("access outcome feedback", () => {
  it("keeps feedback report-only and outside runtime consumption", () => {
    const report = compareProjectedAndObservedAccessOutcome({
      projected: createProjectedAccessOutcome({
        serverId: "remote_1",
        knownRootDefinitionId: "holovid_campaign",
        projectedIntent: "trash",
        reason: "trash_affordable",
        stateVersion: 12,
      }),
      observed: createObservedAccessOutcome({
        serverId: "remote_1",
        knownRootDefinitionId: "holovid_campaign",
        observedIntent: "decline",
        reason: "reserve_would_break",
        stateVersion: 12,
      }),
    });

    expect(report).toMatchObject({
      kind: "access_outcome_feedback",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      mismatchClasses: ["predicted_trash_actual_decline"],
    });
    expect(report.evidence).toEqual(
      expect.arrayContaining([
        "access_outcome_feedback_productive_use_allowed:false",
        "access_outcome_feedback_runtime_consumer_status:none",
        "access_outcome_feedback_mismatch:predicted_trash_actual_decline",
      ]),
    );
  });

  it("classifies decline/trash and payoff expectation reversals", () => {
    expect(
      compareProjectedAndObservedAccessOutcome({
        projected: createProjectedAccessOutcome({
          serverId: "remote_1",
          knownRootDefinitionId: "upgrade",
          projectedIntent: "decline",
          reason: "low_value_target",
          stateVersion: 20,
        }),
        observed: createObservedAccessOutcome({
          serverId: "remote_1",
          knownRootDefinitionId: "upgrade",
          observedIntent: "trash",
          reason: "trash_affordable",
          stateVersion: 20,
        }),
      }).mismatchClasses,
    ).toEqual(["predicted_decline_actual_trash"]);

    expect(
      compareProjectedAndObservedAccessOutcome({
        projected: createProjectedAccessOutcome({
          serverId: "remote_1",
          knownRootDefinitionId: "agenda",
          projectedIntent: "steal",
          reason: "agenda_payoff",
          stateVersion: 21,
        }),
        observed: createObservedAccessOutcome({
          serverId: "remote_1",
          knownRootDefinitionId: "agenda",
          observedIntent: "access_only",
          reason: "unknown",
          stateVersion: 21,
        }),
      }).mismatchClasses,
    ).toEqual(["predicted_payoff_no_payoff"]);

    expect(
      compareProjectedAndObservedAccessOutcome({
        projected: createProjectedAccessOutcome({
          serverId: "remote_1",
          knownRootDefinitionId: "unknown",
          projectedIntent: "access_only",
          reason: "unknown",
          stateVersion: 22,
        }),
        observed: createObservedAccessOutcome({
          serverId: "remote_1",
          knownRootDefinitionId: "agenda",
          observedIntent: "steal",
          reason: "agenda_payoff",
          stateVersion: 22,
        }),
      }).mismatchClasses,
    ).toEqual(["target_changed_before_access", "predicted_no_payoff_agenda"]);
  });
});
