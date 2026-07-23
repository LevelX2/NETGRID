import { describe, expect, it } from "vitest";
import type { ValidatedPlanAssessment } from "./plan-assessment";
import {
  addResourceClaim,
  createPlanResourceLedger,
  delegatedProviderPriority,
  type ActionCapacityToken,
  type CreditToken,
  type PlanNeed,
  type ResourceClaim,
} from "./plan-resource-ledger";

describe("plan needs and typed resource claims", () => {
  it("prevents double reservation of one credit token", () => {
    const need = creditNeed("need-a", "parent-a", "economy-a", 4);
    const ledger = createPlanResourceLedger({
      side: "runner",
      stateVersion: 10,
      turnKey: "runner:3",
      needs: [need, creditNeed("need-b", "parent-b", "economy-b", 4)],
      tokens: [creditToken("pool", 5)],
    });
    const first = addResourceClaim(
      ledger,
      claim("claim-a", "economy-a", "need-a", "pool", 4),
      authority("economy-a"),
      "runner_action.main",
    );

    expect(() =>
      addResourceClaim(
        first,
        claim("claim-b", "economy-b", "need-b", "pool", 2),
        authority("economy-b"),
        "runner_action.main",
      ),
    ).toThrow(expect.objectContaining({ code: "resource_claim_conflict" }));
  });

  it("does not let background soft claims block the leaf executor", () => {
    const need = creditNeed("soft-need", "background", "background", 5);
    need.urgency = "soft";
    const hardNeed = creditNeed("hard-need", "parent", "executor", 5);
    const ledger = createPlanResourceLedger({
      side: "runner",
      stateVersion: 10,
      turnKey: "runner:3",
      needs: [need, hardNeed],
      tokens: [creditToken("pool", 5)],
    });
    const withSoft = addResourceClaim(
      ledger,
      {
        ...claim("soft", "background", "soft-need", "pool", 5),
        hardness: "soft",
      },
      authority("executor"),
      "runner_action.main",
    );
    const withHard = addResourceClaim(
      withSoft,
      claim("hard", "executor", "hard-need", "pool", 5),
      authority("executor"),
      "runner_action.main",
    );

    expect(withHard.claims).toHaveLength(2);
    expect(
      withHard.needs.find((candidate) => candidate.needId === "hard-need")
        ?.status,
    ).toBe("reserved");
  });

  it("rejects hard reservations from an inactive background", () => {
    const ledger = createPlanResourceLedger({
      side: "runner",
      stateVersion: 10,
      turnKey: "runner:3",
      needs: [creditNeed("need", "background", "background", 1)],
      tokens: [creditToken("pool", 5)],
    });

    expect(() =>
      addResourceClaim(
        ledger,
        claim("claim", "background", "need", "pool", 1),
        authority("different-executor"),
        "runner_action.main",
      ),
    ).toThrow(expect.objectContaining({ code: "resource_claim_conflict" }));
  });

  it("delegates P2 only through a bound parent need", () => {
    const parent = assessment("threat-plan", "P2");
    const provider = assessment("economy-provider", "P5");
    const independent = assessment("independent-economy", "P5");
    const boundNeed = creditNeed(
      "threat-funding",
      "threat-plan",
      "economy-provider",
      3,
    );

    expect(
      delegatedProviderPriority(
        "economy-provider",
        [boundNeed],
        [parent, provider, independent],
      ),
    ).toEqual({
      providerPlanInstanceId: "economy-provider",
      effectiveClass: "P2",
      delegatedFromPlanInstanceId: "threat-plan",
      needId: "threat-funding",
      reasonCode: "bound_parent_need",
    });
    expect(
      delegatedProviderPriority(
        "independent-economy",
        [boundNeed],
        [parent, provider, independent],
      ),
    ).toEqual({
      providerPlanInstanceId: "independent-economy",
      effectiveClass: "P5",
      reasonCode: "own_assessment",
    });
  });

  it("rejects cyclic support bindings", () => {
    expect(() =>
      createPlanResourceLedger({
        side: "runner",
        stateVersion: 10,
        turnKey: "runner:3",
        needs: [
          creditNeed("a-needs-b", "plan-a", "plan-b", 1),
          creditNeed("b-needs-a", "plan-b", "plan-a", 1),
        ],
      }),
    ).toThrow(expect.objectContaining({ code: "invalid_support_graph" }));
  });

  it.each([
    [
      "Valu-Pak",
      actionToken(
        "valu-pak",
        "onr_v1_117_valu-pak-software-bundle",
        5,
        "program_install_only",
        ["install_card"],
      ),
      actionNeed("install-program", "program_install_only", ["install_card"]),
      "install_card",
      true,
    ],
    [
      "Edgerunner",
      {
        ...actionToken(
          "edgerunner",
          "onr_v1_289_edgerunner-inc-temps",
          3,
          "install_only",
          ["install_card"],
        ),
        cadence: {
          scope: "turn" as const,
          cadenceKey: "runner:3",
          maximumClaims: 1,
          claimsUsed: 1,
        },
      },
      actionNeed("install", "install_only", ["install_card"]),
      "install_card",
      false,
    ],
    [
      "Wilson",
      actionToken(
        "wilson",
        "onr_v1_187_wilson-weeflerunner-apprentice",
        1,
        "run_only",
        ["start_run"],
      ),
      actionNeed("run", "run_only", ["start_run"]),
      "install_card",
      false,
    ],
  ])(
    "respects %s restriction, cadence and action type",
    (_label, token, need, actionType, accepted) => {
      const ledger = createPlanResourceLedger({
        side: "runner",
        stateVersion: 10,
        turnKey: "runner:3",
        needs: [need],
        tokens: [token],
      });
      const apply = () =>
        addResourceClaim(
          ledger,
          {
            ...claim(
              `claim-${token.tokenId}`,
              "provider",
              need.needId,
              token.tokenId,
              1,
            ),
            actionType,
          },
          authority("provider"),
          "runner_action.main",
        );

      if (accepted) expect(apply().claims).toHaveLength(1);
      else
        expect(apply).toThrow(
          expect.objectContaining({ code: "resource_claim_conflict" }),
        );
    },
  );

  it("keeps Broker cashout unavailable before its projected state and after expiry", () => {
    const broker: CreditToken = {
      ...creditToken("broker-cashout", 6),
      sourceDefinitionId: "onr_v1_154_broker",
      availability: {
        fromStateVersion: 12,
        expiresAtStateVersion: 14,
      },
    };
    const need = creditNeed("broker-need", "parent", "broker-plan", 3);
    const early = createPlanResourceLedger({
      side: "runner",
      stateVersion: 10,
      turnKey: "runner:3",
      needs: [need],
      tokens: [broker],
    });
    expect(() =>
      addResourceClaim(
        early,
        {
          ...claim(
            "early",
            "broker-plan",
            "broker-need",
            "broker-cashout",
            3,
          ),
          stateVersion: 10,
        },
        authority("broker-plan"),
        "runner_action.main",
      ),
    ).toThrow(expect.objectContaining({ code: "resource_claim_conflict" }));

    const current = { ...early, stateVersion: 12 };
    expect(
      addResourceClaim(
        current,
        {
          ...claim(
            "current",
            "broker-plan",
            "broker-need",
            "broker-cashout",
            3,
          ),
          stateVersion: 12,
        },
        authority("broker-plan"),
        "runner_action.main",
      ).claims,
    ).toHaveLength(1);

    expect(() =>
      addResourceClaim(
        { ...early, stateVersion: 15 },
        {
          ...claim(
            "expired",
            "broker-plan",
            "broker-need",
            "broker-cashout",
            3,
          ),
          stateVersion: 15,
        },
        authority("broker-plan"),
        "runner_action.main",
      ),
    ).toThrow(expect.objectContaining({ code: "resource_claim_conflict" }));
  });
});

