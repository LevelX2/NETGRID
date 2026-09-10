import { describe, expect, it } from "vitest";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import type { RunnerAccessFacts } from "../access/runner-access-facts";
import type { CorpScoreProjectSignal } from "../plans/corp-core-plan-modules";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  accessCommitmentForEvaluation,
  reservedAccessTrashCredits,
  corpScoreProjectNeedsProtectionMaturity,
  uniqueScoreProjects,
} from "./plan-first-live-runtime";

function remoteRun() {
  const action = legalAction(
    "run-remote",
    "runner",
    "start_run",
    "Run",
    { credits: 0, clicks: 1 },
    { payload: { serverId: "remote_1" } },
  );
  const input = aiInput("runner", [action]);
  input.playerView.own.credits = 15;
  input.playerView.own.stackOrRdCount = 20;
  input.playerView.opponent.deckCount = 20;
  input.playerView.servers = [
    server(
      "remote_1",
      [],
      [
        visibleCard("known-root", "corp", "upgrade", {
          definitionId: "onr_v1_358_dr-dreff",
          title: "Dr. Dreff",
          rezzed: true,
          trashCost: 3,
        }),
      ],
    ),
  ];
  const [evaluation] = evaluateRunnerRunTargets({ input });
  if (!evaluation) throw new Error("Expected current remote run evaluation");
  return { input, evaluation };
}

describe("typed Runner access facts", () => {
  it("carries the producer's target and general-credit budget through run evaluation regardless of evidence text", () => {
    const { input, evaluation } = remoteRun();
    expect(evaluation).toMatchObject({
      actionId: "run-remote",
      accessPayoff: "trash_affordable",
      accessFacts: {
        knownTargetDefinitionIds: ["onr_v1_358_dr-dreff"],
        trashBudget: 3,
      },
    });
    const expected = accessCommitmentForEvaluation(input, evaluation);
    for (const evidence of [
      [],
      ["translated explanation"],
      [
        "hq_known_trash_definition:wrong-target",
        "known_remote_root_general_trash_cost:999",
        "known_remote_root_trash_cost:0",
        "central_memory_payoff:unknown",
      ],
    ]) {
      expect(
        accessCommitmentForEvaluation(input, { ...evaluation, evidence }),
      ).toEqual(expected);
    }
    expect(expected).toMatchObject({ intendedAction: "trash", trashBudget: 3 });
    expect(input.legalActions[0]?.actionId).toBe(evaluation.actionId);
  });

  it("distinguishes a certified zero budget, unknown costs and no trash objective", () => {
    const { input, evaluation } = remoteRun();
    const free = accessCommitmentForEvaluation(input, {
      ...evaluation,
      accessFacts: { ...evaluation.accessFacts, trashBudget: 0 },
    });
    expect(free).toMatchObject({ intendedAction: "trash", trashBudget: 0 });
    for (const trashBudget of ["unknown", "not_applicable"] as const) {
      const commitment = accessCommitmentForEvaluation(input, {
        ...evaluation,
        accessPayoff: "unknown",
        accessFacts: { knownTargetDefinitionIds: [], trashBudget },
      });
      expect(commitment.trashBudget).toBe(trashBudget);
      expect(commitment.intendedAction).toBe("access");
      expect(reservedAccessTrashCredits(input, commitment)).toBe(0);
      expect(() =>
        reservedAccessTrashCredits(input, {
          ...commitment,
          intendedAction: "trash",
        }),
      ).toThrow(PlanResolutionFailure);
    }
  });

  it.each([
    undefined,
    { knownTargetDefinitionIds: [], trashBudget: 3 },
    { knownTargetDefinitionIds: ["target"], trashBudget: "unknown" },
    { knownTargetDefinitionIds: ["target"], trashBudget: -1 },
    { knownTargetDefinitionIds: ["target"], trashBudget: Number.NaN },
  ])(
    "rejects missing or invalid trash facts even if evidence claims a valid budget: %j",
    (facts) => {
      const { input, evaluation } = remoteRun();
      expect(() =>
        accessCommitmentForEvaluation(input, {
          ...evaluation,
          accessFacts: facts as RunnerAccessFacts,
          evidence: [
            "hq_known_trash_definition:target",
            "hq_known_trash_cost:3",
          ],
        }),
      ).toThrow(PlanResolutionFailure);
      try {
        accessCommitmentForEvaluation(input, {
          ...evaluation,
          accessFacts: facts as RunnerAccessFacts,
        });
      } catch (error) {
        expect(error).toMatchObject({
          code: "missing_action_semantics",
          context: {
            owner: "plan_module",
            unresolvedActionIds: [evaluation.actionId],
            stateVersion: input.playerView.stateVersion,
          },
        });
      }
    },
  );
});

