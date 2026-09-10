import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import {
  corpAccessZonePreparationProfile,
  corpRdRecyclingSignals,
} from "./corp-access-zone-preparation";
import { selectedCorpDiscardChoiceOptionIds } from "./corp-discard-choice-selection";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";

const BEL = "onr_proteus_054_bel-digmo-antibody";
const STEREO = "onr_proteus_075_stereogram-antibody";
function setup(installed = false, protectedRemote = false) {
  const card = visibleCard("antibody", "corp", "asset", {
    definitionId: BEL,
    rezzed: false,
  });
  const action = legalAction(
    "antibody-action",
    "corp",
    installed ? "rez_card" : "install_card",
    "Source action",
    installed ? { credits: 0 } : { credits: 0, clicks: 1 },
    {
      source: card.instanceId,
      payload: {
        cardId: card.instanceId,
        serverId: "remote_1",
        placement: "root",
      },
    },
  );
  const input = aiInput("corp", [action]);
  input.playerView.own.gripOrHq = installed ? [] : [card];
  input.playerView.own.stackOrRdCount = 15;
  input.playerView.own.credits = 10;
  input.playerView.own.clicks = 3;
  input.playerView.activeSide = "corp";
  input.playerView.turnSerial = 2;
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      protectedRemote
        ? [visibleCard("ice", "corp", "ice", { rezzed: true })]
        : [],
      installed ? [card] : [],
    ),
  ];
  const candidates = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: { [card.instanceId]: BEL },
  });
  return { input, action, card, candidates };
}
describe("zone-specific access preparation", () => {
  it("distinguishes free rez recycling from Archives-only access recycling", () => {
    expect(corpAccessZonePreparationProfile(BEL)).toMatchObject({
      zone: "rd",
      damage: 1,
      freeSelfShuffleOnRez: true,
      shufflesOnAccess: false,
    });
    expect(corpAccessZonePreparationProfile(STEREO)).toMatchObject({
      zone: "archives",
      damage: 1,
      freeSelfShuffleOnRez: false,
      shufflesOnAccess: true,
    });
  });
  it("binds a one-click installation and the exact target without claiming remote damage", () => {
    const { input, candidates, action } = setup();
    expect(corpRdRecyclingSignals(input, candidates)).toMatchObject([
      {
        phase: "install",
        patternKind: "rd_recycle",
        actionIds: [action.actionId],
        plannedAdvancementTarget: 0,
        installRoute: { creditCost: 0, fundingGap: 0 },
        serverId: "remote_1",
      },
    ]);
  });
  it("holds a protected remote but recycles at the final server window", () => {
    const { input, candidates, action } = setup(true, true);
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([]);
    input.playerView.activeSide = "runner";
    input.playerView.run = {
      runId: "run-1",
      attackedServerId: "remote_1",
      phase: "movement",
      successful: false,
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
    };
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([]);
    input.playerView.run.position = { kind: "server", serverId: "remote_1" };
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([
      action.actionId,
    ]);
  });
  it("keeps a naked decoy when a funded one-turn agenda makes the alternative credible", () => {
    const { input, candidates } = setup(true);
    input.playerView.own.gripOrHq = [
      visibleCard("fast-agenda", "corp", "agenda", {
        advancementRequirement: 3,
        agendaPoints: 2,
      }),
    ];
    expect(corpRdRecyclingSignals(input, candidates)[0]).toMatchObject({
      actionIds: [],
      followupAgendaInstanceId: "fast-agenda",
    });
    input.playerView.own.stackOrRdCount = 1;
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([
      "antibody-action",
    ]);
  });
  it("does not reveal a held protected decoy during an unrelated central run", () => {
    const { input, candidates } = setup(true, true);
    input.playerView.run = {
      runId: "central",
      attackedServerId: "rd",
      phase: "movement",
      successful: false,
      position: { kind: "server", serverId: "rd" },
    };
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([]);
  });
  it("does not claim a taxed or stale rez as the free current route", () => {
    const { input, candidates, action } = setup(true);
    action.costs = [{ credits: 1 }];
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([]);
    action.costs = [];
    action.expiresAtStateVersion--;
    expect(corpRdRecyclingSignals(input, candidates)[0]?.actionIds).toEqual([]);
  });
  it("leaves a reserved agenda server available to Score", () => {
    const { input, candidates } = setup();
    expect(
      corpRdRecyclingSignals(
        input,
        candidates,
        undefined,
        new Set(["remote_1"]),
      ),
    ).toEqual([]);
  });
  it("retains its original bluff deadline through the agenda installation", () => {
    const { input, candidates } = setup(true);
    const agenda = visibleCard("agenda", "corp", "agenda", {
      advancementRequirement: 3,
    });
    input.playerView.own.gripOrHq = [agenda];
    const signal = corpRdRecyclingSignals(input, candidates)[0]!;
    const previous = {
      instances: [
        { moduleId: "corp.ambush_and_bluff", moduleState: { signal } },
      ],
    } as unknown as ResidentPlanPortfolio;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers.push(server("remote_2", [], [agenda]));
    input.playerView.turnSerial = 4;
    expect(
      corpRdRecyclingSignals(input, candidates, previous)[0],
    ).toMatchObject({ actionIds: [], recycleBluffUntilTurnSerial: 6 });
    input.playerView.turnSerial = 6;
    expect(
      corpRdRecyclingSignals(input, candidates, previous)[0]?.actionIds,
    ).toEqual(["antibody-action"]);
  });
  it("permits two decoys with a funded agenda but does not keep installing idle copies", () => {
    const { input, candidates, card } = setup();
    input.playerView.servers.push(
      server("remote_2", [], [{ ...card, instanceId: "first-decoy" }]),
    );
    expect(
      corpRdRecyclingSignals(input, candidates).filter(
        (s) => s.phase === "install",
      ),
    ).toEqual([]);
    input.playerView.own.gripOrHq.push(
      visibleCard("agenda", "corp", "agenda", { advancementRequirement: 3 }),
    );
    expect(
      corpRdRecyclingSignals(input, candidates).filter(
        (s) => s.phase === "install",
      ),
    ).toHaveLength(1);
    input.playerView.servers.push(
      server("remote_3", [], [{ ...card, instanceId: "second-decoy" }]),
    );
    expect(
      corpRdRecyclingSignals(input, candidates).filter(
        (s) => s.phase === "install",
      ),
    ).toEqual([]);
  });
  it("binds urgent recycling only to the current empty-R&D state and legal source", () => {
    const { input, candidates } = setup();
    input.playerView.own.stackOrRdCount = 0;
    expect(
      corpRdRecyclingSignals(input, candidates)[0]?.emptyRdRecovery,
    ).toEqual({ observedAtStateVersion: input.playerView.stateVersion });
    input.playerView.own.stackOrRdCount = 1;
    expect(
      corpRdRecyclingSignals(input, candidates)[0]?.emptyRdRecovery,
    ).toBeUndefined();
    input.playerView.own.stackOrRdCount = 0;
    expect(
      corpRdRecyclingSignals(input, [])[0]?.emptyRdRecovery,
    ).toBeUndefined();
  });
  it("prefers an uncommitted Archives-only source at cleanup, preserving an exact parent hold", () => {
    const { input, card } = setup();
    const stereo = { ...card, instanceId: "stereo", definitionId: STEREO };
    input.playerView.own.gripOrHq = [card, stereo];
    const choice = {
      choiceId: "discard",
      kind: "select_cards",
      side: "corp",
      source: "discard_phase",
      minSelections: 1,
      maxSelections: 1,
      options: [card, stereo].map((c) => ({
        id: c.instanceId,
        label: c.instanceId,
        value: c.instanceId,
      })),
    } as NonNullable<typeof input.playerView.pendingChoice>;
    expect(
      selectedCorpDiscardChoiceOptionIds(input, choice, choice.options, () => ({
        total: 50,
      }))?.selectedOptionIds,
    ).toEqual(["stereo"]);
    expect(
      selectedCorpDiscardChoiceOptionIds(
        input,
        choice,
        choice.options,
        (_input, c) => ({
          total: 50,
          planDisposition:
            c.instanceId === "stereo" ? "current_plan_route" : "redundant",
        }),
      )?.selectedOptionIds,
    ).toEqual(["antibody"]);
  });
});
