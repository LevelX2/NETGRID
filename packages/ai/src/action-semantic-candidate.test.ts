import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "./action-semantic-candidate";

const ALL_ACTION_TYPES = [
  "mandatory_draw",
  "gain_credit",
  "draw_card",
  "activated_card_ability",
  "install_card",
  "play_event",
  "play_operation",
  "advance_card",
  "score_agenda",
  "start_run",
  "jack_out",
  "rez_ice",
  "decline_rez",
  "pump_breaker",
  "break_subroutine",
  "continue_run",
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "trash_resource",
  "decline_trash",
  "remove_tag",
  "purge_virus_counters",
  "purge_runner_virus_counters",
  "forgo_action",
  "move_to_set_aside",
  "move_to_removed_from_game",
  "return_from_set_aside",
  "change_card_control",
  "resolve_choice",
  "trigger_ability",
  "end_turn",
] as const satisfies readonly LegalAction["type"][];

describe("buildActionSemanticCandidates", () => {
  it("neutral-projects every LegalAction in the AI036 scenario fixture", () => {
    const actions = ALL_ACTION_TYPES.map((type, index) =>
      legalAction(type, index),
    );

    const candidates = buildActionSemanticCandidates({
      legalActions: actions,
      observerSide: "system",
      stateVersion: 42,
      projectionMode: "neutral_only",
    });

    expect(candidates).toHaveLength(actions.length);
    expect(new Set(candidates.map((candidate) => candidate.actionId)).size).toBe(
      actions.length,
    );

    for (const [index, candidate] of candidates.entries()) {
      const action = actions[index];
      if (!action) throw new Error(`Missing fixture action at index ${index}`);
      expect(candidate.actionId).toBe(action.actionId);
      expect(candidate.actionType).toBe(action.type);
      expect(candidate.actorSide).toBe(action.side);
      expect(candidate.observerSide).toBe("system");
      expect(candidate.stateVersion).toBe(42);
      expect(candidate.semanticActionType).toBe("unknown");
      expect(candidate.sourceKind).toBe("unknown");
      expect(candidate.abilityBindingMethod).toBe("unresolved");
      expect(candidate.primaryProjectionStatus).toBe("neutral_projected");
      expect(candidate.projectionIssues).toEqual([]);
      expect(candidate.confidence).toBe("none");
      expect(candidate.cardContextSignals).toEqual([]);
      expect(candidate.actionTacticSignals).toEqual([]);
      expect(candidate.strategySupport).toEqual([]);
      expect(candidate.hardGates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            gateId: "engine_legal_action",
            status: "pass",
          }),
          expect.objectContaining({
            gateId: "hidden_info",
            status: "pass",
          }),
          expect.objectContaining({
            gateId: "runtime_no_effect",
            status: "pass",
          }),
        ]),
      );
    }
  });

  it("keeps LegalAction payload values out of the neutral candidate", () => {
    const [action] = [legalAction("play_event", 0, {
      payload: {
        serverId: "hq",
        targetCardId: "secret-unseen-card",
      },
    })];

    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      projectionMode: "neutral_only",
    });
    if (!candidate) throw new Error("Expected one neutral candidate");

    expect(candidate.legalActionRef.originalPayloadKeys).toEqual([
      "serverId",
      "targetCardId",
    ]);
    expect(JSON.stringify(candidate)).not.toContain("secret-unseen-card");
  });

  it("adds controlled basic action semantics without card hints", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("gain_credit", 0, { source: "basic_action" }),
        legalAction("resolve_choice", 1, { source: "game_rule" }),
        legalAction("install_card", 2, {
          source: "card-install-source",
          payload: { placement: "remote" },
        }),
        legalAction("break_subroutine", 3, {
          source: "breaker-source",
          payload: { iceId: "ice-1", subroutineIndex: 0 },
        }),
      ],
    });

    const gainCredit = candidates[0];
    const choice = candidates[1];
    const install = candidates[2];
    const breakSubroutine = candidates[3];
    if (!gainCredit || !choice || !install || !breakSubroutine) {
      throw new Error("Expected four AI037 candidates");
    }

    expect(gainCredit.semanticActionType).toBe("economy.gain_credit");
    expect(gainCredit.sourceKind).toBe("basic_action");
    expect(gainCredit.primaryProjectionStatus).toBe("projected");
    expect(gainCredit.projectionIssues).toEqual([]);

    expect(choice.semanticActionType).toBe("choice.resolve");
    expect(choice.sourceKind).toBe("choice");
    expect(choice.primaryProjectionStatus).toBe("partial_projected");
    expect(choice.projectionIssues).toEqual(["target_context_unavailable"]);

    expect(install.semanticActionType).toBe("install.card");
    expect(install.sourceKind).toBe("card");
    expect(install.sourceCardId).toBe("card-install-source");
    expect(install.primaryProjectionStatus).toBe("partial_projected");
    expect(install.projectionIssues).toEqual(["target_context_unavailable"]);

    expect(breakSubroutine.semanticActionType).toBe(
      "breaker.break_subroutine",
    );
    expect(breakSubroutine.sourceKind).toBe("card");
    expect(breakSubroutine.sourceCardId).toBe("breaker-source");
    expect(breakSubroutine.projectionIssues).toEqual([
      "ability_unresolved",
      "target_context_unavailable",
    ]);
  });

  it("binds card source and ability only from side-safe LegalAction evidence", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("break_subroutine", 0, {
          source: "breaker-1",
          abilityRef: {
            sourceCardInstanceId: "breaker-1",
            abilityId: "icebreaker.break.1",
          },
        }),
        legalAction("trigger_ability", 1, {
          source: "scored-agenda-1",
          payload: { abilityId: "agenda.when_scored" },
        }),
        legalAction("activated_card_ability", 2, {
          source: "single-ability-card",
        }),
        legalAction("activated_card_ability", 3, {
          source: "ambiguous-card",
          payload: {
            cardImplementationAbility: "activated",
            cardImplementationAbilityIndex: 0,
          },
        }),
      ],
      sideSafeAbilityBindings: [
        {
          actionId: "ai036-2-activated_card_ability",
          sourceCardId: "single-ability-card",
          abilityId: "single.legal.ability",
          method: "single_legal_ability_inferred",
          evidence: ["AI038 test side-safe single legal ability"],
        },
      ],
    });

    const explicit = candidates[0];
    const payload = candidates[1];
    const inferred = candidates[2];
    const unresolved = candidates[3];
    if (!explicit || !payload || !inferred || !unresolved) {
      throw new Error("Expected four AI038 candidates");
    }

    expect(explicit.sourceCardId).toBe("breaker-1");
    expect(explicit.abilityId).toBe("icebreaker.break.1");
    expect(explicit.abilityBindingMethod).toBe("explicit_ability_id");
    expect(explicit.projectionIssues).not.toContain("ability_unresolved");

    expect(payload.sourceCardId).toBe("scored-agenda-1");
    expect(payload.abilityId).toBe("agenda.when_scored");
    expect(payload.abilityBindingMethod).toBe("engine_payload");

    expect(inferred.sourceCardId).toBe("single-ability-card");
    expect(inferred.abilityId).toBe("single.legal.ability");
    expect(inferred.abilityBindingMethod).toBe(
      "single_legal_ability_inferred",
    );

    expect(unresolved.sourceCardId).toBe("ambiguous-card");
    expect(unresolved.abilityId).toBeUndefined();
    expect(unresolved.abilityBindingMethod).toBe("unresolved");
    expect(unresolved.projectionIssues).toContain("ability_unresolved");
  });

  it("projects target context only from selected or engine-provided targets", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("trash_accessed_card", 0, {
          targetRequirements: [
            {
              id: "accessed",
              kind: "card",
              side: "corp",
              zoneScope: ["remote"],
              visibility: "known_to_actor",
            },
          ],
        }),
        legalAction("start_run", 1, {
          targetRequirements: [
            {
              id: "server",
              kind: "server",
              side: "corp",
              visibility: "public",
            },
          ],
        }),
        legalAction("install_card", 2, {
          targetRequirements: [
            {
              id: "host",
              kind: "card",
              side: "runner",
              visibility: "known_to_actor",
            },
          ],
        }),
        legalAction("trash_resource", 3, {
          targetRequirements: [
            {
              id: "hidden-resource",
              kind: "card",
              side: "runner",
              visibility: "engine_only",
            },
          ],
        }),
      ],
      selectedTargetsByActionId: {
        "ai036-0-trash_accessed_card": {
          accessed: "remote-card-1",
        },
      },
      availableTargetsByActionId: {
        "ai036-1-start_run": [
          {
            targetId: "hq",
            targetKind: "server",
            targetSide: "corp",
            evidence: ["AI039 test engine-provided legal server"],
          },
        ],
      },
    });

    const selected = candidates[0];
    const available = candidates[1];
    const unavailable = candidates[2];
    const hiddenBlocked = candidates[3];
    if (!selected || !available || !unavailable || !hiddenBlocked) {
      throw new Error("Expected four AI039 candidates");
    }

    expect(selected.targetContext?.selectedTargets).toEqual([
      expect.objectContaining({
        targetId: "remote-card-1",
        targetKind: "card",
        targetSide: "corp",
      }),
    ]);
    expect(selected.targetContext?.availableTargetsStatus).toBe(
      "not_available",
    );
    expect(selected.projectionIssues).not.toContain(
      "target_context_unavailable",
    );

    expect(available.targetContext?.availableTargetsStatus).toBe(
      "engine_provided",
    );
    expect(available.targetContext?.availableTargets).toEqual([
      expect.objectContaining({ targetId: "hq", targetKind: "server" }),
    ]);

    expect(unavailable.targetContext?.availableTargetsStatus).toBe(
      "target_context_unavailable",
    );
    expect(unavailable.projectionIssues).toContain(
      "target_context_unavailable",
    );

    expect(hiddenBlocked.targetContext?.selectedTargets).toEqual([]);
    expect(hiddenBlocked.targetContext?.hiddenInfoPolicy).toBe(
      "hidden_info_blocked",
    );
    expect(hiddenBlocked.primaryProjectionStatus).toBe("hidden_info_blocked");
    expect(hiddenBlocked.projectionIssues).toContain("hidden_info_blocked");
    expect(JSON.stringify(hiddenBlocked)).not.toContain("hidden-resource-card");
  });

  it("normalizes action cost and timing profiles without scoring", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("gain_credit", 0, {
          side: "runner",
          timingPoint: "runner_action.main",
          costs: [{ clicks: 1 }],
        }),
        legalAction("rez_ice", 1, {
          side: "corp",
          timingPoint: "run.encounter_ice",
          costs: [{ credits: 3 }],
          payload: {
            variableRezKind: "paid_end_the_run_subroutines",
            variableRezValue: 2,
            variableRezAdditionalCost: 1,
          },
        }),
        legalAction("end_turn", 2, {
          side: "corp",
          timingPoint: "corp_action.main",
          costs: [],
        }),
      ],
    });

    const gainCredit = candidates[0];
    const rezIce = candidates[1];
    const endTurn = candidates[2];
    if (!gainCredit || !rezIce || !endTurn) {
      throw new Error("Expected three AI040 candidates");
    }

    expect(gainCredit.costProfile).toMatchObject({
      clickCost: 1,
      paidBy: "runner",
      beneficiary: "runner",
      costKnownStatus: "known",
    });
    expect(gainCredit.timingProfile).toMatchObject({
      phase: "runner_action_phase",
      turnSide: "runner",
      window: "runner_action.main",
    });

    expect(rezIce.costProfile).toMatchObject({
      creditCost: 3,
      costKnownStatus: "known",
      variableCost: {
        kind: "rez_cost",
        min: 1,
        chosen: 2,
      },
    });
    expect(rezIce.costProfile.additionalCosts).toEqual([
      "variableRezKind",
      "variableRezAdditionalCost",
      "variableRezValue",
    ]);
    expect(rezIce.timingProfile).toMatchObject({
      phase: "run",
      window: "run.encounter_ice",
      runPhase: "run.encounter_ice",
      encounterPhase: "encounter_ice",
      rezWindow: true,
    });

    expect(endTurn.costProfile.costKnownStatus).toBe("not_applicable");
    expect(endTurn.timingProfile).toMatchObject({
      phase: "corp_action_phase",
      turnSide: "corp",
      window: "corp_action.main",
    });
  });

  it("joins card semantics only when source and ability binding are side-safe", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "single-ability-card",
          targetRequirements: [
            {
              id: "target",
              kind: "card",
              side: "runner",
              visibility: "known_to_actor",
            },
          ],
        }),
        legalAction("activated_card_ability", 1, {
          source: "multi-ability-card",
        }),
        legalAction("trigger_ability", 2, {
          source: "multi-ability-bound-card",
          abilityRef: {
            sourceCardInstanceId: "multi-ability-bound-card",
            abilityId: "ability.b",
          },
        }),
      ],
      selectedTargetsByActionId: {
        "ai036-0-activated_card_ability": {
          target: "runner-card-1",
        },
      },
      sideSafeAbilityBindings: [
        {
          actionId: "ai036-0-activated_card_ability",
          sourceCardId: "single-ability-card",
          abilityId: "ability.single",
          method: "single_legal_ability_inferred",
          evidence: ["AI041 test single ability binding"],
        },
      ],
      cardSemanticProfilesByCardId: {
        "single-ability-card": {
          cardId: "single-ability-card",
          tacticSignals: ["card.context.economy"],
          abilitySemantics: [
            {
              abilityId: "ability.single",
              tacticSignals: ["economy.burst"],
              strategySupport: [
                {
                  strategyId: "runner.rig_setup",
                  role: "support",
                  confidence: "medium",
                  evidence: "AI041 test support",
                },
              ],
              targetProfileMatches: [
                {
                  targetProfileId: "tp.runner_card",
                  status: "unknown",
                  issues: [],
                  evidence: ["AI041 test target profile"],
                },
              ],
            },
          ],
        },
        "multi-ability-card": {
          cardId: "multi-ability-card",
          tacticSignals: ["card.context.multi"],
          abilitySemantics: [
            { abilityId: "ability.a", tacticSignals: ["draw.card"] },
            { abilityId: "ability.b", tacticSignals: ["economy.gain"] },
          ],
        },
        "multi-ability-bound-card": {
          cardId: "multi-ability-bound-card",
          tacticSignals: ["card.context.bound"],
          abilitySemantics: [
            { abilityId: "ability.a", tacticSignals: ["draw.card"] },
            { abilityId: "ability.b", tacticSignals: ["tag.remove"] },
          ],
        },
      },
    });

    const single = candidates[0];
    const unresolved = candidates[1];
    const explicit = candidates[2];
    if (!single || !unresolved || !explicit) {
      throw new Error("Expected three AI041 candidates");
    }

    expect(single.cardContextSignals).toEqual(["card.context.economy"]);
    expect(single.actionTacticSignals).toEqual(["economy.burst"]);
    expect(single.strategySupport).toEqual([
      expect.objectContaining({ strategyId: "runner.rig_setup" }),
    ]);
    expect(single.targetContext?.targetProfileMatches).toEqual([
      expect.objectContaining({ targetProfileId: "tp.runner_card" }),
    ]);

    expect(unresolved.cardContextSignals).toEqual(["card.context.multi"]);
    expect(unresolved.actionTacticSignals).toEqual([]);
    expect(unresolved.projectionIssues).toContain("ability_unresolved");

    expect(explicit.cardContextSignals).toEqual(["card.context.bound"]);
    expect(explicit.actionTacticSignals).toEqual(["tag.remove"]);
    expect(explicit.projectionIssues).not.toContain("ability_unresolved");
  });

  it("projects Dropp break semantics as emergency prevention, not run access support", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("break_subroutine", 0, {
          source: "dropp-instance",
          abilityRef: {
            sourceCardInstanceId: "dropp-instance",
            abilityId: "dropp.break_subroutine",
          },
          payload: {
            iceId: "ice-1",
            subroutineIndex: 0,
          },
          targetRequirements: [
            {
              id: "subroutine",
              kind: "subroutine",
              side: "corp",
              visibility: "public",
            },
          ],
        }),
      ],
      selectedTargetsByActionId: {
        "ai036-0-break_subroutine": {
          subroutine: "ice-1:subroutine:0",
        },
      },
      cardSemanticProfilesByCardId: {
        "dropp-instance": {
          cardId: "onr_v1_019_dropp",
          tacticSignals: [],
          strategySupport: [],
          abilitySemantics: [
            {
              abilityId: "dropp.break_subroutine",
              tacticSignals: [
                "breaker.break_any_subroutine",
                "encounter.emergency_subroutine_prevention",
                "defense.encounter_threat_mitigation",
              ],
              strategySupport: [],
              risks: [
                {
                  kind: "risk.ends_run_on_use",
                  severity: "high",
                  evidence: ["Dropp break ability ends the run after use"],
                },
                {
                  kind: "risk.access_loss_on_use",
                  severity: "high",
                  evidence: ["Ending the run prevents access"],
                },
                {
                  kind: "risk.blocks_run_continuation",
                  severity: "high",
                  evidence: ["Use cannot support run continuation"],
                },
              ],
              constraints: [
                {
                  kind: "not_access_enabling_breaker",
                  status: "satisfied",
                  evidence: ["Dropp is emergency-only coverage"],
                },
                {
                  kind: "not_reachability_coverage",
                  status: "satisfied",
                  evidence: ["Run-ending break does not prove access"],
                },
              ],
              additionalCosts: ["ends_run"],
              targetProfileMatches: [
                {
                  targetProfileId: "dropp_emergency_subroutine_target",
                  status: "unknown",
                  issues: [],
                  evidence: ["Visible legal subroutine target only"],
                },
              ],
            },
          ],
        },
      },
    });

    if (!candidate) throw new Error("Expected Dropp candidate");
    expect(candidate.actionTacticSignals).toEqual([
      "breaker.break_any_subroutine",
      "encounter.emergency_subroutine_prevention",
      "defense.encounter_threat_mitigation",
    ]);
    expect(candidate.strategySupport).toEqual([]);
    expect(candidate.risks.map((risk) => risk.kind)).toEqual([
      "risk.ends_run_on_use",
      "risk.access_loss_on_use",
      "risk.blocks_run_continuation",
    ]);
    expect(candidate.constraints.map((constraint) => constraint.kind)).toEqual([
      "not_access_enabling_breaker",
      "not_reachability_coverage",
    ]);
    expect(candidate.costProfile.additionalCosts).toContain("ends_run");
    expect(candidate.targetContext?.targetKind).toBe("subroutine");
    expect(candidate.targetContext?.targetProfileMatches).toEqual([
      expect.objectContaining({
        targetProfileId: "dropp_emergency_subroutine_target",
      }),
    ]);
  });
});

function legalAction(
  type: LegalAction["type"],
  index: number,
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: `ai036-${index}-${type}`,
    side: index % 2 === 0 ? "runner" : "corp",
    type,
    label: `AI036 fixture ${type}`,
    source: defaultSourceFor(type),
    timingPoint: index % 2 === 0 ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 43,
    ...overrides,
  };
}

function defaultSourceFor(type: LegalAction["type"]): LegalAction["source"] {
  if (
    [
      "gain_credit",
      "draw_card",
      "start_run",
      "trash_resource",
      "remove_tag",
      "purge_virus_counters",
    ].includes(type)
  ) {
    return "basic_action";
  }

  if (
    [
      "mandatory_draw",
      "jack_out",
      "decline_rez",
      "continue_run",
      "access_card",
      "decline_trash",
      "purge_runner_virus_counters",
      "forgo_action",
      "resolve_choice",
      "end_turn",
    ].includes(type)
  ) {
    return "game_rule";
  }

  return `card-${type}`;
}
