import { describe, expect, it } from "vitest";
import { applyAction, hashGameState, replayEvents } from "@netgrid/engine";

import securityPurgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-177-security-purge-install-targets-d48.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("selfplay 177 Security Purge install targets decision checkpoint", () => {
  it("keeps the exact choice under corp.defend_servers ownership", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(securityPurgeJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    if (!result.ok) return;

    expect(result.decision).toMatchObject({
      actionId: "corp.resolve_choice",
      reasonCode: "plan_first.corp.defend_servers",
      selectedChoices: {
        choiceId: "choice_agenda_purge_install_targets_47",
      },
      decisionDebug: {
        planKind: "corp.defend_servers",
      },
    });
    const plan = result.decision!.decisionDebug!.planFirstDecision!;
    const owner = "plan:corp.defend_servers:server-defense-portfolio";
    expect(plan).toMatchObject({
      rootPlanInstanceId: owner,
      leafExecutorInstanceId: owner,
      selectedStep: { planInstanceId: owner },
      route: {
        planInstanceId: owner,
        actionId: result.decision!.actionId,
        stateVersion: result.input.playerView.stateVersion,
      },
    });
    const selectedIds = result.decision!.selectedChoices!
      .selectedOptionIds as string[];
    expect(selectedIds).toHaveLength(1);
    const option = result.input.playerView.pendingChoice!.options.find(
      (candidate) => candidate.id === selectedIds[0],
    )!;
    expect(option).toBeDefined();
    expect(option.selectable).not.toBe(false);
    const [iceId, serverId] = String(option.value).split("|");
    expect(iceId).toBe("corp_onr_proteus_012_bug-zapper_2");
    const checkpoint = structuredClone(
      securityPurgeJson,
    ) as AiDecisionCheckpointV1;
    const initial = checkpoint.engine.testOnlyGameState;
    initial.eventLog = checkpoint.engine.eventPrefix;
    const applied = applyAction(initial, {
      matchId: initial.matchId,
      side: "corp",
      actionId: result.selectedAction!.actionId,
      selectedChoices: result.decision!.selectedChoices!,
      clientKnownStateVersion: initial.stateVersion,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw new Error(applied.error.message);
    expect(
      applied.state.corp.servers.find((s) => s.id === serverId)?.ice,
    ).toContain(iceId);
    const replay = replayEvents(
      initial,
      applied.state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(applied.state));
  });
});
