import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { buildRunnerEconomyPosture } from "../../runner-run-target-evaluation";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import {
  runnerRunRiskContractReassessment,
  runnerRunWindowActionAssessments,
} from "./run-window-assessment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

const saved = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep704-bound-multiaccess-post-pass.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
  validation: Record<string, boolean>;
};

afterEach(() => {
  releaseAiMatchRuntime(saved.input.matchId!);
  resetResidentPlanPortfolioMemory();
});

function native() {
  expect(Object.keys(saved.validation)).toHaveLength(9);
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const raw = structuredClone(saved.input);
  const input = { ...raw, ...buildAiDecisionInputDto(raw) };
  const portfolio = saved.runtime.residentPlanPortfolio!;
  const state = portfolio.instances.find(
    (p) => p.instanceId === portfolio.rootForegroundInstanceId,
  )!.moduleState as {
    signal: RunnerRunOrigin;
  };
  const origin = structuredClone(state.signal);
  const action = input.legalActions.find((a) => a.type === "trigger_ability")!;
  return { input, origin, action };
}

function assessment(
  input: AiDecisionInputWithDeckCapabilities,
  origin: RunnerRunOrigin | undefined,
) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  return runnerRunWindowActionAssessments(
    input,
    candidates,
    [],
    buildRunnerEconomyPosture({ input }),
    {
      runnerEncounterActionExclusion: (_input, action) => {
        expect(["pump_breaker", "break_subroutine"]).not.toContain(action.type);
        return undefined;
      },
    },
    origin,
    runnerRunRiskContractReassessment(input, origin),
  );
}

it("preserves the bound funded full-path multiaccess instead of a one-credit derez", () => {
  const { input, origin, action } = native();
  expect(origin.accessCommitment).toMatchObject({
    payoff: "access_bonus",
    intendedAction: "access",
  });
  expect(runnerRunRiskContractReassessment(input, origin)).toMatchObject({
    decision: "preserve_continuation",
    currentReserveQuote: {
      unknownIceCount: 0,
      knownPathCost: 2,
      creditsAfterKnownPath: 5,
    },
  });
  const before = JSON.stringify(input);
  const result = assessment(input, origin);
  expect(result[action.actionId]).toMatchObject({
    admissible: false,
    evidenceCodes: expect.arrayContaining([
      "runner_post_pass_derez_would_abandon_preserved_access_bonus",
    ]),
  });
  expect(result["runner.continue_run"]?.admissible).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
});

it("chooses the exact continuation under the original central parent and run executor", () => {
  const { input } = native();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(saved.runtime),
  );
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: "runner.continue_run",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
    leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_111",
    route: { actionId: "runner.continue_run", stateVersion: 113 },
  });
  expect(JSON.stringify(input)).toBe(before);
});

it.each([
  "no_origin",
  "no_bonus",
  "declined",
  "unknown_at_start",
  "unknown_now",
  "unfunded",
  "wrong_server",
] as const)(
  "retains the independent derez assessment without a preserved funded payoff: %s",
  (variant) => {
    const { input, origin, action } = native();
    if (variant === "no_bonus") delete origin.accessCommitment;
    if (variant === "declined")
      origin.accessCommitment!.intendedAction = "decline";
    if (variant === "unknown_at_start")
      origin.runRiskContract!.reserveQuote.unknownIceCount = 1;
    if (variant === "unknown_now") {
      const remaining = input.playerView.servers
        .find((s) => s.id === "rd")!
        .ice.find((c) => c.instanceId.includes("filter"))!;
      remaining.known = false;
      remaining.rezzed = false;
    }
    if (variant === "unfunded") input.playerView.own.credits = 0;
    if (variant === "wrong_server") origin.runRiskContract!.serverId = "hq";
    expect(
      assessment(input, variant === "no_origin" ? undefined : origin)[
        action.actionId
      ]?.admissible,
    ).toBe(true);
  },
);
