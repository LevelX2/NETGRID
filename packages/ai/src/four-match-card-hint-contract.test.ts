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
  timing: string;
  scope: string;
  resource?: string;
  amount?: number;
  target?: string;
};

type HintCard = {
  cardId: string;
  roles: string[];
  planRoles: string[];
  requiredMechanics?: string[];
  tacticSignals?: string[];
  effects?: HintEffect[];
  conditions?: Array<{ kind: string }>;
  targetProfiles?: Array<{
    targetType?: string;
    purpose?: string;
    preferences?: string[];
    hiddenInfoPolicy?: string;
  }>;
};

const hintSources = [
  "data/ai/ai-card-hints-active.json",
  "data/ai/ai-card-hints-compiled.json",
] as const;

describe.each(hintSources)("four-match card semantics in %s", (source) => {
  const hints = readHints(source);

  it("models Disgruntled Ice Technician as a run with a fully-broken ICE derez payoff", () => {
    const hint = card(hints, "onr_proteus_106_disgruntled-ice-technician");

    expect(hint.roles).toEqual(
      expect.arrayContaining(["event", "run_event", "derez", "fully_broken_ice"]),
    );
    expect(hint.planRoles).not.toContain("pressure_rnd");
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "future_run_effect",
          target: "make_run",
        }),
        expect.objectContaining({ kind: "rez", target: "derez" }),
        expect.objectContaining({
          kind: "future_run_effect",
          target: "ends_run_after_effect",
        }),
      ]),
    );
    expect(hint.effects).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "ice_trash" })]),
    );
    expect(hint.targetProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: "installed_ice",
          purpose: "derez_fully_broken_ice",
        }),
      ]),
    );
  });

  it.each([
    ["Militech MRAM Chip", "onr_v1_133_militech-mram-chip", 3],
    ["MRAM Chip", "onr_v1_134_mram-chip", 2],
  ])("keeps %s as hand-size support rather than memory", (_name, cardId, amount) => {
    const hint = card(hints, cardId);

    expect(hint.roles).toEqual(expect.arrayContaining(["hardware", "hand_size"]));
    expect(hint.roles).not.toContain("memory");
    expect(hint.planRoles).not.toContain("remote_upgrade_modifier");
    expect(hint.tacticSignals).toContain("setup.hand_size");
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "hand_size_modifier",
          scope: "runner",
          resource: "hand_size",
          amount,
        }),
      ]),
    );
  });

  it("keeps Mantis card search distinct from draw", () => {
    const hint = card(hints, "onr_v1_099_mantis-fixer-at-large");

    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "search", target: "card_search" }),
      ]),
    );
    expect(hint.effects).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "draw" })]),
    );
  });

  it("keeps Score as pure burst economy", () => {
    const hint = card(hints, "onr_v1_108_score");

    expect(hint.roles).toEqual(["economy"]);
    expect(hint.planRoles).toEqual(["recover_economy"]);
    expect(hint.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "economy",
          scope: "runner",
          resource: "credits",
          amount: 9,
          target: "burst_credit",
        }),
      ]),
    );
    expect(hint.effects?.every((effect) => effect.kind === "economy")).toBe(
      true,
    );
  });

  it("keeps Corporate Downsizing on HQ agenda cleanup mechanics", () => {
    const hint = card(hints, "onr_v1_194_corporate-downsizing");

    expect(hint.planRoles).not.toContain("protect_rnd");
    expect(hint.requiredMechanics).toEqual(
      expect.arrayContaining([
        "hq_agenda_reveal",
        "hq_agenda_shuffle_into_rd",
      ]),
    );
    expect(hint.requiredMechanics).not.toContain("reveal_rd_top");
    expect(hint.tacticSignals).toEqual(
      expect.arrayContaining([
        "economy.corp_agenda_reveal_burst",
        "hq.corp_agenda_density_reduction",
        "rnd.corp_agenda_shuffle_from_hq",
        "score.hq_agenda_reveal",
        "score.hq_agenda_shuffle",
      ]),
    );
  });

  it.each([
    ["Cloak", "onr_v1_011_cloak", 3],
    ["Vewy Vewy Quiet", "onr_v1_071_vewy-vewy-quiet", 2],
  ])(
    "normalizes %s to non-noisy recurring breaker credits",
    (_name, cardId, amount) => {
      const hint = card(hints, cardId);

      expect(hint.tacticSignals).toContain(
        "economy.recurring_non_noisy_breaker_credit",
      );
      expect(hint.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "recurring_economy",
            resource: "credits",
            amount,
            target: "non_noisy_icebreaker",
          }),
        ]),
      );
    },
  );
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
