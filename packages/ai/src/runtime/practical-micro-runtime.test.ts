import { describe, expect, it } from "vitest";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type ActionType,
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import {
  applyPracticalMicroRuntimeComparator,
  type PracticalMicroCandidate,
} from "./practical-micro-runtime";

const legalAction = (
  actionId: string,
  type: ActionType = "install_card",
): LegalAction => ({
  actionId,
  side: "runner",
  type,
  label: actionId,
  source: "basic_action",
  timingPoint: "runner_action.main",
  costs: [],
  targetRequirements: [],
  visibility: "public",
  expiresAtStateVersion: 1,
});

const input = (legalActions: readonly LegalAction[]): AiDecisionInput => ({
  side: "runner",
  playerView: {
    side: "runner",
    stateVersion: 1,
    timingPoint: "runner_action.main",
    activeSide: "runner",
    phase: "runner_action_phase",
    own: {
      identity: visibleCard("runner-identity"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleCard("corp-identity"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions: [...legalActions],
    winner: null,
    agendaPointsToWin: 7,
  },
  eventTail: [],
  legalActions: [...legalActions],
  difficulty: "normal",
  seed: "ai213-test-seed",
  decisionId: "ai213-test-decision",
  actionNumber: 1,
  profileId: "ai213-test-profile",
});

const visibleCard = (cardId: string): VisibleCard => ({
  instanceId: `${cardId}-instance`,
  definitionId: cardId,
  title: cardId,
  type: "identity",
  known: true,
  owner: "runner",
  controller: "runner",
});

const runtimeDecision: AiDecision = {
  actionId: "runtime-action",
  selectedChoices: { targetId: "stale-choice" },
  reasonCode: "runtime",
  explanation: "Runtime reference.",
  consideredActionIds: ["runtime-action"],
  fallbackUsed: false,
  evidence: ["runtime_evidence"],
  decisionDebug: {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: 1,
    fallbackUsed: false,
  },
};

const candidate: PracticalMicroCandidate = {
  ruleId: "runner_visible_coverage_install",
  actionId: "candidate-action",
  actionType: "install",
  reasonCode: "practical_micro_runner_visible_coverage_install",
  explanation: "Install visible coverage before drifting.",
  evidence: ["candidate_evidence"],
};

describe("applyPracticalMicroRuntimeComparator", () => {
  it("leaves runtime decisions unchanged while the practical micro runtime is off", () => {
    const actual = applyPracticalMicroRuntimeComparator(
      input([legalAction("runtime-action"), legalAction("candidate-action")]),
      runtimeDecision,
      {},
      [candidate],
    );

    expect(actual).toBe(runtimeDecision);
  });

  it("records compare evidence without changing the selected action", () => {
    const actual = applyPracticalMicroRuntimeComparator(
      input([legalAction("runtime-action"), legalAction("candidate-action")]),
      runtimeDecision,
      {
        practicalMicroRuntime: {
          mode: "compare",
          enabledRules: ["runner_visible_coverage_install"],
        },
      },
      [candidate],
    );

    expect(actual.actionId).toBe("runtime-action");
    expect(actual.evidence).toContain("practical_micro_runtime_compare:true");
    expect(actual.evidence).toContain(
      "practical_micro_candidate:runner_visible_coverage_install",
    );
    expect(actual.decisionDebug?.detailSections?.at(-1)?.items).toEqual(
      expect.arrayContaining([
        "runtime_action:runtime-action",
        "micro_candidate:runner_visible_coverage_install:candidate-action",
      ]),
    );
  });

  it("keeps apply-mode candidates compare-only when they are present in legalActions", () => {
    const actual = applyPracticalMicroRuntimeComparator(
      input([legalAction("runtime-action"), legalAction("candidate-action")]),
      runtimeDecision,
      {
        practicalMicroRuntime: {
          mode: "apply",
          enabledRules: ["runner_visible_coverage_install"],
        },
      },
      [candidate],
    );

    expect(actual.actionId).toBe("runtime-action");
    expect(actual.selectedChoices).toEqual({ targetId: "stale-choice" });
    expect(actual.reasonCode).toBe("runtime");
    expect(actual.consideredActionIds).toEqual(["runtime-action"]);
    expect(actual.evidence).toEqual(
      expect.arrayContaining([
        "candidate_evidence",
        "practical_micro_runtime_compare:true",
        "practical_micro_runtime_apply_requested:true",
        "practical_micro_runtime_actual_override:false",
        "practical_micro_candidate:runner_visible_coverage_install",
        "practical_micro_runtime_reference:runtime-action",
      ]),
    );
    expect(actual.decisionDebug?.detailSections?.at(-1)?.items).toEqual(
      expect.arrayContaining([
        "micro_candidate:runner_visible_coverage_install:candidate-action",
        "apply_requested:true",
        "actual_override:false",
      ]),
    );
  });

  it("does not apply candidates outside legalActions", () => {
    const actual = applyPracticalMicroRuntimeComparator(
      input([legalAction("runtime-action")]),
      runtimeDecision,
      {
        practicalMicroRuntime: {
          mode: "apply",
          enabledRules: ["runner_visible_coverage_install"],
        },
      },
      [candidate],
    );

    expect(actual.actionId).toBe("runtime-action");
    expect(actual.evidence).toContain("practical_micro_candidate:none");
    expect(actual.decisionDebug?.warnings).toContain(
      "practical_micro_no_candidate",
    );
  });

  it("keeps comparator diagnostics free of known hidden transport fields", () => {
    const actual = applyPracticalMicroRuntimeComparator(
      input([legalAction("runtime-action"), legalAction("candidate-action")]),
      runtimeDecision,
      {
        practicalMicroRuntime: {
          mode: "compare",
          enabledRules: ["runner_visible_coverage_install"],
        },
      },
      [candidate],
    );

    expect(JSON.stringify(actual)).not.toMatch(
      /cardInstances|privatePayload|fullGameState|sessionToken|reconnectToken|joinToken/i,
    );
  });
});
