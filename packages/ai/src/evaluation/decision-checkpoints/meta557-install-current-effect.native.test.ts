import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { corpIceInstallDefenseProfile } from "../../corp/defense/corp-defense-domain-signals";
function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
beforeEach(resetResidentPlanPortfolioMemory);
function decide(name: string, dto = false, resident = true) {
  const cp = fixture(name);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  if (dto) cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  if (resident)
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
  const before = JSON.stringify(cp.input),
    result = chooseAiAction(cp.input),
    pf = result.decisionDebug!.planFirstDecision!;
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(pf.turnPlanning?.coverage).toMatchObject({
    status: "pass",
    coveragePercent: 100,
  });
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: cp.stateVersion,
    planInstanceId: pf.selectedStep!.planInstanceId,
    stepId: pf.selectedStep!.stepId,
  });
  expect(JSON.stringify(cp.input)).toBe(before);
  const action = cp.input.legalActions.find(
    (a: any) => a.actionId === result.actionId,
  );
  expect(action?.expiresAtStateVersion).toBe(cp.stateVersion);
  return { cp, result, pf, action };
}
describe("pairing 557 qualitative install uses actual current Engine effects", () => {
  it.each([
    ["cp-meta557-empty-install", false, false],
    ["cp-meta557-empty-install", false, true],
    ["cp-meta557-empty-install", true, false],
    ["cp-meta557-empty-install", true, true],
    ["cp-meta557-empty-install-second-half", false, false],
    ["cp-meta557-empty-install-second-half", false, true],
    ["cp-meta557-empty-install-second-half", true, false],
    ["cp-meta557-empty-install-second-half", true, true],
  ] as const)(
    "does not admit an empty current encounter as immediate defense: %s DTO=%s resident=%s",
    (name, dto, resident) => {
      const { cp, pf, action } = decide(name, dto, resident);
      for (const offer of cp.input.legalActions.filter(
        (a: any) => a.type === "install_card" && a.payload?.placement === "ice",
      )) {
        const quote = JSON.parse(
          offer.payload.postInstallEffectiveRunQuoteJson,
        );
        if (
          quote.subroutines.length === 0 &&
          !quote.conditionalEncounterEffects?.length
        ) {
          expect(action.actionId).not.toBe(offer.actionId);
          expect(pf.dispositions).toContainEqual(
            expect.objectContaining({
              actionId: offer.actionId,
              ownerModuleId: "corp.defend_servers",
              disposition: "explicitly_nonproductive",
            }),
          );
        }
      }
    },
  );
  it.each(["stale", "wrong_source", "missing_quote", "malformed_quote"])(
    "does not derive a current profile from incomplete binding: %s",
    (kind) => {
      const cp = fixture("cp-meta557-empty-install"),
        a = cp.input.legalActions.find(
          (a: any) =>
            a.source.includes("minotaur") && a.payload?.serverId === "hq",
        ),
        c = cp.input.playerView.own.gripOrHq.find(
          (c: any) => c.instanceId === a.source,
        );
      if (kind === "stale") a.expiresAtStateVersion--;
      if (kind === "wrong_source") a.source = "other";
      if (kind === "missing_quote")
        delete a.payload.postInstallEffectiveRunQuoteJson;
      if (kind === "malformed_quote")
        a.payload.postInstallEffectiveRunQuoteJson = "{";
      expect(
        corpIceInstallDefenseProfile(cp.input, a, c, "hq"),
      ).toBeUndefined();
    },
  );
  it("keeps explicitly quoted conditional paid stop potential for existing funding checks", () => {
    const cp = fixture("cp-meta557-empty-install"),
      a = cp.input.legalActions.find(
        (a: any) =>
          a.source.includes("minotaur") && a.payload?.serverId === "hq",
      ),
      c = cp.input.playerView.own.gripOrHq.find(
        (c: any) => c.instanceId === a.source,
      ),
      q = JSON.parse(a.payload.postInstallEffectiveRunQuoteJson);
    q.conditionalEncounterEffects = [
      { kind: "corp_paid_add_end_the_run_subroutine", creditCost: 1 },
    ];
    a.payload.postInstallEffectiveRunQuoteJson = JSON.stringify(q);
    expect(
      corpIceInstallDefenseProfile(cp.input, a, c, "hq")?.hasImmediateStop,
    ).toBe(true);
  });
  it("keeps the real Minotaur toll supplied by Tesseract", () => {
    const { cp, pf, action } = decide("cp-meta557-tesseract-install");
    expect(action.source).toContain("minotaur");
    expect(action.payload.serverId).toBe("hq");
    expect(
      JSON.parse(action.payload.postInstallEffectiveRunQuoteJson).subroutines,
    ).toContainEqual(
      expect.objectContaining({
        type: "end_the_run_unless_runner_pays",
        amount: 1,
      }),
    );
    expect(pf.selectedPlan!.moduleId).toBe("corp.defend_servers");
  });
  it("keeps the real Mastermind stop without an outer layer", () => {
    const { pf, action } = decide("cp-meta557-hard-stop-install");
    expect(action.source).toContain("mastermind");
    expect(
      JSON.parse(action.payload.postInstallEffectiveRunQuoteJson).subroutines,
    ).toContainEqual(expect.objectContaining({ type: "end_the_run" }));
    expect(pf.selectedPlan!.moduleId).toBe("corp.defend_servers");
  });
});
