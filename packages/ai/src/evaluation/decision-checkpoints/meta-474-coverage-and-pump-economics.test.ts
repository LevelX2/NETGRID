import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  pureEndRunEncounterPayment,
  pureEndRunEncounterEconomics,
} from "../../runner/run-window/run-window-pure-etr-economics";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}

describe("pairing 474: exact coverage identity and complete ETR payment", () => {
  it.each(["r9-g1-d142", "r9-g17-d176"])(
    "keeps productive legal installations owned at native %s",
    (name) => {
      const input = checkpoint(name);
      const decision = chooseAiAction(input);
      expect(
        input.legalActions.some((a) => a.actionId === decision.actionId),
      ).toBe(true);
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.timeoutUsed).toBe(false);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        lane: "plan",
        stateVersion: input.playerView.stateVersion,
        route: { actionId: decision.actionId },
      });
      expect(decision.evidence).toContain("plan_first_runtime:true");
      const development = residentPlanPortfolioSnapshot(input)!.instances.find(
        (i) =>
          i.moduleId === "runner.develop_board_and_hand" &&
          i.target?.id === "onr_v1_021_dwarf",
      )!;
      expect(development.moduleState).toMatchObject({
        signal: {
          assignedDomainPlanIds: [],
          actionIds: [
            "runner.install_card.runner_onr_v1_021_dwarf_2.runner_onr_v1_021_dwarf_2",
          ],
        },
      });
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject(
        name === "r9-g1-d142"
          ? {
              rootPlanInstanceId:
                "plan:runner.develop_board_and_hand:card%3Arunner_onr_v1_021_dwarf_2",
              leafExecutorInstanceId: development.instanceId,
              route: {
                actionId:
                  "runner.install_card.runner_onr_v1_021_dwarf_2.runner_onr_v1_021_dwarf_2",
              },
            }
          : {
              rootPlanInstanceId:
                "plan:runner.contest_remote:remote%3Aremote_1",
              leafExecutorInstanceId:
                "plan:runner.rig_and_coverage:coverage%3Abreaker_wall%3Aefficiency%3Aremote_1%3Arun%3Arunner.start_run.remote_1",
              route: {
                actionId:
                  "runner.install_card.runner_onr_v1_074_worm_1.runner_onr_v1_074_worm_1",
              },
            },
      );
    },
  );

  it("selects the six-credit full Worm sequence over ten-credit Krash at the same bound run step", () => {
    const input = checkpoint("r9-g5-d256");
    const worm = input.legalActions.find(
      (a) =>
        a.type === "pump_breaker" && a.source === "runner_onr_v1_074_worm_1",
    )!;
    const krash = input.legalActions.find(
      (a) =>
        a.type === "pump_breaker" && a.source === "runner_onr_v1_039_krash_2",
    )!;
    expect(pureEndRunEncounterPayment(input, worm)?.cost).toBe(6);
    expect(pureEndRunEncounterPayment(input, krash)?.cost).toBe(10);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(worm.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      stateVersion: 255,
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_251",
      selectedStep: {
        planInstanceId: "plan:runner.convert_run_window:run%3Arun_251",
        stepId: "plan:runner.convert_run_window:run%3Arun_251:convert",
      },
      route: { actionId: worm.actionId },
    });
  });
  it("prefers breaker-bound funds over spending cash on the nominally cheaper sequence", () => {
    const input = checkpoint("r9-g5-d256");
    input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_039_krash",
    )!.hostedOn = "spin-chip";
    input.playerView.own.rig!.push({
      instanceId: "spin-chip",
      definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
      known: true,
      type: "hardware",
      subtypes: ["chip"],
      counterDisplays: [
        {
          id: "hosted-bits",
          amount: 10,
          displayKind: "restricted_pool",
          label: "Run-Bits",
          ariaLabel: "10 Run-Bits",
          creditPool: {
            kind: "restricted_credit",
            uses: ["using_icebreaker_during_run"],
            requireHostedBreakerForIcebreakerUse: true,
          },
        },
      ],
    });
    const worm = input.legalActions.find(
      (a) =>
        a.type === "pump_breaker" && a.source === "runner_onr_v1_074_worm_1",
    )!;
    const krash = input.legalActions.find(
      (a) =>
        a.type === "pump_breaker" && a.source === "runner_onr_v1_039_krash_2",
    )!;
    const wormPayment = pureEndRunEncounterPayment(input, worm)!;
    const krashPayment = pureEndRunEncounterPayment(input, krash)!;
    expect(wormPayment).toMatchObject({ cost: 6, cashCost: 6 });
    expect(krashPayment).toMatchObject({ cost: 10, cashCost: 0 });
    expect(
      pureEndRunEncounterEconomics(input, krashPayment)!.value,
    ).toBeGreaterThan(pureEndRunEncounterEconomics(input, wormPayment)!.value);
    expect(chooseAiAction(input).actionId).toBe(krash.actionId);
  });

  it("prices the inner known wall after resetting encounter-only pumps", () => {
    const input = checkpoint("r9-g5-d256");
    input.playerView.own.credits = 20;
    const outer = input.playerView.run!.encounteredIce!;
    const inner = structuredClone(outer);
    inner.instanceId = "inner-fire-wall";
    inner.effectiveRunQuote!.iceInstanceId = inner.instanceId;
    input.playerView.servers.find((s) => s.id === "hq")!.ice = [inner, outer];
    input.playerView.run!.position = {
      kind: "ice",
      serverId: "hq",
      iceIndex: 1,
    };
    input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_v1_039_krash",
    )!.strengthAfterEncounter = 0;
    const payments = input.legalActions
      .filter((a) => a.type === "pump_breaker")
      .map((a) => pureEndRunEncounterPayment(input, a)!);
    expect(
      payments.map((p) => pureEndRunEncounterEconomics(input, p)?.totalCost),
    ).toEqual([12, 16]);
    input.playerView.run!.badPublicityCredits = 8;
    const runCreditPayments = input.legalActions
      .filter((a) => a.type === "pump_breaker")
      .map((a) => pureEndRunEncounterPayment(input, a)!);
    expect(
      runCreditPayments.map(
        (p) => pureEndRunEncounterEconomics(input, p)?.cashCost,
      ),
    ).toEqual([4, 8]);
    inner.known = false;
    inner.rezzed = false;
    delete inner.effectiveRunQuote;
    expect(
      payments.every(
        (p) => pureEndRunEncounterEconomics(input, p) === undefined,
      ),
    ).toBe(true);
  });

  it("uses bad-publicity credits once while retaining the cheaper complete payment", () => {
    const input = checkpoint("r9-g5-d256");
    input.playerView.run!.badPublicityCredits = 8;
    const payments = input.legalActions
      .filter((a) => a.type === "pump_breaker")
      .map((a) => pureEndRunEncounterPayment(input, a)!);
    expect(payments.map((p) => p.cashCost)).toEqual([0, 2]);
    expect(
      payments.map((p) => pureEndRunEncounterEconomics(input, p)?.cashCost),
    ).toEqual([0, 2]);
    expect(chooseAiAction(input).actionId).toBe(
      input.legalActions[0]!.actionId,
    );
  });
});
