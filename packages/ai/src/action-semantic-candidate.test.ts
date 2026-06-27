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
    expect(
      new Set(candidates.map((candidate) => candidate.actionId)).size,
    ).toBe(actions.length);

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
      expect(candidate.boardContext).toMatchObject({
        source: "ai_decision_input",
        sideSafe: true,
        stateVersion: 42,
        timingPoint: action.timingPoint,
      });
      expect(candidate.boardContext.notes).toEqual(
        expect.arrayContaining([
          "AI036 side-safe decision context projection",
          `action_side:${action.side}`,
          `action_visibility:${action.visibility}`,
        ]),
      );
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
    const [action] = [
      legalAction("play_event", 0, {
        payload: {
          serverId: "hq",
          targetCardId: "secret-unseen-card",
        },
      }),
    ];

    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      projectionMode: "neutral_only",
    });
    if (!candidate) throw new Error("Expected one neutral candidate");

    expect(candidate.legalActionRef.originalPayloadKeys).toEqual([
      "serverId",
      "targetCardId",
    ]);
    expect(candidate.boardContext.source).toBe("not_projected");
    expect(candidate.boardContext.notes).toContain(
      "payload_keys:serverId,targetCardId",
    );
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

    expect(breakSubroutine.semanticActionType).toBe("breaker.break_subroutine");
    expect(breakSubroutine.sourceKind).toBe("card");
    expect(breakSubroutine.sourceCardId).toBe("breaker-source");
    expect(breakSubroutine.targetContext?.targetKind).toBe("subroutine");
    expect(breakSubroutine.targetContext?.availableTargets).toEqual([
      expect.objectContaining({
        targetId: "ice-1:subroutine:0",
        targetKind: "subroutine",
      }),
    ]);
    expect(breakSubroutine.projectionIssues).toEqual(["ability_unresolved"]);
  });

  it("covers the minimal runtime bridge action families", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("gain_credit", 0, { source: "basic_action" }),
        legalAction("draw_card", 1, { source: "basic_action" }),
        legalAction("start_run", 2, {
          source: "basic_action",
          payload: { serverId: "rd" },
        }),
        legalAction("continue_run", 3, { source: "game_rule" }),
        legalAction("rez_ice", 4, {
          side: "corp",
          source: "game_rule",
          payload: { serverId: "rd" },
        }),
        legalAction("advance_card", 5, {
          side: "corp",
          source: "basic_action",
          payload: { cardId: "installed-agenda" },
        }),
        legalAction("score_agenda", 6, {
          side: "corp",
          source: "game_rule",
          payload: { cardId: "installed-agenda" },
        }),
      ],
    });

    expect(
      candidates.map((candidate) => [
        candidate.actionType,
        candidate.semanticActionType,
        candidate.primaryProjectionStatus,
      ]),
    ).toEqual([
      ["gain_credit", "economy.gain_credit", "projected"],
      ["draw_card", "draw.card", "projected"],
      ["start_run", "run.start", "projected"],
      ["continue_run", "run.continue", "projected"],
      ["rez_ice", "corp_window.rez", "partial_projected"],
      ["advance_card", "score.advance_card", "partial_projected"],
      ["score_agenda", "score.agenda", "partial_projected"],
    ]);

    expect(
      candidates.find((candidate) => candidate.actionType === "start_run")
        ?.targetContext?.availableTargets,
    ).toEqual([expect.objectContaining({ targetId: "rd" })]);
    expect(
      candidates.find((candidate) => candidate.actionType === "rez_ice")
        ?.targetContext?.availableTargets,
    ).toEqual([expect.objectContaining({ targetId: "rd" })]);
    expect(
      candidates.find((candidate) => candidate.actionType === "advance_card")
        ?.targetContext?.availableTargets,
    ).toEqual([expect.objectContaining({ targetId: "installed-agenda" })]);
    expect(
      candidates.find((candidate) => candidate.actionType === "score_agenda")
        ?.targetContext?.availableTargets,
    ).toEqual([
      expect.objectContaining({
        targetId: "installed-agenda",
        targetKind: "agenda",
      }),
    ]);
    for (const candidate of candidates.slice(2)) {
      expect(candidate.projectionIssues).not.toContain(
        "target_context_unavailable",
      );
    }
  });

  it("classifies every current LegalAction type without strategy or scoring anchors", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: ALL_ACTION_TYPES.map((type, index) =>
        legalAction(type, index),
      ),
      observerSide: "system",
    });

    expect(candidates).toHaveLength(ALL_ACTION_TYPES.length);
    for (const candidate of candidates) {
      expect(candidate.semanticActionType).not.toBe("unknown");
      expect(candidate.confidence).not.toBe("none");
      expect(candidate.strategySupport).toEqual([]);
      expect(candidate.actionTacticSignals).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining("planWeight"),
          expect.stringContaining("strategy_anchor"),
        ]),
      );
      expect(candidate.cardContextSignals).toEqual([]);
      expect(candidate.hardGates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            gateId: "runtime_no_effect",
            status: "pass",
          }),
        ]),
      );
    }

    const serialized = JSON.stringify(candidates);
    expect(serialized).not.toContain("planWeight");
    expect(serialized).not.toContain("scoringWeight");
    expect(serialized).not.toContain("selectedActionId");
    expect(
      candidates.find((candidate) => candidate.actionType === "gain_credit")
        ?.actionTacticSignals,
    ).toEqual(expect.arrayContaining(["economy.basic"]));
    expect(
      candidates.find((candidate) => candidate.actionType === "score_agenda")
        ?.actionTacticSignals,
    ).toEqual(expect.arrayContaining(["corp.score_closeout"]));
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
    expect(inferred.abilityBindingMethod).toBe("single_legal_ability_inferred");

    expect(unresolved.sourceCardId).toBe("ambiguous-card");
    expect(unresolved.abilityId).toBeUndefined();
    expect(unresolved.abilityBindingMethod).toBe("unresolved");
    expect(unresolved.projectionIssues).toContain("ability_unresolved");
  });

  it("projects card implementation primitive payload fields read-only", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("resolve_choice", 0, {
          source: "game_rule",
          visibility: "private_to_actor",
          payload: {
            sourceCardId: "runner-resource-1",
            sourceDefinitionId: "onr_proteus_136_credit-subversion",
            cardImplementationAbilityId:
              "onr_proteus_136_credit-subversion:successful_run_before_access:0",
            cardImplementationAbilityKey: "successful_run_before_access:0",
            cardImplementationPrimitiveKind:
              "successful_run_before_access_effect",
            cardImplementationEffectKind: "corp_lose_credits",
          },
        }),
      ],
      observerSide: "runner",
    });
    if (!candidate) throw new Error("Expected primitive payload candidate");

    expect(candidate.sourceKind).toBe("card");
    expect(candidate.sourceCardId).toBe("runner-resource-1");
    expect(candidate.sourceCardInstanceId).toBe("runner-resource-1");
    expect(candidate.sourceDefinitionId).toBe(
      "onr_proteus_136_credit-subversion",
    );
    expect(candidate.abilityId).toBe(
      "onr_proteus_136_credit-subversion:successful_run_before_access:0",
    );
    expect(candidate.abilityKey).toBe("successful_run_before_access:0");
    expect(candidate.primitiveKind).toBe("successful_run_before_access_effect");
    expect(candidate.effectKind).toBe("corp_lose_credits");
    expect(candidate.abilityBindingMethod).toBe("engine_payload");
    expect(candidate.observerSide).toBe("runner");
    expect(candidate.visibilityScope).toBe("actor_private");
    expect(candidate.actionTacticSignals).toEqual([]);
    expect(candidate.strategySupport).toEqual([]);
    expect(candidate.evidence).toEqual(
      expect.arrayContaining([
        "AI038 source instance bound from LegalAction: runner-resource-1",
        "AI038 source definition bound from LegalAction: onr_proteus_136_credit-subversion",
        "AI038 payload cardImplementationAbilityId: onr_proteus_136_credit-subversion:successful_run_before_access:0",
        "AI038 payload cardImplementationAbilityKey: successful_run_before_access:0",
        "AI038 payload cardImplementationPrimitiveKind: successful_run_before_access_effect",
        "AI038 payload cardImplementationEffectKind: corp_lose_credits",
      ]),
    );

    const serialized = JSON.stringify(candidate);
    for (const hiddenInfoField of [
      "corpHiddenRndOrder",
      "runnerHiddenStackOrder",
      "hiddenHqCards",
      "actualDeckOrder",
      "actualStackOrder",
      "cardInstances",
      "fullGameState",
      "privatePayload",
    ]) {
      expect(serialized).not.toContain(hiddenInfoField);
    }
    expect(serialized).not.toContain("planWeight");
    expect(serialized).not.toContain("scoringWeight");
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
        legalAction("resolve_choice", 4, {
          choiceRequirements: [
            {
              choiceId: "actor-private-choice",
              minSelections: 1,
              maxSelections: 1,
              optionIds: ["choice_option_keep", "choice_option_discard"],
            },
          ],
          payload: {
            choiceVisibility: "hidden_info_barrier",
            secretChoiceLabel: "unprojected private option label",
          },
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
    const choiceOptions = candidates[4];
    if (
      !selected ||
      !available ||
      !unavailable ||
      !hiddenBlocked ||
      !choiceOptions
    ) {
      throw new Error("Expected five AI039 candidates");
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

    expect(choiceOptions.targetContext?.targetKind).toBe("choice");
    expect(choiceOptions.targetContext?.availableTargetsStatus).toBe(
      "engine_provided",
    );
    expect(choiceOptions.targetContext?.availableTargets).toEqual([
      {
        targetId: "choice_option_discard",
        targetKind: "choice",
        targetSide: "runner",
        evidence: ["AI039 legal ChoiceRequirement option id"],
      },
      {
        targetId: "choice_option_keep",
        targetKind: "choice",
        targetSide: "runner",
        evidence: ["AI039 legal ChoiceRequirement option id"],
      },
    ]);
    expect(choiceOptions.projectionIssues).not.toContain(
      "target_context_unavailable",
    );
    expect(JSON.stringify(choiceOptions)).not.toContain(
      "unprojected private option label",
    );
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
        legalAction("resolve_choice", 3, {
          side: "corp",
          source: "game_rule",
          timingPoint: "corp_action.main",
          payload: {
            cardImplementationPrimitiveKind:
              "score_install_hq_cards_into_new_remote_then_rez",
            cardImplementationAbilityKey: "hq_to_new_remote_install_rez:0",
            cardImplementationTemporaryCreditBudget: 10,
            temporaryCreditsProvided: 10,
            temporaryCreditsSpent: 9,
            temporaryCreditsRemaining: 1,
            temporaryCreditsReturned: 1,
            corpCreditsSpent: 0,
            hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
          },
        }),
        legalAction("trigger_ability", 4, {
          side: "runner",
          source: "hidden-resource-source",
          timingPoint: "access.resolve_card",
          payload: {
            cardImplementationPrimitiveKind:
              "successful_run_before_access_effect",
            cardImplementationCostKind: "reveal_and_tap_source",
            publicRevealKind: "reveal",
            sourceTapped: true,
          },
        }),
      ],
    });

    const gainCredit = candidates[0];
    const rezIce = candidates[1];
    const endTurn = candidates[2];
    const dataFortSequence = candidates[3];
    const revealTap = candidates[4];
    if (!gainCredit || !rezIce || !endTurn || !dataFortSequence || !revealTap) {
      throw new Error("Expected five AI040 candidates");
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

    expect(dataFortSequence.costProfile).toMatchObject({
      creditCost: 0,
      costKnownStatus: "known",
      temporaryCredits: {
        budget: 10,
        provided: 10,
        spent: 9,
        remaining: 1,
        returned: 1,
      },
    });
    expect(dataFortSequence.costProfile.additionalCosts).toEqual(
      expect.arrayContaining([
        "cardImplementationTemporaryCreditBudget",
        "temporaryCreditsProvided",
        "temporaryCreditsSpent",
        "temporaryCreditsRemaining",
        "temporaryCreditsReturned",
        "corpCreditsSpent",
      ]),
    );
    expect(dataFortSequence.timingProfile).toMatchObject({
      phase: "corp_action_phase",
      scoreWindow: true,
    });

    expect(revealTap.costProfile).toMatchObject({
      tapCost: true,
      revealCost: true,
      costKnownStatus: "known",
    });
    expect(revealTap.costProfile.additionalCosts).toEqual(
      expect.arrayContaining([
        "cardImplementationCostKind",
        "publicRevealKind",
        "sourceTapped",
      ]),
    );
    expect(revealTap.timingProfile).toMatchObject({
      phase: "run",
      accessPhase: true,
      responseWindow: true,
    });
  });

  it("joins card semantics only when source and ability binding are side-safe", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "single-ability-instance",
          payload: { sourceDefinitionId: "single-ability-card" },
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
          source: "multi-ability-instance",
          payload: { sourceCardDefinitionId: "multi-ability-card" },
        }),
        legalAction("trigger_ability", 2, {
          source: "multi-ability-bound-instance",
          payload: { sourceDefinitionId: "multi-ability-bound-card" },
          abilityRef: {
            sourceCardInstanceId: "multi-ability-bound-instance",
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
          sourceCardId: "single-ability-instance",
          sourceDefinitionId: "single-ability-card",
          abilityId: "ability.single",
          method: "single_legal_ability_inferred",
          evidence: ["AI041 test single ability binding"],
        },
      ],
      cardSemanticProfilesByDefinitionId: {
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

    expect(single.sourceCardInstanceId).toBe("single-ability-instance");
    expect(single.sourceDefinitionId).toBe("single-ability-card");
    expect(single.cardContextSignals).toEqual(["card.context.economy"]);
    expect(single.actionTacticSignals).toEqual(["economy.burst"]);
    expect(single.strategySupport).toEqual([
      expect.objectContaining({ strategyId: "runner.rig_setup" }),
    ]);
    expect(single.targetContext?.targetProfileMatches).toEqual([
      expect.objectContaining({ targetProfileId: "tp.runner_card" }),
    ]);

    expect(unresolved.sourceCardInstanceId).toBe("multi-ability-instance");
    expect(unresolved.sourceDefinitionId).toBe("multi-ability-card");
    expect(unresolved.cardContextSignals).toEqual(["card.context.multi"]);
    expect(unresolved.actionTacticSignals).toEqual([]);
    expect(unresolved.projectionIssues).toContain("ability_unresolved");

    expect(explicit.sourceCardInstanceId).toBe("multi-ability-bound-instance");
    expect(explicit.sourceDefinitionId).toBe("multi-ability-bound-card");
    expect(explicit.cardContextSignals).toEqual(["card.context.bound"]);
    expect(explicit.actionTacticSignals).toEqual(["tag.remove"]);
    expect(explicit.projectionIssues).not.toContain("ability_unresolved");
  });

  it("does not materialize TargetProfile matches without legal target evidence", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "profile-only-instance",
          payload: { sourceDefinitionId: "profile-only-card" },
          abilityRef: {
            sourceCardInstanceId: "profile-only-instance",
            abilityId: "ability.profile_only",
          },
        }),
      ],
      cardSemanticProfilesByDefinitionId: {
        "profile-only-card": {
          cardId: "profile-only-card",
          tacticSignals: [],
          abilitySemantics: [
            {
              abilityId: "ability.profile_only",
              tacticSignals: [],
              targetProfileMatches: [
                {
                  targetProfileId: "tp.profile_only_remote",
                  status: "matched",
                  issues: [],
                  evidence: [
                    "Profile-only target classification must stay diagnostic",
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    if (!candidate) throw new Error("Expected profile-only target candidate");
    const targetContextGate = candidate.hardGates.find(
      (gate) => gate.gateId === "target_context",
    );

    expect(candidate.sourceDefinitionId).toBe("profile-only-card");
    expect(candidate.targetContext).toBeUndefined();
    expect(targetContextGate?.status).toBe("not_applicable");
    expect(candidate.projectionIssues).not.toContain(
      "target_context_unavailable",
    );
    expect(JSON.stringify(candidate)).not.toContain("tp.profile_only_remote");
  });

  it("prefers sourceCardInstanceId over the legacy sourceCardId binding alias", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "preferred-instance",
          payload: { sourceDefinitionId: "preferred-card" },
        }),
      ],
      sideSafeAbilityBindings: [
        {
          actionId: "ai036-0-activated_card_ability",
          sourceCardId: "legacy-wrong-instance",
          sourceCardInstanceId: "preferred-instance",
          sourceDefinitionId: "preferred-card",
          abilityId: "ability.preferred",
          method: "single_legal_ability_inferred",
          evidence: ["R1 preferred sourceCardInstanceId binding"],
        },
      ],
      cardSemanticProfilesByDefinitionId: {
        "preferred-card": {
          cardId: "preferred-card",
          tacticSignals: ["card.context.preferred"],
          abilitySemantics: [
            {
              abilityId: "ability.preferred",
              tacticSignals: ["economy.preferred"],
            },
          ],
        },
      },
    });

    if (!candidate) throw new Error("Expected one preferred binding candidate");
    expect(candidate.sourceCardId).toBe("preferred-instance");
    expect(candidate.sourceCardInstanceId).toBe("preferred-instance");
    expect(candidate.sourceDefinitionId).toBe("preferred-card");
    expect(candidate.abilityId).toBe("ability.preferred");
    expect(candidate.cardContextSignals).toEqual(["card.context.preferred"]);
    expect(candidate.actionTacticSignals).toEqual(["economy.preferred"]);
    expect(candidate.evidence).toContain(
      "R1 preferred sourceCardInstanceId binding",
    );
  });

  it("does not join card semantics from source instance ids without a side-safe definition id", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "hidden-instance-only",
        }),
      ],
      cardSemanticProfilesByDefinitionId: {
        "hidden-instance-only": {
          cardId: "hidden-instance-only",
          tacticSignals: ["must.not.join"],
          abilitySemantics: [
            { abilityId: "ability.hidden", tacticSignals: ["hidden.signal"] },
          ],
        },
      },
    });

    if (!candidate) throw new Error("Expected one AI041 candidate");
    expect(candidate.sourceCardId).toBe("hidden-instance-only");
    expect(candidate.sourceCardInstanceId).toBe("hidden-instance-only");
    expect(candidate.sourceDefinitionId).toBeUndefined();
    expect(candidate.cardContextSignals).toEqual([]);
    expect(candidate.actionTacticSignals).toEqual([]);
    expect(candidate.projectionIssues).toContain("card_semantics_unavailable");
    expect(JSON.stringify(candidate)).not.toContain("must.not.join");
    expect(JSON.stringify(candidate)).not.toContain("hidden.signal");
    expect(candidate.evidence.join(" ")).not.toContain(
      "card semantic profile joined",
    );
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
            sourceDefinitionId: "onr_v1_019_dropp",
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
      cardSemanticProfilesByDefinitionId: {
        onr_v1_019_dropp: {
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

  it("projects activated CardImplementation tag cleanup as tag removal from visible source definition", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "danshi-instance",
          payload: {
            cardImplementationAbility: "activated",
            cardImplementationAbilityIndex: 0,
            cardImplementationTrashSourceCost: true,
          },
        }),
      ],
      visibleSourceDefinitionsByInstanceId: {
        "danshi-instance": "onr_v1_158_danshis-second-id",
      },
    });

    if (!candidate) throw new Error("Expected Danish tag cleanup candidate");
    expect(candidate.sourceDefinitionId).toBe("onr_v1_158_danshis-second-id");
    expect(candidate.semanticActionType).toBe("tag.remove");
    expect(candidate.tagEffectProfile).toMatchObject({
      kind: "remove_tags",
      mode: "up_to_amount",
      amount: 3,
      currentTagReduction: 3,
      acuteTagRemoval: true,
      source: "card_implementation",
    });
    expect(candidate.projectionIssues).not.toContain("ability_unresolved");
    expect(candidate.actionTacticSignals).toContain("tag.remove");
    expect(candidate.strategySupport).toContainEqual(
      expect.objectContaining({ strategyId: "runner_remove_tags" }),
    );
    expect(JSON.stringify(candidate)).not.toContain("fullGameState");
    expect(JSON.stringify(candidate)).not.toContain("hiddenHqCards");
  });

  it("projects another activated tag cleanup resource through the same descriptor path", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "nomad-instance",
          costs: [{ clicks: 1 }, { credits: 1 }],
        }),
      ],
      visibleSourceDefinitionsByInstanceId: {
        "nomad-instance": "onr_v1_170_nomad-allies",
      },
    });

    if (!candidate) throw new Error("Expected Nomad Allies candidate");
    expect(candidate.semanticActionType).toBe("tag.remove");
    expect(candidate.tagEffectProfile).toMatchObject({
      kind: "remove_tags",
      mode: "amount",
      amount: 1,
      acuteTagRemoval: true,
    });
    expect(candidate.costProfile).toMatchObject({
      clickCost: 1,
      creditCost: 1,
    });
  });

  it("keeps tag avoidance sources support-only instead of acute tag removal", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("trigger_ability", 0, {
          source: "fall-guy-instance",
        }),
      ],
      visibleSourceDefinitionsByInstanceId: {
        "fall-guy-instance": "onr_v1_161_fall-guy",
      },
    });

    if (!candidate) throw new Error("Expected Fall Guy candidate");
    expect(candidate.semanticActionType).toBe("card_ability.trigger");
    expect(candidate.tagEffectProfile).toMatchObject({
      kind: "avoid_tag",
      acuteTagRemoval: false,
    });
    expect(candidate.actionTacticSignals).toContain("tag.avoid_tag");
  });

  it("keeps basic remove_tag projected through the existing tag removal path", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [legalAction("remove_tag", 0, { source: "basic_action" })],
    });

    if (!candidate) throw new Error("Expected basic remove tag candidate");
    expect(candidate.semanticActionType).toBe("tag.remove");
    expect(candidate.tagEffectProfile).toMatchObject({
      kind: "remove_tags",
      amount: 1,
      currentTagReduction: 1,
      acuteTagRemoval: true,
      source: "legal_action_type",
    });
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
