import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { projectHiddenResourceVirusModel } from "./hidden-resource-virus-model";

describe("projectHiddenResourceVirusModel", () => {
  it("uses own private hidden-resource constraints when supplied by LegalAction", () => {
    const model = projectHiddenResourceVirusModel(
      candidate({ actionTacticSignals: ["hidden_resource"] }),
      action(
        { ownHiddenResourceAvailable: 3, ownHiddenResourceRequired: 2 },
        "private_to_actor",
      ),
    );
    expect(model?.hiddenResource).toMatchObject({
      perspective: "own_private_constraint",
      available: 3,
      required: 2,
      sufficiency: "sufficient",
    });
  });

  it("redacts opponent hidden amounts and identity into the same abstract risk", () => {
    const firstDefinitionId = syntheticCardDefinitionId("secret-definition-a");
    const secondDefinitionId = syntheticCardDefinitionId("secret-definition-b");
    const first = projectHiddenResourceVirusModel(
      blockedCandidate("secret-instance-a", firstDefinitionId),
      action({ hiddenResourceAvailable: 9, hiddenResourceRequired: 1 }),
    );
    const second = projectHiddenResourceVirusModel(
      blockedCandidate("secret-instance-b", secondDefinitionId),
      action({ hiddenResourceAvailable: 1, hiddenResourceRequired: 9 }),
    );

    expect(first?.hiddenResource).toEqual(second?.hiddenResource);
    expect(first?.hiddenResource).toMatchObject({
      perspective: "hidden_info_blocked",
      sufficiency: "unknown",
      opponentIdentityPreserved: true,
    });
    const encoded = JSON.stringify(first);
    expect(encoded).not.toContain("secret-");
    for (const id of [firstDefinitionId, secondDefinitionId]) {
      expect(encoded).not.toContain(String(id));
    }
  });

  it("models a Runner virus counter and purge window from structured payload", () => {
    const model = projectHiddenResourceVirusModel(
      candidate(),
      action({
        counterFamily: "runner_virus",
        virusCounterType: "vienna",
        virusCounterAdded: 1,
        virusCountersAfter: 4,
        purgeWindowOpen: true,
        counterPayoutAvailable: true,
      }),
    );
    expect(model?.virusCounter).toMatchObject({
      counterFamily: "runner_virus",
      counterType: "vienna",
      amountAdded: 1,
      countersAfter: 4,
      purgePressure: "purge_window",
      payoutWindow: "available",
      antibodySeparatedFromRunnerVirus: true,
    });
  });

  it("recognizes the engine purge action without inventing counter amounts", () => {
    const model = projectHiddenResourceVirusModel(
      candidate(),
      action({}, "public", "purge_virus_counters"),
    );
    expect(model?.virusCounter).toMatchObject({
      counterFamily: "runner_virus",
      purgePressure: "purge_action",
      source: "action_type",
    });
    expect(model?.virusCounter).not.toHaveProperty("countersAfter");
  });

  it("keeps Proteus antibody counters separate from Runner virus counters", () => {
    const model = projectHiddenResourceVirusModel(
      candidate({
        cardContextSignals: ["proteus_antibody_counter_family"],
      }),
      action({ counterType: "crying", counterAmountAdded: 1 }),
    );
    expect(model?.virusCounter).toMatchObject({
      counterFamily: "corp_antibody",
      counterType: "crying",
      antibodySeparatedFromRunnerVirus: true,
    });
  });

  it("does not interpret near-miss tokens as hidden resources or viruses", () => {
    expect(
      projectHiddenResourceVirusModel(
        candidate({ actionTacticSignals: ["hiddenness.resourceful", "viral"] }),
        action({}),
      ),
    ).toBeUndefined();
  });
});

function action(
  payload: Record<string, string | number | boolean>,
  visibility: LegalAction["visibility"] = "public",
  type: LegalAction["type"] = "trigger_ability",
): LegalAction {
  return {
    actionId: "action-1",
    side: "runner",
    type,
    label: "fixture",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility,
    expiresAtStateVersion: 1,
    payload,
  };
}

function blockedCandidate(
  sourceCardInstanceId: string,
  sourceDefinitionId: number,
): ActionSemanticCandidate {
  return candidate({
    sourceCardInstanceId,
    sourceDefinitionId,
    primaryProjectionStatus: "hidden_info_blocked",
    projectionIssues: ["hidden_info_blocked"],
    actionTacticSignals: ["hidden_resource"],
  });
}

function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actorSide: "runner",
    cardContextSignals: [],
    actionTacticSignals: [],
    conditions: [],
    risks: [],
    constraints: [],
    hardGates: [],
    projectionIssues: [],
    primaryProjectionStatus: "projected",
    ...overrides,
  } as ActionSemanticCandidate;
}
