import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const offSiteId = "onr_v1_296_off-site-backups";
const reclamationId = "onr_classic_018_reclamation-project";

function generatedHint(cardId: string) {
  const hint = AI_HINTS_BY_CARD.get(cardId);
  if (hint === undefined)
    throw new Error(`missing_generated_test_hint:${cardId}`);
  return hint;
}

function entry(cardId: string) {
  const card = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (card === undefined) throw new Error(`missing_test_card:${cardId}`);
  return card;
}

function expectUnrestrictedRecovery(hint: {
  effects?: unknown;
  functionSignals?: unknown;
  roles: unknown;
  tacticSignals?: unknown;
}) {
  expect(hint.effects).toContainEqual(
    expect.objectContaining({
      kind: "card_recovery",
      scope: "archives",
      target: "archives.corp_recovery",
    }),
  );
  expect(hint.functionSignals).toContain("archives.corp_recovery");
  expect(hint.roles).not.toContain("ice_recovery");
  expect(hint.effects).not.toContainEqual(
    expect.objectContaining({ target: "ice_recovery" }),
  );
  for (const signal of ["hq.corp_ice_recovery", "ice.corp_recovery"])
    expect(hint.tacticSignals).not.toContain(signal);
}

describe("typed Archives recovery hint semantics", () => {
  it.each([
    "onr_classic_017_corporate-shuffle",
    reclamationId,
    "onr_classic_040_meat-upgrade",
    "onr_classic_041_networking",
    "onr_classic_042_panzer-run",
    "onr_classic_043_running-interference",
  ])("retains the real additional play action in %s", (cardId) => {
    const compiled = deriveCardSpecAiHint(entry(cardId));
    const generated = generatedHint(cardId);
    expect(compiled.costProfile?.clicks).toBe(2);
    expect(generated.costProfile?.clicks).toBe(2);
  });

  it("keeps Off-Site Backups unrestricted, private, and one action", () => {
    const compiled = deriveCardSpecAiHint(entry(offSiteId));
    const generated = generatedHint(offSiteId);
    for (const hint of [compiled, generated]) {
      expectUnrestrictedRecovery(hint);
      expect(hint.costProfile).toMatchObject({ clicks: 1, credits: 0 });
      expect(hint.requiredMechanics).toContain("archives_to_hq");
      for (const mechanic of ["double_action_cost", "reveal"])
        expect(hint.requiredMechanics).not.toContain(mechanic);
      for (const risk of ["double_action", "reveal_to_runner"])
        expect(hint.riskTags).not.toContain(risk);
      for (const signal of [
        "info.reveal_recovered_cards_to_runner",
        "risk.double_operation_action_cost",
      ]) {
        expect(hint.functionSignals).not.toContain(signal);
        expect(hint.tacticSignals).not.toContain(signal);
      }
    }
  });

  it("preserves Reclamation Project's explicit ICE filter, reveal, and two actions", () => {
    const compiled = deriveCardSpecAiHint(entry(reclamationId));
    const generated = generatedHint(reclamationId);
    for (const hint of [compiled, generated]) {
      expect(hint.costProfile).toMatchObject({ clicks: 2, credits: 0 });
      expect(hint.roles).toContain("ice_recovery");
      expect(hint.requiredMechanics).toEqual(
        expect.arrayContaining([
          "archives_to_hq",
          "double_action_cost",
          "reveal",
        ]),
      );
      expect(hint.riskTags).toEqual(
        expect.arrayContaining(["double_action", "reveal_to_runner"]),
      );
      expect(hint.functionSignals).toEqual(
        expect.arrayContaining([
          "info.reveal_recovered_cards_to_runner",
          "risk.double_operation_action_cost",
        ]),
      );
      expect(hint.tacticSignals).toEqual(
        expect.arrayContaining(["hq.corp_ice_recovery", "ice.corp_recovery"]),
      );
    }
  });

  it.each([
    { name: "reveal only", reveal: true, double: false, ice: false },
    { name: "additional action only", reveal: false, double: true, ice: false },
    { name: "ICE filter only", reveal: false, double: false, ice: true },
  ])("keeps optional fields independent: $name", ({ reveal, double, ice }) => {
    const card = entry(offSiteId);
    const planning = { ...card.planning };
    delete planning.planningAnnotations;
    const utility = planning.engine.corpUtility;
    if (utility?.kind !== "corp_archives_to_hq")
      throw new Error("archives_recovery_test_binding_missing");
    const hint = deriveCardSpecAiHint({
      ...card,
      planning: {
        ...planning,
        engine: {
          ...planning.engine,
          corpUtility: {
            ...utility,
            ...(reveal ? { revealToRunner: true as const } : {}),
            ...(double
              ? {
                  playCost: {
                    kind: "printed" as const,
                    additionalClicks: 1 as const,
                  },
                }
              : {}),
            ...(ice ? { filter: { cardType: "ice" as const } } : {}),
          },
        },
      },
    });
    expect(hint.costProfile?.clicks).toBe(double ? 2 : 1);
    expect(hint.requiredMechanics?.includes("reveal")).toBe(reveal);
    expect(hint.riskTags?.includes("reveal_to_runner") ?? false).toBe(reveal);
    expect(hint.requiredMechanics?.includes("double_action_cost")).toBe(double);
    expect(hint.riskTags?.includes("double_action") ?? false).toBe(double);
    expect(hint.roles.includes("ice_recovery")).toBe(ice);
    expect(
      hint.functionSignals?.includes("info.reveal_recovered_cards_to_runner") ??
        false,
    ).toBe(reveal);
    expect(
      hint.functionSignals?.includes("risk.double_operation_action_cost") ??
        false,
    ).toBe(double);
    expect(hint.tacticSignals?.includes("hq.corp_ice_recovery") ?? false).toBe(
      ice,
    );
    if (!ice) expectUnrestrictedRecovery(hint);
  });
});
