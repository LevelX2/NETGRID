import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildCorpIceCardFacts } from "./runtime/corp-ice-placement/corp-ice-placement";

const entries = cardSpecPlanningCards();
function entry(id: string) {
  const e = entries.find((c) => c.definition.id === id);
  if (!e) throw Error(`counter_lock_test_missing_card:${id}`);
  return e;
}
function mechanical(id: string) {
  const e = entry(id),
    planning = { ...e.planning };
  delete planning.planningAnnotations;
  return deriveCardSpecAiHint({ ...e, planning });
}
function hints(id: string) {
  const generated = AI_HINTS_BY_CARD.get(id);
  if (!generated) throw Error(`counter_lock_test_missing_hint:${id}`);
  return [mechanical(id), generated];
}

describe("typed runner-counter and run-duration lock projections", () => {
  it.each([
    ["onr_v1_236_data-raven", "tags", 1, 1],
    ["onr_proteus_057_doppelganger-antibody", "credits", 1, 4],
    ["onr_v1_354_crybaby", undefined, undefined, 2],
  ] as const)(
    "does not invent damage or run-end counters for %s",
    (id, resource, amount, removal) => {
      for (const h of hints(id)) {
        expect(h.functionSignals).not.toContain(
          "damage.corp_persistent_damage_counter",
        );
        expect(h.functionSignals).not.toContain("defense.corp_run_end_counter");
        expect(h.tacticSignals ?? []).not.toContain(
          "damage.corp_persistent_damage_counter",
        );
        expect(h.tacticSignals ?? []).not.toContain(
          "defense.corp_run_end_counter",
        );
        expect(h.requiredMechanics).not.toContain("run_start_counter_damage");
        expect(h.requiredMechanics).toEqual(
          expect.arrayContaining(["runner_counter", "runner_counter_removal"]),
        );
        if (resource)
          expect(h.effects).toContainEqual(
            expect.objectContaining({
              kind: "persistent_counter_effect",
              timing: "start_of_turn",
              resource,
              amount,
            }),
          );
        expect(h.effects).toContainEqual(
          expect.objectContaining({
            kind: "persistent_counter_effect",
            timing: "action",
            resource: "counters",
            amount: 1,
            counterRemoval: {
              counterType: expect.any(String), credits: removal, clicks: 1, amount: 1,
            },
            target: expect.stringContaining(`remove_for_${removal}_credits`),
          }),
        );
      }
    },
  );
  it.each([
    ["onr_classic_005_baskerville", "net_damage", 2],
    ["onr_v1_227_cerberus", "net_damage", 2],
    ["onr_v1_255_mastiff", "brain_damage", 1],
  ] as const)(
    "keeps the actual run-start damage of %s without adding an ETR",
    (id, resource, amount) => {
      for (const h of hints(id)) {
        expect(h.functionSignals).toContain(
          "damage.corp_persistent_damage_counter",
        );
        expect(h.tacticSignals).toContain(
          "damage.corp_persistent_damage_counter",
        );
        expect(h.functionSignals).not.toContain("defense.corp_run_end_counter");
        expect(h.requiredMechanics).toContain("run_start_counter_damage");
        expect(h.effects).toContainEqual(
          expect.objectContaining({
            kind: "persistent_counter_effect",
            timing: "start_of_run",
            resource,
            amount,
            repeatable: true,
          }),
        );
      }
      const facts = buildCorpIceCardFacts({
        instanceId: "counter-ice",
        known: true,
        type: "ice",
        definitionId: id,
      });
      expect(facts).toMatchObject({
        damage: true,
        persistentDamageCounter: true,
      });
    },
  );
  it.each(["onr_classic_001_data-fort-remapping", "onr_v1_192_corporate-boon"])(
    "keeps real scored-agenda run-end counters in %s",
    (id) => {
      for (const h of hints(id))
        expect(h.functionSignals).toContain("defense.corp_run_end_counter");
    },
  );
  it("feeds the genuine non-damaging Raven counter to the existing defense fact consumer", () => {
    const facts = buildCorpIceCardFacts({
      instanceId: "raven",
      known: true,
      type: "ice",
      definitionId: "onr_v1_236_data-raven",
    });
    expect(facts).toMatchObject({
      damage: false,
      persistentDamageCounter: false,
      tagTrace: true,
      runLock: false,
    });
  });
  it("projects the printed run-duration jack-out prohibition without annotations", () => {
    for (const h of hints("onr_v1_251_jack-attack")) {
      expect(h.functionSignals).toEqual(
        expect.arrayContaining(["corp_ice.jack_out_lock", "run.lock"]),
      );
      expect(h.tacticSignals).toEqual(
        expect.arrayContaining(["corp_ice.jack_out_lock", "run.lock"]),
      );
      expect(h.effects).toContainEqual({
        kind: "run_lock",
        scope: "run_path",
        timing: "encounter",
        target: "corp_ice.jack_out_lock",
        finite: true,
      });
    }
    expect(
      buildCorpIceCardFacts({
        instanceId: "jack",
        known: true,
        type: "ice",
        definitionId: "onr_v1_251_jack-attack",
      }).runLock,
    ).toBe(true);
    for (const id of ["onr_v1_249_hunter", "onr_v1_236_data-raven"]) {
      expect(
        (mechanical(id).effects ?? []).some((e) => e.kind === "run_lock"),
      ).toBe(false);
      expect(mechanical(id).functionSignals).not.toContain(
        "corp_ice.jack_out_lock",
      );
    }
    expect(mechanical("onr_v1_221_asp").functionSignals).not.toContain(
      "corp_ice.jack_out_lock",
    );
  });
  it("derives counter semantics from typed effects when the supported card identity changes", () => {
    const e = entry("onr_v1_236_data-raven"),
      planning = { ...e.planning };
    delete planning.planningAnnotations;
    const renamed = deriveCardSpecAiHint({
      ...e,
      definition: {
        ...e.definition,
        id: entry("onr_v1_249_hunter").definition.id,
      },
      planning,
    });
    expect(renamed.functionSignals).not.toContain(
      "damage.corp_persistent_damage_counter",
    );
    expect(renamed.functionSignals).not.toContain(
      "defense.corp_run_end_counter",
    );
    expect(renamed.effects).toContainEqual(
      expect.objectContaining({
        kind: "persistent_counter_effect",
        resource: "tags",
        timing: "start_of_turn",
        amount: 1,
      }),
    );
  });
});
