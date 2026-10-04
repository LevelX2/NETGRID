import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { persistentEngineProfileForCard } from "./runner/hand-development/runner-persistent-install-evaluation";
import { visibleCard } from "./runner-hand-development.test-support";

describe("tag prevention consumption follows the actual typed source cost", () => {
  it.each(
    cardSpecPlanningCards()
      .filter((c) => c.planning.engine.tagPreventionSources !== undefined)
      .map((c) => [c.definition.id, c] as const),
  )("keeps canonical and generated semantics for %s", (id, entry) => {
    const sources = entry.planning.engine.tagPreventionSources!;
    const consumed = sources.some(
      (s) =>
        s.cost.kind === "trash_source" ||
        s.cost.kind === "credit_and_trash_source",
    );
    const paid = sources.some(
      (s) => s.cost.kind !== "trash_source" && s.cost.amount > 0,
    );
    for (const hint of [
      deriveCardSpecAiHint(entry),
      AI_HINTS_BY_CARD.get(id)!,
    ]) {
      expect(hint.requiredMechanics?.includes("trash_source")).toBe(consumed);
      if (paid) expect(hint.requiredMechanics).toContain("credit_cost");
      expect(
        hint.effects?.filter(
          (e) =>
            e.kind === "tag_prevention" && e.timing === "prevention_window",
        ),
      ).toEqual(
        sources.map((s) => ({
          kind: "tag_prevention",
          scope: "runner",
          timing: "prevention_window",
          resource: "tags",
          target: "avoid_tag",
          amount: 1,
          ...(s.cost.kind === "trash_source" ||
          s.cost.kind === "credit_and_trash_source"
            ? { finite: true }
            : { repeatable: true }),
        })),
      );
    }
  });
  it("does not mark repeatable Nasuko protection as a self-consuming persistent provider", () => {
    const card = visibleCard("nasuko", {
      definitionId: "onr_v1_135_nasuko-cycle",
      type: "hardware",
      installCost: 1,
    });
    expect(persistentEngineProfileForCard(card).consumptionBlockers).toEqual(
      [],
    );
    const hint = AI_HINTS_BY_CARD.get(card.definitionId!)!;
    expect(hint.riskTags).not.toContain("trash_source");
    expect(hint.planRoles).toContain("avoid_tags");
  });
  it("retains the actual consuming Fall Guy counterpart", () => {
    const card = visibleCard("fall-guy", {
      definitionId: "onr_v1_161_fall-guy",
      type: "resource",
      installCost: 0,
    });
    expect(persistentEngineProfileForCard(card).consumptionBlockers).toContain(
      "mechanic:trash_source",
    );
    expect(
      AI_HINTS_BY_CARD.get(card.definitionId!)!.requiredMechanics,
    ).not.toContain("credit_cost");
  });
});
