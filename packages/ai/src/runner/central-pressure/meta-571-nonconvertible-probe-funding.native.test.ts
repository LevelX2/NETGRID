import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
it.each([2, 3, 4])(
  "keeps Broker stored value when the central information path cannot use the funded credits (native G%i)",
  (game) => {
    const f = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta571-g" +
            game +
            "-nonconvertible-probe-funding.json",
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
    const { input, runtime } = f;
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const before = JSON.stringify(input),
      decision = chooseAiAction(input),
      portfolio = residentPlanPortfolioSnapshot(input)!;
    expect(JSON.stringify(input)).toBe(before);
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).not.toBe("runner.credit_bank");
    const parent = portfolio.instances.find(
      (p) => p.instanceId === "plan:runner.pressure_central:central%3Ard",
    );
    expect(parent?.moduleState).toMatchObject({
      signal: {
        reachable: false,
        evidenceCode:
          "runner_central_information_probe_known_path_not_admitted:rd",
      },
    });
    expect(
      (parent?.moduleState as { signal?: { supportNeedId?: string } })?.signal
        ?.supportNeedId,
    ).toBeUndefined();
    const bank = portfolio.instances.find(
      (p) => p.moduleId === "runner.credit_bank",
    );
    expect(bank?.moduleState).toMatchObject({
      signal: { phase: "hold", currentStoredCredits: 6 },
    });
    expect(
      (bank?.moduleState as { signal?: { runFunding?: unknown } })?.signal
        ?.runFunding,
    ).toBeUndefined();
  },
);
