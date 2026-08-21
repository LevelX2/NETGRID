import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { applyCardActionSourceBinding } from "./action-source-binding";

describe("applyCardActionSourceBinding", () => {
  it("requires ability binding only for exact action types", () => {
    expect(
      applyCardActionSourceBinding(
        candidate(),
        action("break_subroutine"),
        [],
        undefined,
      ).projectionIssues,
    ).toContain("ability_unresolved");
    expect(
      applyCardActionSourceBinding(
        candidate(["ability_unresolved"]),
        action("break_subroutine_noise"),
        [],
        undefined,
      ).projectionIssues,
    ).not.toContain("ability_unresolved");
  });

  it("binds canonical AbilityRef exactly and rejects a hybrid ref", () => {
    const canonical: LegalAction = {
      ...action("activated_card_ability"),
      source: "source",
      payload: {
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: "test_card:gain",
        cardImplementationAbilityKey: "gain",
      },
      abilityRef: {
        sourceCardInstanceId: "source",
        sourceAbilityId: "test_card:gain",
      },
    };
    expect(
      applyCardActionSourceBinding(candidate(), canonical, [], undefined),
    ).toMatchObject({
      sourceCardInstanceId: "source",
      sourceDefinitionId: "test_card",
      abilityId: "test_card:gain",
      abilityBindingMethod: "canonical_capability_id",
    });
    const hybrid = {
      ...canonical,
      abilityRef: {
        sourceCardInstanceId: "source",
        abilityId: "legacy",
        sourceAbilityId: "test_card:gain",
      },
    } as unknown as LegalAction;
    expect(() =>
      applyCardActionSourceBinding(candidate(), hybrid, [], undefined),
    ).toThrow(/AbilityRef/);

    const wrongDefinition = {
      ...canonical,
      payload: {
        ...canonical.payload,
        sourceDefinitionId: "other_card",
      },
    } as LegalAction;
    expect(() =>
      applyCardActionSourceBinding(candidate(), wrongDefinition, [], undefined),
    ).toThrow(/definition conflicts/);
    expect(() =>
      applyCardActionSourceBinding(candidate(), canonical, [], {
        source: "other_card",
      }),
    ).toThrow(/definition conflicts/);

    const { payload: _payload, ...missingPayload } = canonical;
    expect(() =>
      applyCardActionSourceBinding(candidate(), missingPayload, [], undefined),
    ).toThrow(/incomplete/);
  });
});

function candidate(
  projectionIssues: ActionSemanticCandidate["projectionIssues"] = [],
): ActionSemanticCandidate {
  return {
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    projectionIssues,
    hardGates: [],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}

function action(type: string): LegalAction {
  return {
    actionId: `test.${type}`,
    side: "runner",
    type: type as LegalAction["type"],
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
