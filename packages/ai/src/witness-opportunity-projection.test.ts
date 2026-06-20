import { describe, expect, it } from "vitest";
import { buildCandidatePathBinding } from "./candidate-path-binding";
import { buildSemanticActionSignature } from "./semantic-action-signature";
import { buildTargetRef } from "./target-ref";
import { buildWitnessOpportunityProjection } from "./witness-opportunity-projection";

describe("Witness opportunity projection", () => {
  it("blocks candidate-path projections that only have redacted action refs", () => {
    const projection = buildWitnessOpportunityProjection({
      binding: buildCandidatePathBinding({
        signature: buildSemanticActionSignature({
          actionType: "gain_credit",
          semanticActionType: "economy",
          sourceKind: "basic_action",
          targetIdentity: "none",
        }),
        redactedActionRef: "redacted:test",
        stateVersion: 9,
        side: "runner",
        intentContractId: "test.intent",
      }),
      targetRef: buildTargetRef({ kind: "none" }),
    });

    expect(projection.status).toBe("blocked");
    expect(projection.candidatePathBindingFromWitness).toBe(false);
    expect(projection.blockers).toContain("legalaction_witness_missing_real_action_id");
    expect(projection.blockers).toContain("legalaction_witness_missing");
  });

  it("keeps target blockers explicit", () => {
    const projection = buildWitnessOpportunityProjection({
      binding: buildCandidatePathBinding({
        signature: buildSemanticActionSignature({
          actionType: "start_run",
          semanticActionType: "run_pressure",
          sourceKind: "basic_action",
          targetIdentity: "server:unknown",
        }),
        redactedActionRef: "redacted:run",
        stateVersion: 10,
        side: "runner",
        intentContractId: "test.run",
      }),
      targetRef: buildTargetRef({
        kind: "unknown_unprojected",
        blocker: "server_target_missing",
      }),
    });

    expect(projection.blockers).toContain("server_target_missing");
  });
});
