import { describe, expect, it } from "vitest";

import {
  corpDefenseActionDispositions,
  corpDefenseMaterializedActionIds,
  createCorpCorePlanModules,
  type CorpCorePlanDomain,
} from "../../plans/corp-core-plan-modules";
import { instantiatePlanProposal } from "../../plans/plan-instance";
import {
  checkpointDefenseCandidate,
  checkpointDefenseContext,
  checkpointRemoteProject,
  checkpointRemoteSupportSignal,
} from "./corp-defense-checkpoint-test-support";

describe("match 9f8cecdd78b35d0e Corp remote support D78", () => {
  it("binds every legal Remote 1 protection route to the need or names the stronger selected provider", () => {
    const parentNeedId = "remote-hardening:strategic-score-remote:4";
    const tesseractRoute = checkpointDefenseCandidate(
      "d78-install-tesseract-remote-1",
      "remote_1",
      "d78-tesseract",
    );
    const strongerRoute = checkpointDefenseCandidate(
      "d78-install-stronger-remote-1",
      "remote_1",
      "d78-stronger-provider",
    );
    const remoteProject: CorpCorePlanDomain["remoteProjects"][number] =
      checkpointRemoteProject(parentNeedId);
    const defenseNeeds = [
      checkpointRemoteSupportSignal({
        candidate: tesseractRoute,
        parentNeedId,
        value: 10,
      }),
      checkpointRemoteSupportSignal({
        candidate: strongerRoute,
        parentNeedId,
        value: 30,
      }),
    ];
    const context = checkpointDefenseContext({
      candidates: [tesseractRoute, strongerRoute],
      defenseNeeds,
      remoteProjects: [remoteProject],
    });
    const materialized = corpDefenseMaterializedActionIds(
      context,
      defenseNeeds,
    );
    const dispositions = corpDefenseActionDispositions(context, defenseNeeds);
    const tesseractDisposition = dispositions.find(
      (entry) => entry.actionId === tesseractRoute.actionId,
    );

    expect(materialized).toEqual(new Set([strongerRoute.actionId]));
    expect(tesseractDisposition).toMatchObject({
      actionId: tesseractRoute.actionId,
      evidenceCode: expect.stringMatching(
        /reason:higher_state_bound_defense_value.*selected:remote_1:.*d78-install-stronger-remote-1/,
      ),
    });
    expect(tesseractDisposition?.evidenceCode).not.toContain(
      "not_selected_by_plan",
    );

    const defenseModule = createCorpCorePlanModules().find(
      (module) => module.moduleId === "corp.defend_servers",
    )!;
    const proposal = defenseModule.discover(context)[0]!;
    const instance = instantiatePlanProposal(proposal, 60);
    expect(proposal).toMatchObject({
      parentInstanceId:
        "plan:corp.establish_scoring_remote:strategic-score-remote",
      parentNeedId,
      initialViability: "ready",
    });
    expect(
      defenseModule
        .materialize(instance, {} as never, context)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([strongerRoute.actionId]);
  });
});