function creditNeed(
  needId: string,
  parentPlanInstanceId: string,
  providerPlanInstanceId: string,
  quantity: number,
): PlanNeed {
  return {
    needId,
    side: "runner",
    parentPlanInstanceId,
    providerPlanInstanceId,
    status: "provider_bound",
    urgency: "hard",
    deadline: { horizon: "current_turn" },
    requirement: {
      resourceKind: "credits",
      quantity,
      acceptedRestrictions: ["general"],
    },
    evidenceCodes: [],
  };
}

function actionNeed(
  needId: string,
  restriction: ActionCapacityToken["restriction"],
  requiredActionTypes: string[],
): PlanNeed {
  return {
    needId,
    side: "runner",
    parentPlanInstanceId: "parent",
    providerPlanInstanceId: "provider",
    status: "provider_bound",
    urgency: "hard",
    deadline: { horizon: "current_turn" },
    requirement: {
      resourceKind: "action_capacity",
      quantity: 1,
      acceptedRestrictions: [restriction],
      requiredActionTypes,
    },
    evidenceCodes: [],
  };
}

function creditToken(tokenId: string, quantity: number): CreditToken {
  return {
    resourceKind: "credits",
    tokenId,
    side: "runner",
    sourcePlanInstanceId: "economy",
    quantity,
    restriction: "general",
    reliability: "guaranteed",
    availability: { fromStateVersion: 10 },
  };
}

function actionToken(
  tokenId: string,
  sourceDefinitionId: string,
  quantity: number,
  restriction: ActionCapacityToken["restriction"],
  allowedActionTypes: string[],
): ActionCapacityToken {
  return {
    resourceKind: "action_capacity",
    tokenId,
    side: "runner",
    sourcePlanInstanceId: "provider",
    sourceDefinitionId,
    quantity,
    restriction,
    allowedActionTypes,
    reliability: "guaranteed",
    availability: { fromStateVersion: 10 },
  };
}

function claim(
  claimId: string,
  planInstanceId: string,
  needId: string,
  tokenId: string,
  quantity: number,
): ResourceClaim {
  return {
    claimId,
    planInstanceId,
    needId,
    tokenId,
    quantity,
    hardness: "hard",
    stateVersion: 10,
    turnKey: "runner:3",
    status: "accepted",
  };
}

function authority(executorPlanInstanceId: string) {
  return {
    executorPlanInstanceId,
    activeContinuationPlanInstanceIds: [],
  };
}

function assessment(
  instanceId: string,
  effectiveClass: ValidatedPlanAssessment["priorityValidation"]["effectiveClass"],
): ValidatedPlanAssessment {
  return {
    instanceId,
    priorityValidation: { status: "accepted", effectiveClass, reasonCodes: [] },
  } as unknown as ValidatedPlanAssessment;
}
