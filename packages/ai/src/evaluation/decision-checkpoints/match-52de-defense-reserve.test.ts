import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  assessCorpRezOpportunityCost,
  corpFundedCentralProtectionReserve,
  corpServerProtectionClaims,
  reserveForRunCount,
} from "../../corp/defense/corp-server-protection-reserve";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { buildAiDecisionInputDto } from "../../input-dto";
import { assessCorpExactIceRezAgainstScoreReserves } from "../../corp/defense/corp-defense-score-reserve";
import { isValidDefenseSignal } from "../../corp/defense/defense-validation";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";

function currentRoute(input: AiDecisionInputWithDeckCapabilities) {
  const source = input.playerView.servers.find((s) => s.id === "rd")!.ice[0]!;
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    projectionMode: "basic_semantics",
    visibleSourceDefinitionsByInstanceId: {
      [source.instanceId]: source.definitionId!,
    },
  }).find((c) => c.actionType === "rez_ice")!;
  return projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard: source,
    targetServerId: "rd",
  })!;
}

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-52de-d7-defense-replay.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}

function decide(
  runnerClicks?: number,
  credits?: number,
  runnerPoints?: number,
  bonusRun?: "after_run" | "after_successful_run",
) {
  const replay = capture();
  const input = replay.input;
  if (runnerClicks !== undefined)
    input.playerView.opponent.clicks = runnerClicks;
  if (credits !== undefined) input.playerView.own.credits = credits;
  if (runnerPoints !== undefined)
    input.playerView.opponent.agendaPoints = runnerPoints;
  if (bonusRun) input.playerView.run!.followupRunOpportunity = bonusRun;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    replay.runtime,
  );
  return { input, decision: chooseAiAction(input) };
}

