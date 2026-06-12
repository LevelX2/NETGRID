import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState, LegalAction, Side } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildActionSemanticCandidates,
  type ActionSemanticCandidate,
} from "../action-semantic-candidate";
import {
  ACTION_SEMANTIC_COVERAGE_GROUPS,
  type ActionSemanticCandidateCoverageSummary,
  formatActionSemanticCandidateCoverageReport,
  summarizeActionSemanticCandidateCoverage,
} from "./action-semantic-coverage";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

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

describe("Action semantic coverage", () => {
  it("projects every LegalAction type with identity, gates, visibility, cost, timing and evidence", () => {
    const actions = ALL_ACTION_TYPES.map((type, index) =>
      legalAction(type, index),
    );

    const candidates = buildActionSemanticCandidates({
      legalActions: actions,
      observerSide: "system",
      stateVersion: 108,
    });

    expect(candidates).toHaveLength(actions.length);
    expect(
      new Set(candidates.map((candidate) => candidate.actionId)).size,
    ).toBe(actions.length);

    for (const [index, candidate] of candidates.entries()) {
      const action = actions[index];
      if (!action) throw new Error(`Missing action fixture ${index}`);

      expect(candidate.actionId).toBe(action.actionId);
      expect(candidate.actionType).toBe(action.type);
      expect(candidate.actorSide).toBe(action.side);
      expect(candidate.observerSide).toBe("system");
      expect(candidate.stateVersion).toBe(108);
      expect(candidate.legalActionRef).toEqual({
        actionId: action.actionId,
        actionType: action.type,
        originalPayloadKeys: Object.keys(action.payload ?? {}).sort(),
      });
      expect(candidate.visibilityScope).toBe(
        action.visibility === "public" ? "public" : "actor_private",
      );
      expect(candidate.costProfile.costKnownStatus).toMatch(
        /^(known|not_applicable|unknown)$/,
      );
      expect(Array.isArray(candidate.costProfile.additionalCosts)).toBe(true);
      expect(candidate.timingProfile.window).toBe(action.timingPoint);
      expect(candidate.primaryProjectionStatus).toMatch(
        /^(projected|neutral_projected|partial_projected|blocked|schema_gap|hidden_info_blocked)$/,
      );
      expect(candidate.hardGates.map((gate) => gate.gateId).sort()).toEqual([
        "ability_resolution",
        "cost_known",
        "engine_legal_action",
        "hidden_info",
        "runtime_no_effect",
        "side_visibility",
        "source_resolution",
        "target_context",
        "timing_known",
      ]);
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
            gateId: "timing_known",
            status: "pass",
          }),
        ]),
      );
      expect(candidate.evidence).toEqual(
        expect.arrayContaining([
          "AI036 neutral projection",
          "AI040 cost/timing profile normalized",
        ]),
      );
    }
  });

  it("keeps central BasicActions projected without card source or ability joins", () => {
    const actions = [
      legalAction("gain_credit", 0, { source: "basic_action" }),
      legalAction("draw_card", 1, { source: "basic_action" }),
      legalAction("start_run", 2, {
        source: "basic_action",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            side: "corp",
            visibility: "public",
          },
        ],
      }),
      legalAction("resolve_choice", 3, { source: "game_rule" }),
      legalAction("end_turn", 4, { source: "game_rule" }),
    ];

    const candidates = buildActionSemanticCandidates({
      legalActions: actions,
      availableTargetsByActionId: {
        "coverage-2-start_run": [
          {
            targetId: "hq",
            targetKind: "server",
            targetSide: "corp",
            evidence: ["coverage fixture legal server"],
          },
        ],
      },
    });

    expect(
      candidates.map((candidate) => ({
        actionType: candidate.actionType,
        semanticActionType: candidate.semanticActionType,
        sourceKind: candidate.sourceKind,
        status: candidate.primaryProjectionStatus,
      })),
    ).toEqual([
      {
        actionType: "gain_credit",
        semanticActionType: "economy.gain_credit",
        sourceKind: "basic_action",
        status: "projected",
      },
      {
        actionType: "draw_card",
        semanticActionType: "draw.card",
        sourceKind: "basic_action",
        status: "projected",
      },
      {
        actionType: "start_run",
        semanticActionType: "run.start",
        sourceKind: "basic_action",
        status: "projected",
      },
      {
        actionType: "resolve_choice",
        semanticActionType: "choice.resolve",
        sourceKind: "choice",
        status: "partial_projected",
      },
      {
        actionType: "end_turn",
        semanticActionType: "turn_flow.end_turn",
        sourceKind: "game_rule",
        status: "projected",
      },
    ]);

    for (const candidate of candidates) {
      expect(candidate.sourceCardId).toBeUndefined();
      expect(candidate.sourceCardInstanceId).toBeUndefined();
      expect(candidate.sourceDefinitionId).toBeUndefined();
      expect(candidate.projectionIssues).not.toContain(
        "card_semantics_unavailable",
      );
      expect(candidate.hardGates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            gateId: "ability_resolution",
            status: "not_applicable",
          }),
        ]),
      );
    }
    expect(candidates[2]?.targetContext?.availableTargetsStatus).toBe(
      "engine_provided",
    );
  });

  it("projects real Engine LegalActions without leaking hidden payload values", () => {
    const realActions = collectRealEngineLegalActions();
    const realTypes = new Set(realActions.map((action) => action.type));
    expect([...realTypes]).toEqual(
      expect.arrayContaining([
        "mandatory_draw",
        "gain_credit",
        "draw_card",
        "install_card",
        "play_operation",
        "end_turn",
        "resolve_choice",
        "play_event",
        "start_run",
        "access_card",
      ]),
    );

    const candidates = buildActionSemanticCandidates({
      legalActions: realActions,
      observerSide: "system",
      stateVersion: 209,
    });

    expect(candidates).toHaveLength(realActions.length);
    for (const [index, candidate] of candidates.entries()) {
      const action = realActions[index];
      if (!action) throw new Error(`Missing real Engine action ${index}`);

      expect(candidate.actionId).toBe(action.actionId);
      expect(candidate.legalActionRef.actionId).toBe(action.actionId);
      expect(candidate.legalActionRef.actionType).toBe(action.type);
      expect(candidate.legalActionRef.originalPayloadKeys).toEqual(
        Object.keys(action.payload ?? {}).sort(),
      );
      expect(candidate.timingProfile.window).toBe(action.timingPoint);
      expect(candidate.costProfile.costKnownStatus).toMatch(
        /^(known|not_applicable|unknown)$/,
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
        ]),
      );

      if (action.source === "basic_action" || action.source === "game_rule") {
        expect(candidate.sourceCardId).toBeUndefined();
        expect(candidate.sourceCardInstanceId).toBeUndefined();
        expect(candidate.sourceDefinitionId).toBeUndefined();
      }

      expect(JSON.stringify(candidate)).not.toMatch(
        /privatePayload|cardInstances|fullGameState|secretRunnerHandIds|secretGripIds/i,
      );
    }
  });

  it("summarizes candidate coverage by required fields without leaking card instance data", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("gain_credit", 0, { source: "basic_action" }),
        legalAction("resolve_choice", 1, { source: "game_rule" }),
        legalAction("start_run", 2, {
          source: "basic_action",
          targetRequirements: [
            {
              id: "server",
              kind: "server",
              side: "corp",
              visibility: "public",
            },
          ],
        }),
        legalAction("access_card", 3, { source: "game_rule" }),
        legalAction("trigger_ability", 4, {
          side: "runner",
          source: "runner-hidden-instance",
          abilityRef: {
            sourceCardInstanceId: "runner-hidden-instance",
            abilityId: "runner.visible.ability",
          },
          payload: { sourceDefinitionId: "runner-visible-definition" },
        }),
        legalAction("install_card", 5, {
          side: "corp",
          source: "corp-hidden-instance",
          payload: { sourceDefinitionId: "corp-visible-definition" },
        }),
        legalAction("advance_card", 6, {
          side: "corp",
          source: "basic_action",
        }),
        legalAction("score_agenda", 7, {
          side: "corp",
          source: "game_rule",
        }),
        legalAction("rez_ice", 8, {
          side: "corp",
          source: "game_rule",
          timingPoint: "run.encounter_ice",
        }),
      ],
      availableTargetsByActionId: {
        "coverage-2-start_run": [
          {
            targetId: "hq",
            targetKind: "server",
            targetSide: "corp",
            evidence: ["coverage fixture legal server"],
          },
        ],
      },
    });

    const summary = summarizeActionSemanticCandidateCoverage(candidates);
    const report = formatActionSemanticCandidateCoverageReport(summary);

    expect(summary.version).toBe("action-semantic-candidate-coverage-v1");
    expect(summary.totalCandidates).toBe(candidates.length);
    expect(summary.redactionSafe).toBe(true);
    expect(summary.forbiddenMarkers).toEqual([]);
    expect(summary.fieldCoverage).toMatchObject({
      hasSourceCardId: 2,
      hasAbilityId: 1,
      hasTimingProfile: candidates.length,
      hasTargetContext: 1,
      redactionSafe: candidates.length,
    });
    for (const group of ACTION_SEMANTIC_COVERAGE_GROUPS) {
      expect(summary.groups[group]).toBeGreaterThan(0);
    }
    expect(summary.targetContextByGroup.run_action.engine_provided).toBe(1);
    expect(summary.targetContextByGroup.install_action.missing).toBe(1);
    expect(report).toContain("## Coverage Groups");
    expect(report).toContain("## Target Context By Group");
    expect(report).not.toContain("runner-hidden-instance");
    expect(report).not.toContain("corp-hidden-instance");
    expect(report).not.toContain("sourceCardInstanceId");
    expect(report).not.toContain("privatePayload");
    expect(report).not.toContain("fullGameState");
  });

  it("matches the checked-in ActionSemanticCandidate coverage report", () => {
    const candidates = coverageReportFixtureCandidates();
    const summary = summarizeActionSemanticCandidateCoverage(candidates);
    const artifact = coverageReportArtifact(summary);
    const checkedInReport = JSON.parse(
      readFileSync(
        path.join(
          repoRoot,
          "docs/reviews/ai/action-semantic-candidate-coverage-2026-06-12.json",
        ),
        "utf8",
      ),
    );

    expect(artifact).toEqual(checkedInReport);
    expect(summary.fieldCoverage.hasPrimitiveKind).toBe(1);
    expect(summary.fieldCoverage.hasEffectKind).toBe(1);
    expect(summary.hiddenInfoBlockers).toBe(1);
    expect(summary.schemaGaps).toMatchObject({
      target_context_unavailable: 6,
    });
    expect(formatActionSemanticCandidateCoverageReport(summary)).toContain(
      "## Projection Issues",
    );

    const serialized = JSON.stringify(artifact);
    expect(serialized).not.toContain("sourceCardInstanceId");
    expect(serialized).not.toContain("runner-hidden-instance");
    expect(serialized).not.toContain("corp-hidden-instance");
    expect(serialized).not.toContain("privatePayload");
    expect(serialized).not.toContain("fullGameState");
  });
});

