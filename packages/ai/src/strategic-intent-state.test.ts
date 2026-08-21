import { describe, expect, it } from "vitest";
import type {
  AiDeckStrategyProfile,
  DeckStrategyRuntimeStatus,
  DeckStrategyScore,
} from "./deck-doctrine-strategy";
import { PlanResolutionFailure } from "./plans/plan-resolution-failure";
import {
  buildStrategicIntentState,
  type StrategicRoleStatusSnapshot,
} from "./strategic-intent-state";

describe("StrategicIntentState contract", () => {
  it("keeps anchorless Runner decks in NeutralDoctrine without action generation", () => {
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 7,
    });

    expect(state).toMatchObject({
      schemaVersion: "strategic-intent-state-v1",
      side: "runner",
      phase: "recover",
      source: {
        deckStrategyProfile: "missing",
        plannerEffect: "goal_and_plan_input",
        actionGeneration: "none",
        hiddenInfoPolicy: "player_view_only",
      },
      primaryStrategy: {
        strategyId: "runner.neutral",
        family: "neutral",
        completeness: "none",
      },
      targetVector: { kind: "none" },
    });
    expect(state.blockers.map((blocker) => blocker.reason)).toContain(
      "no_strategy_anchor",
    );
  });

  it("models partial Runner pressure with support gaps and reserve blockers", () => {
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 12,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 45,
            support: 30,
            final: 39,
            confidence: "medium",
            gaps: ["missing_wall_coverage"],
          }),
        },
      }),
      availableCredits: 2,
      roleStatuses: [
        role("rnd_pressure_anchor", "in_deck_unseen", [
          "role_status:in_deck_unseen",
        ]),
      ],
    });

    expect(state.primaryStrategy).toMatchObject({
      strategyId: "runner.rnd_pressure",
      family: "runner_central_pressure",
      completeness: "partial",
    });
    expect(state.phase).toBe("recover");
    expect(state.targetVector).toMatchObject({
      kind: "central",
      targetId: "rd",
    });
    expect(state.blockers.map((blocker) => blocker.reason)).toEqual(
      expect.arrayContaining(["support_gap", "reserve_shortfall"]),
    );
    expect(state.reserve).toMatchObject({
      kind: "credits",
      required: 4,
      available: 2,
      satisfied: false,
    });
  });

  it("models complete Corp scoreline intent and commitment continuation", () => {
    const profileInput = profile("corp", {
      primary: ["corp.remote_scoring"],
      secondary: ["corp.ice_tax_glacier"],
      scores: {
        "corp.remote_scoring": score({
          anchor: 80,
          support: 85,
          final: 82,
          confidence: "high",
        }),
        "corp.ice_tax_glacier": score({
          anchor: 45,
          support: 55,
          final: 51,
          confidence: "medium",
        }),
      },
    });
    const activeRoles = [
      role("scoring_remote", "active", ["remote_ready:true"]),
    ];
    const first = buildStrategicIntentState({
      side: "corp",
      stateVersion: 20,
      strategyProfile: profileInput,
      availableCredits: 7,
      roleStatuses: activeRoles,
    });
    const continued = buildStrategicIntentState({
      side: "corp",
      stateVersion: 21,
      strategyProfile: profileInput,
      previousState: first,
      availableCredits: 7,
      roleStatuses: activeRoles,
    });

    expect(first.primaryStrategy).toMatchObject({
      strategyId: "corp.remote_scoring",
      family: "corp_scoreline",
      completeness: "complete",
      confidence: "high",
    });
    expect(first.phase).toBe("convert");
    expect(first.targetVector.kind).toBe("scoreline");
    expect(first.blockers).toEqual([]);
    expect(first.secondaryStrategies.map((line) => line.strategyId)).toEqual([
      "corp.ice_tax_glacier",
    ]);
    expect(
      first.strategyPortfolio?.productiveCandidates.map(
        (candidate) => candidate.strategyId,
      ),
    ).toEqual(["corp.remote_scoring", "corp.ice_tax_glacier"]);
    expect(first.strategyPortfolio?.activeStrategyId).toBe(
      "corp.remote_scoring",
    );
    expect(continued.transition).toMatchObject({
      status: "continued",
      reason: "same_primary_strategy",
      previousStrategyId: "corp.remote_scoring",
    });
    expect(continued.commitment.decisionsCommitted).toBe(2);
  });

  it.each([
    ["corp.action_tempo", "corp_action_tempo", "scoreline", 0],
    ["corp.overadvance_value", "corp_overadvance", "scoreline", 5],
    ["corp.draw_engine", "corp_draw_engine", "none", 0],
    ["corp.deck_recycle_engine", "corp_recycle_engine", "none", 0],
  ] as const)(
    "models %s as a fully classified runtime intent",
    (strategyId, family, targetKind, reserveRequired) => {
      const state = buildStrategicIntentState({
        side: "corp",
        stateVersion: 24,
        strategyProfile: profile("corp", {
          primary: [strategyId],
          scores: {
            [strategyId]: score({
              anchor: 80,
              support: 80,
              final: 80,
              confidence: "high",
            }),
          },
        }),
        availableCredits: 8,
      });

      expect(state.primaryStrategy).toMatchObject({ strategyId, family });
      expect(state.targetVector.kind).toBe(targetKind);
      expect(state.targetVector.evidence).toContain(
        `target_from_strategy:${strategyId}`,
      );
      expect(state.targetVector.evidence.join("|")).not.toContain("unknown");
      expect(state.reserve.required).toBe(reserveRequired);
      expect(state.phase).not.toBe("recover");
    },
  );

  it("holds the previous strategy until minimum commitment is met", () => {
    const first = buildStrategicIntentState({
      side: "runner",
      stateVersion: 30,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 70,
            support: 70,
            final: 70,
            confidence: "high",
          }),
        },
      }),
      availableCredits: 8,
    });
    const held = buildStrategicIntentState({
      side: "runner",
      stateVersion: 31,
      strategyProfile: profile("runner", {
        primary: ["runner.hq_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 70,
            support: 70,
            final: 70,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 95,
            support: 95,
            final: 95,
            confidence: "high",
          }),
        },
      }),
      previousState: first,
      availableCredits: 8,
    });

    expect(held.primaryStrategy.strategyId).toBe("runner.rnd_pressure");
    expect(held.transition).toMatchObject({
      status: "continued",
      reason: "min_commitment_not_met",
      previousStrategyId: "runner.rnd_pressure",
    });
    expect(held.transition.evidence).toContain(
      "held_candidate:runner.hq_pressure",
    );
    expect(held.strategyPortfolio?.activeStrategyId).toBe(
      "runner.rnd_pressure",
    );
    expect(
      held.strategyPortfolio?.productiveCandidates.map(
        (candidate) => candidate.strategyId,
      ),
    ).toEqual(["runner.rnd_pressure", "runner.hq_pressure"]);
  });

  it("lets a current phase revalidation replace a provisional initial selection only above the switch margin", () => {
    const first = buildStrategicIntentState({
      side: "runner",
      stateVersion: 30,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 70,
            support: 70,
            final: 70,
            confidence: "high",
          }),
        },
      }),
      availableCredits: 8,
    });
    const belowMargin = buildStrategicIntentState({
      side: "runner",
      stateVersion: 31,
      strategyProfile: profile("runner", {
        primary: ["runner.hq_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 90,
            support: 90,
            final: 90,
            confidence: "high",
          }),
        },
      }),
      previousState: first,
      availableCredits: 8,
      revalidation: {
        observedAtStateVersion: 31,
        reason: "phase_change",
        evidenceCodes: ["setup_phase_completed"],
      },
    });
    const aboveMargin = buildStrategicIntentState({
      side: "runner",
      stateVersion: 31,
      strategyProfile: profile("runner", {
        primary: ["runner.hq_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 95,
            support: 95,
            final: 95,
            confidence: "high",
          }),
        },
      }),
      previousState: first,
      availableCredits: 8,
      revalidation: {
        observedAtStateVersion: 31,
        reason: "phase_change",
        evidenceCodes: ["setup_phase_completed"],
      },
    });

    expect(belowMargin.primaryStrategy.strategyId).toBe("runner.rnd_pressure");
    expect(belowMargin.transition.reason).toBe("min_commitment_not_met");
    expect(aboveMargin.primaryStrategy.strategyId).toBe("runner.hq_pressure");
    expect(aboveMargin.transition).toMatchObject({
      status: "switched",
      reason: "primary_strategy_changed",
      previousStrategyId: "runner.rnd_pressure",
    });
    expect(aboveMargin.transition.evidence).toEqual(
      expect.arrayContaining([
        "revalidation:phase_change",
        "revalidation_evidence:setup_phase_completed",
      ]),
    );
  });

  it("documents completed Runner setup as invalidation before switching to pressure", () => {
    const searchProfile = profile("runner", {
      primary: ["runner.search.breaker"],
      scores: {
        "runner.search.breaker": score({
          anchor: 100,
          support: 100,
          final: 100,
          confidence: "high",
        }),
      },
    });
    const activeCoverage = [
      role("runner.breaker.wall", "active", ["installed:true"]),
      role("runner.breaker.code_gate", "active", ["installed:true"]),
      role("runner.breaker.sentry", "active", ["installed:true"]),
    ];
    const previous = buildStrategicIntentState({
      side: "runner",
      stateVersion: 32,
      strategyProfile: searchProfile,
      availableCredits: 8,
      roleStatuses: activeCoverage,
    });
    const pressureCandidate = {
      strategyId: "runner.rnd_pressure",
      family: "runner_central_pressure" as const,
      candidateRole: "secondary" as const,
      runtimeStatus: "productive" as const,
      runtimeBlockers: [],
      confidence: "high" as const,
      score: { anchor: 100, support: 100, final: 100 },
      selectionScore: 132,
      roleStatuses: activeCoverage,
      targetVector: {
        kind: "central" as const,
        targetId: "rd",
        evidence: ["runner_setup_complete_pressure_transition:true"],
      },
      reserve: {
        kind: "credits" as const,
        required: 4,
        available: 8,
        satisfied: true,
        evidence: ["reserve_satisfied:true"],
      },
      evidence: ["runtime_transition:runner_setup_complete"],
    };
    const switched = buildStrategicIntentState({
      side: "runner",
      stateVersion: 33,
      strategyProfile: searchProfile,
      previousState: previous,
      availableCredits: 8,
      preferredStrategyId: "runner.rnd_pressure",
      strategyPortfolio: {
        activeStrategyId: "runner.rnd_pressure",
        activeSelectionReason: "highest_runtime_portfolio_score",
        productiveCandidates: [pressureCandidate],
        blockedCandidates: [],
        evidence: ["test:completed_setup_pressure"],
      },
      roleStatuses: activeCoverage,
      targetVector: pressureCandidate.targetVector,
      reserveRequirement: pressureCandidate.reserve,
    });

    expect(switched.primaryStrategy).toMatchObject({
      strategyId: "runner.rnd_pressure",
      family: "runner_central_pressure",
      completeness: "complete",
    });
    expect(switched.phase).toBe("pressure");
    expect(switched.transition).toMatchObject({
      status: "switched",
      previousStrategyId: "runner.search.breaker",
    });
    expect(switched.transition.evidence).toEqual(
      expect.arrayContaining([
        "intent_selection_authority:invalidation",
        "intent_invalidation:runner_setup_completed",
      ]),
    );
  });

  it("does not promote blocked strategy scores into the active line", () => {
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 35,
      strategyProfile: profile("runner", {
        primary: ["runner.hq_pressure", "runner.rnd_pressure"],
        scores: {
          "runner.hq_pressure": score({
            anchor: 95,
            support: 95,
            final: 95,
            confidence: "high",
            runtimeStatus: "blocked",
            runtimeBlockers: ["missing_hq_payoff"],
          }),
          "runner.rnd_pressure": score({
            anchor: 70,
            support: 70,
            final: 70,
            confidence: "high",
          }),
        },
      }),
      availableCredits: 8,
    });

    expect(state.primaryStrategy.strategyId).toBe("runner.rnd_pressure");
    expect(
      state.strategyPortfolio?.productiveCandidates.map(
        (candidate) => candidate.strategyId,
      ),
    ).toEqual(["runner.rnd_pressure"]);
  });

  it("does not mutate intent from normal action-score fluctuation and switches only after explicit revalidation", () => {
    const first = buildStrategicIntentState({
      side: "runner",
      stateVersion: 40,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
        },
      }),
      availableCredits: 8,
    });
    const committed = buildStrategicIntentState({
      side: "runner",
      stateVersion: 41,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
        },
      }),
      previousState: first,
      availableCredits: 8,
    });
    const fluctuated = buildStrategicIntentState({
      side: "runner",
      stateVersion: 42,
      strategyProfile: profile("runner", {
        primary: ["runner.hq_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 95,
            support: 95,
            final: 95,
            confidence: "high",
          }),
        },
      }),
      previousState: committed,
      availableCredits: 8,
    });
    const switched = buildStrategicIntentState({
      side: "runner",
      stateVersion: 43,
      strategyProfile: profile("runner", {
        primary: ["runner.hq_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
          "runner.hq_pressure": score({
            anchor: 95,
            support: 95,
            final: 95,
            confidence: "high",
          }),
        },
      }),
      previousState: fluctuated,
      availableCredits: 8,
      revalidation: {
        observedAtStateVersion: 43,
        reason: "new_information",
        evidenceCodes: ["new_public_server_information"],
      },
    });

    expect(committed.commitment.decisionsCommitted).toBe(2);
    expect(fluctuated.primaryStrategy.strategyId).toBe("runner.rnd_pressure");
    expect(fluctuated.transition).toMatchObject({
      status: "continued",
      reason: "revalidation_not_triggered",
      previousStrategyId: "runner.rnd_pressure",
    });
    expect(switched.primaryStrategy.strategyId).toBe("runner.hq_pressure");
    expect(switched.transition).toMatchObject({
      status: "switched",
      reason: "primary_strategy_changed",
      previousStrategyId: "runner.rnd_pressure",
    });
    expect(switched.transition.evidence).toEqual(
      expect.arrayContaining([
        "revalidation:new_information",
        "revalidation_evidence:new_public_server_information",
      ]),
    );
  });

  it.each([41, 43])(
    "fails closed when intent revalidation is not bound to current stateVersion 42 (observed %s)",
    (observedAtStateVersion) => {
      expect(() =>
        buildStrategicIntentState({
          side: "runner",
          stateVersion: 42,
          strategyProfile: profile("runner", {
            primary: ["runner.rnd_pressure"],
            scores: {
              "runner.rnd_pressure": score({
                anchor: 80,
                support: 80,
                final: 80,
                confidence: "high",
              }),
            },
          }),
          availableCredits: 8,
          revalidation: {
            observedAtStateVersion,
            reason: "phase_change",
            evidenceCodes: ["phase_changed"],
          },
        }),
      ).toThrowError("invalid_plan_identity");
    },
  );

  it("rejects action authority embedded in an intent revalidation trigger", () => {
    let failure: unknown;
    try {
      buildStrategicIntentState({
        side: "runner",
        stateVersion: 42,
        strategyProfile: profile("runner", {
          primary: ["runner.rnd_pressure"],
          scores: {
            "runner.rnd_pressure": score({
              anchor: 80,
              support: 80,
              final: 80,
              confidence: "high",
            }),
          },
        }),
        availableCredits: 8,
        revalidation: {
          observedAtStateVersion: 42,
          reason: "phase_change",
          evidenceCodes: ["phase_changed"],
          actionIds: ["runner.start_run.rd"],
        } as never,
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(PlanResolutionFailure);
    expect(
      (failure as PlanResolutionFailure).context.removalCondition,
    ).toContain("unexpected field actionIds");
  });

  it("abandons previous strategy when the current profile has no productive anchor", () => {
    const previous = buildStrategicIntentState({
      side: "runner",
      stateVersion: 50,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 80,
            support: 80,
            final: 80,
            confidence: "high",
          }),
        },
      }),
      availableCredits: 8,
    });
    const abandoned = buildStrategicIntentState({
      side: "runner",
      stateVersion: 51,
      previousState: previous,
      availableCredits: 8,
    });

    expect(abandoned.primaryStrategy.family).toBe("neutral");
    expect(abandoned.transition).toMatchObject({
      status: "abandoned",
      reason: "no_current_strategy_anchor",
      previousStrategyId: "runner.rnd_pressure",
    });
    expect(abandoned.transition.evidence).toEqual(
      expect.arrayContaining([
        "intent_selection_authority:invalidation",
        "intent_invalidation:candidate_has_no_current_anchor",
      ]),
    );
  });
});

