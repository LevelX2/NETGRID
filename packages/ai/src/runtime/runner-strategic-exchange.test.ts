import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { describe, expect, it } from "vitest";
import {
  runnerStrategicExchangeHardExclusion,
  runnerStrategicExchangeKinds,
  runnerStrategicExchangeRequiresBoundParent,
} from "./runner-strategic-exchange";

function candidate(
  overrides: Partial<ActionSemanticCandidate>,
): ActionSemanticCandidate {
  return {
    actionId: "action",
    actionType: "play_event",
    actorSide: "runner",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId: "action",
      actionType: "play_event",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "unresolved",
    semanticActionType: "card.play",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    boardContext: { source: "player_view", sideSafe: true, notes: [] },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  };
}

describe("runner strategic exchange classification", () => {
  it.each([
    [
      "score progress",
      candidate({
        risks: [{ kind: "agenda_cost", severity: "unknown", evidence: [] }],
      }),
      "score_progress",
    ],
    [
      "debt financing",
      candidate({
        risks: [{ kind: "credit_swing", severity: "unknown", evidence: [] }],
      }),
      "debt_financing",
    ],
    [
      "board or hand sacrifice",
      candidate({
        risks: [{ kind: "board_tradeoff", severity: "unknown", evidence: [] }],
      }),
      "board_or_hand_sacrifice",
    ],
    [
      "self tag",
      candidate({
        risks: [{ kind: "tag_self", severity: "unknown", evidence: [] }],
      }),
      "self_tag",
    ],
    [
      "self damage",
      candidate({
        cardContextFunctionalEffects: [
          {
            kind: "damage",
            timing: "action",
            scope: "runner",
            target: "self_brain_damage",
          },
        ],
      }),
      "self_damage",
    ],
    [
      "temporary resource",
      candidate({ strategicExchangeKinds: ["temporary_resource"] }),
      "temporary_resource",
    ],
  ] as const)("classifies %s", (_label, action, kind) => {
    expect(runnerStrategicExchangeKinds(action)).toContain(kind);
  });

  it("rejects only the terminal score-transfer action while retaining engine legality", () => {
    const action = candidate({
      functionalEffects: [
        {
          kind: "run_tax",
          timing: "action",
          scope: "score_area",
          target: "agenda_points_given_to_corp",
        },
      ],
    });
    expect(
      runnerStrategicExchangeHardExclusion(
        {
          playerView: {
            agendaPointsToWin: 7,
            opponent: { agendaPoints: 6 },
          },
        } as never,
        action,
      ),
    ).toBe("runner_strategic_exchange_opponent_terminal_score");
  });

  it("requires a concrete parent for a debt installation without relying on a card identity", () => {
    expect(
      runnerStrategicExchangeRequiresBoundParent(
        candidate({
          semanticActionType: "install.card",
          strategicExchangeKinds: ["debt_financing"],
        }),
      ),
    ).toBe(true);
  });

  it("requires a concrete parent for an action that pays self damage", () => {
    expect(
      runnerStrategicExchangeRequiresBoundParent(
        candidate({
          strategicExchangeKinds: ["self_damage"],
          costProfile: {
            costKnownStatus: "known",
            additionalCosts: [],
            selfDamage: [
              {
                type: "core",
                amount: 1,
              },
            ],
          },
        }),
      ),
    ).toBe(true);
  });

  it("does not parent-bind every strategic exchange category", () => {
    expect(
      runnerStrategicExchangeRequiresBoundParent(
        candidate({ strategicExchangeKinds: ["temporary_resource"] }),
      ),
    ).toBe(false);
  });
});
