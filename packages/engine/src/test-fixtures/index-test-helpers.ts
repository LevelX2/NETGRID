import { expect } from "vitest";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type ServerId,
} from "@netgrid/shared";
import { apply } from "./mechanic-smoke-fixtures";

export function expectCurrentRulesBaseline(state: Pick<GameState, "baseline">): void {
  expect(state.baseline).toStrictEqual(CURRENT_RULES_BASELINE);
  expect(state.baseline.engineSchemaVersion).toBe(
    CURRENT_RULES_BASELINE.engineSchemaVersion,
  );
}

export function continueRunAction(state: GameState): GameState {
  return apply(state, "runner", (action) => action.type === "continue_run");
}

export function continueRunThroughMovement(state: GameState): GameState {
  const next = continueRunAction(state);
  if (next.timingPoint === "run.jack_out_window")
    return continueRunAction(next);
  return next;
}

export function continueRunThroughMovementWindow(state: GameState): GameState {
  return continueRunThroughMovement(state);
}

export function enterEncounterFromMovementWindow(state: GameState): GameState {
  if (state.timingPoint !== "run.jack_out_window" || state.run?.phase !== "movement")
    return state;
  return continueRunAction(state);
}

export function traceChoiceOptionIdForDefinition(
  state: GameState,
  definitionId: string,
  optionPrefix: string,
): string {
  const option = state.pendingChoice?.options.find(
    (candidate) =>
      candidate.id.startsWith(optionPrefix) &&
      typeof candidate.value === "string" &&
      state.cardInstances[candidate.value]?.definitionId === definitionId,
  );
  if (!option) throw new Error(`Missing trace choice option for ${definitionId}`);
  return option.id;
}

export function addCorpCardToHqForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  suffix: string,
): CardInstanceId {
  const cardId = `p354_${suffix}_${definitionId}` as CardInstanceId;
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

export function addRezzedCorpRootForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  serverId: Exclude<ServerId, "new_remote">,
  suffix: string,
): CardInstanceId {
  const cardId = `p354_${suffix}_${definitionId}` as CardInstanceId;
  let server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    server = {
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  server.root.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

export function addRezzedCorpIceForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  serverId: Exclude<ServerId, "new_remote">,
  suffix: string,
): CardInstanceId {
  const cardId = `p354_${suffix}_${definitionId}` as CardInstanceId;
  let server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    server = {
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  server.ice.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

export function addInstalledRunnerProgramForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  suffix: string,
): CardInstanceId {
  const cardId = `p354_${suffix}_${definitionId}` as CardInstanceId;
  state.runner.rig.programs.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

