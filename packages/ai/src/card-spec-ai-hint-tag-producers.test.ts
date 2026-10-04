import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import {
  classifyTagSourceFromOntology,
  classifyTagPunishLegalActionFromOntology,
} from "./tag-punish-ontology-consumer";
import type { LegalAction } from "@netgrid/shared";

const marked = "onr_proteus_005_marked-accounts";
const trap = "onr_v1_345_trap";
const hunting = "onr_proteus_026_hunting-pack";

function entry(id: string) {
  const result = cardSpecPlanningCards().find((c) => c.definition.id === id);
  if (!result) throw new Error(`missing_native_tag_witness:${id}`);
  return result;
}
function mechanicalHint(id: string) {
  const card = entry(id);
  const planning = { ...card.planning };
  delete planning.planningAnnotations;
  return deriveCardSpecAiHint({ ...card, planning });
}

describe("native access and relative-ICE tag producers", () => {
  it.each([marked, trap])(
    "projects direct access tags without strategy annotations: %s",
    (id) => {
      const card = entry(id);
      const sourceTag = card.planning.engine
        .accessEffects!.flatMap((a) => a.effects)
        .find((e) => e.kind === "add_tags")!;
      expect(sourceTag.kind).toBe("add_tags");
      const hint = mechanicalHint(id);
      expect(hint.effects).toContainEqual({
        kind: "tag_source",
        scope: "runner",
        timing: "on_access",
        resource: "tags",
        target: "tag.source",
        amount: 1,
        finite: true,
      });
      expect(hint.functionSignals).toContain("tag.source");
      expect(hint.tacticSignals).toContain("access.corp_tag_ambush");
      expect(classifyTagSourceFromOntology(hint)).toMatchObject({
        tagSource: true,
        traceTagSource: false,
      });
      expect(
        classifyTagSourceFromOntology(AI_HINTS_BY_CARD.get(id)),
      ).toMatchObject({
        tagSource: true,
        traceTagSource: false,
      });
      // Projection preserves canonical all-zone access; a reveal condition does
      // not rewrite native sourceZones or create an unconditional legal action.
      expect(card.planning.engine.accessEffects![0]!.sourceZones).toEqual([
        "installed",
        "hq",
        "rd",
        "archives",
      ]);
    },
  );

  it("keeps non-tag accesses and damage-only relative ICE outside tag classification", () => {
    expect(
      classifyTagSourceFromOntology(mechanicalHint("onr_proteus_004_fetal-ai")),
    ).toBeUndefined();
    expect(
      classifyTagSourceFromOntology(mechanicalHint("onr_proteus_021_dog-pile")),
    ).toBeUndefined();
  });

  it("projects relative public traces with dynamic cardinality and the exact tag payoff", () => {
    const hint = mechanicalHint(hunting);
    expect(hint.effects).toContainEqual({
      kind: "trace",
      scope: "trace",
      timing: "encounter_resolution",
      target: "corp_ice.outer_ice_scaling",
      amountKind: "dynamic",
    });
    expect(hint.effects).toContainEqual({
      kind: "tag_source",
      scope: "runner",
      timing: "trace_success",
      resource: "tags",
      target: "tag.source",
      amount: 1,
      finite: true,
    });
    expect(hint.effects?.some((e) => e.kind === "etr")).toBe(false);
    expect(hint.roles).toEqual(
      expect.arrayContaining(["ice", "sentry_ice", "tag_ice"]),
    );
    expect(hint.functionSignals).toEqual(
      expect.arrayContaining([
        "corp_ice.outer_ice_scaling",
        "trace.source",
        "tag.source",
      ]),
    );
    expect(hint.tacticSignals).toContain("corp_ice.position_scaling");
    expect(classifyTagSourceFromOntology(hint)).toMatchObject({
      tagSource: true,
      traceTagSource: true,
    });
    const action = {
      actionId: "corp.rez_ice",
      side: "corp",
      type: "rez_ice",
      source: "ice-instance",
      costs: [{ credits: 1 }],
      payload: {},
    } as unknown as LegalAction;
    expect(
      classifyTagPunishLegalActionFromOntology(action, hunting, {
        runnerTagged: false,
      }),
    ).toMatchObject({
      isTagSource: true,
      isTraceTagSource: true,
      isPunishPayoff: false,
    });
  });

  it("counts the real generated access and ICE tag sources by copies in the productive profile", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "native-tag-producer-regression",
      side: "corp",
      cards: [
        { cardId: marked, quantity: 3 },
        { cardId: hunting, quantity: 2 },
      ],
    });
    expect(profile.corpProfile?.punishProfile.tagSources).toBe(5);
    expect(profile.corpProfile?.iceProfile.tag).toBe(2);
    expect(profile.corpProfile?.iceProfile.trace).toBe(2);
  });

  it.each([
    { traceLimit: -1 },
    { visibility: "hidden_info_barrier" },
    { traceSuccessEffect: { type: "add_tag", amount: 0 } },
    { traceSuccessEffect: { type: "end_run" } },
  ])("rejects unsupported relative trace shapes: %j", (change) => {
    const card = entry(hunting);
    const relativeIce = card.planning.engine.relativeIce!;
    const planning = { ...card.planning };
    delete planning.planningAnnotations;
    expect(() =>
      deriveCardSpecAiHint({
        ...card,
        planning: {
          ...planning,
          engine: {
            ...card.planning.engine,
            relativeIce: {
              ...relativeIce,
              dynamicTraceSubroutines: {
                ...relativeIce.dynamicTraceSubroutines,
                ...change,
              },
            },
          },
        },
      } as never),
    ).toThrow("card_spec_unknown_relative_ice_dynamic_trace_shape");
  });
});
