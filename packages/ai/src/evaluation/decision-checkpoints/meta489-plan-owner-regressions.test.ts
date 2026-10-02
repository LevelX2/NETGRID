import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreResidentPlanPortfolioMemorySnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";

function checkpoint(name: "g10-d129" | "g27-d112") {
  const fixture = JSON.parse(
    readFileSync(
      new URL(`./fixtures/meta489-${name}.json`, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...fixture.input,
    ...buildAiDecisionInputDto(fixture.input),
  } as AiDecisionInput;
  // A historical in-flight window requires its captured lease. The ordinary
  // checkpoint restart API deliberately invalidates leases for new planning.
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(fixture.runtime.residentPlanPortfolio),
  );
  return input;
}

describe("meta489 native plan-owner regressions", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("keeps the exact scoring agenda and executes its cheaper current-turn route", () => {
    const input = checkpoint("g10-d129");
    const agenda = "corp_onr_v1_196_corporate-war_1";
    const parent = `plan:corp.score_agenda:agenda%3A${agenda}%3Aremote_1`;
    expect(
      corpSameTurnScoreConversionPaths(input).find(
        (path) => path.agendaCardId === agenda,
      ),
    ).toMatchObject({
      creditsRequired: 2,
      clicksRequired: 2,
      sameTurnGuaranteed: true,
    });
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(`corp.advance_card.${agenda}.${agenda}`);
    expect(
      input.legalActions.find(
        (action) => action.actionId === selected.actionId,
      ),
    ).toMatchObject({
      side: "corp",
      type: "advance_card",
      expiresAtStateVersion: 128,
      costs: [{ clicks: 1, credits: 1 }],
    });
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: parent,
      leafExecutorInstanceId: parent,
      executionOrigin: {
        rootPlanInstanceId: parent,
        leafPlanInstanceId: parent,
        stateVersion: 128,
      },
    });
  });

  it("retains the exact run parent through two root rezzes before exposing ICE", () => {
    const input = checkpoint("g27-d112");
    const selected = chooseAiAction(input);
    const expose = input.legalActions.find(
      (action) => action.payload?.approachIceExposeDecision === "expose",
    );
    expect(selected.actionId).toBe(expose?.actionId);
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      leafExecutorInstanceId:
        "plan:runner.expose_information:ice%3Acorp_onr_proteus_017_credit-blocks_3",
      executionOrigin: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        stateVersion: 111,
      },
    });
    expect(expose).toMatchObject({
      side: "runner",
      expiresAtStateVersion: 111,
      payload: {
        cardId: "runner_onr_v1_065_smarteye_1",
        iceId: "corp_onr_proteus_017_credit-blocks_3",
      },
    });
  });

  it.each(["gap", "actor", "server"] as const)(
    "rejects a root-rez continuation with the wrong %s",
    (defect) => {
      const input = checkpoint("g27-d112");
      const event = input.eventTail.find(
        (item) => item.stateVersionBefore === 109,
      )!;
      if (defect === "gap") event.stateVersionBefore = 108;
      if (defect === "actor") event.publicPayload.actor = "runner";
      if (defect === "server") event.publicPayload.serverId = "rd";
      expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
    },
  );
});