function legalAction(
  type: LegalAction["type"],
  index: number,
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: `coverage-${index}-${type}`,
    side: index % 2 === 0 ? "runner" : "corp",
    type,
    label: `Coverage fixture ${type}`,
    source: defaultSourceFor(type),
    timingPoint: index % 2 === 0 ? "runner_action.main" : "corp_action.main",
    costs: costFor(index),
    targetRequirements: [],
    visibility: index % 2 === 0 ? "public" : "private_to_actor",
    expiresAtStateVersion: 109,
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

  return `card-instance-${type}`;
}

function costFor(index: number): LegalAction["costs"] {
  if (index % 3 === 0) return [{ clicks: 1 }];
  if (index % 3 === 1) return [{ credits: 2 }];
  return [];
}

function coverageReportFixtureCandidates(): ActionSemanticCandidate[] {
  return buildActionSemanticCandidates({
    legalActions: [
      legalAction("gain_credit", 0, { source: "basic_action" }),
      legalAction("resolve_choice", 1, { source: "game_rule" }),
      legalAction("start_run", 2, {
        source: "basic_action",
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            side: "corp",
            visibility: "public",
          },
        ],
      }),
      legalAction("access_card", 3, { source: "game_rule" }),
      legalAction("resolve_choice", 4, {
        source: "game_rule",
        visibility: "private_to_actor",
        payload: {
          sourceCardId: "runner-hidden-instance",
          sourceDefinitionId: "onr_proteus_136_credit-subversion",
          cardImplementationAbilityId:
            "onr_proteus_136_credit-subversion:successful_run_before_access:0",
          cardImplementationAbilityKey: "successful_run_before_access:0",
          cardImplementationPrimitiveKind:
            "successful_run_before_access_effect",
          cardImplementationEffectKind: "corp_lose_credits",
        },
      }),
      legalAction("trigger_ability", 5, {
        side: "runner",
        source: "runner-hidden-instance",
        abilityRef: {
          sourceCardInstanceId: "runner-hidden-instance",
          abilityId: "runner.visible.ability",
        },
        payload: { sourceDefinitionId: "runner-visible-definition" },
      }),
      legalAction("install_card", 6, {
        side: "corp",
        source: "corp-hidden-instance",
        payload: { sourceDefinitionId: "corp-visible-definition" },
      }),
      legalAction("advance_card", 7, {
        side: "corp",
        source: "basic_action",
      }),
      legalAction("score_agenda", 8, {
        side: "corp",
        source: "game_rule",
      }),
      legalAction("rez_ice", 9, {
        side: "corp",
        source: "game_rule",
        timingPoint: "run.encounter_ice",
      }),
      legalAction("trash_resource", 10, {
        source: "basic_action",
        targetRequirements: [
          {
            id: "resource",
            kind: "card",
            side: "runner",
            visibility: "engine_only",
          },
        ],
      }),
    ],
    observerSide: "system",
    stateVersion: 612,
    availableTargetsByActionId: {
      "coverage-2-start_run": [
        {
          targetId: "hq",
          targetKind: "server",
          targetSide: "corp",
          evidence: ["coverage report fixture legal server"],
        },
      ],
    },
  });
}

