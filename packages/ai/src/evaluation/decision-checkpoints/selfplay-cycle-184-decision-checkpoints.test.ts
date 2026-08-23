import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import emptyGripRdJackOutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-01-empty-grip-rd-jack-out-d43.json";
import confirmedDamageTaxedDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-02-confirmed-damage-taxed-draw-d164.json";
import criticalDamageRemoteContestJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-03-critical-damage-remote-contest-d64.json";
import confirmedDamageUnrezzedRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-04-confirmed-damage-unrezzed-rd-d63.json";
import terminalRemoteNonlethalDamageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-184-05-terminal-remote-nonlethal-damage-d265.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  provenance: "reconstructed_from_persisted_decision_sources";
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("selfplay cycle 184 decision checkpoints", () => {
  it("jacks out before unknown central access with an empty grip under critical damage pressure", () => {
    const capture = structuredClone(
      emptyGripRdJackOutJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.jack_out",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
          leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_39",
          selectedStep: {
            planInstanceId: "plan:runner.convert_run_window:run%3Arun_39",
            parentInstanceId: "plan:runner.pressure_central:central%3Ard",
          },
          route: {
            actionType: "jack_out",
            capabilityId: "convert_active_run_window",
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "runner_critical_empty_grip_unknown_central_access_requires_jack_out",
        ),
      ]),
    );
  });

  it("does not treat a guaranteed draw-tax tag as defensive hand buffering under confirmed damage pressure", () => {
    const capture = structuredClone(
      confirmedDamageTaxedDrawJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.gain_credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:runner.economy:runner-portfolio-credit-reserve",
          leafExecutorInstanceId:
            "plan:runner.economy:runner-portfolio-credit-reserve",
          route: {
            actionType: "gain_credit",
            capabilityId: "gain_general_liquid_credits",
          },
        },
      },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.portfolio.find(
        (plan) => plan.moduleId === "runner.defense_and_recovery",
      ),
    ).toBeUndefined();
  });

  it("builds hand buffer before a nonterminal risky remote contest under critical damage pressure", () => {
    const capture = structuredClone(
      criticalDamageRemoteContestJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.draw_card",
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
          route: {
            actionType: "draw_card",
            capabilityId: "build_required_hand_buffer",
          },
          portfolio: expect.arrayContaining([
            expect.objectContaining({
              instanceId: "plan:runner.contest_remote:remote%3Aremote_4",
              viability: "blocked",
              evidenceCodes: expect.arrayContaining([
                "runner_critical_damage_remote_contest_requires_hand_buffer:remote_4",
              ]),
            }),
          ]),
        },
      },
    });
  });

  it("builds hand buffer before a nonterminal risky central run with unrezzed ice under confirmed damage pressure", () => {
    const capture = structuredClone(
      confirmedDamageUnrezzedRdJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.draw_card",
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
          route: {
            actionType: "draw_card",
            capabilityId: "build_required_hand_buffer",
          },
          portfolio: expect.arrayContaining([
            expect.objectContaining({
              instanceId: "plan:runner.pressure_central:central%3Ard",
              viability: "blocked",
              evidenceCodes: expect.arrayContaining([
                "runner_confirmed_damage_central_pressure_requires_hand_buffer:rd",
              ]),
            }),
          ]),
        },
      },
    });
  });

  it("contests a terminal remote when the visible damage only violates the normal hand floor", () => {
    const capture = structuredClone(
      terminalRemoteNonlethalDamageJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId: "runner.start_run.remote_1",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          leafExecutorInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_1",
          route: {
            actionType: "start_run",
            capabilityId: "contest_remote",
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("runner_terminal_remote_contest_mandatory"),
      ]),
    );

    const continuation = structuredClone(capture.input);
    continuation.playerView.stateVersion += 1;
    continuation.playerView.timingPoint = "run.jack_out_window";
    continuation.playerView.own.clicks -= 1;
    continuation.playerView.run = {
      runId: "selfplay-184-terminal-remote-continuation",
      attackedServerId: "remote_1",
      phase: "movement",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      successful: false,
    };
    continuation.legalActions = [
      {
        actionId: "runner.continue_run",
        side: "runner",
        type: "continue_run",
        label: "Run fortsetzen",
        source: "game_rule",
        timingPoint: "run.jack_out_window",
        costs: [],
        targetRequirements: [],
        visibility: "private_to_actor",
        expiresAtStateVersion: continuation.playerView.stateVersion,
        payload: { serverId: "remote_1" },
      },
      {
        actionId: "runner.jack_out",
        side: "runner",
        type: "jack_out",
        label: "Jack-out",
        source: "game_rule",
        timingPoint: "run.jack_out_window",
        costs: [],
        targetRequirements: [],
        visibility: "private_to_actor",
        expiresAtStateVersion: continuation.playerView.stateVersion,
      },
    ];

    const continuationDecision = chooseAiAction(
      continuation as AiDecisionInput,
    );

    expect(continuationDecision).toMatchObject({
      actionId: "runner.continue_run",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          leafExecutorInstanceId:
            "plan:runner.convert_run_window:run%3Aselfplay-184-terminal-remote-continuation",
          selectedStep: {
            parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          },
          route: {
            actionId: "runner.continue_run",
            actionType: "continue_run",
          },
        },
      },
    });
    expect(
      continuationDecision.decisionDebug?.planFirstDecision?.selectedPlan
        ?.evidenceCodes,
    ).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "runner_visible_ice_damage_below_required_hand_floor_requires_jack_out",
        ),
      ]),
    );

    const repeatAfterFailedPath = structuredClone(capture.input);
    repeatAfterFailedPath.playerView.stateVersion += 3;
    repeatAfterFailedPath.playerView.own.clicks -= 1;
    repeatAfterFailedPath.legalActions = repeatAfterFailedPath.legalActions.map(
      (action) => ({
        ...action,
        expiresAtStateVersion: repeatAfterFailedPath.playerView.stateVersion,
      }),
    );
    const turnSerial = capture.input.playerView.turnSerial;
    expect(turnSerial).toBeDefined();
    const failedRunEvents: NonNullable<AiDecisionInput["eventTail"]> = [
      {
        eventId: "evt_selfplay_184_terminal_run_started",
        type: "start_run",
        stateVersionBefore: capture.input.playerView.stateVersion,
        stateVersionAfter: capture.input.playerView.stateVersion + 1,
        turnSerial: turnSerial!,
        stateHashAfter: "fnv1a:terminal-run-started",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        },
      },
      {
        eventId: "evt_selfplay_184_terminal_run_ended",
        type: "continue_run",
        stateVersionBefore: capture.input.playerView.stateVersion + 1,
        stateVersionAfter: capture.input.playerView.stateVersion + 2,
        turnSerial: turnSerial!,
        stateHashAfter: "fnv1a:terminal-run-ended",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "continue_run",
          serverId: "remote_1",
          result: "ended",
          encounterWillEndRun: true,
        },
      },
    ];
    repeatAfterFailedPath.eventTail = [
      ...(repeatAfterFailedPath.eventTail ?? []),
      ...failedRunEvents,
    ];
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      repeatAfterFailedPath,
      deckSnapshotId!,
      capture.runtime,
    );

    const repeatDecision = chooseAiAction(
      repeatAfterFailedPath as AiDecisionInput,
    );

    expect(repeatDecision.actionId).not.toBe("runner.start_run.remote_1");
    expect(
      repeatDecision.decisionDebug?.planFirstDecision?.dispositions,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "runner.start_run.remote_1",
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.contest_remote",
          evidenceCode:
            "runner_terminal_remote_contest_repeat_blocked_after_failed_path:remote_1",
        }),
      ]),
    );
  });
});
