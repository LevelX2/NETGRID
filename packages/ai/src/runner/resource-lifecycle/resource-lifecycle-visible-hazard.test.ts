import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../../semantic-ai-runtime-cutover.test-support";
import { runnerResourceLifecycleSignals } from "./resource-lifecycle-signals";
import { runnerResourceLifecycleActionDispositions } from "./resource-lifecycle-dispositions";
import { createRunnerResourceLifecycleModule } from "./resource-lifecycle-plan-module";

function fixture() {
  const trash = legalAction(
    "resource.trash",
    "runner",
    "activated_card_ability",
    "Trash resource",
    { credits: 0, clicks: 1 },
    {
      source: "resource-1",
      payload: {
        cardId: "resource-1",
        sourceDefinitionId: "onr_classic_044_crash-space",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey: "trash_source_action",
        cardImplementationAbilityId:
          "onr_classic_044_crash-space:trash_source_action",
        cardImplementationTrashesSource: true,
      },
    },
  );
  const run = legalAction(
    "runner.start_run.rd",
    "runner",
    "start_run",
    "Run R&D",
    { credits: 0, clicks: 1 },
    { payload: { serverId: "rd" } },
  );
  const input = aiInput("runner", [trash, run]);
  Object.assign(input.playerView.own, { credits: 31, clicks: 2 });
  input.playerView.own.rig = [
    visibleCard("resource-1", "runner", "resource", {
      definitionId: "onr_classic_044_crash-space",
    }),
  ];
  input.playerView.servers = [
    server("rd", [
      visibleCard("trace-1", "corp", "ice", {
        definitionId: "onr_v1_228_cinderella",
        rezzed: true,
      }),
    ]),
  ];
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: 1,
    visibleSourceDefinitionsByInstanceId: {
      "resource-1": "onr_classic_044_crash-space",
    },
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const signals = () =>
    runnerResourceLifecycleSignals(input, candidates, () => {
      throw new Error("unexpected funding search");
    });
  return { input, trash, run, candidates, signals };
}

describe("Resource lifecycle visible trace liability", () => {
  it("admits removal at the exact cash and follow-click boundary", () => {
    const f = fixture();
    f.input.playerView.own.credits = 3;
    expect(f.signals()[0]?.phase).toBe("leave_play");
    f.input.playerView.own.credits = 2;
    expect(f.signals()[0]?.phase).toBe("retain");
  });

  it("materializes the exact canonical self-trash under the lifecycle owner", () => {
    const f = fixture();
    expect(
      f.candidates.find((c) => c.actionId === f.trash.actionId)
        ?.planOwnerBinding?.owner,
    ).toBe("runner.resource_lifecycle");
    const [signal] = f.signals();
    expect(signal).toMatchObject({
      phase: "leave_play",
      priorityClass: "P5",
      actionIds: [f.trash.actionId],
      evidenceCodes: expect.arrayContaining([
        "runner_resource_remove_visible_trace_liability",
        "runner_resource_leave_play_credit_loss:2",
        "runner_resource_start_turn_credit_gain:1",
        "runner_resource_visible_trace_source:trace-1",
      ]),
    });
    const module = createRunnerResourceLifecycleModule();
    const context = {
      input: f.input,
      actionCandidates: f.candidates,
      turnKey: "runner:0",
      domain: { resourceLifecycle: [signal], fundingNeeds: [] },
    };
    const proposal = module.discover(context)[0]!;
    expect(
      module
        .materialize(
          { ...proposal, instanceId: "lifecycle-1" } as never,
          {} as never,
          context,
        )
        .candidates.map((c) => c.candidate.actionId),
    ).toEqual([f.trash.actionId]);
  });

  it("retains income without an active visible trace source", () => {
    const f = fixture();
    f.input.playerView.servers = [];
    expect(f.signals()[0]).toMatchObject({
      phase: "retain",
      actionIds: [],
      rejectedActionIds: [f.trash.actionId],
    });
    expect(
      runnerResourceLifecycleActionDispositions(f.signals())[0]?.evidenceCode,
    ).toBe("runner_resource_self_trash_deferred_without_visible_hazard");
  });

  it.each(["hidden", "unrezzed", "archived"])(
    "does not treat a %s trace card as an active source",
    (kind) => {
      const f = fixture();
      const card = f.input.playerView.servers[0]!.ice[0]!;
      if (kind === "hidden") card.known = false;
      if (kind === "unrezzed") card.rezzed = false;
      if (kind === "archived")
        f.input.playerView.servers = [server("archives", [], [card])];
      expect(f.signals()[0]?.phase).toBe("retain");
    },
  );

  it.each(["clicks", "credits", "run"])(
    "defers removal when %s cannot preserve follow capacity",
    (kind) => {
      const f = fixture();
      if (kind === "clicks") f.input.playerView.own.clicks = 1;
      if (kind === "credits") f.input.playerView.own.credits = 2;
      if (kind === "run") f.input.legalActions = [f.trash];
      expect(f.signals()[0]).toMatchObject({
        phase: "retain",
        evidenceCodes: expect.arrayContaining([
          "runner_resource_trace_liability_removal_deferred_without_follow_capacity",
        ]),
      });
    },
  );

  it.each(["version", "source", "capability", "cost", "definition"])(
    "leaves an invalid %s binding unassessed",
    (kind) => {
      const f = fixture();
      if (kind === "version") f.trash.expiresAtStateVersion = 0;
      if (kind === "source") f.trash.payload!.cardId = "another-source";
      if (kind === "capability")
        f.trash.payload!.cardImplementationAbilityKey = "another-capability";
      if (kind === "cost") f.trash.costs = [{ clicks: 2 }];
      if (kind === "definition")
        f.input.playerView.own.rig![0]!.definitionId = "unknown-resource";
      expect(f.signals()).toEqual([]);
    },
  );
});
