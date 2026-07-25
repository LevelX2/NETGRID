import { describe, expect, it } from "vitest";
import type { AiDecisionInput, StateHash, VisibleCard } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../input-dto.js";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter.js";

const agenda = (id: string): VisibleCard => ({
  instanceId: id,
  definitionId: "onr_v1_196_corporate-war",
  type: "agenda",
  known: true,
  title: "ignored",
});
const twoPointAgenda = (id: string): VisibleCard => ({
  instanceId: id,
  definitionId: "onr_v1_194_corporate-downsizing",
  type: "agenda",
  known: true,
  title: "ignored",
});
const asset = (id: string): VisibleCard => ({
  instanceId: id,
  definitionId: "simple_economy_asset",
  type: "asset",
  known: true,
  title: "ignored",
});
function input(): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 8,
      turnSerial: 3,
      activeSide: "corp",
      timingPoint: "corp_action.main",
      phase: "action",
      own: {
        identity: asset("id"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [agenda("a")],
        stackOrRdCount: 1,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: asset("rid"),
        credits: 4,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 1,
        maxHandSize: 5,
        deckCount: 1,
        discardCount: 0,
        scoreArea: [],
        rig: [],
      },
      servers: ["hq", "rd", "archives"].map((id) => ({
        id: id as "hq" | "rd" | "archives",
        label: id,
        ice: [],
        root: [],
      })),
      corpCentralAccessQuotes: ["hq", "rd"].map((serverId) => ({
        serverId: serverId as "hq" | "rd",
        stateVersion: 8,
        complete: true as const,
        effectiveAccessCount: 1,
        isMultiaccess: false,
        sourceDefinitionIds: [],
        serverBoundEffects: [],
      })),
      specialZones: {
        setAside: [],
        removedFromGame: [],
        setAsideCount: 0,
        removedFromGameCount: 0,
      },
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "s",
    decisionId: "d",
    actionNumber: 8,
    profileId: "p",
  } as unknown as AiDecisionInput;
}
function withSnapshot(value: AiDecisionInput): AiDecisionInput {
  (value as AiDecisionInput & { ownDeckSnapshot: unknown }).ownDeckSnapshot = {
    deckSnapshotId: "deck",
    side: "corp",
    cards: [{ cardId: "onr_v1_196_corporate-war", quantity: 2 }],
  };
  return value;
}
describe("allocateCorpCentralDefenseFromAiFacts", () => {
  it("adapts complete HQ agendas and exact R&D residual inventory", () => {
    const value = withSnapshot(input());
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({
      status: "known",
      evidence: {
        hq: { expectedAgendaLoss: { numerator: 3, denominator: 1 } },
        rd: { expectedAgendaLoss: { numerator: 3, denominator: 1 } },
      },
    });
  });
  it("uses Highlighter/Vienna quote facts without inspecting Runner text", () => {
    const value = withSnapshot(input());
    value.playerView.corpCentralAccessQuotes![1] = {
      ...value.playerView.corpCentralAccessQuotes![1]!,
      effectiveAccessCount: 3,
      isMultiaccess: true,
      sourceDefinitionIds: ["onr_proteus_090_highlighter"],
      serverBoundEffects: [
        {
          id: "corp:highlighter",
          kind: "purgeable_runner_virus_counter_access_modifier",
          serverId: "rd",
          counterKind: "highlighter",
          formula: "per_counter_after_first",
          sourceDefinitionId: "onr_proteus_090_highlighter",
          counterCount: 3,
          additionalAccessCount: 2,
        },
      ],
    };
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({ status: "known", selectedServerId: "rd" });
  });
  it("fails closed for a server-bound effect attached to the wrong central", () => {
    const value = withSnapshot(input());
    value.playerView.corpCentralAccessQuotes![0] = {
      ...value.playerView.corpCentralAccessQuotes![0]!,
      effectiveAccessCount: 2,
      isMultiaccess: true,
      sourceDefinitionIds: ["onr_proteus_090_highlighter"],
      serverBoundEffects: [
        {
          id: "corp:highlighter",
          kind: "purgeable_runner_virus_counter_access_modifier",
          serverId: "rd",
          counterKind: "highlighter",
          formula: "per_counter_after_first",
          sourceDefinitionId: "onr_proteus_090_highlighter",
          counterCount: 2,
          additionalAccessCount: 1,
        },
      ],
    };
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({ status: "unknown" });
  });
  it("classifies known Asset/Upgrade plan roles without trash-cost or text fallbacks", () => {
    const value = withSnapshot(input());
    value.playerView.own.gripOrHq.push(asset("critical-asset"));
    value.playerView.own.stackOrRdCount = 1;
    (
      value as AiDecisionInput & {
        ownDeckSnapshot: { cards: Array<{ cardId: string; quantity: number }> };
      }
    ).ownDeckSnapshot.cards.push({
      cardId: "simple_economy_asset",
      quantity: 1,
    });
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({
      status: "known",
      evidence: {
        hq: { expectedTrashableLoss: { numerator: 1, denominator: 2 } },
      },
    });
  });
  it("marks an exact central agenda potential terminal at Runner matchpoint", () => {
    const value = withSnapshot(input());
    value.playerView.opponent.agendaPoints = 4;
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({
      status: "known",
      evidence: { hq: { threat: "terminal" } },
    });
  });
  it("does not call aggregate agenda points terminal when one access cannot steal enough", () => {
    const value = withSnapshot(input());
    value.playerView.own.gripOrHq = [
      twoPointAgenda("two-a"),
      twoPointAgenda("two-b"),
    ];
    value.playerView.opponent.agendaPoints = 4;
    (
      value as AiDecisionInput & {
        ownDeckSnapshot: { cards: Array<{ cardId: string; quantity: number }> };
      }
    ).ownDeckSnapshot.cards = [
      { cardId: "onr_v1_194_corporate-downsizing", quantity: 3 },
    ];
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({
      status: "known",
      evidence: { hq: { threat: "material" } },
    });
  });
  it.each(["missing", "stale", "duplicate"])(
    "fails closed for %s quotes",
    (kind) => {
      const value = withSnapshot(input());
      if (kind === "missing") delete value.playerView.corpCentralAccessQuotes;
      if (kind === "stale")
        value.playerView.corpCentralAccessQuotes![0] = {
          ...value.playerView.corpCentralAccessQuotes![0]!,
          stateVersion: 7,
        };
      if (kind === "duplicate")
        value.playerView.corpCentralAccessQuotes![1] = {
          ...value.playerView.corpCentralAccessQuotes![1]!,
          serverId: "hq",
        };
      expect(
        allocateCorpCentralDefenseFromAiFacts({ input: value }),
      ).toMatchObject({ status: "unknown" });
    },
  );
  it("fails closed without a complete deck snapshot or known zones", () => {
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: input() }),
    ).toMatchObject({ status: "unknown" });
    const value = withSnapshot(input());
    value.playerView.own.gripOrHq[0] = {
      ...value.playerView.own.gripOrHq[0]!,
      known: false,
    };
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({ status: "unknown" });
  });
  it("fails closed for malformed or future structured pressure events", () => {
    const value = withSnapshot(input());
    value.eventTail = [
      {
        eventId: "future",
        stateVersionBefore: 8,
        stateVersionAfter: 9,
        turnSerial: 3,
        stateHashAfter: "future-state-hash" as StateHash,
        type: "access_card",
        publicPayload: { actor: "runner", serverId: "hq" },
      },
    ];
    expect(
      allocateCorpCentralDefenseFromAiFacts({ input: value }),
    ).toMatchObject({ status: "unknown" });
  });
  it("keeps the actor-private match, turn, and central quotes in the Corp DTO only", () => {
    const raw = input();
    const corpDto = buildAiDecisionInputDto({
      matchId: "match-central",
      side: "corp",
      playerView: raw.playerView,
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "s",
      decisionId: "dto-corp",
      actionNumber: 8,
      profileId: "p",
    });
    expect(corpDto).toMatchObject({
      matchId: "match-central",
      playerView: {
        turnSerial: 3,
        corpCentralAccessQuotes: [
          { serverId: "hq", stateVersion: 8, complete: true },
          { serverId: "rd", stateVersion: 8, complete: true },
        ],
      },
    });

    const runnerDto = buildAiDecisionInputDto({
      side: "runner",
      playerView: { ...raw.playerView, side: "runner" },
      eventTail: [],
      legalActions: [],
      difficulty: "normal",
      seed: "s",
      decisionId: "dto-runner",
      actionNumber: 8,
      profileId: "p",
    });
    expect(runnerDto.playerView.corpCentralAccessQuotes).toBeUndefined();
  });
});
