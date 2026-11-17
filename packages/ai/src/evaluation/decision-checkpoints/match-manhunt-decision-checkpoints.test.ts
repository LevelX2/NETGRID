import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-03.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-04.json";
import cp05Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-05.json";
import cp06Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-06.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

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

  it("develops executable campaign income before unfunded strategic remote staging", () => {
    const checkpoint = fixture(cp05Json);
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, result.message).toBe(true);
    const initial = structuredClone(checkpoint.engine.testOnlyGameState);
    initial.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    let state = initial;
    for (let index = 0; index < 3; index++) {
      const action = getLegalActions(state, "corp").find((candidate) =>
        index === 0
          ? candidate.actionId === result.decision!.actionId
          : candidate.source === "corp_521_2" &&
            (index === 1
              ? candidate.type === "rez_card"
              : candidate.payload?.cardImplementationTakesHostedCredits ===
                true),
      );
      expect(action).toBeDefined();
      const applied = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: action!.actionId,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(applied.ok).toBe(true);
      if (!applied.ok) throw Error(JSON.stringify(applied.error));
      state = applied.state;
    }
    expect(state.corp.credits).toBe(initial.corp.credits + 2);
    expect(state.corp.clicks).toBe(initial.corp.clicks - 2);
  });

  it("can discard the damage payoff without a funded and observable route", () => {
    const checkpoint = fixture(cp06Json);
    expect(checkpoint.engine.testOnlyGameState.corp.credits).toBe(4);
    checkpoint.expectation = {
      discardChoice: { mustDiscardDefinitionIds: [URBAN_RENEWAL] },
      planExecution: {
        acceptablePlanKinds: ["corp.hand_and_agenda_management"],
      },
    };
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, result.message).toBe(true);
    expect(
      result.input.playerView.opponent.rig?.some((card) => card.concealed),
    ).toBe(true);
  });

  it("retains the funded damage payoff against a tagged Runner with a public rig", () => {
    const checkpoint = mutateFixture(cp06Json, ({ engine }) => {
      const state = engine.testOnlyGameState;
      RealEngineFixtureBuilder.forState(state)
        .withCorpCredits(10)
        .withRunnerTags(1)
        .withRunnerGripSize(4);
      for (const id of state.runner.rig.resources)
        state.cardInstances[id]!.faceup = true;
    });
    checkpoint.expectation = {
      discardChoice: { mustRetainDefinitionIds: [URBAN_RENEWAL] },
      planExecution: {
        acceptablePlanKinds: ["corp.hand_and_agenda_management"],
      },
    };
    const result = runAiDecisionCheckpoint(checkpoint);
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

  it("takes the available certified economy payout instead of a blind agenda search", () => {
    const noTagWindow = mutateFixture(cp02Json, (fixture) => {
      moveCorpCardsToArchives(fixture, new Set([CHANCE_OBSERVATION]));
      fixture.expectation = {
        acceptableActions: [
          {
            type: "activated_card_ability",
            sourceDefinitionId: 521,
          },
        ],
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

  it("retains executable campaign development when no visible kill pair remains", () => {
    const noVisibleKillPair = mutateFixture(cp05Json, (fixture) => {
      moveCorpCardsToArchives(
        fixture,
        new Set([AUDIT_OF_CALL_RECORDS, URBAN_RENEWAL]),
      );
      restoreCorpScoredAgendaToRd(fixture);
      fixture.expectation = campaignDevelopmentExpectation();
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

const CHANCE_OBSERVATION = 496;
const AUDIT_OF_CALL_RECORDS = 495;
const URBAN_RENEWAL = 519;
const I_GOT_A_ROCK = 539;
const BBS_WHISPERING_CAMPAIGN = 521;
const TAG_SOURCE_DEFINITION_IDS = new Set([
  CHANCE_OBSERVATION,
  AUDIT_OF_CALL_RECORDS,
  525,
]);
const KILL_LINE_DEFINITION_IDS = new Set([
  ...TAG_SOURCE_DEFINITION_IDS,
  497,
  511,
  514,
  URBAN_RENEWAL,
  I_GOT_A_ROCK,
]);

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
  );
  if (value === cp05Json)
    checkpoint.expectation = campaignDevelopmentExpectation();
  return checkpoint;
}

function campaignDevelopmentExpectation(): AiDecisionCheckpointV1["expectation"] {
  return {
    ...(structuredClone(cp05Json) as AiDecisionCheckpointV1).expectation,
    acceptableActions: [
      {
        actionId:
          "corp.install_card.corp_521_2.remote_1.corp_521_2",
      },
    ],
    planExecution: {
      acceptablePlanKinds: ["corp.economy"],
      acceptableCapabilities: ["develop_or_convert_corp_economy"],
      requiredAssessmentEvidence: [
        "corp_visible_economy_campaign:install:remote_1:protected_contestable",
      ],
      forbiddenPlanKinds: ["corp.execute_punish_sequence"],
    },
  };
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
  definitionIds: ReadonlySet<number>,
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
