import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import {
  buildLegalActionWitness,
  legalActionWitnessIsRedactionSafe,
} from "./legalaction-witness";

describe("LegalActionWitness v1", () => {
  it("projects no-target basic actions with targetRef none", () => {
    const witness = buildLegalActionWitness({
      legalAction: action("gain_credit", {
        targetRequirements: [],
        costs: [{ clicks: 1 }],
      }),
      stateVersion: 12,
    });

    expect(witness).toMatchObject({
      schemaVersion: "legalaction-witness-v1",
      actionId: "test.gain_credit",
      targetRef: {
        kind: "none",
        ref: "none",
        playerActionTargetRequired: false,
        redactionPolicy: "public",
      },
      costProfile: { clickCost: 1, creditCost: 0, additionalCosts: [] },
      redactionPolicy: "public",
      blockers: [],
    });
  });

  it("projects simple server-targeted actions from LegalAction payload", () => {
    const witness = buildLegalActionWitness({
      legalAction: action("start_run", {
        payload: { serverId: "rd" },
        targetRequirements: [{ id: "server", kind: "server", allowedServers: ["rd"] }],
      }),
      stateVersion: 33,
    });

    expect(witness.targetRef).toMatchObject({
      kind: "server",
      ref: "server:rd",
      playerActionTargetRequired: true,
    });
    expect(witness.evidence).toContain("server_from_legalaction_payload");
  });

  it("redacts hidden-info markers instead of emitting private target data", () => {
    const witness = buildLegalActionWitness({
      legalAction: action("trigger_ability", {
        source: "cardInstances.corp.hidden.0",
        targetRequirements: [{ id: "target", kind: "card", visibility: "engine_only" }],
      }),
      stateVersion: 3,
      selectedTargets: { target: "cardInstances.runner.stack.0" },
    });

    expect(legalActionWitnessIsRedactionSafe(witness)).toBe(true);
    expect(JSON.stringify(witness)).not.toContain("cardInstances");
    expect(witness.targetRef.kind).toBe("hidden_blocked");
    expect(witness.blockers).toContain("target_ref_hidden_blocked");
    expect(witness.blockers).toContain("source_ref_hidden_blocked");
  });

  it("bounds hidden-info marker detection to exact tokens", () => {
    const witness = buildLegalActionWitness({
      legalAction: action("trigger_ability", {
        source: "cardInstancesish.corp.visible.0",
        targetRequirements: [{ id: "target", kind: "card", visibility: "public" }],
      }),
      stateVersion: 4,
      selectedTargets: { target: "privatePayloadish.runner.stack.0" },
    });

    expect(witness.sourceRef.kind).toBe("actor_known_card");
    expect(witness.targetRef.kind).toBe("ownInstalled");
    expect(witness.blockers).not.toContain("source_ref_hidden_blocked");
    expect(witness.blockers).not.toContain("target_ref_hidden_blocked");
  });

  it("keeps actor-known card sources actor-private", () => {
    const witness = buildLegalActionWitness({
      legalAction: action("trigger_ability", {
        source: "visible.runner.rig.program",
      }),
      stateVersion: 6,
    });

    expect(witness.sourceRef.kind).toBe("actor_known_card");
    expect(witness.redactionPolicy).toBe("actor_private");
  });

  it("does not mutate the original LegalAction", () => {
    const legalAction = action("start_run", {
      payload: { serverId: "hq" },
      targetRequirements: [{ id: "server", kind: "server", allowedServers: ["hq"] }],
    });
    const before = JSON.stringify(legalAction);

    buildLegalActionWitness({ legalAction, stateVersion: 5 });

    expect(JSON.stringify(legalAction)).toBe(before);
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
