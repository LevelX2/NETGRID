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

function actualCardRole(id: string, title?: string, unknownTarget?: "ice" | "root") {
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
      expect(actualCardRole("onr_classic_032_schematics-search-engine", title).developmentRole)
        .toBe("access_payoff");
    },
  );

  it("retains actual search and economy functions independently of their title", () => {
    expect(actualCardRole("onr_classic_034_boostergang-connections", "Unrelated witness").developmentRole)
      .toBe("draw_or_search_engine");
    expect(actualCardRole("onr_classic_041_networking", "Unrelated witness").developmentRole)
      .toBe("economy_engine");
  });

  it.each(["onr_proteus_133_chiba-bank-account", "onr_proteus_152_swiss-bank-account"])(
    "classifies %s as finite income rather than manual savings",
    (id) => expect(actualCardRole(id).developmentRole).toBe("economy_engine"),
  );

  it("does not treat losing opposing credits as own income", () => {
    expect(actualCardRole("onr_proteus_136_credit-subversion").developmentRole)
      .toBe("access_payoff");
  });

  it("retains the actual manual bank capability", () => {
    expect(actualCardRole("onr_v1_154_broker").developmentRole).toBe("bank_tool");
  });
});

describe("installed-card information development uses actual missing information", () => {
  it("does not invent an expose need when no installed Corp card is unknown", () => {
    expect(actualCardRole("onr_classic_032_schematics-search-engine").currentNeed)
      .toBe("none");
  });

  it.each(["ice", "root"] as const)("recognizes an unknown installed %s target", (target) => {
    expect(actualCardRole("onr_classic_032_schematics-search-engine", undefined, target).currentNeed)
      .toBe("useful_now");
  });
});

describe("post-break derez support keeps its known function (SP-617)", () => {
  it("retains a Derez run event in the run-event owner", () => {
    expect(actualCardRole("onr_proteus_106_disgruntled-ice-technician").developmentRole)
      .toBe("run_event");
  });
  it.each(["onr_classic_033_superglue", "onr_proteus_085_disintegrator"])(
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
