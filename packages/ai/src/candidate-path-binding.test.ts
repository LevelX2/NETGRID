import { describe, expect, it } from "vitest";
import {
  buildCandidatePathBinding,
  candidatePathBindingIsRedactionSafe,
} from "./candidate-path-binding";
import { buildSemanticActionSignature } from "./semantic-action-signature";

describe("candidate path bindings", () => {
  it("keeps the binding stable for the same redacted legal-action path", () => {
    const signature = buildSemanticActionSignature({
      actionType: "gain_credit",
      semanticActionType: "economy",
      sourceKind: "basic_action",
      targetIdentity: "none",
      costClass: "hard_gate:none,economy:not_projected",
      timingClass: "snapshot_context:scoreline_relevant",
    });
    const input = {
      signature,
      redactedActionRef: "redacted:test-ref",
      stateVersion: 42,
      side: "runner" as const,
      intentContractId: "test.economy",
    };

    expect(buildCandidatePathBinding(input).bindingKey).toBe(
      buildCandidatePathBinding({ ...input }).bindingKey,
    );
    expect(buildCandidatePathBinding(input).proofStatus).toBe("bound");
  });

  it("separates otherwise identical bindings by target identity", () => {
    const base = {
      actionType: "start_run",
      semanticActionType: "run_pressure",
      sourceKind: "basic_action",
      costClass: "hard_gate:none",
      timingClass: "snapshot_context:reachability_relevant",
    };

    const hq = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({ ...base, targetIdentity: "server:hq" }),
      redactedActionRef: "redacted:run",
      stateVersion: 7,
      side: "runner",
      intentContractId: "test.run",
    });
    const rd = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({ ...base, targetIdentity: "server:rd" }),
      redactedActionRef: "redacted:run",
      stateVersion: 7,
      side: "runner",
      intentContractId: "test.run",
    });

    expect(hq.bindingKey).not.toBe(rd.bindingKey);
  });

  it("keeps unresolved target identity as an explicit blocker", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "install_card",
        semanticActionType: "coverage_setup",
        sourceKind: "visible_card_or_ability",
        sourceDefinitionId: "Wall of Static",
        targetIdentity: "unknown_target",
      }),
      redactedActionRef: "redacted:install",
      stateVersion: 11,
      side: "corp",
      intentContractId: "test.coverage",
    });

    expect(binding.proofStatus).toBe("blocked");
    expect(binding.blockers).toContain("target_identity_unresolved");
  });

  it("redacts hidden-info markers before emitting a binding", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "trigger_ability",
        semanticActionType: "unknown",
        sourceKind: "card",
        targetIdentity: "cardInstances.runner.hidden.0",
      }),
      redactedActionRef: "redacted:hidden",
      stateVersion: 1,
      side: "corp",
      intentContractId: "test.hidden",
    });

    expect(candidatePathBindingIsRedactionSafe(binding)).toBe(true);
    expect(JSON.stringify(binding)).not.toContain("cardInstances");
    expect(binding.blockers).toContain("hidden_target_identity_blocked");
  });

  it("bounds hidden-info marker detection to exact tokens", () => {
    const binding = buildCandidatePathBinding({
      signature: buildSemanticActionSignature({
        actionType: "trigger_ability",
        semanticActionType: "unknown",
        sourceKind: "card",
        targetIdentity: "server:hq",
        costClass: "known:unknown",
      }),
      redactedActionRef: "redacted:visible",
      stateVersion: 1,
      side: "corp",
      intentContractId: "test.visible",
      evidence: ["cardInstancesish-visible"],
    });

    expect(binding.targetIdentity).toBe("server:hq");
    expect(binding.redactedActionRef).toBe("redacted:visible");
    expect(binding.blockers).not.toContain("hidden_info_marker_detected");
  });
});
