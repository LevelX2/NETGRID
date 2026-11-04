import { evaluateRunnerHandDevelopment } from "../hand-development/hand-development-evaluation";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
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
function base(fixture = "cp-meta588-broker-coverage-funding.json") {
  const f = JSON.parse(
    readFileSync(new URL(root + fixture, import.meta.url), "utf8"),
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
  const candidates = buildActionSemanticCandidates({
    legalActions: f.input.legalActions,
    observerSide: f.input.side,
    stateVersion: f.input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      f.input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const deck = f.input.ownDeckSnapshot,
    capabilities = f.input.ownDeckCapabilities;
  if (!deck || !capabilities) throw Error("Native fixture lacks deck context");
  const development = evaluateRunnerHandDevelopment({
    input: f.input,
    actionCandidates: candidates,
    deckCapabilities: capabilities,
  });
  return {
    ...f,
    input: {
      ...f.input,
      ownDeckSnapshot: deck,
      ownDeckCapabilities: capabilities,
    },
    gaps,
    banks,
    candidates,
    development,
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
    source: "runner_onr_v1_154_broker_2",
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
    estimatedPayout: 9,
    priorityClass: "P4",
    coverageFunding: {
      stateVersion: 413,
      gap: 5,
      targetCredits: 14,
      targetDefinitionId: "onr_v1_002_ai-boon",
      replacedBasicClicks: 5,
    },
  });
  const parent = p.instances.find(
    (i) => i.instanceId === bank.parentInstanceId,
  )!;
  expect(parent.openNeedIds).toContain(bank.parentNeedId);
  expect(
    runnerCreditBankCoverageParentValue(parent, signal.coverageFunding!, 413),
  ).toBe(65);
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
it("funds the full native install with one payout and lets the next normal decision install the answer", () => {
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
  if (!d.actionId) throw Error("Expected the quoted current payout action");
  const z = applyAction(sf.state, {
    matchId: sf.state.matchId,
    side: "runner",
    actionId: d.actionId,
    clientKnownStateVersion: sf.state.stateVersion,
  });
  expect(z.ok).toBe(true);
  if (!z.ok) throw Error(z.error.message);
  expect(getPlayerView(z.state, "runner").own.credits).toBe(18);
  const nextInput = buildAiDecisionInput(z.state, "runner", {
    difficulty: f.input.difficulty,
    profileId: f.input.profileId,
    ownDeckSnapshot: f.input.ownDeckSnapshot,
  });
  const next = chooseAiAction(nextInput),
    a = getLegalActions(z.state, "runner").find(
      (a) => a.actionId === next.actionId,
    )!;
  expect(a).toMatchObject({
    type: "install_card",
    source: "runner_onr_v1_002_ai-boon_2",
  });
  expect(next).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(next.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.rig_and_coverage",
  );
  const zz = applyAction(z.state, {
    matchId: z.state.matchId,
    side: "runner",
    actionId: a.actionId,
    clientKnownStateVersion: z.state.stateVersion,
  });
  expect(zz.ok).toBe(true);
  if (!zz.ok) throw Error(zz.error.message);
  const own = getPlayerView(zz.state, "runner").own;
  expect(own.credits).toBe(6);
  expect(own.clicks).toBe(2);
  expect(
    own.rig!.find((c) => c.instanceId === "runner_onr_v1_154_broker_3")
      ?.counters?.bit,
  ).toBe(3);
});
it.each([
  "last_action",
  "one_credit_gap",
  "missing_hand_answer",
  "already_installable",
  "stale_cashout",
  "restricted_cashout",
  "preparation_required",
  "missing_development_budget",
])("keeps ordinary coverage funding when %s", (mode) => {
  const f = base();
  if (mode === "missing_development_budget") f.development.length = 0;
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
    f.development,
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
  other.economyProjection!.netLiquidCreditGain = 5;
  other.economyProjection!.grossLiquidCreditGain = 5;
  expect(
    bindRunnerCreditBankCoverageFunding(
      f.input,
      [...f.candidates, other],
      f.gaps,
      f.banks,
      f.development,
    ).creditBanks.some((b) => b.coverageFunding),
  ).toBe(false);
  const supported = bindRunnerCreditBankCoverageFunding(
    f.input,
    f.candidates,
    f.gaps,
    f.banks,
    f.development,
  );
  expect(supported.creditBanks.filter((b) => b.coverageFunding)).toHaveLength(
    1,
  );
  expect(supported.coverageGaps.filter((g) => g.bankFunding)).toHaveLength(1);
});

it("keeps full native action coverage when a building bank becomes a coverage payout", () => {
  const f = JSON.parse(
    readFileSync(
      new URL(
        root + "cp-meta588-broker-build-cashout-failure.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const d = chooseAiAction(f.input);
  expect(d).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    f.input.legalActions.some(
      (a: { actionId: string }) => a.actionId === d.actionId,
    ),
  ).toBe(true);
  const p = residentPlanPortfolioSnapshot(f.input)!;
  expect(
    p.instances
      .filter((i) => i.moduleId === "runner.credit_bank")
      .every(
        (i) =>
          !(i.moduleState as { signal: RunnerCreditBankSignal }).signal
            .coverageFunding,
      ),
  ).toBe(true);
});

it("retains old productive load IDs when a sufficient building bank is rebound to payout", () => {
  const f = base();
  for (const bank of f.banks) {
    bank.phase = "build";
    bank.actionIds = f.candidates
      .filter(
        (c) =>
          c.sourceCardInstanceId === bank.bankId &&
          c.planOwnerBinding?.route === "build",
      )
      .map((c) => c.actionId);
  }
  const z = bindRunnerCreditBankCoverageFunding(
    f.input,
    f.candidates,
    f.gaps,
    f.banks,
    f.development,
  );
  const bank = z.creditBanks.find((b) => b.coverageFunding)!;
  expect(bank.coverageFunding).toBeDefined();
  const old = f.banks.find((b) => b.bankId === bank.bankId)!;
  expect(old.actionIds.length).toBeGreaterThan(0);
  for (const id of old.actionIds) expect(bank.rejectedActionIds).toContain(id);
  expect(bank.rejectedActionIds).not.toContain(bank.coverageFunding!.actionId);
});

it("does not cash out two small Brokers when their combined payout still misses the current full breaker reserve", () => {
  const f = base("cp-meta590-two-broker-coverage.json");
  expect(f.input.playerView.own).toMatchObject({ credits: 6, clicks: 3 });
  const need = f.development.find(
    (entry) => entry.definitionId === "onr_proteus_092_morphing-tool",
  )!.fundingNeed!;
  expect(need).toMatchObject({ installOrPlayCost: 10, targetCredits: 16 });
  expect(f.banks.map((bank) => bank.estimatedPayout)).toEqual([3, 3]);
  expect(
    f.input.playerView.own.credits +
      f.banks.reduce((sum, bank) => sum + bank.estimatedPayout, 0),
  ).toBeLessThan(need.targetCredits);
  const bound = bindRunnerCreditBankCoverageFunding(
    f.input,
    f.candidates,
    f.gaps,
    f.banks,
    f.development,
  );
  expect(bound.creditBanks.some((bank) => bank.coverageFunding)).toBe(false);
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  expect(chooseAiAction(f.input)).toMatchObject({
    actionId: "runner.gain_credit",
    fallbackUsed: false,
    timeoutUsed: false,
  });
});
