import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { expect, it } from "vitest";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function hint(id: string) {
  const entry = cardSpecPlanningCardByDefinitionId(id);
  if (!entry) throw new Error(`missing_test_card:${id}`);
  return deriveCardSpecAiHint(entry);
}

it("distinguishes fort-wide score strength from a separately selected ICE mark", () => {
  const fort = hint("onr_v1_215_security-net-optimization");
  const single = hint("onr_v1_204_ice-transmutation");
  expect(fort.effects).toContainEqual(
    expect.objectContaining({
      kind: "global_modifier",
      scope: "ice",
      resource: "strength",
      target: "score.fort_ice_strength_modifier",
      amount: 1,
    }),
  );
  expect(single.effects).toContainEqual(
    expect.objectContaining({
      kind: "global_modifier",
      scope: "ice",
      resource: "strength",
      target: "score.selected_ice_strength_modifier",
      amount: 1,
    }),
  );
  expect(single.effects).not.toContainEqual(
    expect.objectContaining({
      target: "score.fort_ice_strength_modifier",
    }),
  );
});

it("projects the exact Stack program search of the combined install/run source", () => {
  const combined = hint("onr_proteus_126_test-spin");
  expect(combined.effects).toContainEqual(
    expect.objectContaining({
      kind: "search",
      scope: "stack",
      timing: "action",
      target: "program",
      finite: true,
    }),
  );
  expect(combined.functionSignals).toContain("setup.program_search");
  expect(combined.targetProfiles).toContainEqual(
    expect.objectContaining({
      kind: "search_install_target",
      targetType: "program",
      timing: "on_play",
    }),
  );
  // A current Stack search is no claim of a permanent installation or a
  // successful run; its existing temporary-source/risk metadata stays present.
  expect(combined.planRoles).toContain("temporary_program_search");
  expect(combined.riskTags).toContain("flatline_risk");
});
