import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  getLegalActions,
  hashState,
  replayEvents,
} from "../../index";
import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  ServerId,
  Side,
} from "@netgrid/shared";

function apply(
  state: GameState,
  side: Side,
  predicate: (action: ReturnType<typeof getLegalActions>[number]) => boolean,
  selectedOptionIds: string[] = [],
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  expect(action).toBeDefined();
  if (!action) throw new Error("Missing action");
  const selectedChoices =
    action.type === "resolve_choice"
      ? { choiceId: state.pendingChoice?.choiceId, selectedOptionIds }
      : undefined;
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function corpCard(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  rezzed = false,
): CardInstance {
  return {
    instanceId: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
    zone,
  };
}

function runnerProgram(
  id: string,
  definitionId: string,
  hostedOn?: CardInstanceId,
): CardInstance {
  return {
    instanceId: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
    zone: { side: "runner", zone: "rig" },
    ...(hostedOn ? { hostedOn } : {}),
  };
}

function installRemote(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  state.corp.servers.push({
    id: serverId,
    kind: "remote",
    label: "Remote 1",
    ice: [],
    root: [],
  });
}

describe("Proteus Phase 8c Viral Breeding Ground", () => {
  it("scores by trashing cards in and on the source fort without leaking hidden titles", () => {
    let state = createGame({
      seed: "proteus-8c-vbg-score",
      setupMode: "completed",
    });
    const serverId = "remote_1";
    installRemote(state, serverId);
    const server = state.corp.servers.find((candidate) => candidate.id === serverId);
    if (!server) throw new Error("Missing remote");
    const agendaId = "proteus_8c_vbg" as CardInstanceId;
    const hiddenRootId = "proteus_8c_hidden_root" as CardInstanceId;
    const publicIceId = "proteus_8c_public_ice" as CardInstanceId;
    state.cardInstances[agendaId] = {
      ...corpCard(agendaId, "onr_proteus_009_viral-breeding-ground", {
        side: "corp",
        zone: "serverRoot",
        serverId,
      }),
      advancementCounters: 4,
    };
    state.cardInstances[hiddenRootId] = corpCard(
      hiddenRootId,
      "onr_v1_346_vacant-soulkiller",
      { side: "corp", zone: "serverRoot", serverId },
      false,
    );
    state.cardInstances[publicIceId] = corpCard(
      publicIceId,
      "onr_v1_246_fragmentation-storm",
      { side: "corp", zone: "serverIce", serverId },
      true,
    );
    server.root.push(agendaId, hiddenRootId);
    server.ice.push(publicIceId);
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    const initial = structuredClone(state);

    state = apply(state, "corp", (action) => action.type === "score_agenda");

    expect(state.corp.scoreArea).toContain(agendaId);
    expect(state.corp.archives).toEqual(
      expect.arrayContaining([hiddenRootId, publicIceId]),
    );
    const payload = state.eventLog.at(-1)?.publicPayload;
    expect(payload).toMatchObject({
      hiddenZoneAction: "proteus_trash_source_server_installed_corp_cards",
      trashedInstalledCount: 2,
      scoredFromServerId: serverId,
    });
    expect(String(payload?.publicTrashedCardDefinitionIds ?? "")).toContain(
      "onr_v1_246_fragmentation-storm",
    );
    expect(String(payload?.publicTrashedCardDefinitionIds ?? "")).not.toContain(
      "onr_v1_346_vacant-soulkiller",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
  });

  it("opens a Corp access choice to return installed Runner programs and trash hosted programs", () => {
    let state = createGame({
      seed: "proteus-8c-vbg-access",
      setupMode: "completed",
    });
    const agendaId = "proteus_8c_vbg_access" as CardInstanceId;
    state.cardInstances[agendaId] = {
      ...corpCard(agendaId, "onr_proteus_009_viral-breeding-ground", {
        side: "corp",
        zone: "rd",
      }),
      advancementCounters: 2,
    };
    state.corp.rd.unshift(agendaId);
    const daemonId = "proteus_8c_succubus" as CardInstanceId;
    const hostedId = "proteus_8c_dwarf" as CardInstanceId;
    state.cardInstances[daemonId] = runnerProgram(
      daemonId,
      "onr_v1_069_succubus",
    );
    state.cardInstances[hostedId] = runnerProgram(
      hostedId,
      "onr_v1_021_dwarf",
      daemonId,
    );
    state.runner.rig.programs.push(daemonId, hostedId);
    state.activeSide = "runner";
    state.phase = "run";
    state.timingPoint = "access.resolve_card";
    state.run = {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "access",
      position: { kind: "server", serverId: "rd" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
      accessCount: 1,
      breach: {
        breachId: "breach_1",
        serverId: "rd",
        accessMode: "single",
        queue: [
          {
            entryId: "entry_1",
            cardInstanceId: agendaId,
            serverId: "rd",
            zone: "rd",
            status: "pending",
            hiddenInfo: true,
          },
        ],
        currentIndex: 0,
        completed: false,
        accessedSummaries: [],
      },
    };
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_cards",
      maxSelections: 2,
    });
    const daemonOptionId = state.pendingChoice?.options.find(
      (option) => option.value === daemonId,
    )?.id;
    expect(daemonOptionId).toBeDefined();
    state = apply(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
      daemonOptionId ? [daemonOptionId] : [],
    );

    expect(state.runner.grip).toContain(daemonId);
    expect(state.runner.heap).toContain(hostedId);
    expect(state.runner.rig.programs).not.toContain(daemonId);
    expect(state.runner.rig.programs).not.toContain(hostedId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "proteus_return_installed_runner_programs_to_grip",
      returnedProgramCount: 1,
      daemonHostedTrashCount: 1,
    });
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
  });
});