describe("match 52de cross-server defense reserve", () => {
  beforeEach(() => resetResidentPlanPortfolioMemory());

  it("retains the actor-safe historical checkpoint", () => {
    const replay = capture();
    expect(Object.values(replay.validation).every(Boolean)).toBe(true);
    expect(
      replay.input.playerView.own.gripOrHq.filter((c) => c.type === "agenda"),
    ).toHaveLength(2);
    expect(replay.input.playerView.opponent).not.toHaveProperty("gripOrHq");
  });

  it("preserves the funded HQ stop at D7 instead of exhausting credits on R&D", () => {
    const { input, decision } = decide();
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("decline_rez");
    expect(decision.reasonCode).toBe("plan_first.corp.defend_servers");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
      selectedStep: {
        stepId: "plan:corp.defend_servers:server-defense-portfolio:allocate",
      },
    });
  });

  it("defends the current R&D run when no click remains for a later HQ run", () => {
    const { input, decision } = decide(0);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("rez_ice");
    expect(decision.reasonCode).toBe("plan_first.corp.defend_servers");
  });

  it("does not withhold a useful rez when both servers are funded", () => {
    const { input, decision } = decide(3, 7);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("rez_ice");
  });

  it("prioritizes the current potentially winning access over a later HQ threat", () => {
    const { input, decision } = decide(3, 5, 6);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("rez_ice");
  });

  it("binds the reserve to the historical HQ stop and reports both alternatives", () => {
    const { input } = capture();
    const source = input.playerView.servers.find((s) => s.id === "rd")!.ice[0]!;
    const candidate = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      projectionMode: "basic_semantics",
      visibleSourceDefinitionsByInstanceId: {
        [source.instanceId]: source.definitionId!,
      },
    }).find((c) => c.actionType === "rez_ice")!;
    const route = projectExactCorpIceRezRoute({
      input,
      candidate,
      sourceCard: input.playerView.servers.find((s) => s.id === "rd")!.ice[0]!,
      targetServerId: "rd",
    })!;
    const assessment = assessCorpRezOpportunityCost(input, route, 0);
    expect(assessment).toMatchObject({
      preservesReserve: false,
      requiredCredits: 2,
      reason: "funded_alternative_protection",
      claims: [{ serverId: "hq", credits: 2 }],
    });
    expect(assessment.claims[0]!.expectedPoints).toBeCloseTo(4 / 3);
    expect(assessment.claims[0]!.iceIds).toEqual([
      "corp_onr_v1_261_quandary_1",
    ]);
  });

  it("does not claim protection from a stale rez quote", () => {
    const { input } = capture();
    input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!
      .effectiveRezCostQuote!.expiresAtStateVersion--;
    const result = corpServerProtectionClaims(input);
    expect(result.claims.some((c) => c.serverId === "hq")).toBe(false);
    expect(result.unknownServerIds).toContain("hq");
  });

  it("keeps HQ protection with zero clicks and an unconditional public bonus run", () => {
    const { input, decision } = decide(0, 5, 0, "after_run");
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("decline_rez");
  });

  it("stops the current run and thereby prevents a success-dependent bonus run", () => {
    const { input, decision } = decide(0, 5, 0, "after_successful_run");
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("rez_ice");
  });

  it("shares cash across alternative targets, but funds sequential distinct rezzes", () => {
    const { input } = capture();
    const claims = corpServerProtectionClaims(input).claims;
    expect(claims.map((c) => c.credits).sort()).toEqual([2, 5]);
    expect(reserveForRunCount(claims, 1)).toBe(5);
    expect(reserveForRunCount(claims, 2)).toBe(7);
    expect(reserveForRunCount(claims, 0)).toBe(0);
  });

  it("retains an independent current stop without inventing an unknown central reserve", () => {
    const { input } = capture();
    delete input.ownDeckSnapshot;
    input.playerView.servers.find((s) => s.id === "hq")!.ice = [];
    expect(
      assessCorpRezOpportunityCost(input, currentRoute(input), 0),
    ).toMatchObject({
      preservesReserve: true,
      requiredCredits: 0,
      reason: "no_certified_alternative",
      unknownServerIds: ["rd"],
    });
  });

  it("requires a complete comparison only when a certified alternative would lose funding", () => {
    const { input } = capture();
    delete input.ownDeckSnapshot;
    expect(
      assessCorpRezOpportunityCost(input, currentRoute(input), 0),
    ).toMatchObject({
      preservesReserve: false,
      reason: "assessment_unknown",
      unknownServerIds: ["rd"],
    });
    expect(
      assessCorpRezOpportunityCost(input, currentRoute(input), 2),
    ).toMatchObject({
      preservesReserve: true,
      requiredCredits: 2,
      reason: "all_alternatives_funded",
    });
  });

  it("releases the HQ reserve once its agendas leave and does not hoard an unaffordable portfolio", () => {
    const { input } = capture();
    input.playerView.phase = "corp_action_phase";
    expect(corpFundedCentralProtectionReserve(input)).toBe(2);
    input.playerView.own.credits = 7;
    expect(corpFundedCentralProtectionReserve(input)).toBe(7);
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.filter(
      (c) => c.type !== "agenda",
    );
    delete input.ownDeckSnapshot; // R&D inventory deliberately unknown; HQ remains fully known.
    expect(corpFundedCentralProtectionReserve(input)).toBe(0);
  });

  it("carries the public follow-up condition through the AI input boundary", () => {
    const { input } = capture();
    input.playerView.run!.followupRunOpportunity = "after_successful_run";
    input.playerView.run!.pendingSequenceRunCount = 2;
    expect(
      buildAiDecisionInputDto(input).playerView.run?.pendingSequenceRunCount,
    ).toBe(2);
    expect(
      buildAiDecisionInputDto(input).playerView.run?.followupRunOpportunity,
    ).toBe("after_successful_run");
    input.playerView.run!.pendingSequenceRunCount = -1;
    expect(() => buildAiDecisionInputDto(input)).toThrow(
      "Invalid Engine public follow-up run opportunity.",
    );
  });

  it("does not starve a higher-risk protected agenda route for a lower-risk central", () => {
    const { input } = capture();
    input.playerView.phase = "corp_action_phase";
    expect(corpFundedCentralProtectionReserve(input)).toBe(2);
    expect(corpFundedCentralProtectionReserve(input, undefined, 2)).toBe(0);
    input.playerView.opponent.agendaPoints = 5;
    expect(corpFundedCentralProtectionReserve(input, undefined, 1)).toBe(2);
  });

  it("does not fund next-turn protection with credits that expire before that turn", () => {
    const { input } = capture();
    input.playerView.own.installRezOnlyCredits = 4;
    expect(corpFundedCentralProtectionReserve(input)).toBe(0);
    expect(
      corpServerProtectionClaims(input).claims.some((c) => c.serverId === "hq"),
    ).toBe(true);
    input.playerView.own.installRezOnlyCredits =
      input.playerView.own.credits + 1;
    expect(() => buildAiDecisionInputDto(input)).toThrow(
      "Invalid Engine Corp install/rez-only credit pool.",
    );
  });

  it("replays the same checkpoint deterministically", () => {
    const first = decide().decision;
    resetResidentPlanPortfolioMemory();
    const second = decide().decision;
    expect(second).toEqual(first);
  });

  it("retains HQ funding on a last-click run with a public event sequence", () => {
    const { input } = capture();
    input.playerView.opponent.clicks = 0;
    input.playerView.run!.pendingSequenceRunCount = 2;
    expect(
      assessCorpRezOpportunityCost(input, currentRoute(input), 0),
    ).toMatchObject({
      preservesReserve: false,
      requiredCredits: 2,
      reason: "funded_alternative_protection",
    });
  });

  it("does not claim a marginal matchpoint save when the current path was already blocked", () => {
    const { input } = capture();
    input.playerView.opponent.agendaPoints = 6;
    const route = currentRoute(input);
    expect(route.after).toBeDefined();
    const assessment = assessCorpRezOpportunityCost(
      input,
      { ...route, before: route.after! },
      0,
    );
    expect(assessment).toMatchObject({
      preservesReserve: false,
      reason: "funded_alternative_protection",
      requiredCredits: 2,
    });
  });

  it("validates the structured reserve diagnosis and rejects malformed credit claims", () => {
    const { input } = capture();
    const assessment = assessCorpExactIceRezAgainstScoreReserves({
      input,
      route: currentRoute(input),
      scoreProjects: [],
    });
    const signal: CorpGenericDefenseSignal = {
      kind: "generic",
      phase: "rez_response",
      defenseId: "reserve-test",
      serverId: "rd",
      sourceDefinitionIds: [],
      actionIds: [],
      urgent: false,
      value: 0,
      evidenceCode: "reserve-test",
      rezReserveAssessment: assessment,
    };
    expect(isValidDefenseSignal(signal)).toBe(true);
    expect(
      isValidDefenseSignal({
        ...signal,
        rezReserveAssessment: {
          ...assessment,
          opportunity: { ...assessment.opportunity, requiredCredits: -1 },
        },
      }),
    ).toBe(false);
  });
});
