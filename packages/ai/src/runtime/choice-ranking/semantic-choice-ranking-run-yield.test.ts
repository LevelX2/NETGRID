import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
import {
  aiInput,
  centralRunMapping,
  choice,
  legalAction,
  runEvent,
  scoreComponentEvidence,
} from "./semantic-choice-ranking.test-support";

describe("tactical plan run yield contracts", () => {
  it("lets a useful non-run action beat an expensive central run with no reserve", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 13, [], {
          key: "runner_visible_ice_path_cost",
          value: -1800,
          reason: "server:rd;break_cost:8;credits_after:1",
        }),
        choice(draw, 148),
      ],
      centralRunMapping([run]),
      choice(draw, 148),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideReason).toBe("inferior_run_target_mapping_yield");
  });

  it("keeps an affordable HQ success-window run over the acute hand buffer", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const drawChoice = choice(draw, 1543, [], {
      key: "runner_hand_buffer_need",
      value: 600,
      reason: "hand:1|damage_pressure:false",
    });
    const runChoice = choice(
      run,
      2764,
      scoreComponentEvidence("runner_hq_success_window_setup"),
      {
        key: "runner_hq_success_window_setup",
        value: 1700,
        reason: "affordable_success_window:true",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drawChoice, runChoice],
      centralRunMapping([run]),
      drawChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-hq");
  });

  it("remembers a failed run across a long resolution sequence until the next turn", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const oldRun = {
      ...runEvent({ serverId: "hq" }),
      eventId: "old-hq-run",
      stateVersionBefore: 1,
      stateVersionAfter: 2,
    };
    const previousRunnerEnd = {
      ...runEvent({ actor: "runner", actionType: "end_turn" }),
      eventId: "previous-runner-end",
      type: "end_turn",
      stateVersionBefore: 39,
      stateVersionAfter: 40,
    };
    const currentCorpTurn = {
      ...runEvent({ actor: "corp", actionType: "mandatory_draw" }),
      eventId: "current-corp-turn",
      type: "mandatory_draw",
      stateVersionBefore: 40,
      stateVersionAfter: 41,
    };
    const input = aiInput([oldRun, previousRunnerEnd, currentCorpTurn]);
    input.playerView.stateVersion = 60;

    const result = tacticalPlanMappedChoice(
      input,
      [choice(draw, 2_498), choice(run, 706)],
      centralRunMapping([run]),
      choice(draw, 2_498),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideReason).toBe("repeated_run_mapping_yield");
  });
});
