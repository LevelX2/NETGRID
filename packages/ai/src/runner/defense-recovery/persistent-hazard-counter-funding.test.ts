import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { runnerPersistentHazardCounterFundingQuotes } from "./persistent-hazard-counter-funding";
import { createRunnerDefenseModule } from "./defense-plan-module";
import type { RunnerDefenseSignals } from "./defense-types";
import { validateAiHintOntologyFields } from "../../hint-ontology";

const input = (): AiDecisionInput => JSON.parse(readFileSync(new URL("../../runtime/test-fixtures/meta-528-counter-funding.json", import.meta.url), "utf8")).checkpoint.input;
const hint = (credits: number) => ({ effects: [{ kind: "persistent_counter_effect" as const, timing: "action" as const, scope: "runner" as const, resource: "counters" as const,
  counterRemoval: { counterType: "trace_tag_counter", credits, clicks: 1 as const, amount: 1 as const } }] });

describe("persistent hazard counter funding contracts", () => {
  it("quotes the own positive counter from canonical metadata without an affordable removal action", () => {
    expect(runnerPersistentHazardCounterFundingQuotes(input())).toEqual([{ counterType: "trace_tag_counter", observedAmount: 1, credits: 1 }]);
  });
  it.each(["zero", "irrelevant"])("opens no need for %s counters", key => {
    const i = input();
    if (key === "zero") i.playerView.own.identity.counterDisplays![0]!.amount = 0;
    else i.playerView.own.identity.counterDisplays = [];
    expect(runnerPersistentHazardCounterFundingQuotes(i, [])).toEqual([]);
  });
  it("fails visibly on absent or conflicting canonical quotes", () => {
    expect(() => runnerPersistentHazardCounterFundingQuotes(input(), [])).toThrow("missing_canonical_removal_quote");
    expect(() => runnerPersistentHazardCounterFundingQuotes(input(), [hint(1), hint(4)])).toThrow("conflicting_canonical_removal_quote");
  });
  it("rejects negative and fractional typed removal costs at the metadata boundary", () => {
    for (const cost of [-1, 0.5]) expect(validateAiHintOntologyFields(hint(cost)).issues.some(issue => issue.path.includes("counterRemoval"))).toBe(true);
  });
  it.each(["stateVersion", "actionId", "counter", "cost", "gap"])("rejects a stale %s at discovery and materialization", key => {
    const i = input(), candidates = buildActionSemanticCandidates({ legalActions: i.legalActions, observerSide: "runner", stateVersion: i.playerView.stateVersion });
    const need: NonNullable<RunnerDefenseSignals["persistentHazardCounterFundingNeed"]> = { needId: "runner-defense-persistent-hazard-counter-funding", parentPlanInstanceId: "plan:runner.defense_and_recovery:runner",
      counterType: "trace_tag_counter", observedAmount: 1, targetCredits: 1, currentCreditsAtRevalidation: 0, gap: 1, actionIds: ["runner.gain_credit"],
      revalidation: { stateVersion: i.playerView.stateVersion, status: "defense_parent_open" }, evidenceCode: "runner_persistent_hazard_counter_requires_funding" };
    if (key === "stateVersion") need.revalidation.stateVersion--;
    if (key === "actionId") need.actionIds = ["runner.invented_credit"];
    if (key === "counter") need.observedAmount = 2;
    if (key === "cost") need.targetCredits = 4;
    if (key === "gap") need.gap = 2;
    const defense: RunnerDefenseSignals = { activeTags: 0, visibleTagPunish: false, persistentHazardCounterRemovalAvailable: false, persistentHazardCounterFundingNeed: need,
      pendingDamage: 0, damagePreventionNeeded: false, handSize: 5, minimumHandBuffer: 3, drawAllowed: false, forgoUnsafeRunCapacity: false, handBufferPriorityClass: "P5", evidenceCodes: [] };
    const context = { input: i, actionCandidates: candidates, turnKey: "runner:13", domain: { defense } };
    const module = createRunnerDefenseModule(), proposal = module.discover(context)[0]!;
    expect(proposal.initialViability).toBe("blocked");
    expect(proposal.blockers[0]?.code).toBe("invalid_persistent_hazard_counter_funding_need");
    expect(module.materialize({ ...proposal, instanceId: "plan:runner.defense_and_recovery:runner" } as never, {} as never, context).candidates).toEqual([]);
  });
});
