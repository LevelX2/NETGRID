import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import unsafeAgendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-coup-selfplay-001.json";
import lowValueArchivesJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-coup-selfplay-003.json";
import deckoutCloseoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-manhunt-coup-selfplay-005.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Manhunt vs. Coup exact selfplay decision checkpoints", () => {
  it("does not expose Corporate War without a timely safe completion line", () => {
    const result = runAiDecisionCheckpoint(fixture(unsafeAgendaJson));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("still starts a protected Corporate War line when it can finish now", () => {
    const safeImmediateScore = mutateFixture(unsafeAgendaJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.corp.clicks = 4;
      checkpoint.engine.testOnlyGameState.corp.credits = 12;
      checkpoint.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: CORPORATE_WAR,
          },
        ],
      };
    });

    const result = runAiDecisionCheckpoint(safeImmediateScore);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("does not spend the last click on one unknown Archives card without pressure", () => {
    const result = runAiDecisionCheckpoint(fixture(lowValueArchivesJson));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("still runs Archives when a visible agenda is waiting there", () => {
    const knownAgenda = mutateFixture(lowValueArchivesJson, (checkpoint) => {
      moveCorpCardToArchives(checkpoint, CORPORATE_WAR);
      checkpoint.expectation = {
        acceptableActions: [{ type: "start_run", targetServerId: "archives" }],
      };
    });

    const result = runAiDecisionCheckpoint(knownAgenda);

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("fails closed at matchpoint while exact remote score protection remains unknown", () => {
    const result = runAiDecisionCheckpoint(fixture(deckoutCloseoutJson));

    expect(result.ok, diagnostic(result)).toBe(true);
  });

  it("also completes the turn with no finite need while exact score protection remains unknown", () => {
    const relaxedClock = mutateFixture(deckoutCloseoutJson, (checkpoint) => {
      moveArchivesCardsToRd(checkpoint, 6);
      checkpoint.expectation = {
        acceptableActions: [{ type: "end_turn" }],
        planExecution: {
          acceptablePlanIds: [
            "plan:corp.complete_turn:standard-turn-completion",
          ],
          acceptablePlanKinds: ["corp.complete_turn"],
          acceptableCapabilities: [
            "complete_turn_after_productive_routes_exhausted",
          ],
          requiredAssessmentEvidence: [
            "corp_basic_credit_has_no_finite_reserve_or_parent_funding_need",
            "corp_score_protection_assessment_unknown:remote_1:subset_assessment_unknown",
            "productive_legal_routes_exhausted",
          ],
        },
      };
    });

    const result = runAiDecisionCheckpoint(relaxedClock);

    expect(result.ok, diagnostic(result)).toBe(true);
  });
});

const CORPORATE_WAR = "onr_v1_196_corporate-war";

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (checkpoint: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const checkpoint = fixture(value);
  mutation(checkpoint);
  checkpoint.engine.stateHash = hashGameState(
    checkpoint.engine.testOnlyGameState,
  );
  return checkpoint;
}

function moveCorpCardToArchives(
  checkpoint: AiDecisionCheckpointV1,
  definitionId: string,
): void {
  const state = checkpoint.engine.testOnlyGameState;
  const instanceId = [...state.corp.hq, ...state.corp.rd].find(
    (candidate) =>
      state.cardInstances[candidate]?.definitionId === definitionId,
  );
  if (!instanceId) throw new Error(`missing_corp_card:${definitionId}`);
  state.corp.hq = state.corp.hq.filter((candidate) => candidate !== instanceId);
  state.corp.rd = state.corp.rd.filter((candidate) => candidate !== instanceId);
  state.corp.archives.push(instanceId);
  state.cardInstances[instanceId] = {
    ...state.cardInstances[instanceId]!,
    zone: { side: "corp", zone: "archives" },
    faceup: true,
    rezzed: false,
  };
}

function moveArchivesCardsToRd(
  checkpoint: AiDecisionCheckpointV1,
  count: number,
): void {
  const state = checkpoint.engine.testOnlyGameState;
  const moved = state.corp.archives.splice(0, count);
  if (moved.length !== count) throw new Error("insufficient_archives_cards");
  state.corp.rd.push(...moved);
  for (const instanceId of moved) {
    state.cardInstances[instanceId] = {
      ...state.cardInstances[instanceId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function diagnostic(
  result: ReturnType<typeof runAiDecisionCheckpoint>,
): string {
  return [
    result.code ?? "pass",
    result.message,
    result.selectedAction?.actionId ?? "no-action",
    result.decision?.reasonCode ?? "no-reason",
  ].join(" | ");
}
