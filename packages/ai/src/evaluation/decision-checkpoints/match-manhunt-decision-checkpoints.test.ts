import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-03.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-04.json";
import cp05Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-05.json";
import cp06Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-06.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match Manhunt exact decision checkpoints", () => {
  it("treats the coupled Corp tag and damage line as the primary win condition", () => {
    const result = runAiDecisionCheckpoint(fixture(cp01Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("takes the certified BBS payout when Trace N cannot guarantee the visible tag-and-damage route", () => {
    const result = runAiDecisionCheckpoint(fixture(cp02Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("retains I Got a Rock while its tag line remains reachable", () => {
    const result = runAiDecisionCheckpoint(fixture(cp03Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("abandons the scoreline after all remaining agenda points are exhausted", () => {
    const result = runAiDecisionCheckpoint(fixture(cp04Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("uses the finite economy asset to resolve HQ overflow", () => {
    const result = runAiDecisionCheckpoint(fixture(cp05Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("retains the final visible tag enabler and damage payoff", () => {
    const result = runAiDecisionCheckpoint(fixture(cp06Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("keeps Fast Advance primary when the deck has no tag or damage line", () => {
    const fastAdvanceOnly = mutateFixture(cp01Json, (fixture) => {
      fixture.deckSnapshot.cards = fixture.deckSnapshot.cards.filter(
        (card) => !KILL_LINE_DEFINITION_IDS.has(card.cardId),
      );
      fixture.expectation = {
        strategicIntent: {
          acceptablePrimaryStrategyIds: ["corp.fast_advance"],
          acceptableFamilies: ["corp_fast_advance"],
        },
      };
    });

    const result = runAiDecisionCheckpoint(fastAdvanceOnly);

    expect(result.ok, result.message).toBe(true);
  });

  it("takes the certified campaign payout when no visible tag action remains", () => {
    const noTagWindow = mutateFixture(cp02Json, (fixture) => {
      moveCorpCardsToArchives(fixture, new Set([CHANCE_OBSERVATION]));
      fixture.expectation = {
        exactActionId:
          "corp.activated_card_ability.corp_onr_v1_309_bbs-whispering-campaign_1.corp_onr_v1_309_bbs-whispering-campaign_1.activated.onr_v1_309_bbs-whispering-campaign:abilities_activated_corp_main_take_hosted_credits",
        planExecution: {
          acceptablePlanKinds: ["corp.economy"],
          acceptableCapabilities: ["develop_or_convert_corp_economy"],
          requiredAssessmentEvidence: [
            "corp_engine_certified_visible_card_payout:onr_v1_309_bbs-whispering-campaign",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(noTagWindow);

    expect(result.ok, result.message).toBe(true);
  });

  it("keeps the scoreline when enough agenda points remain in R&D", () => {
    const feasibleScoreline = mutateFixture(cp04Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      for (const agendaId of state.runner.scoreArea.splice(0)) {
        state.corp.rd.push(agendaId);
        state.cardInstances[agendaId] = {
          ...state.cardInstances[agendaId]!,
          zone: { side: "corp", zone: "rd" },
          faceup: false,
          rezzed: false,
        };
      }
      fixture.expectation = {
        strategicIntent: {
          acceptablePrimaryStrategyIds: ["corp.fast_advance"],
          acceptableFamilies: ["corp_fast_advance"],
        },
      };
    });

    const result = runAiDecisionCheckpoint(feasibleScoreline);

    expect(result.ok, result.message).toBe(true);
  });

  it("builds liquid credits when no visible kill pair remains", () => {
    const noVisibleKillPair = mutateFixture(cp05Json, (fixture) => {
      moveCorpCardsToArchives(
        fixture,
        new Set([AUDIT_OF_CALL_RECORDS, URBAN_RENEWAL]),
      );
      restoreCorpScoredAgendaToRd(fixture);
      fixture.expectation = {
        exactActionId: "corp.gain_credit",
        planExecution: {
          acceptablePlanKinds: ["corp.economy"],
          acceptableCapabilities: ["develop_or_convert_corp_economy"],
          requiredAssessmentEvidence: [
            "corp_engine_certified_basic_liquidity_development",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(noVisibleKillPair);

    expect(result.ok, result.message).toBe(true);
  });

  it("may discard a conditional payoff after every tag source is exhausted", () => {
    const exhaustedTagLine = mutateFixture(cp03Json, (fixture) => {
      moveCorpCardsToArchives(fixture, TAG_SOURCE_DEFINITION_IDS);
      fixture.expectation = {
        discardChoice: {
          mustDiscardDefinitionIds: [I_GOT_A_ROCK],
        },
      };
    });

    const result = runAiDecisionCheckpoint(exhaustedTagLine);

    expect(result.ok, result.message).toBe(true);
  });
});

const CHANCE_OBSERVATION = "onr_v1_284_chance-observation";
const AUDIT_OF_CALL_RECORDS = "onr_v1_283_audit-of-call-records";
const URBAN_RENEWAL = "onr_v1_307_urban-renewal";
const I_GOT_A_ROCK = "onr_v1_327_i-got-a-rock";
const BBS_WHISPERING_CAMPAIGN = "onr_v1_309_bbs-whispering-campaign";
const TAG_SOURCE_DEFINITION_IDS = new Set([
  CHANCE_OBSERVATION,
  AUDIT_OF_CALL_RECORDS,
  "onr_v1_313_city-surveillance",
]);
const KILL_LINE_DEFINITION_IDS = new Set([
  ...TAG_SOURCE_DEFINITION_IDS,
  "onr_v1_285_closed-accounts",
  "onr_v1_299_power-grid-overload",
  "onr_v1_302_scorched-earth",
  URBAN_RENEWAL,
  I_GOT_A_ROCK,
]);

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function moveCorpCardsToArchives(
  fixture: AiDecisionCheckpointV1,
  definitionIds: ReadonlySet<string>,
): void {
  const state = fixture.engine.testOnlyGameState;
  const matchingIds = Object.values(state.cardInstances)
    .filter(
      (card) => card.owner === "corp" && definitionIds.has(card.definitionId),
    )
    .map((card) => card.instanceId)
    .filter((instanceId) => !state.corp.archives.includes(instanceId));
  const matchingSet = new Set(matchingIds);

  state.corp.hq = state.corp.hq.filter((id) => !matchingSet.has(id));
  state.corp.rd = state.corp.rd.filter((id) => !matchingSet.has(id));
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => !matchingSet.has(id));
    server.root = server.root.filter((id) => !matchingSet.has(id));
  }
  for (const instanceId of matchingIds) {
    state.corp.archives.push(instanceId);
    state.cardInstances[instanceId] = {
      ...state.cardInstances[instanceId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: false,
    };
  }
}

function restoreCorpScoredAgendaToRd(fixture: AiDecisionCheckpointV1): void {
  const state = fixture.engine.testOnlyGameState;
  const agendaId = state.corp.scoreArea.pop();
  if (!agendaId) throw new Error("Missing scored Corp agenda counterprobe");
  state.corp.rd.push(agendaId);
  state.cardInstances[agendaId] = {
    ...state.cardInstances[agendaId]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
}
