import { describe, expect, it } from "vitest";
import { buildCandidatePathBinding } from "./candidate-path-binding";
import { buildLegalActionWitness } from "./legalaction-witness";
import { buildSemanticActionSignature } from "./semantic-action-signature";
import { resolveCandidateTargetIdentity } from "./target-identity-resolver";
import {
  buildPlayerActionFromCandidateBinding,
  buildPlayerActionFromWitness,
} from "./playeraction-dry-run-builder";
import type { LegalAction } from "@netgrid/shared";

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

describe("player action builder from LegalActionWitness", () => {
  it("builds no-target basic actions", () => {
    const result = buildPlayerActionFromWitness({
      witness: buildLegalActionWitness({
        legalAction: action("gain_credit", { targetRequirements: [] }),
        stateVersion: 17,
      }),
      legalActionIds: ["test.gain_credit"],
    });

    expect(result.status).toBe("built");
    expect(result.playerAction).toMatchObject({
      actionId: "test.gain_credit",
      clientKnownStateVersion: 17,
      side: "runner",
    });
    expect(result.playerAction?.selectedTargets).toBeUndefined();
  });

  it("builds server runs", () => {
    const result = buildPlayerActionFromWitness({
      witness: buildLegalActionWitness({
        legalAction: action("start_run", {
          payload: { serverId: "hq" },
          targetRequirements: [{ id: "server", kind: "server", allowedServers: ["hq"] }],
        }),
        stateVersion: 20,
      }),
    });

    expect(result.status).toBe("built");
    expect(result.playerAction?.selectedTargets).toEqual({ serverId: "hq" });
  });

  it("builds choice options", () => {
    const result = buildPlayerActionFromWitness({
      witness: buildLegalActionWitness({
        legalAction: action("resolve_choice", {
          choiceRequirements: [
            {
              choiceId: "choice_1",
              minSelections: 1,
              maxSelections: 1,
              optionIds: ["option_a"],
            },
          ],
          targetRequirements: [],
        }),
        stateVersion: 21,
        selectedChoices: { choiceId: "choice_1", selectedOptionIds: ["option_a"] },
      }),
    });

    expect(result.status).toBe("built");
    expect(result.playerAction?.selectedChoices).toEqual({
      choiceId: "choice_1",
      selectedOptionIds: ["option_a"],
    });
  });

  it("blocks hidden targets and missing legal action membership", () => {
    const result = buildPlayerActionFromWitness({
      witness: buildLegalActionWitness({
        legalAction: action("trigger_ability", {
          source: "cardInstances.runner.stack.0",
          targetRequirements: [{ id: "target", kind: "card", visibility: "engine_only" }],
        }),
        stateVersion: 22,
        selectedTargets: { target: "cardInstances.runner.stack.0" },
      }),
      legalActionIds: ["other"],
    });

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("action_not_in_legal_actions");
    expect(result.blockers).toContain("witness_hidden_blocked");
  });
});

function action(
  type: LegalAction["type"],
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: `test.${type}`,
    side: "runner",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
