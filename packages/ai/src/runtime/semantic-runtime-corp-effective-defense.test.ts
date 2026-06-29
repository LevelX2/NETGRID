import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";

describe("semanticRuntimeCorpEffectiveDefenseContext", () => {
  it("flags zero-effect variable trace rez actions", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5),
      rezAction("homing-x0", 4, {
        variableRezKind: "x_strength",
        variableRezValue: 0,
      }),
      rezCandidate("homing-x0", 4, [
        "role:trace_ice",
        "corp_ice.conditional_end_run",
        "trace.source",
      ], {
        kind: "rez_cost",
        chosen: 0,
        min: 0,
      }),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      postRezCredits: 1,
      minimumUsefulX: 1,
      hasImmediateStopPotential: false,
      zeroEffectRisk: true,
    });
  });

  it("flags zero-effect X-strength rez actions encoded in the legal action id", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(6),
      rezAction("corp.rez_ice.test_ice.test_ice.x_strength.0.0", 6),
      undefined,
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      postRezCredits: 0,
      minimumUsefulX: 1,
      hasImmediateStopPotential: false,
      zeroEffectRisk: true,
    });
    expect(context?.evidence).toEqual(
      expect.arrayContaining([
        "effective_defense_variable_kind:x_strength",
        "effective_defense_variable_value:0",
      ]),
    );
  });

  it("does not treat x-like variable rez kind text as a minimum-useful X contract", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(6),
      rezAction("x-like-kind", 4, {
        variableRezKind: "xylophone_noise",
        variableRezValue: 0,
      }),
      undefined,
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      hasImmediateStopPotential: false,
      zeroEffectRisk: false,
    });
    expect(context?.minimumUsefulX).toBeUndefined();
  });

  it("treats a useful variable trace rez value as effective defense", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5),
      rezAction("homing-x1", 5, {
        variableRezKind: "x_strength",
        variableRezValue: 1,
      }),
      rezCandidate("homing-x1", 5, [
        "role:trace_ice",
        "corp_ice.conditional_end_run",
        "trace.source",
      ], {
        kind: "rez_cost",
        chosen: 1,
        min: 1,
      }),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      postRezCredits: 0,
      minimumUsefulX: 1,
      hasImmediateStopPotential: true,
      zeroEffectRisk: false,
    });
  });

  it("ignores label-only trace and end-the-run defense text", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5),
      rezAction(
        "label-only-trace",
        4,
        {
          variableRezValue: 1,
        },
        "Trace ICE with end the run",
      ),
      undefined,
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      hasImmediateStopPotential: false,
      hasMeaningfulTaxOrDamage: false,
      zeroEffectRisk: false,
    });
    expect(context?.minimumUsefulX).toBeUndefined();
  });

  it("ignores substring-only structured defense signal noise", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5),
      rezAction("signal-noise", 4),
      rezCandidate("signal-noise", 4, [
        "traceroute_noise",
        "damaged_goods",
        "taxable_noise",
        "end_runner_noise",
        "paid_subroutineish_noise",
        "encounter_paid_subroutineish_add",
      ]),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      hasImmediateStopPotential: false,
      hasMeaningfulTaxOrDamage: false,
      requiresPostRezPaidAbility: false,
      zeroEffectRisk: false,
    });
    expect(context?.minimumUsefulX).toBeUndefined();
  });

  it("requires post-rez budget for paid encounter subroutine defense", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(3),
      rezAction("paid-subroutine-ice", 2),
      rezCandidate("paid-subroutine-ice", 2, [
        "role:etr_ice",
        "corp_ice.encounter_paid_subroutine_add",
      ]),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      postRezCredits: 1,
      requiresPostRezPaidAbility: true,
      postRezAbilityAffordable: false,
      hasImmediateStopPotential: false,
      zeroEffectRisk: true,
    });
  });

  it("recognizes paid encounter subroutine defense when post-rez budget remains", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5),
      rezAction("paid-subroutine-ice", 2),
      rezCandidate("paid-subroutine-ice", 2, [
        "role:etr_ice",
        "corp_ice.encounter_paid_subroutine_add",
      ]),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      postRezCredits: 3,
      requiresPostRezPaidAbility: true,
      postRezAbilityAffordable: true,
      hasImmediateStopPotential: true,
      zeroEffectRisk: false,
    });
  });

  it("does not treat Credit Blocks sentry mode as a stop against visible Killer coverage", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5, {
        runnerRig: [killerBreaker()],
        servers: [
          server("rd", [
            corpIce("credit-blocks", {
              definitionId: "onr_proteus_017_credit-blocks",
              title: "Credit Blocks",
              subtypes: ["sentry"],
            }),
          ]),
        ],
      }),
      rezAction("credit-blocks-sentry", 3, {
        variableRezKind: "alternate_subtype",
        selectedSubtypesAfterRez: "sentry",
      }, "Credit Blocks rezzen", "credit-blocks"),
      rezCandidate("credit-blocks-sentry", 3, [
        "role:etr_ice",
        "corp_ice.end_run",
      ]),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      hasImmediateStopPotential: false,
      zeroEffectRisk: true,
    });
    expect(context?.evidence).toContain(
      "effective_defense_visible_breaker_coverage:true",
    );
  });

  it("treats Credit Blocks wall mode as a stop when only visible Killer coverage exists", () => {
    const context = semanticRuntimeCorpEffectiveDefenseContext(
      corpInput(5, {
        runnerRig: [killerBreaker()],
        servers: [
          server("rd", [
            corpIce("credit-blocks", {
              definitionId: "onr_proteus_017_credit-blocks",
              title: "Credit Blocks",
              subtypes: ["sentry"],
            }),
          ]),
        ],
      }),
      rezAction("credit-blocks-wall", 4, {
        variableRezKind: "alternate_subtype",
        selectedSubtypesAfterRez: "wall",
      }, "Credit Blocks als Wall rezzen", "credit-blocks"),
      rezCandidate("credit-blocks-wall", 4, [
        "role:etr_ice",
        "corp_ice.end_run",
      ]),
      { actionCreditCost },
    );

    expect(context).toMatchObject({
      isRezzableNow: true,
      hasImmediateStopPotential: true,
      zeroEffectRisk: false,
    });
    expect(context?.evidence).toContain(
      "effective_defense_visible_breaker_coverage:false",
    );
  });
});

