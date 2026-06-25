import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  resolveSuccessfulRunCreditLossSpendChoice,
  enterAccessFromSuccessfulRun,
  type RunAccessTransitionHost,
} from "./run-access-transition";
import type { BreachStateHost } from "../access/breach-state";

function definition(id: string, type: CardDefinition["type"]): CardDefinition {
  return { id: id as CardDefinitionId, title: id, type } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  faceup = false,
  rezzed = false,
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone,
    faceup,
    rezzed,
  } as unknown as CardInstance;
}

function makeHost(options: {
  run?: GameState["run"];
  corpCredits?: number;
  runnerCredits?: number;
  corpArchives?: string[];
} = {}): {
  host: RunAccessTransitionHost;
  state: GameState;
  finishedRuns: boolean[];
  archivesAutoAdvanced: number;
  privateLooks: Array<{ zone: string; count: number | "all" }>;
} {
  const definitions = {
    agenda: definition("agenda_def", "agenda"),
    operation: definition("operation_def", "operation"),
    ice: definition("ice_def", "ice"),
  };
  const servers = [
    { id: "rd", ice: [], root: [] },
    { id: "hq", ice: [], root: [] },
    { id: "archives", ice: [], root: [] },
    { id: "remote_1", ice: [], root: ["remote_agenda"] },
  ] as unknown as CorpServer[];
  const cardInstances: Record<string, CardInstance> = {
    rd_operation: instance("rd_operation", "operation_def", {
      side: "corp",
      zone: "rd",
    }),
    remote_agenda: instance(
      "remote_agenda",
      "agenda_def",
      { side: "corp", zone: "serverRoot", serverId: "remote_1" } as CardInstance["zone"],
    ),
    archive_face_up: instance(
      "archive_face_up",
      "operation_def",
      { side: "corp", zone: "archives" },
      true,
    ),
    archive_face_down: instance("archive_face_down", "operation_def", {
      side: "corp",
      zone: "archives",
    }),
  };
  const state = {
    stateVersion: 3,
    activeSide: "runner",
    timingPoint: "run.jack_out_window",
    randomCounter: 0,
    randomDrawRecords: [],
    runner: {
      credits: options.runnerCredits ?? 6,
      tags: 0,
      scoreArea: [],
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: options.corpCredits ?? 5,
      rd: ["rd_operation"],
      hq: [],
      archives: options.corpArchives ?? ["archive_face_up", "archive_face_down"],
      servers,
    },
    cardInstances,
    run:
      options.run ??
      ({
        runId: "run_1",
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        successful: true,
        accessCount: 1,
      } as unknown as NonNullable<GameState["run"]>),
  } as unknown as GameState;
  const finishedRuns: boolean[] = [];
  let archivesAutoAdvanced = 0;
  const privateLooks: Array<{ zone: string; count: number | "all" }> = [];
  const breachHost: BreachStateHost = {
    state,
    cards: {
      definitionFor: (cardId) => {
        const instance = cardInstances[cardId];
        if (!instance) throw new Error(`missing ${cardId}`);
        const found = Object.values(definitions).find(
          (candidate) => candidate.id === instance.definitionId,
        );
        if (!found) throw new Error(`missing definition ${instance.definitionId}`);
        return found;
      },
      cardInstanceFor: (cardId) => cardInstances[cardId]!,
    },
    servers: {
      mustServer: (serverId) => {
        const server = servers.find((candidate) => candidate.id === serverId);
        if (!server) throw new Error(`missing server ${serverId}`);
        return server;
      },
    },
    rng: {
      nextRandom: () => 0,
    },
  };
  const host: RunAccessTransitionHost = {
    state,
    breach: breachHost,
    cards: breachHost.cards,
    runner: {
      ensureTurnFlags: () => {
        state.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
          stolenAgendaAdvancementCountersThisTurn: 0,
          stolenAgendaAdvancementCountersLastTurn: 0,
          runnerReceivedTagThisTurn: false,
          stoleResearchAgendaThisTurn: false,
          stoleGrayOpsAgendaThisTurn: false,
          stoleBlackOpsAgendaThisTurn: false,
          runAttemptsThisTurn: 0,
          runAttemptsLastTurn: 0,
          successfulHqRunThisTurn: false,
          successfulRunThisTurn: false,
          damagePreventionUsage: {},
          runnerActionsTakenThisTurn: 0,
        } as NonNullable<GameState["runnerTurnFlags"]>;
        return state.runnerTurnFlags;
      },
    },
    draw: {
      drawCorpCards: () => undefined,
    },
    rng: {
      shuffleStateIds: (ids) => ids.slice(),
    },
    access: {
      hasHiddenResourceAccessStartActions: () => false,
      advanceArchivesBreachPastNonDecisionCards: () => {
        archivesAutoAdvanced += 1;
      },
      findPreAccessTopRdReorderSource: () => undefined,
      isPreAccessTopRdReorderSource: () => false,
      startRunnerPrivateLookChoice: (_sourceCardId, _sourceDefinitionId, zone, count) => {
        privateLooks.push({ zone, count });
        return true;
      },
    },
    run: {
      isV097OrLater: () => true,
      finishRun: (successful) => {
        finishedRuns.push(successful);
        delete state.run;
      },
      applyUniqueDirectSuccessfulRunTriggers: () => undefined,
      successfulRunInterventionKindForSource: () => undefined,
      successfulRunInterventionCost: () => 0,
    },
    choices: {
      selectedChoiceIds: (selectedChoices) => {
        const raw = (selectedChoices as { selectedOptionIds?: unknown } | undefined)
          ?.selectedOptionIds;
        return Array.isArray(raw)
          ? raw.filter((value): value is string => typeof value === "string")
          : [];
      },
    },
  };
  return {
    host,
    state,
    finishedRuns,
    get archivesAutoAdvanced() {
      return archivesAutoAdvanced;
    },
    privateLooks,
  };
}

