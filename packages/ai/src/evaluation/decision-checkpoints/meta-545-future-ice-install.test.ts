import { corpIceInstallPositionEffect } from "../../corp/defense/corp-defense-domain-signals";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(name: string) {
  const f = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/" + name, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
function decide(name: string) {
  const f = fixture(name),
    before = JSON.stringify(f.input);
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const result = chooseAiAction(f.input);
  expect(JSON.stringify(f.input)).toBe(before);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: f.input.playerView.stateVersion,
    planInstanceId: pf.selectedStep!.planInstanceId,
    stepId: pf.selectedStep!.stepId,
  });
  expect(
    f.input.legalActions.find(
      (a: { actionId: string }) => a.actionId === result.actionId,
    ).expiresAtStateVersion,
  ).toBe(f.input.playerView.stateVersion);
  return { f, result, pf };
}
describe("position-bound ICE installation", () => {
  it.each([
    "545-r3-g18-d6.json",
    "545-r3-g23-d37.json",
    "545-r3-g1-d22.json",
    "545-r3-g8-d26.json",
    "545-r3-g38-d41.json",
    "545-r3-g24-d4.json",
    "545-r3-g21-d19.json",
  ])(
    "does not treat a future-only innermost installation as defense in %s",
    (name) => {
      const { f, result } = decide(name);
      const sourceId = Object.keys(f.input.playerView.own.gripOrHq).length;
      expect(sourceId).toBeGreaterThan(0);
      const selected = f.input.legalActions.find(
        (a: { actionId: string }) => a.actionId === result.actionId,
      )!;
      if (
        selected.type === "install_card" &&
        selected.payload?.placement === "ice"
      ) {
        const quote = JSON.parse(
          selected.payload.postInstallEffectiveRunQuoteJson,
        );
        const existing = f.input.playerView.servers.find(
          (s: { id: string }) => s.id === selected.payload.serverId,
        );
        const types = quote.subroutines.map((s: { type: string }) => s.type);
        expect(
          (existing?.ice.length ?? 0) > 0 ||
            types.some(
              (t: string) =>
                ![
                  "set_run_future_strength_bonus",
                  "set_run_encounter_tax",
                  "set_next_encounter_unless_fully_break_damage",
                ].includes(t),
            ),
        ).toBe(true);
      }
    },
  );
  it.each(["545-r3-g26-d107.json", "545-r3-g11-d44.json"])(
    "keeps the native outer or mixed immediate-effect installation in %s",
    (name) => {
      const { f, result, pf } = decide(name);
      const action = f.input.legalActions.find(
        (a: { actionId: string }) => a.actionId === result.actionId,
      )!;
      expect(action.type).toBe("install_card");
      expect(action.payload.placement).toBe("ice");
      const expected = name.includes("g26")
        ? "onr_v1_225_canis-major"
        : "onr_v1_258_neural-blade";
      expect(
        f.input.playerView.own.gripOrHq.find(
          (c: { instanceId: string }) => c.instanceId === action.source,
        ).definitionId,
      ).toBe(expected);
      expect(pf.selectedPlan!.moduleId).toBe("corp.defend_servers");
    },
  );
  // Constructed consumer boundaries retain the native board and source but vary
  // the quoted effect/binding; these are not historical checkpoint replays.
  it.each([
    "missing_quote",
    "malformed_quote",
    "stale",
    "wrong_source",
    "wrong_definition",
    "invalid_paid_cost",
  ])("keeps incomplete position evidence fail-closed: %s", (kind) => {
    const f = fixture("545-r3-g18-d6.json"),
      input = f.input;
    const action = input.legalActions.find(
      (a: any) =>
        a.payload?.serverId === "hq" && a.source.includes("canis-major"),
    );
    const source = input.playerView.own.gripOrHq.find(
      (c: any) => c.instanceId === action.source,
    );
    const quote = JSON.parse(action.payload.postInstallEffectiveRunQuoteJson);
    if (kind === "missing_quote")
      delete action.payload.postInstallEffectiveRunQuoteJson;
    if (kind === "malformed_quote")
      action.payload.postInstallEffectiveRunQuoteJson = "{";
    if (kind === "stale") action.expiresAtStateVersion--;
    if (kind === "wrong_source") action.source = "other";
    if (kind === "wrong_definition") {
      quote.iceDefinitionId = "other";
      action.payload.postInstallEffectiveRunQuoteJson = JSON.stringify(quote);
    }
    if (kind === "invalid_paid_cost") {
      quote.conditionalEncounterEffects = [
        { kind: "corp_paid_add_end_the_run_subroutine", creditCost: -1 },
      ];
      action.payload.postInstallEffectiveRunQuoteJson = JSON.stringify(quote);
    }
    expect(corpIceInstallPositionEffect(input, action, source, "hq")).toBe(
      "unknown",
    );
  });
  it.each([
    "set_run_encounter_tax",
    "set_run_break_subroutine_cost_modifier",
    "set_run_future_end_the_run_subroutine",
    "set_run_future_strength_bonus",
    "set_next_encounter_unless_fully_break_damage",
    "set_next_encounter_lock",
    "set_next_encounter_no_break_subroutines",
  ])("requires a following encounter for quoted %s", (type) => {
    const f = fixture("545-r3-g18-d6.json"),
      input = f.input;
    const action = input.legalActions.find(
      (a: any) =>
        a.payload?.serverId === "hq" && a.source.includes("canis-major"),
    );
    const source = input.playerView.own.gripOrHq.find(
      (c: any) => c.instanceId === action.source,
    );
    const quote = JSON.parse(action.payload.postInstallEffectiveRunQuoteJson);
    quote.subroutines = [{ id: "quoted-future", type }];
    action.payload.postInstallEffectiveRunQuoteJson = JSON.stringify(quote);
    expect(corpIceInstallPositionEffect(input, action, source, "hq")).toBe(
      "untargeted_future_only",
    );
  });
  it("preserves separately quoted current paid ETR potential for the existing funding assessment", () => {
    const f = fixture("545-r3-g18-d6.json"),
      input = f.input;
    const action = input.legalActions.find(
      (a: any) =>
        a.payload?.serverId === "hq" && a.source.includes("canis-major"),
    );
    const source = input.playerView.own.gripOrHq.find(
      (c: any) => c.instanceId === action.source,
    );
    const quote = JSON.parse(action.payload.postInstallEffectiveRunQuoteJson);
    quote.conditionalEncounterEffects = [
      { kind: "corp_paid_add_end_the_run_subroutine", creditCost: 1 },
    ];
    action.payload.postInstallEffectiveRunQuoteJson = JSON.stringify(quote);
    expect(corpIceInstallPositionEffect(input, action, source, "hq")).toBe(
      "not_excluded_by_position",
    );
  });
});