function coverageReportArtifact(
  summary: ActionSemanticCandidateCoverageSummary,
): unknown {
  return {
    schemaVersion: "action-semantic-candidate-coverage-report-v2",
    date: "2026-06-12",
    status: "done",
    runtimeConsumerStatus: "none",
    source: {
      builder:
        "packages/ai/src/actions/action-semantic-coverage.ts:summarizeActionSemanticCandidateCoverage",
      fixture:
        "packages/ai/src/actions/action-semantic-coverage.test.ts:coverageReportFixtureCandidates",
    },
    metrics: {
      totalCandidates: summary.totalCandidates,
      sources: summary.sourceKinds,
      abilities: {
        hasAbilityId: summary.fieldCoverage.hasAbilityId,
      },
      primitives: {
        hasPrimitiveKind: summary.fieldCoverage.hasPrimitiveKind,
        hasEffectKind: summary.fieldCoverage.hasEffectKind,
      },
      costs: {
        hasCostProfile: summary.fieldCoverage.hasCostProfile,
      },
      timing: {
        hasTimingProfile: summary.fieldCoverage.hasTimingProfile,
      },
      targetContext: {
        hasTargetContext: summary.fieldCoverage.hasTargetContext,
        statuses: summary.targetContextStatuses,
        byGroup: summary.targetContextByGroup,
      },
      hiddenInfoBlockers: summary.hiddenInfoBlockers,
      schemaGaps: summary.schemaGaps,
      projectionIssues: summary.projectionIssues,
      projectionStatuses: summary.primaryProjectionStatuses,
      coverageGroups: summary.groups,
      neutralFallbacks: summary.fieldCoverage.usesNeutralFallback,
      redaction: {
        safe: summary.redactionSafe,
        unsafeRows: summary.redactionUnsafeRows,
        forbiddenMarkers: summary.forbiddenMarkers,
      },
    },
    gates: {
      deterministic: true,
      hiddenInfoLeaks: summary.redactionSafe ? 0 : summary.redactionUnsafeRows,
      runtimeBehaviorChanges: 0,
      actionSelectionChanges: 0,
      legalActionGenerationChanges: 0,
    },
    noEffectFlags: [
      "no_runtime_scoring",
      "no_action_selection",
      "no_legal_action_generation",
      "no_hidden_info_projection",
      "report_only",
    ],
  };
}

