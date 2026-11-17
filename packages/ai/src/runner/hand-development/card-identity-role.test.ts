import { getPublicCardView } from "@netgrid/cards/server";
import { describe, expect, it } from "vitest";
import { evaluateRunnerHandDevelopment } from "./hand-development-evaluation";
import {
  findByInstance,
  installAction,
  playEventAction,
  runnerInput,
  visibleCard,
} from "../../runner-hand-development.test-support";

function actualCardRole(id: number, title?: string, unknownTarget?: "ice" | "root") {
  const definition = getPublicCardView(id)!;
  const card = visibleCard(`real-${id}`, {
    definitionId: id,
    title: title ?? definition.title,
    type: definition.cardType,
    subtypes: [...definition.subtypes],
    rulesText: definition.rulesText,
    ...(definition.numeric.installCost === null ? {} : { installCost: definition.numeric.installCost }),
    ...(definition.numeric.memoryCost === null ? {} : { memoryCost: definition.numeric.memoryCost }),
  });
  const action = definition.cardType === "event"
    ? playEventAction("play-real-source", card, definition.playCost?.kind === "fixed" ? definition.playCost.credits : 0)
    : installAction("install-real-source", card, definition.numeric.installCost ?? 0);
  const input = runnerInput({ credits: 15, clicks: 4, hand: [card], legalActions: [action] });
  input.playerView.servers = [
    { id: "hq", label: "HQ", ice: [], root: [] },
    { id: "rd", label: "R&D", ice: [], root: [] },
    { id: "archives", label: "Archives", ice: [], root: [] },
  ];
  if (unknownTarget) {
    input.playerView.servers[1]![unknownTarget].push({
      instanceId: `corp-unknown-${unknownTarget}`,
      known: false,
    });
  }
  return findByInstance(evaluateRunnerHandDevelopment({
    input,
  }), card.instanceId);
}

describe("development roles use card functions rather than identity words (SP-616)", () => {
  it.each([undefined, "Credit Search Memory Engine"])(
    "keeps the real HQ-triggered expose card in access support: %s",
    (title) => {
      expect(actualCardRole(36, title).developmentRole)
        .toBe("access_payoff");
    },
  );

  it("retains actual search and economy functions independently of their title", () => {
    expect(actualCardRole(38, "Unrelated witness").developmentRole)
      .toBe("draw_or_search_engine");
    expect(actualCardRole(45, "Unrelated witness").developmentRole)
      .toBe("economy_engine");
  });

  it.each([191, 210])(
    "classifies %s as finite income rather than manual savings",
    (id) => expect(actualCardRole(id).developmentRole).toBe("economy_engine"),
  );

  it("does not treat losing opposing credits as own income", () => {
    expect(actualCardRole(194).developmentRole)
      .toBe("access_payoff");
  });

  it("retains the actual manual bank capability", () => {
    expect(actualCardRole(366).developmentRole).toBe("bank_tool");
  });
});

describe("installed-card information development uses actual missing information", () => {
  it("does not invent an expose need when no installed Corp card is unknown", () => {
    expect(actualCardRole(36).currentNeed)
      .toBe("none");
  });

  it.each(["ice", "root"] as const)("recognizes an unknown installed %s target", (target) => {
    expect(actualCardRole(36, undefined, target).currentNeed)
      .toBe("useful_now");
  });
});

describe("post-break derez support keeps its known function (SP-617)", () => {
  it("retains a Derez run event in the run-event owner", () => {
    expect(actualCardRole(164).developmentRole)
      .toBe("run_event");
  });
  it.each([37, 143])(
    "recognizes %s without inventing an unbound installation need",
    (id) => {
      const evaluation = actualCardRole(id);
      expect(evaluation.developmentRole).toBe("access_payoff");
      expect(evaluation.persistentInstallEvaluation?.newFunctionalCoverage)
        .toContain("access_support");
      expect(evaluation.currentNeed).toBe("none");
    },
  );
});

describe("tag-removal credit pools keep their restricted function (SP-805)", () => {
  it.each([
    332,
    338,
  ])("does not classify %s as general income or manual savings", (id) => {
    const evaluation = actualCardRole(id, "Unrelated witness");
    expect(evaluation.developmentRole).toBe("defense_support");
    expect(evaluation.liquidityTiming).toBe("none");
    expect(evaluation.persistentInstallEvaluation?.newFunctionalCoverage)
      .toContain("tag_clear_credit_support");
    expect(evaluation.persistentInstallEvaluation?.newFunctionalCoverage)
      .not.toContain("bank_tool");
    expect(evaluation.persistentInstallEvaluation?.newFunctionalCoverage)
      .not.toContain("economy_engine");
  });
});
