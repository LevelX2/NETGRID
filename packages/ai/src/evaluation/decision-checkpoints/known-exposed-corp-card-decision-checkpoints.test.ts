import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import runnerCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-known-trap-unsafe-remote-run.json";
import corpCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-exposed-trap-cowboy-recycle.json";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { evaluateKnownRemoteAccessPayoff } from "../../known-remote-access-payoff";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import {
  CORP_AMBUSH_COMMITMENT_VERSION,
  buildCorpAmbushPlanSignals,
} from "../../runtime/corp-ambush-plan-signals";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../../semantic-ai-runtime-cutover.test-support";

describe("known exposed Corp card decision checkpoints", () => {
  it("known TRAP prevents an unsafe Remote run", () => {
    const serverId = runnerCheckpoint.serverId as `remote_${number}`;
    const input = aiInput("runner", []);
    input.playerView.own.gripOrHq = Array.from(
      { length: runnerCheckpoint.runnerHandCount },
      (_, index) => visibleCard(`runner-grip-${index}`, "runner", "event"),
    );
    input.playerView.opponent.credits = runnerCheckpoint.corpCredits;
    input.playerView.servers = [
      server(
        serverId,
        [],
        [
          {
            instanceId: runnerCheckpoint.cardInstanceId,
            owner: "corp",
            controller: "corp",
            known: false,
          },
        ],
      ),
    ];
    const expose = exposeEvent(
      runnerCheckpoint.exposeEventId,
      serverId,
      runnerCheckpoint.cardDefinitionId,
    );
    input.playerView.publicEvents = [expose];
    input.eventTail = [expose];

    const payoff = evaluateKnownRemoteAccessPayoff(input, serverId);
    expect(payoff.accessDecision).toBe(runnerCheckpoint.expectedAccessDecision);
    expect(payoff.contestable).toBe(false);
    expect(payoff.evidence).toContain(runnerCheckpoint.expectedEvidence);
  });

  it("exposed weak TRAP is returned through Cowboy's exact legal action", () => {
    const serverId = corpCheckpoint.serverId as `remote_${number}`;
    const trap = visibleCard(corpCheckpoint.cardInstanceId, "corp", "asset", {
      definitionId: corpCheckpoint.cardDefinitionId,
      advancementCounters: 0,
      rezzed: false,
    });
    const cowboy = visibleCard(
      corpCheckpoint.recyclerInstanceId,
      "corp",
      "asset",
      {
        definitionId: corpCheckpoint.recyclerDefinitionId,
        rezzed: true,
      },
    );
    const recycle = legalAction(
      corpCheckpoint.recycleActionId,
      "corp",
      "gain_credit",
      "Return exposed Ambush to HQ",
      { credits: 0, clicks: 1 },
      {
        source: cowboy.instanceId,
        payload: {
          cardId: cowboy.instanceId,
          v1951CorpUtilityAbility: "corp_installed_card_to_hq",
          targetCardId: trap.instanceId,
        },
      },
    );
    const input = aiInput("corp", [recycle]);
    input.playerView.own.credits = corpCheckpoint.corpCredits;
    input.playerView.opponent.handCount = corpCheckpoint.runnerHandCount;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(serverId, [], [trap, cowboy]),
    ];
    const expose = exposeEvent(
      corpCheckpoint.exposeEventId,
      serverId,
      corpCheckpoint.cardDefinitionId,
    );
    input.playerView.publicEvents = [expose];
    input.eventTail = [expose];
    const candidates = buildActionSemanticCandidates({
      legalActions: [recycle],
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [cowboy.instanceId]: corpCheckpoint.recyclerDefinitionId,
      },
    });

    const [signal] = buildCorpAmbushPlanSignals({
      input,
      candidates,
      previous: residentAmbush(input, trap.instanceId),
    });
    expect(signal?.phase).toBe(corpCheckpoint.expectedPhase);
    expect(signal?.actionIds).toEqual([corpCheckpoint.recycleActionId]);
    expect(signal?.decisionEvidenceCodes).toContain(
      corpCheckpoint.expectedEvidence,
    );
  });
});

function exposeEvent(
  eventId: string,
  serverId: string,
  definitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "resolve_choice",
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: `hash-${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      publicRevealKind: "expose",
      publicRevealDefinitionId: definitionId,
      exposedCardDefinitionId: definitionId,
      exposedServerId: serverId,
      exposedArea: "root",
      exposedIndex: 0,
      exposedPositionKey: "root:0",
    },
  } as PublicGameEvent;
}

function residentAmbush(
  input: AiDecisionInput,
  cardInstanceId: string,
): ResidentPlanPortfolio {
  return {
    instances: [
      {
        instanceId: `plan:corp.ambush_and_bluff:${cardInstanceId}`,
        moduleId: "corp.ambush_and_bluff",
        viability: "ready",
        moduleState: {
          kind: "ambush",
          signal: {
            commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
            ambushId: `ambush:${cardInstanceId}`,
            sourceDefinitionId: corpCheckpoint.cardDefinitionId,
            sourceInstanceId: cardInstanceId,
            actionIds: [],
            serverId: corpCheckpoint.serverId,
            phase: "trigger",
            patternKind: "access_ambush",
            assignedDomainPlanIds: ["corp.ambush_bluff"],
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: true,
            plannedAtStateVersion: input.playerView.stateVersion,
            plannedAdvancementTarget: 0,
            value: 0,
            evidenceCode: "checkpoint-installed-ambush",
          },
        },
      },
    ],
  } as unknown as ResidentPlanPortfolio;
}