function profile(
  side: "runner" | "corp",
  params: {
    primary: string[];
    secondary?: string[];
    scores: Record<string, DeckStrategyScore>;
  },
): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: `${side}-fixture`,
    side,
    cardCount: 10,
    strategyScores: params.scores,
    primaryStrategies: params.primary,
    secondaryStrategies: params.secondary ?? [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      activeHints: "effective-ai-hints:legacy-json+generated-card-spec-v1",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function score(params: {
  anchor: number;
  support: number;
  final: number;
  confidence: "low" | "medium" | "high";
  gaps?: string[];
  runtimeStatus?: DeckStrategyRuntimeStatus;
  runtimeBlockers?: string[];
}): DeckStrategyScore {
  return {
    anchorScore: params.anchor,
    supportScore: params.support,
    finalScore: params.final,
    confidence: params.confidence,
    runtimeStatus: params.runtimeStatus ?? "productive",
    runtimeBlockers: params.runtimeBlockers ?? [],
    supportGaps: params.gaps ?? [],
    anchorEvidence:
      params.anchor > 0
        ? [
            {
              cardId: "fixture-card",
              quantity: 1,
              source: "derivedStrategyAnchor",
              strategyId: "fixture.strategy",
              reason: "test",
            },
          ]
        : [],
    supportEvidence:
      params.support > 0
        ? [
            {
              cardId: "fixture-support",
              quantity: 1,
              source: "functionSignal",
              signal: "fixture.support",
              reason: "test",
            },
          ]
        : [],
  };
}

function role(
  roleId: string,
  status: StrategicRoleStatusSnapshot["status"],
  evidence: string[],
): StrategicRoleStatusSnapshot {
  return {
    roleId,
    status,
    source: "player_view",
    evidence,
  };
}
