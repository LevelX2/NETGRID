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
    expect(install.sourceKind).toBe("unknown");
    expect(install.primaryProjectionStatus).toBe("partial_projected");
    expect(install.projectionIssues).toEqual(["target_context_unavailable"]);

    expect(breakSubroutine.semanticActionType).toBe(
      "breaker.break_subroutine",
    );
    expect(breakSubroutine.sourceKind).toBe("unknown");
    expect(breakSubroutine.projectionIssues).toEqual([
      "ability_unresolved",
      "target_context_unavailable",
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
