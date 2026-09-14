import { expect, it } from "vitest";
import first from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r8-g3-d414.json";
import repeated from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r8-g3-d459.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
it.each([
  [414, first],
  [459, repeated],
] as const)(
  "completes the funded score that restores next-window rez cash (D%s)",
  (_d, checkpoint) => {
    const input = structuredClone(
      checkpoint.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const runtime = structuredClone(
      checkpoint.runtime,
    ) as unknown as AiRuntimeCheckpointV1;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio!,
    );
    const decision = chooseAiAction(input),
      a = input.legalActions.find((a) => a.actionId === decision.actionId)!;
    expect(decision.fallbackUsed).toBe(false);
    expect(a.type).toBe("install_card");
    expect(a.payload).toMatchObject({
      cardId: "corp_onr_v1_203_hostile-takeover_1",
      serverId: "remote_1",
    });
    const parent =
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_203_hostile-takeover_1%3Aremote_1";
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe(parent);
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: a.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    expect(decision.decisionDebug?.planFirstDecision?.route?.stepId).toContain(
      parent,
    );
  },
);

import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { corpScoreRestoresRezReserveBeforeRunnerTurn } from "../../corp/score/score-reserve-restoration";
import { corpDefenseReserveNeeds } from "../../corp/defense/corp-defense-funding-facts";
function facts() {
  const input = structuredClone(
    first.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const project = structuredClone(
    first.runtime.residentPlanPortfolio.instances.find(
      (x) =>
        x.moduleId === "corp.score_agenda" &&
        x.instanceId.includes("hostile-takeover_1"),
    )!.moduleState,
  ) as unknown as { signal: CorpScoreProjectSignal };
  const defense = structuredClone(
    first.runtime.residentPlanPortfolio.instances.find(
      (x) => x.moduleId === "corp.defend_servers",
    )!.moduleState,
  ) as unknown as { signals: CorpGenericDefenseSignal[] };
  return { input, project: project.signal, reserve: defense.signals[0]! };
}
it("requires the complete score cost now and restores the exact next-window reserve", () => {
  const { input, project, reserve } = facts();
  expect(corpScoreRestoresRezReserveBeforeRunnerTurn(input, [project], 5)).toBe(
    true,
  );
  expect(corpScoreRestoresRezReserveBeforeRunnerTurn(input, [project], 6)).toBe(
    false,
  );
  const funding = input.legalActions
    .filter((a) => a.type === "activated_card_ability")
    .map((a) => a.actionId);
  expect(funding.length).toBeGreaterThan(0);
  expect(
    corpDefenseReserveNeeds(input, [reserve], funding, [], [project]),
  ).toEqual([]);
  expect(
    corpDefenseReserveNeeds(input, [reserve], funding, [], []),
  ).toHaveLength(1);
  reserve.rezReserveNeed!.observedAtStateVersion--;
  expect(
    corpDefenseReserveNeeds(input, [reserve], funding, [], [project]),
  ).toHaveLength(1);
});
it.each([
  "cash",
  "clicks",
  "stale_cost",
  "stale_action",
  "missing_action",
  "no_quote",
  "later_turn",
  "blocked",
  "pending_funding",
  "conditional_payout",
  "ability_income",
  "runner_window",
])("does not defer defense for an unproven score (%s)", (kind) => {
  const { input, project } = facts();
  if (kind === "cash") input.playerView.own.credits = 1;
  if (kind === "clicks") input.playerView.own.clicks = 2;
  if (kind === "stale_cost")
    project.sameTurnConversionResourceCost!.stateVersion--;
  if (kind === "stale_action")
    for (const a of input.legalActions) a.expiresAtStateVersion--;
  if (kind === "missing_action") project.actionIds = [];
  if (kind === "no_quote") delete project.sameTurnConversionProof;
  if (kind === "later_turn") project.sameTurnCloseout = false;
  if (kind === "blocked") project.feasible = false;
  if (kind === "pending_funding") project.fundingGap = 1;
  if (kind === "conditional_payout")
    project.agendaDefinitionId = "onr_v1_196_corporate-war";
  if (kind === "ability_income")
    project.agendaDefinitionId = "onr_v1_206_marine-arcology";
  if (kind === "runner_window") input.playerView.activeSide = "runner";
  expect(corpScoreRestoresRezReserveBeforeRunnerTurn(input, [project], 4)).toBe(
    false,
  );
});

import installed from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-fix8-g1-d415.json";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
it("retains the complete cost certificate after installing the score target", () => {
  const input = structuredClone(
    installed.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const runtime = structuredClone(
    installed.runtime,
  ) as unknown as AiRuntimeCheckpointV1;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    runtime.residentPlanPortfolio!,
  );
  const d = chooseAiAction(input),
    a = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(a.type).toBe("advance_card");
  expect(a.source).toBe("corp_onr_v1_203_hostile-takeover_1");
  const parent =
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_203_hostile-takeover_1%3Aremote_1";
  expect(d.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    parent,
  );
  expect(d.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: a.actionId,
    stateVersion: 414,
  });
  expect(
    residentPlanPortfolioSnapshot(input)!.instances.find(
      (p) => p.instanceId === parent,
    )!.moduleState,
  ).toMatchObject({
    signal: {
      sameTurnConversionResourceCost: {
        stateVersion: 414,
        credits: 2,
        clicks: 2,
      },
    },
  });
});

import { corpInstalledScoreResourceCost } from "../../corp/score/score-reserve-restoration";
import { corpConditionalScoreCreditProfile } from "../../runtime/corp-canonical-card-facts";
it("uses real conditional-card semantics in the payout contrast", () => {
  expect(
    corpConditionalScoreCreditProfile("onr_v1_196_corporate-war"),
  ).toMatchObject({ threshold: 12 });
});
it.each([
  "current",
  "stale",
  "wrong_server",
  "wrong_agenda",
  "incomplete",
  "missing",
  "negative",
])("binds installed score costs to the exact Engine quote (%s)", (kind) => {
  const input = structuredClone(
    installed.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const agenda = input.playerView.servers
    .find((s) => s.id === "remote_1")!
    .root.find((c) => c.instanceId === "corp_onr_v1_203_hostile-takeover_1")!;
  const q = agenda.scoreContinuationQuote!;
  expect(q.creditsRequiredBeforeNextCorpTurn).toBe(1);
  if (kind === "stale") q.expiresAtStateVersion--;
  if (kind === "wrong_server") q.serverId = "rd";
  if (kind === "wrong_agenda") q.agendaCardId = "another_agenda";
  if (kind === "incomplete") q.complete = false;
  if (kind === "missing") delete agenda.scoreContinuationQuote;
  if (kind === "negative") q.advancementCreditCostPerCounter = -1;
  const cost = corpInstalledScoreResourceCost(input, agenda, "remote_1");
  if (kind === "current")
    expect(cost).toEqual({ stateVersion: 414, credits: 2, clicks: 2 });
  else expect(cost).toBeUndefined();
});
