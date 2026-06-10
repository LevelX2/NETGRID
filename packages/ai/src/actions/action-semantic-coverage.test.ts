import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  ACTION_SEMANTIC_COVERAGE_GROUPS,
  formatActionSemanticCandidateCoverageReport,
  summarizeActionSemanticCandidateCoverage,
} from "./action-semantic-coverage";

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
    expect(new Set(candidates.map((candidate) => candidate.actionId)).size).toBe(
      actions.length,
    );

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
    expect(report).toContain("## Coverage Groups");
    expect(report).not.toContain("runner-hidden-instance");
    expect(report).not.toContain("corp-hidden-instance");
    expect(report).not.toContain("sourceCardInstanceId");
    expect(report).not.toContain("privatePayload");
    expect(report).not.toContain("fullGameState");
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
