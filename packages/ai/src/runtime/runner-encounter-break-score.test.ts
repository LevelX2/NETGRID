import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerEncounterBreakScoreComponents } from "./runner-encounter-break-score";

describe("runnerEncounterBreakScoreComponents", () => {
  it("scores a same-cost multi-break above single-subroutine break options", () => {
    const singleDamage = breakAction("break-damage", "0");
    const both = breakAction("break-both", "0,1");
    const singleEndRun = breakAction("break-etr", "1");
    const input = decisionInput([singleDamage, both, singleEndRun]);

    const singleDamageScore = score(input, singleDamage);
    const bothScore = score(input, both);
    const singleEndRunScore = score(input, singleEndRun);

    expect(bothScore).toBeGreaterThan(singleDamageScore);
    expect(bothScore).toBeGreaterThan(singleEndRunScore);
    expect(
      runnerEncounterBreakScoreComponents(input, both)[0]?.reason,
    ).toContain("indexes:0,1");
  });
});

function score(input: AiDecisionInput, action: LegalAction): number {
  return runnerEncounterBreakScoreComponents(input, action).reduce(
    (sum, component) => sum + component.value,
    0,
  );
}

function breakAction(actionId: string, subroutineIndexes: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "break_subroutine",
    label: actionId,
    source: "pile-driver",
    timingPoint: "run.encounter_ice",
    costs: [{ credits: 3 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 8,
    payload: {
      breakerId: "pile-driver",
      iceId: "shotgun-wire",
      subroutineIndexes,
      multiBreakSubroutines: true,
    },
  };
}

function decisionInput(legalActions: LegalAction[]): AiDecisionInput {
  const encounteredIce: VisibleCard = {
    instanceId: "shotgun-wire",
    known: true,
    title: "Shotgun Wire",
    definitionId: "onr_v1_269_shotgun-wire",
    type: "ice",
    subtypes: ["wall"],
    rezzed: true,
    effectiveRunQuote: {
      iceInstanceId: "shotgun-wire",
      iceDefinitionId: "onr_v1_269_shotgun-wire",
      effectiveStrength: 5,
      subroutines: [
        {
          id: "shotgun-wire-net-damage",
          type: "do_damage",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
        {
          id: "shotgun-wire-etr",
          type: "end_the_run",
        },
      ],
    },
  };
  return {
    side: "runner",
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "runner-encounter-break-score-test",
    decisionId: "runner-encounter-break-score-test",
    actionNumber: 1,
    profileId: "test-profile",
    playerView: {
      side: "runner",
      activeSide: "runner",
      stateVersion: 7,
      phase: "runner_action_phase",
      timingPoint: "run.encounter_ice",
      own: {
        identity: { instanceId: "runner-identity", known: true },
        credits: 8,
        clicks: 0,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 0,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "corp-identity", known: true },
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 0,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [encounteredIce],
          root: [],
        },
      ],
      run: {
        attackedServerId: "remote_1",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
        encounteredIce,
        successful: false,
      },
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
  } as AiDecisionInput;
}