function corpInput(
  credits: number,
  overrides: {
    runnerRig?: NonNullable<AiDecisionInput["playerView"]["opponent"]["rig"]>;
    servers?: AiDecisionInput["playerView"]["servers"];
  } = {},
): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        credits,
        gripOrHq: [],
      },
      opponent: {
        rig: overrides.runnerRig ?? [],
      },
      servers: overrides.servers ?? [],
    },
  } as unknown as AiDecisionInput;
}

function rezAction(
  actionId: string,
  creditCost: number,
  payload: LegalAction["payload"] = {},
  label = "ICE rezzen",
  source = "game_rule",
): LegalAction {
  return {
    actionId,
    side: "corp",
    type: "rez_ice",
    label,
    source,
    timingPoint: "run.encounter_ice",
    costs: [{ credits: creditCost }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      rezCostPaid: creditCost,
      ...payload,
    },
  };
}

function rezCandidate(
  actionId: string,
  creditCost: number,
  signals: readonly string[],
  variableCost?: NonNullable<
    ActionSemanticCandidate["costProfile"]["variableCost"]
  >,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "rez_ice",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: "rez_ice",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "engine_payload",
    semanticActionType: "corp_window.rez",
    cardContextSignals: [...signals],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      creditCost,
      costKnownStatus: "known",
      ...(variableCost ? { variableCost } : {}),
      additionalCosts: [],
    },
    timingProfile: {
      rezWindow: true,
    },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [...signals],
  };
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

function server(
  id: AiDecisionInput["playerView"]["servers"][number]["id"],
  ice: AiDecisionInput["playerView"]["servers"][number]["ice"] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root: [],
  };
}

function corpIce(
  instanceId: string,
  overrides: Partial<AiDecisionInput["playerView"]["servers"][number]["ice"][number]> = {},
): AiDecisionInput["playerView"]["servers"][number]["ice"][number] {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    known: true,
    type: "ice",
    owner: "corp",
    controller: "corp",
    ...overrides,
  };
}

function killerBreaker(): NonNullable<
  AiDecisionInput["playerView"]["opponent"]["rig"]
>[number] {
  return {
    instanceId: "loony-goon",
    definitionId: "loony-goon",
    title: "Loony Goon",
    known: true,
    type: "program",
    owner: "runner",
    controller: "runner",
    subtypes: ["Icebreaker", "Killer"],
    rulesText: "Break sentry subroutines.",
  };
}
