import { describe, expect, it } from "vitest";

import {
  classifyTagPunishLegalActionFromOntology,
  getStructuredTagPunishProfileForCard,
  tagPunishOntologyConflictWithLegacy,
  type StructuredTagPunishProfile,
} from "./tag-punish-ontology-consumer";
import type { LegalAction } from "@netgrid/shared";

describe("tag punish ontology conflict detection", () => {
  it("matches legacy tag and payoff roles by bounded role terms", () => {
    expect(
      tagPunishOntologyConflictWithLegacy(tagSourceProfile(), [
        "tag_punishment",
      ]),
    ).toBe(true);
    expect(
      tagPunishOntologyConflictWithLegacy(payoffProfile(), ["trace_tag"]),
    ).toBe(true);
    expect(
      tagPunishOntologyConflictWithLegacy(payoffProfile(), ["trace"]),
    ).toBe(true);
  });

  it("ignores tag and payoff substring noise in legacy roles", () => {
    expect(
      tagPunishOntologyConflictWithLegacy(tagSourceProfile(), [
        "tag_punishmentish_noise",
        "damage_operational_noise",
      ]),
    ).toBe(false);
    expect(
      tagPunishOntologyConflictWithLegacy(payoffProfile(), [
        "tag_sourceish_noise",
        "trace_tagish_noise",
      ]),
    ).toBe(false);
  });

  it("does not classify Rex rez as a tag source", () => {
    const assessment = classifyTagPunishLegalActionFromOntology(
      rezAction(),
      "onr_v1_264_rex",
      { runnerTagged: false },
    );

    expect(assessment?.isTagSource).toBe(false);
    expect(assessment?.isTraceTagSource).toBe(false);
  });

  it("keeps Fetch rez classified as a real trace tag source", () => {
    const assessment = classifyTagPunishLegalActionFromOntology(
      rezAction(),
      "onr_v1_243_fetch-4-0-1",
      { runnerTagged: false },
    );

    expect(assessment?.isTagSource).toBe(true);
    expect(assessment?.isTraceTagSource).toBe(true);
  });

  it("does not classify a typed source-trash economy cashout as tag punishment", () => {
    expect(
      getStructuredTagPunishProfileForCard("onr_v1_328_information-laundering"),
    ).toBeUndefined();
  });

  it("classifies installed access, follow-up, and random damage cards by typed mechanics", () => {
    expect(
      getStructuredTagPunishProfileForCard("onr_v1_372_turbeau-delacroix"),
    ).toMatchObject({
      tagSource: true,
      traceTagSource: true,
      payoff: false,
      requiresTraceSuccess: true,
    });
    expect(
      getStructuredTagPunishProfileForCard("onr_v1_333_omniscience-foundation"),
    ).toMatchObject({
      tagSource: true,
      payoff: false,
    });
    expect(
      getStructuredTagPunishProfileForCard("onr_v1_339_schlaghund"),
    ).toMatchObject({
      tagSource: false,
      payoff: true,
      requiresRunnerTagged: true,
      payoffKinds: expect.arrayContaining(["damage"]),
    });
  });
});

function rezAction(): LegalAction {
  return {
    actionId: "corp.rez_ice",
    side: "corp",
    type: "rez_ice",
    source: "ice-instance",
    costs: [],
    payload: {},
  } as unknown as LegalAction;
}

function tagSourceProfile(): StructuredTagPunishProfile {
  return profile({ tagSource: true });
}

function payoffProfile(): StructuredTagPunishProfile {
  return profile({ payoff: true });
}

function profile(
  overrides: Partial<StructuredTagPunishProfile>,
): StructuredTagPunishProfile {
  return {
    tagSource: false,
    traceTagSource: false,
    payoff: false,
    requiresScoredAgenda: false,
    requiresRunnerTagged: false,
    requiresTraceSuccess: false,
    effectKinds: [],
    conditionKinds: [],
    payoffKinds: [],
    evidence: [],
    ...overrides,
  };
}