describe("run access transition", () => {
  it("starts normal successful R&D access with a breach state", () => {
    const fixture = makeHost();
    const legalAction = { payload: {} } as LegalAction;

    const result = enterAccessFromSuccessfulRun(fixture.host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      accessStarted: true,
      serverId: "rd",
      accessCount: 1,
      stateChanged: true,
    });
    expect(fixture.state.run?.phase).toBe("access");
    expect(fixture.state.run?.breach?.queue.map((entry) => entry.cardInstanceId)).toEqual([
      "rd_operation",
    ]);
    expect(fixture.state.timingPoint).toBe("access.resolve_card");
    expect(fixture.state.activeSide).toBe("runner");
    expect(legalAction.payload).toMatchObject({
      baseAccessCount: 1,
      installedAccessBonus: 0,
      effectiveAccessCount: 1,
    });
  });

  it("applies simple no-access credit/tag replacement and finishes the run", () => {
    const fixture = makeHost({
      corpCredits: 4,
      run: {
        runId: "run_1",
        attackedServerId: "hq",
        phase: "movement",
        position: { kind: "server", serverId: "hq" },
        successful: true,
        successfulRunAccessReplacement: "corp_lose_credits",
        successfulRunCreditLoss: 1,
        successfulRunRunnerCreditGain: 10,
        successfulRunRunnerTagGain: 1,
      } as unknown as NonNullable<GameState["run"]>,
    });
    const legalAction = { payload: {} } as LegalAction;

    const result = enterAccessFromSuccessfulRun(fixture.host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      accessSkipped: true,
      replacementApplied: "corp_lose_credits",
      runFinished: true,
    });
    expect(fixture.state.corp.credits).toBe(3);
    expect(fixture.state.runner.credits).toBe(16);
    expect(fixture.state.runner.tags).toBe(1);
    expect(fixture.finishedRuns).toEqual([true]);
    expect(legalAction.payload).toMatchObject({
      accessReplacement: "corp_lose_credits",
      creditLoss: 1,
      gainedCredits: 10,
      tagsAdded: 1,
      hiddenZoneBarrier: true,
    });
  });

  it("opens and resolves Priority Wreck without starting access", () => {
    const fixture = makeHost({
      corpCredits: 5,
      runnerCredits: 6,
      run: {
        runId: "run_priority",
        attackedServerId: "hq",
        phase: "movement",
        position: { kind: "server", serverId: "hq" },
        successful: true,
        successfulRunAccessReplacement: "runner_spend_corp_lose_credits",
        successfulRunSourceCardId: "remote_agenda" as CardInstanceId,
        successfulRunSourceDefinitionId: "agenda_def" as CardDefinitionId,
        successfulRunSourceTitle: "Priority Wreck",
      } as unknown as NonNullable<GameState["run"]>,
    });
    const startAction = { payload: {} } as LegalAction;

    const result = enterAccessFromSuccessfulRun(fixture.host, startAction);

    expect(result).toMatchObject({
      handled: true,
      accessSkipped: true,
      replacementApplied: "runner_spend_corp_lose_credits",
    });
    expect(fixture.state.pendingChoice?.source).toContain("successful_run.credit_loss_spend");
    expect(startAction.payload).toMatchObject({
      accessReplacement: "runner_spend_corp_lose_credits",
      successfulRunCreditLossSpendChoiceOpened: true,
      hiddenZoneBarrier: true,
    });

    const resolveAction = { payload: {} } as LegalAction;
    resolveSuccessfulRunCreditLossSpendChoice(
      fixture.host,
      resolveAction,
      {
        selectedChoices: { selectedOptionIds: ["pay_3"] },
      } as unknown as PlayerAction,
    );

    expect(fixture.state.runner.credits).toBe(3);
    expect(fixture.state.corp.credits).toBe(2);
    expect(fixture.state.pendingChoice).toBeUndefined();
    expect(fixture.finishedRuns).toEqual([true]);
    expect(resolveAction.payload).toMatchObject({
      accessReplacement: "runner_spend_corp_lose_credits",
      runnerPaidAmount: 3,
      corpLostCredits: 3,
      hiddenZoneBarrier: true,
    });
  });

  it("applies Archives face-up to R&D replacement with stable payload", () => {
    const fixture = makeHost({
      run: {
        runId: "run_archives",
        attackedServerId: "archives",
        phase: "movement",
        position: { kind: "server", serverId: "archives" },
        successful: true,
        successfulRunAccessReplacement: "archives_faceup_to_rd",
        successfulRunArchivesMoveCount: 2,
      } as unknown as NonNullable<GameState["run"]>,
    });
    const legalAction = { payload: {} } as LegalAction;

    const result = enterAccessFromSuccessfulRun(fixture.host, legalAction);

    expect(result).toMatchObject({
      handled: true,
      accessSkipped: true,
      replacementApplied: "archives_faceup_to_rd",
      runFinished: true,
    });
    expect(fixture.state.corp.rd[0]).toBe("archive_face_up");
    expect(fixture.state.cardInstances.archive_face_up?.zone).toEqual({
      side: "corp",
      zone: "rd",
    });
    expect(legalAction.payload).toMatchObject({
      accessReplacement: "archives_faceup_to_rd",
      shuffledFaceUpArchivesCount: 1,
      movedCount: 1,
      hiddenZoneBarrier: true,
    });
  });
});