function collectRealEngineLegalActions(): LegalAction[] {
  let state = createGameAfterSetup({
    seed: "r2-real-engine-legal-action-coverage",
  });
  const actions: LegalAction[] = [];
  collectActiveActions(state, actions);

  state = applyRealAction(
    state,
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  collectActiveActions(state, actions);

  state = applyRealAction(
    state,
    "corp",
    (action) => action.type === "end_turn",
  );
  collectActiveActions(state, actions);

  if (state.pendingChoice?.source === "discard_phase") {
    const selectedOptionId = state.pendingChoice.options[0]?.id;
    if (!selectedOptionId) throw new Error("Missing discard choice option");
    state = applyRealAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
      {
        choiceId: state.pendingChoice.choiceId,
        selectedOptionIds: [String(selectedOptionId)],
      },
    );
  }
  collectActiveActions(state, actions);

  state = applyRealAction(
    state,
    "runner",
    (action) =>
      action.type === "start_run" &&
      (action.payload?.serverId === "hq" ||
        action.label.toLowerCase().includes("hq")),
  );
  collectActiveActions(state, actions);

  return actions;
}

function collectActiveActions(state: GameState, target: LegalAction[]): void {
  target.push(...getLegalActions(state, state.activeSide));
}

function applyRealAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
  selectedChoices?: {
    choiceId: string;
    selectedOptionIds: string[];
  },
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) {
    throw new Error(
      `Missing real action. Legal: ${getLegalActions(state, side)
        .map((candidate) => `${candidate.type}:${candidate.label}`)
        .join(", ")}`,
    );
  }
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
    idempotencyKey: `r2-${side}-${state.stateVersion}-${action.actionId}`,
  });
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.state;
}