function project(
  overrides: Partial<CorpScoreProjectSignal> = {},
): CorpScoreProjectSignal {
  return {
    projectId: "agenda:agenda-1:remote_1",
    agendaInstanceId: "agenda-1",
    agendaPoints: 2,
    serverId: "remote_1",
    phase: "install_agenda",
    actionIds: ["install-agenda"],
    routeSemanticActionTypes: ["install.card"],
    sameTurnCloseout: false,
    terminalScore: false,
    feasible: false,
    evidenceCode: "explanation",
    ...overrides,
  };
}

describe("typed Corp protection and score proof", () => {
  it.each([
    "corp_score_horizon_unbounded",
    "corp_near_matchpoint_remote_maturity_required",
  ] as const)(
    "retains %s protection independently of text",
    (routeAssessment) => {
      expect(
        corpScoreProjectNeedsProtectionMaturity(
          project({ routeAssessment, evidenceCode: "" }),
        ),
      ).toBe(true);
      expect(
        corpScoreProjectNeedsProtectionMaturity(
          project({ routeAssessment, evidenceCode: "renamed" }),
        ),
      ).toBe(true);
      expect(
        corpScoreProjectNeedsProtectionMaturity(
          project({ evidenceCode: `${routeAssessment}:remote_1` }),
        ),
      ).toBe(false);
    },
  );

  it.each([false, true])(
    "prefers the exact conversion proof in either input order (%s)",
    (reverse) => {
      const direct = project({
        sameTurnCloseout: true,
        feasible: true,
        actionIds: ["direct"],
        evidenceCode: "corp_same_turn_score_conversion:forged",
      });
      const exact = project({
        sameTurnCloseout: true,
        feasible: true,
        actionIds: ["exact"],
        sameTurnConversionProof: "engine_quoted_path",
        evidenceCode: "renamed",
      });
      expect(
        uniqueScoreProjects(reverse ? [exact, direct] : [direct, exact]),
      ).toEqual([exact]);
      expect(
        uniqueScoreProjects([{ ...exact, sameTurnCloseout: false }, direct]),
      ).toEqual([direct]);
    },
  );

  it("merges equivalent action routes regardless of explanations, preserving target and proof boundaries", () => {
    const first = project({
      actionIds: ["a"],
      routeAssessment: "corp_funded_protected_score_install",
    });
    const second = {
      ...first,
      actionIds: ["b"],
      evidenceCode: "different explanation",
    };
    expect(uniqueScoreProjects([first, second])[0]?.actionIds).toEqual([
      "a",
      "b",
    ]);
    const incompatible = {
      ...second,
      advancementCounterChoiceBinding: {
        kind: "move_advancement" as const,
        sourceCardId: "source",
        targetCardId: "agenda-1",
        amount: 1,
      },
    };
    expect(uniqueScoreProjects([first, incompatible])[0]?.actionIds).toEqual([
      "a",
    ]);
    expect(
      uniqueScoreProjects([
        first,
        {
          ...second,
          projectId: "another-agenda",
          agendaInstanceId: "agenda-2",
        },
      ]),
    ).toHaveLength(2);
  });

  it("does not use nested protection evidence as a route compatibility key", () => {
    const first = project({
      actionIds: ["a"],
      protectionNeed: {
        needId: "protect-agenda-1",
        parentProjectId: "agenda:agenda-1:remote_1",
        targetServerId: "remote_1",
        observedAtStateVersion: 1,
        objective: {
          kind: "funded_remote_access_risk",
          maximumRunnerAccessSuccessProbability: {
            numerator: 0,
            denominator: 1,
          },
          policySource: "score_owner",
        },
        scoreReserve: { creditBreakdown: [], hardClickReserve: 0 },
        baseline: {
          knowledge: "unknown",
          unknownReason: "missing_rez_cost_quote",
          availableCorpCredits: 5,
          availableCorpClicks: 3,
          availableCorpAgendaPoints: 0,
          totalScoreReserveCredits: 0,
          hardClickReserve: 0,
          fundedProtection: false,
          evidence: ["old explanation"],
        },
      },
    });
    const second = structuredClone(first);
    second.actionIds = ["b"];
    second.evidenceCode = "translated explanation";
    second.protectionNeed = {
      ...second.protectionNeed!,
      baseline: { ...second.protectionNeed!.baseline, evidence: [] },
    };
    expect(uniqueScoreProjects([first, second])[0]?.actionIds).toEqual([
      "a",
      "b",
    ]);
  });
});
