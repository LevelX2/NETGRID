import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { prepareCorpDefenseDiscovery } from "../../corp/defense/defense-discovery";
import {
  CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
  corpDefensiveUpgradePlacement,
} from "../../corp/defense/defense-discovery-support";
import { corpQualitativeIceStagingSignal } from "../../corp/defense/corp-defense-domain-signals";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r4-g17-d200.json",
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
  return { input, runtime: cp.runtime };
}

function discovery(
  input: AiDecisionInputWithDeckCapabilities,
  runtime: AiRuntimeCheckpointV1,
) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const domain = prepareCorpDefenseDiscovery({
    input,
    previous: runtime.residentPlanPortfolio,
    candidates,
  });
  const candidate = candidates.find(
    (c) =>
      c.actionId ===
      "corp.install_card.corp_onr_classic_005_baskerville_1.hq.corp_onr_classic_005_baskerville_1.2",
  )!;
  expect(candidate).toBeDefined();
  return { domain, candidate, candidates };
}

describe("pairing 475: local central rez reserve survives unknown global allocation", () => {
  it("rejects the original extra layer that consumes an independently quoted ten-credit reserve", () => {
    const { input, runtime } = checkpoint();
    const { domain, candidate } = discovery(input, runtime);
    expect(domain.centralDefenseAllocation.status).toBe("unknown");
    expect(input.playerView.own.credits).toBe(11);
    expect(candidate.costProfile.creditCost).toBe(2);
    expect(
      corpQualitativeIceStagingSignal(
        input,
        candidate,
        "hq",
        domain.centralDefenseAllocation,
        CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
      ),
    ).toBeUndefined();
  });

  it.each([
    [11, false],
    [12, true],
    [13, true],
  ] as const)(
    "preserves the exact local quote at %i credits",
    (credits, allowed) => {
      const { input, runtime } = checkpoint();
      input.playerView.own.credits = credits;
      const { domain, candidate } = discovery(input, runtime);
      expect(
        Boolean(
          corpQualitativeIceStagingSignal(
            input,
            candidate,
            "hq",
            domain.centralDefenseAllocation,
            CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
          ),
        ),
      ).toBe(allowed);
    },
  );

  it("does not invent a reserve from an expired quote", () => {
    const { input, runtime } = checkpoint();
    const guard = input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
    guard.effectiveRezCostQuote!.expiresAtStateVersion -= 1;
    const { domain, candidate } = discovery(input, runtime);
    expect(
      corpQualitativeIceStagingSignal(
        input,
        candidate,
        "hq",
        domain.centralDefenseAllocation,
        CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
      ),
    ).toBeDefined();
  });

  it.each([
    [11, false],
    [13, true],
  ] as const)(
    "keeps upgrade placement within the same local reserve at %i credits",
    (credits, allowed) => {
      const { input, runtime } = checkpoint();
      input.playerView.own.credits = credits;
      const { domain, candidates } = discovery(input, runtime);
      const upgrade = candidates.find(
        (c) =>
          c.actionId ===
          "corp.install_card.corp_onr_classic_020_london-city-grid_2.rd.corp_onr_classic_020_london-city-grid_2",
      )!;
      expect(upgrade.costProfile.creditCost).toBe(3);
      const placement = corpDefensiveUpgradePlacement(
        input,
        upgrade,
        [],
        domain.centralDefenseAllocation,
      );
      expect(
        placement?.evidenceCode.endsWith(
          "consumes_known_central_rez_reserve",
        ) === true,
      ).toBe(!allowed);
    },
  );

  it("keeps the productive chooser route state-bound without staging the reserve away", () => {
    const { input, runtime } = checkpoint();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan!.moduleId).toBe("corp.economy");
    expect(pf.route!.actionId).toBe(decision.actionId);
    expect(pf.route!.stateVersion).toBe(input.playerView.stateVersion);
    expect(pf.route!.planInstanceId).toBe(pf.leafExecutorInstanceId);
    expect(pf.selectedStep!.planInstanceId).toBe(pf.leafExecutorInstanceId);
    expect(pf.route!.stepId).toBe(pf.selectedStep!.stepId);
  });
});
