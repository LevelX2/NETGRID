import { describe, expect, it } from "vitest";
import { buildCandidatePathBinding } from "./candidate-path-binding";
import { buildSemanticActionSignature } from "./semantic-action-signature";
import { resolveCandidateTargetIdentity } from "./target-identity-resolver";
import { buildPlayerActionFromCandidateBinding } from "./playeraction-dry-run-builder";

describe("playeraction dry-run builder", () => {
  it("builds a no-target basic action when a real actionId is present", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "gain_credit",
        semanticActionType: "economy",
        sourceKind: "basic_action",
        targetIdentity: "none",
      }),
      actionId: "runner.gain_credit.1",
      stateVersion: 12,
      side: "runner",
      intentContractId: "test.economy",
    });
    const result = buildPlayerActionFromCandidateBinding({
      binding,
      targetIdentity: resolveCandidateTargetIdentity({
        actionType: "gain_credit",
        targetIdentity: "none",
      }),
      legalActionIds: ["runner.gain_credit.1"],
    });

    expect(result.status).toBe("built");
    expect(result.playerAction).toMatchObject({
      side: "runner",
      actionId: "runner.gain_credit.1",
      clientKnownStateVersion: 12,
    });
  });

  it("builds a server-targeted run action when the target is stable", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "start_run",
        semanticActionType: "run_pressure",
        sourceKind: "basic_action",
        targetIdentity: "server:rd",
      }),
      actionId: "runner.start_run.rd",
      stateVersion: 20,
      side: "runner",
      intentContractId: "test.run",
    });
    const result = buildPlayerActionFromCandidateBinding({
      binding,
      targetIdentity: resolveCandidateTargetIdentity({
        actionType: "start_run",
        targetIdentity: "server:rd",
      }),
      legalActionIds: ["runner.start_run.rd"],
    });

    expect(result.status).toBe("built");
    expect(result.playerAction?.selectedTargets).toEqual({ serverId: "rd" });
  });

  it("blocks when target identity is missing", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "start_run",
        semanticActionType: "run_pressure",
        sourceKind: "basic_action",
        targetIdentity: "server:unknown",
      }),
      actionId: "runner.start_run.unknown",
      stateVersion: 20,
      side: "runner",
      intentContractId: "test.run",
    });
    const result = buildPlayerActionFromCandidateBinding({
      binding,
      targetIdentity: resolveCandidateTargetIdentity({
        actionType: "start_run",
        targetIdentity: "server:unknown",
      }),
      legalActionIds: ["runner.start_run.unknown"],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("server_target_missing");
  });

  it("blocks when the actionId is not present in the reviewed LegalActions", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "gain_credit",
        semanticActionType: "economy",
        sourceKind: "basic_action",
        targetIdentity: "none",
      }),
      actionId: "runner.gain_credit.1",
      stateVersion: 12,
      side: "runner",
      intentContractId: "test.economy",
    });
    const result = buildPlayerActionFromCandidateBinding({
      binding,
      targetIdentity: resolveCandidateTargetIdentity({
        actionType: "gain_credit",
        targetIdentity: "none",
      }),
      legalActionIds: ["runner.draw_card.1"],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("action_not_in_legal_actions");
  });

  it("blocks redacted action refs before building a PlayerAction", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "gain_credit",
        semanticActionType: "economy",
        sourceKind: "basic_action",
        targetIdentity: "none",
      }),
      redactedActionRef: "redacted:basic",
      stateVersion: 12,
      side: "runner",
      intentContractId: "test.economy",
    });
    const result = buildPlayerActionFromCandidateBinding({
      binding,
      targetIdentity: resolveCandidateTargetIdentity({
        actionType: "gain_credit",
        targetIdentity: "none",
      }),
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("action_id_redacted");
  });
});
