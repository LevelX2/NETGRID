import {
  buildLegalActionWitness,
  type LegalActionWitness,
} from "./legalaction-witness";
import { describe, expect, it } from "vitest";
import { buildCandidatePathBinding } from "./candidate-path-binding";
import { buildSemanticActionSignature } from "./semantic-action-signature";
import { buildTargetRef } from "./target-ref";
import { buildWitnessOpportunityProjection } from "./witness-opportunity-projection";

describe("Witness opportunity projection", () => {
  it("projects only a witness bound to this action, state, side, type and target", () => {
    const witness = buildLegalActionWitness({
      stateVersion: 17,
      legalAction: {
        actionId: "rb",
        side: "runner",
        type: "gain_credit",
        label: "Gain credit",
        source: "basic_action",
        timingPoint: "runner_action.main",
        costs: [],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: 17,
      },
    });
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: witness.actionType,
        semanticActionType: "economy",
        sourceKind: "basic_action",
        targetIdentity: "none",
      }),
      actionId: witness.actionId,
      stateVersion: 17,
      side: "runner",
      intentContractId: "test.intent",
    });
    const targetRef = buildTargetRef({ kind: "none" });
    const project = (legalActionWitness: LegalActionWitness) =>
      buildWitnessOpportunityProjection({
        binding,
        targetRef,
        legalActionWitness,
      });
    expect(project(witness)).toMatchObject({
      status: "projected",
      candidatePathBindingFromWitness: true,
      legalActionWitness: witness,
    });

    const crossed: Array<Partial<LegalActionWitness>> = [
      { actionId: "other" },
      { side: "corp" },
      { stateVersion: 16 },
      {
        timingProfile: { ...witness.timingProfile, expiresAtStateVersion: 16 },
      },
      { actionType: "draw_card" },
      { targetRef: buildTargetRef({ kind: "server", serverId: "rd" }) },
      { blockers: ["unavailable"] },
      { evidence: ["DecisionDebug"] },
    ];
    for (const override of crossed) {
      const projection = project({ ...witness, ...override });
      expect(projection).toMatchObject({
        status: "blocked",
        candidatePathBindingFromWitness: false,
      });
      expect(projection.legalActionWitness).toBeUndefined();
    }
  });

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
    expect(projection.blockers).toContain(
      "legalaction_witness_missing_real_action_id",
    );
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
