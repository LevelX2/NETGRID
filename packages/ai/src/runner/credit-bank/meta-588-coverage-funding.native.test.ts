import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import {
  bindRunnerCreditBankCoverageFunding,
  runnerCreditBankCoverageParentValue,
} from "./credit-bank-coverage-funding";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { RunnerCreditBankSignal } from "./credit-bank-types";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import type { GameState } from "@netgrid/shared";
const root = "../../../../../data/scenarios/ai-decision-checkpoints/";
function base() {
  const f = JSON.parse(
    readFileSync(
      new URL(
        root + "cp-meta588-broker-coverage-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  f.input.planningStateIdentity = buildPlanningStateIdentity(f.input);
  const port = f.runtime.residentPlanPortfolio!;
  const gaps = port.instances
    .filter((i) => i.moduleId === "runner.rig_and_coverage")
    .map((i) => (i.moduleState as { gap: RunnerCoverageGapSignal }).gap);
  const banks = port.instances
    .filter((i) => i.moduleId === "runner.credit_bank")
    .map((i) => (i.moduleState as { signal: RunnerCreditBankSignal }).signal);
  return {
    ...f,
    gaps,
    banks,
    candidates: buildActionSemanticCandidates({
      legalActions: f.input.legalActions,
      observerSide: f.input.side,
      stateVersion: f.input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(f.input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }),
  };
}
afterEach(resetResidentPlanPortfolioMemory);
it("funds the current Sentry answer with one sufficient bank and preserves P4, parent, state and owner", () => {
  const f = base();
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  const before = JSON.stringify(f.input),
    d = chooseAiAction(f.input);
  expect(JSON.stringify(f.input)).toBe(before);
  expect(d).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const a = f.input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(a).toMatchObject({
    type: "activated_card_ability",
    source: "runner_onr_v1_154_broker_3",
    payload: { cardImplementationAbilityKey: "withdraw_credits" },
  });
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.credit_bank",
  );
  const p = residentPlanPortfolioSnapshot(f.input)!,
    bank = p.instances.find(
      (i) => i.moduleId === "runner.credit_bank" && i.phase === "cash_out",
    )!;
  expect(bank).toMatchObject({
    parentInstanceId: "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry",
    parentNeedId: "coverage-bank-funding:coverage:breaker_sentry",
  });
  const signal = (bank.moduleState as { signal: RunnerCreditBankSignal })
    .signal;
  expect(signal).toMatchObject({
    estimatedPayout: 3,
    priorityClass: "P4",
    coverageFunding: {
      stateVersion: 413,
      gap: 3,
      targetDefinitionId: "onr_v1_002_ai-boon",
      replacedBasicClicks: 3,
    },
  });
  const parent = p.instances.find(
    (i) => i.instanceId === bank.parentInstanceId,
  )!;
  expect(parent.openNeedIds).toContain(bank.parentNeedId);
  expect(
    runnerCreditBankCoverageParentValue(parent, signal.coverageFunding!, 413),
  ).toBe(63);
  expect(
    runnerCreditBankCoverageParentValue(parent, signal.coverageFunding!, 414),
  ).toBeUndefined();
  const withdrawn = structuredClone(parent);
  (withdrawn.moduleState as { gap: RunnerCoverageGapSignal }).gap.answerInHand =
    false;
  expect(
    runnerCreditBankCoverageParentValue(
      withdrawn,
      signal.coverageFunding!,
      413,
    ),
  ).toBeUndefined();
});
it("the native payout and explicitly chosen install save two actions against three credit actions and the same install", () => {
  const f = base(),
    sf = JSON.parse(
      readFileSync(
        new URL(
          root + "cp-meta588-broker-coverage-state.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as { state: GameState; checkedStates: number };
  expect(sf.checkedStates).toBe(414);
  expect(hashGameState(sf.state)).toBe(
    JSON.parse(
      readFileSync(
        new URL(
          root + "cp-meta588-broker-coverage-funding.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ).stateHash,
  );
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  const d = chooseAiAction(f.input);
  function play(bank: boolean) {
    let s = structuredClone(sf.state);
    const ids = bank ? [d.actionId] : Array(3).fill("runner.gain_credit");
    for (const id of ids) {
      const z = applyAction(s, {
        matchId: s.matchId,
        side: "runner",
        actionId: id,
        clientKnownStateVersion: s.stateVersion,
      });
      expect(z.ok).toBe(true);
      if (!z.ok) throw Error(z.error.message);
      s = z.state;
    }
    const a = getLegalActions(s, "runner").find(
      (a) =>
        a.type === "install_card" && a.source === "runner_onr_v1_002_ai-boon_2",
    )!;
    expect(a).toBeDefined();
    const z = applyAction(s, {
      matchId: s.matchId,
      side: "runner",
      actionId: a.actionId,
      clientKnownStateVersion: s.stateVersion,
    });
    expect(z.ok).toBe(true);
    if (!z.ok) throw Error(z.error.message);
    return getPlayerView(z.state, "runner").own;
  }
  const old = play(false),
    next = play(true);
  expect(next.clicks).toBe(old.clicks + 2);
  expect(next.credits).toBe(old.credits);
  expect(next.rig!.map((c) => c.definitionId)).toEqual(
    old.rig!.map((c) => c.definitionId),
  );
  expect(next.gripOrHq.map((c) => c.definitionId)).toEqual(
    old.gripOrHq.map((c) => c.definitionId),
  );
});
it.each([
  "last_action",
  "one_credit_gap",
  "missing_hand_answer",
  "already_installable",
  "stale_cashout",
  "restricted_cashout",
  "preparation_required",
])("keeps ordinary coverage funding when %s", (mode) => {
  const f = base();
  if (mode === "last_action") f.input.playerView.own.clicks = 1;
  if (mode === "one_credit_gap") {
    f.gaps[0]!.fundingGap = 1;
    f.gaps[0]!.answerInstallCost = f.input.playerView.own.credits + 1;
  }
  if (mode === "missing_hand_answer") f.gaps[0]!.answerInHand = false;
  if (mode === "already_installable")
    f.gaps[0]!.installActionIds = ["current.install"];
  if (mode === "preparation_required")
    f.gaps[0]!.preparationActionIds = ["current.prepare"];
  if (mode === "stale_cashout")
    for (const a of f.input.legalActions)
      if (a.payload?.cardImplementationAbilityKey === "withdraw_credits")
        a.expiresAtStateVersion--;
  if (mode === "restricted_cashout")
    for (const c of f.candidates)
      if (c.planOwnerBinding?.route === "cash_out" && c.economyProjection)
        c.economyProjection.creditRestriction = "restricted";
  const z = bindRunnerCreditBankCoverageFunding(
    f.input,
    f.candidates,
    f.gaps,
    f.banks,
  );
  expect(z.creditBanks.some((b) => b.coverageFunding)).toBe(false);
  expect(z.coverageGaps.some((g) => g.bankFunding)).toBe(false);
});

it("keeps a same-speed guaranteed income alternative and never publishes two bank providers", () => {
  const f = base();
  const basic = f.candidates.find((c) => c.actionType === "gain_credit")!;
  const other = structuredClone(basic);
  other.actionId = "quoted.other-income";
  other.actionType = "activated_card_ability";
  other.sourceKind = "card";
  other.economyProjection!.netLiquidCreditGain = 3;
  other.economyProjection!.grossLiquidCreditGain = 3;
  expect(
    bindRunnerCreditBankCoverageFunding(
      f.input,
      [...f.candidates, other],
      f.gaps,
      f.banks,
    ).creditBanks.some((b) => b.coverageFunding),
  ).toBe(false);
  const supported = bindRunnerCreditBankCoverageFunding(
    f.input,
    f.candidates,
    f.gaps,
    f.banks,
  );
  expect(supported.creditBanks.filter((b) => b.coverageFunding)).toHaveLength(
    1,
  );
  expect(supported.coverageGaps.filter((g) => g.bankFunding)).toHaveLength(1);
});
