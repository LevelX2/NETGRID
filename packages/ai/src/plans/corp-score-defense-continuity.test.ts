import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import {
  corpRemoteHasEngineQuotedReusableScoreFriction,
  corpResidentScoreAgendaInstanceId,
  corpResidentScoreDefenseBinding,
} from "./corp-score-defense-continuity";

const visibleCardIsAgenda = (
  _input: AiDecisionInput,
  card: VisibleCard,
): boolean => card.known && card.type === "agenda";

describe("corp score defense continuity", () => {
  it("accepts the exact immediate ICE-install execution receipt", () => {
    const input = decisionInput(11);
    const previous = portfolio({
      executorInstanceId: "score-root",
      instances: [scoreRoot()],
      commitment: {
        commitmentId: "commitment-1",
        cursor: { phaseIndex: 0, nodeIndex: 0 },
        phases: [
          {
            root: { planInstanceId: "score-root" },
            nodes: [
              {
                invocation: {
                  semanticActionType: "install.card",
                  sourceCardInstanceId: "ice-1",
                },
              },
            ],
          },
        ],
      },
      lease: {
        commitmentId: "commitment-1",
        actionType: "install_card",
        stateIdentity: { stateVersion: 10 },
      },
    });

    expect(
      corpResidentScoreAgendaInstanceId(previous, input, visibleCardIsAgenda),
    ).toBe("agenda-1");
  });

  it("accepts a recent resident defense staging receipt for the score parent", () => {
    const input = decisionInput(11);
    const previous = portfolio({
      executorInstanceId: "defense-child",
      instances: [
        scoreRoot(),
        {
          instanceId: "defense-child",
          moduleId: "corp.defend_servers",
          parentInstanceId: "score-root",
          dedupeKey: "defense:remote_1",
          updatedAtStateVersion: 10,
          moduleState: {
            kind: "defense",
            signals: [
              {
                kind: "score_protection_staging_install",
                serverId: "remote_1",
                parentProjectId: "agenda:agenda-1:remote_1",
                sourceCardInstanceId: "ice-1",
              },
            ],
          },
        },
      ],
    });

    expect(
      corpResidentScoreAgendaInstanceId(previous, input, visibleCardIsAgenda),
    ).toBe("agenda-1");
  });

  it("carries a new-remote staging receipt onto the uniquely created remote", () => {
    const input = decisionInput(11);
    const previous = portfolio({
      executorInstanceId: "defense-child",
      instances: [
        scoreRoot("new_remote"),
        {
          instanceId: "defense-child",
          moduleId: "corp.defend_servers",
          parentInstanceId: "score-root",
          dedupeKey: "defense:new_remote",
          updatedAtStateVersion: 10,
          moduleState: {
            kind: "defense",
            signals: [
              {
                kind: "score_protection_staging_install",
                serverId: "new_remote",
                parentProjectId: "agenda:agenda-1:new_remote",
                sourceCardInstanceId: "ice-1",
              },
            ],
          },
        },
      ],
    });

    expect(
      corpResidentScoreDefenseBinding(previous, input, visibleCardIsAgenda),
    ).toEqual({
      agendaInstanceId: "agenda-1",
      serverId: "remote_1",
    });
  });

  it("fails closed without an immediate or resident staging receipt", () => {
    const input = decisionInput(11);
    input.playerView.servers[0]!.ice = [];
    const previous = portfolio({
      executorInstanceId: "score-root",
      instances: [scoreRoot()],
    });

    expect(
      corpResidentScoreAgendaInstanceId(previous, input, visibleCardIsAgenda),
    ).toBeUndefined();
  });

  it("retains the exact protected remote across an intermediate score-support action", () => {
    const input = decisionInput(42);
    const previous = portfolio({
      instances: [
        scoreRoot(),
        {
          instanceId: "score-support",
          moduleId: "corp.economy",
          dedupeKey: "score-support:agenda-1:remote_1",
          parentInstanceId: "score-root",
        },
      ],
      executorInstanceId: "score-support",
    });

    expect(
      corpResidentScoreDefenseBinding(previous, input, visibleCardIsAgenda),
    ).toEqual({
      agendaInstanceId: "agenda-1",
      serverId: "remote_1",
    });
  });

  it("recognizes an exact non-ETR ICE interaction as reusable score friction", () => {
    const input = decisionInput(42);
    input.playerView.servers[0] = {
      id: "remote_1",
      label: "Remote 1",
      root: [],
      ice: [
        {
          instanceId: "shock-r",
          known: true,
          definitionId: "onr_v1_268_shock-r",
          type: "ice",
          rezzed: false,
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: "shock-r",
            iceDefinitionId: "onr_v1_268_shock-r",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: 42,
            complete: true,
            effectiveRunQuote: {
              iceInstanceId: "shock-r",
              iceDefinitionId: "onr_v1_268_shock-r",
              effectiveStrength: 3,
              subroutines: [
                {
                  id: "shock-r-lock",
                  type: "set_next_encounter_lock",
                  breakTags: ["stun"],
                },
              ],
            },
          },
        },
      ],
    };

    expect(
      corpRemoteHasEngineQuotedReusableScoreFriction(input, "remote_1"),
    ).toBe(true);
  });

  it("does not force score reuse over a persistent remote root", () => {
    const input = decisionInput(42);
    input.playerView.servers[0] = {
      id: "remote_1",
      label: "Remote 1",
      root: [
        {
          instanceId: "economy-asset",
          known: true,
          definitionId: "asset-definition",
          type: "asset",
        },
      ],
      ice: [
        {
          instanceId: "rezzed-ice",
          known: true,
          definitionId: "ice-definition",
          type: "ice",
          rezzed: true,
          effectiveRunQuote: {
            iceInstanceId: "rezzed-ice",
            iceDefinitionId: "ice-definition",
            effectiveStrength: 2,
            subroutines: [
              { id: "tax", type: "runner_lose_credits", amount: 1 },
            ],
          },
        },
      ],
    };

    expect(
      corpRemoteHasEngineQuotedReusableScoreFriction(input, "remote_1"),
    ).toBe(false);
  });
});

function decisionInput(stateVersion: number): AiDecisionInput {
  return {
    playerView: {
      stateVersion,
      own: {
        gripOrHq: [
          {
            instanceId: "agenda-1",
            known: true,
            definitionId: "agenda-definition",
            type: "agenda",
          },
        ],
      },
      servers: [
        {
          id: "remote_1",
          ice: [{ instanceId: "ice-1" }],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function scoreRoot(serverId = "remote_1") {
  return {
    instanceId: "score-root",
    moduleId: "corp.score_agenda",
    dedupeKey: `agenda:agenda-1:${serverId}`,
    moduleState: {
      kind: "score",
      signal: {
        agendaInstanceId: "agenda-1",
        serverId,
      },
    },
  };
}

function portfolio(params: {
  executorInstanceId: string;
  instances: unknown[];
  commitment?: unknown;
  lease?: unknown;
}): ResidentPlanPortfolio {
  return {
    executorInstanceId: params.executorInstanceId,
    rootForegroundInstanceId: "score-root",
    instances: params.instances,
    ...(params.commitment ? { turnPlanCommitment: params.commitment } : {}),
    ...(params.lease ? { turnPlanExecutionLease: params.lease } : {}),
  } as unknown as ResidentPlanPortfolio;
}
