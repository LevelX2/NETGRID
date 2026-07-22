import { afterEach, describe, expect, it } from "vitest";
import { chooseCorpAction } from "./index";
import * as aiPublicApi from "./index";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildSemanticDecisionFrame } from "./decision/semantic-decision-frame";
import { buildSemanticShadowDecision } from "./decision/semantic-shadow-decision";
import { buildDeckDoctrineV2Diagnostic } from "./deck-doctrine-strategy";
import { buildRealEngineDecisionCorpusScenarios } from "./evaluation/real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./evaluation/real-engine-decision-corpus";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
} from "./decision/pilot-scope-registry";
import { resetTacticalPlanMemory } from "./tactical-plans";
import {
  chooseSemanticRuntimeAction,
  type SemanticRuntimeDependencies,
} from "./runtime/semantic-runtime";
import type { LegalAction } from "@netgrid/shared";
import {
  aiInput,
  legalAction,
  semanticRuntimeDependenciesWithoutRunTargetEvaluation,
  server,
  visibleCard,
} from "./semantic-ai-runtime-cutover.test-support";

function semanticRuntimeDependencies(
  ...args: Parameters<
    typeof semanticRuntimeDependenciesWithoutRunTargetEvaluation
  >
): SemanticRuntimeDependencies {
  return {
    ...semanticRuntimeDependenciesWithoutRunTargetEvaluation(...args),
    evaluateRunnerRunTargets: () => [],
  } as SemanticRuntimeDependencies;
}

describe("Semantic AI runtime cutover — fallback and diagnostic boundaries", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  const originalPilotMode = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  const originalLocalDefaultMode =
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];

  afterEach(() => {
    resetTacticalPlanMemory();
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
    if (originalPilotMode === undefined) {
      delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_PILOT_ENV] = originalPilotMode;
    }
    if (originalLocalDefaultMode === undefined) {
      delete process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV] =
        originalLocalDefaultMode;
    }
  });

  it("represents a corp rez window as a rez defense plan", () => {
    const input = aiInput("corp", [
      legalAction(
        "rez-outer",
        "corp",
        "rez_ice",
        "Rez outer ICE",
        { credits: 3 },
        { source: "outer-ice", payload: { serverId: "remote_1" } },
      ),
      legalAction("decline-rez", "corp", "decline_rez", "Decline rez", {
        credits: 0,
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [visibleCard("outer-ice", "corp", "ice")]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("rez-outer");
    expect(decision.decisionDebug?.planKind).toBe("corp.rez_defense");
    expect(decision.evidence).toContain("tactical_step:rez_outer_ice");
  });

  it("uses semantic coverage fallback instead of legacy when no choice is selectable", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);

    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies([], {
        initiallySelectedActionId: "none",
      }),
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_coverage_fallback:true",
        "fallback_reason:no_semantic_candidate",
        "fallback_action_policy:economy_basic",
      ]),
    );
    expect(decision.decisionDebug?.whyNot).toEqual(
      expect.arrayContaining([
        "fallback_reason:no_semantic_candidate",
        "fallback_action_policy:economy_basic",
        "fallback_candidate_count:2",
        "fallback_choice_count:0",
        "fallback_action_type:gain_credit",
        "fallback_action_id:gain-credit",
      ]),
    );
  });

  it("uses a fail-closed fallback for a sole legal Runner start-run action", () => {
    const input = aiInput("runner", [
      legalAction(
        "forced-run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        {
          source: "game_rule",
          payload: { serverId: "rd", effectKind: "run" },
        },
      ),
    ]);
    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies([], {
        initiallySelectedActionId: "none",
      }),
    );

    expect(decision.actionId).toBe("forced-run-rd");
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.evidence).toContain(
      "fallback_action_policy:required_run_start",
    );
  });

  it("fails closed for a sole Armageddon replacement instead of masking a coverage gap", () => {
    const input = aiInput("runner", [
      legalAction(
        "armageddon-doom",
        "runner",
        "trigger_ability",
        "Armageddon: Doom-Counter statt Zugriff",
        { credits: 0 },
        {
          source: "armageddon-instance",
          payload: {
            cardId: "armageddon-instance",
            serverId: "rd",
            proteusRunnerVirusFollowup:
              "doom_counter_instead_of_rd_access",
            counterType: "doom",
            counterDelta: 1,
          },
        },
      ),
    ]);
    input.legalActions[0]!.costs = [];
    input.playerView.own.rig = [
      visibleCard("armageddon-instance", "runner", "program", {
        definitionId: "onr_proteus_078_armageddon",
      }),
    ];

    expect(() =>
      chooseSemanticRuntimeAction(
        input,
        {},
        semanticRuntimeDependencies([], {
          initiallySelectedActionId: "none",
        }),
      ),
    ).toThrow(
      "Semantic coverage has no fail-closed fallback for runner: trigger_ability",
    );
  });

  it("fails closed when semantic coverage has only opaque card actions", () => {
    const input = aiInput("corp", [
      legalAction(
        "opaque-card",
        "corp",
        "activated_card_ability",
        "Opaque",
        {
          credits: 0,
        },
        {
          source: "unknown-card-instance",
        },
      ),
    ]);

    expect(() =>
      chooseSemanticRuntimeAction(
        input,
        {},
        semanticRuntimeDependencies([], {
          initiallySelectedActionId: "none",
        }),
      ),
    ).toThrow(/no fail-closed fallback for corp: activated_card_ability/);
  });

  it("does not expose shadow-only diagnostics through the public AI runtime API", () => {
    const exportedKeys = Object.keys(aiPublicApi);

    expect(exportedKeys).not.toContain("buildSemanticShadowDecision");
    expect(exportedKeys).not.toContain("buildDeckDoctrineV2Diagnostic");
    expect(exportedKeys).not.toContain("buildRealEngineDecisionCorpus");
    expect(exportedKeys).not.toContain("buildSemanticDecisionFrame");
  });

  it("keeps ActionSemanticCandidate as a projection instead of LegalAction generation", () => {
    const action = legalAction(
      "gain-credit",
      "runner",
      "gain_credit",
      "Gain 1",
      {
        credits: 0,
      },
    );
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 1,
    });

    expect(candidate?.actionId).toBe(action.actionId);
    expect(candidate).not.toHaveProperty("legalAction");
    expect(candidate).not.toHaveProperty("legalActions");
    expect(JSON.stringify(candidate)).not.toContain("applyAction");
  });

  it("keeps SemanticShadowDecision and DeckDoctrine v2 as no-effect diagnostics", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });
    const trace = buildSemanticShadowDecision(frame);
    const doctrine = buildDeckDoctrineV2Diagnostic({
      deckSnapshotId: "cutover-shadow-only-runner",
      side: "runner",
      cards: [{ cardId: "simple_run_event", quantity: 3 }],
    });
    const corpus = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );

    expect(trace.noRuntimeEffect).toBe(true);
    expect(trace.selectedActionId).toBeUndefined();
    expect(doctrine.scope).toBe("diagnostic_only");
    expect(doctrine.productiveUseAllowed).toBe(false);
    expect(corpus.every((sample) => sample.trace.noRuntimeEffect)).toBe(true);
    expect(
      corpus.every((sample) => sample.trace.selectedActionId === undefined),
    ).toBe(true);
  });
});
