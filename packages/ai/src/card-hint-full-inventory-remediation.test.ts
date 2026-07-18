import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

type HintEffect = {
  kind: string;
  timing?: string;
  scope?: string;
  resource?: string;
  amount?: number;
  target?: string;
};

type HintCard = {
  cardId: string;
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  effects?: HintEffect[];
  conditions?: Array<{ kind: string }>;
  breakerProfile?: { coverage?: string[] };
};

const hintSources = [
  "data/ai/ai-card-hints-active.json",
  "data/ai/ai-card-hints-compiled.json",
] as const;

describe.each(hintSources)("AIH-01 card semantics in %s", (source) => {
  const hints = readHints(source);

  it.each([
    ["onr_v1_221_asp", "Asp"],
    ["onr_v1_241_fang-2-0", "Fang 2.0"],
  ])("keeps %s trace/run-lock ICE free of false tag hints", (cardId) => {
    const hint = card(hints, cardId);

    expect(hint.roles).not.toContain("tag");
    expect(hint.planRoles).not.toContain("tag_pressure");
    expect(hint.requiredMechanics).not.toContain("add_tag");
  });

  it("keeps Mastiff damage pressure free of a false tag plan", () => {
    expect(card(hints, "onr_v1_255_mastiff").planRoles).not.toContain(
      "tag_pressure",
    );
  });

  it("models Omni Kismet solely as an ICE swap upgrade", () => {
    const hint = card(hints, "onr_v1_364_omni-kismet-ph-d");

    expect(hint.roles).toEqual(["upgrade"]);
    expect(hint.requiredMechanics).not.toEqual(
      expect.arrayContaining(["tag_condition", "gain_credit"]),
    );
    expect(hint.valueHints).toEqual({});
    expect(hint.riskTags).not.toContain("tag_risk");
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "zone_shuffle",
          target: "ice.corp_ice_swap",
        }),
      ]),
    );
  });

  it("keeps Fragmentation Storm free of nonexistent damage semantics", () => {
    const hint = card(hints, "onr_v1_246_fragmentation-storm");

    expect(hint.roles).not.toContain("net_damage");
    expect(hint.requiredMechanics).not.toContain("net_damage");
    expect(hint.riskTags).not.toContain("damage_window");
  });

  it.each([
    ["onr_v1_083_desperate-competitor", "requires_liberated_gray_ops_agenda"],
    ["onr_v1_090_hot-tip-for-wns", "requires_liberated_black_ops_agenda"],
  ])("requires a liberated agenda for %s", (cardId, subtypeCondition) => {
    const hint = card(hints, cardId);
    const conditionKinds = hint.conditions?.map((entry) => entry.kind) ?? [];

    expect(conditionKinds).toEqual(
      expect.arrayContaining([
        "requires_liberated_agenda_this_turn",
        subtypeCondition,
      ]),
    );
    expect(conditionKinds).not.toContain("requires_scored_agenda");
  });

  it.each([
    ["onr_proteus_101_all-hands", "All-Hands"],
    ["onr_proteus_102_blackmail", "Blackmail"],
  ])("keeps the HQ-only plan role for %s", (cardId) => {
    expect(card(hints, cardId).planRoles).toEqual(["pressure_hq"]);
  });

  it("does not route Edited Shipping Manifests into remote contest", () => {
    expect(
      card(hints, "onr_v1_084_edited-shipping-manifests").planRoles,
    ).toEqual(["pressure_hq"]);
  });

  it("does not claim regular sentry coverage for Bulldozer", () => {
    expect(card(hints, "onr_proteus_082_bulldozer").roles).not.toContain(
      "breaker_killer",
    );
  });

  it("models Credit Subversion as HQ economy denial without tag payoff", () => {
    const hint = card(hints, "onr_proteus_136_credit-subversion");

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "counter_economy",
          scope: "corp",
          amount: 3,
          target: "access.hq_sabotage_credit_loss",
        }),
      ]),
    );
    expect(hint.effects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "tag_punish_payoff" }),
        expect.objectContaining({ kind: "access_replacement" }),
      ]),
    );
  });

  it("models Get Ready to Rumble as damage retaliation and HQ disruption", () => {
    const hint = card(hints, "onr_proteus_141_get-ready-to-rumble");

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: "defense.damage_retaliation" }),
        expect.objectContaining({
          kind: "persistent_counter_effect",
          scope: "hq",
          amount: 2,
          target: "random_discard",
        }),
      ]),
    );
    expect(hint.effects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "tag_punish_payoff" }),
        expect.objectContaining({ kind: "access_replacement" }),
      ]),
    );
  });

  it("models Live News Feed self-tags and bad-publicity pressure", () => {
    const hint = card(hints, "onr_proteus_113_live-news-feed");

    expect(hint.planRoles).toEqual(["run_pressure"]);
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "tag",
          scope: "runner",
          amount: 2,
          target: "self_tag",
        }),
        expect.objectContaining({
          kind: "global_modifier",
          scope: "corp",
          target: "bad_publicity_win_pressure",
        }),
      ]),
    );
  });

  it.each([
    ["onr_proteus_142_hq-mole", "hq"],
    ["onr_proteus_147_r-and-d-mole", "rnd"],
  ])("models %s as actual multiaccess", (cardId, scope) => {
    const hint = card(hints, cardId);

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "multiaccess",
          scope,
          amount: 2,
        }),
      ]),
    );
    expect(hint.effects).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "access_replacement" }),
      ]),
    );
  });

  it("transports Washed-Up Solo Construct pay-or-trash and rez economy", () => {
    const hint = card(hints, "onr_proteus_045_washed-up-solo-construct");

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "program_trash",
          target: "corp_ice.program_trash",
        }),
        expect.objectContaining({
          kind: "run_tax",
          amount: 1,
          target: "corp_ice.runner_pay_or_program_trash",
        }),
        expect.objectContaining({
          kind: "economy",
          amount: 3,
          target: "corp_ice.rez_economy",
        }),
      ]),
    );
  });
});

describe("AIH-01 compiled breaker coverage", () => {
  const hints = readHints("data/ai/ai-card-hints-compiled.json");

  it("keeps Bulldozer coverage limited to walls", () => {
    expect(
      card(hints, "onr_proteus_082_bulldozer").breakerProfile?.coverage,
    ).toEqual(["wall"]);
  });
});

function readHints(relativePath: string): HintCard[] {
  const artifact = JSON.parse(
    fs.readFileSync(path.join(repoRoot, relativePath), "utf8"),
  ) as { cards: HintCard[] };
  return artifact.cards;
}

function card(hints: HintCard[], cardId: string): HintCard {
  const found = hints.find((hint) => hint.cardId === cardId);
  if (!found) throw new Error(`Missing AI hint ${cardId}`);
  return found;
}
