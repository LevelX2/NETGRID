import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createSemanticRuntimeCorpRemoteContestabilityContext } from "./semantic-runtime-corp-remote-contestability-context";

describe("semanticRuntimeCorpRemoteScoreContestabilityAssessment", () => {
  it("flags unprotected remote scoreline installs as contestable", () => {
    const action = corpAction("install-scoreline", "install_card", {
      placement: "root",
    });
    const {
      semanticRuntimeCorpRemoteScoreContestabilityAssessment,
    } = createSemanticRuntimeCorpRemoteContestabilityContext(
      testDependencies({
        actionIsScoreLine: true,
      }),
    );

    const assessment =
      semanticRuntimeCorpRemoteScoreContestabilityAssessment(
        corpInput([remoteServer("remote_1", [])]),
        action,
      );

    expect(assessment).toEqual(
      expect.objectContaining({
        serverId: "remote_1",
        contestable: true,
      }),
    );
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_score_line:contestable_by_runner",
        "remote_unprotected:true",
      ]),
    );
  });
});

function corpInput(
  servers: AiDecisionInput["playerView"]["servers"],
): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      own: {
        credits: 4,
      },
      opponent: {
        credits: 4,
        rig: [],
      },
      servers,
    },
  } as unknown as AiDecisionInput;
}

function remoteServer(
  id: string,
  ice: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id: id as AiDecisionInput["playerView"]["servers"][number]["id"],
    label: id,
    ice: [...ice],
    root: [],
  };
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    costs: [],
    payload,
  } as unknown as LegalAction;
}

function testDependencies(
  overrides: {
    actionIsScoreLine?: boolean;
    advanceCompletesScore?: boolean;
  } = {},
) {
  return {
    actionServerId: () => "remote_1",
    server: (input: AiDecisionInput, serverId: string | undefined) =>
      input.playerView.servers.find((server) => server.id === serverId),
    actionIsScoreLine: () => overrides.actionIsScoreLine ?? false,
    advanceCompletesScore: () => overrides.advanceCompletesScore ?? false,
    remoteIsProtected: (
      server: AiDecisionInput["playerView"]["servers"][number] | undefined,
    ) => (server?.ice.length ?? 0) > 0,
    isRemoteServerTarget: (serverId: string | undefined) =>
      serverId?.startsWith("remote_") === true,
  };
}
