import { describe, expect, it, vi } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

const mockedHints = vi.hoisted(
  () =>
    new Map([
      [
        "damage-support",
        hint(["support_damage_prevention"], []),
      ],
      [
        "damage-noise",
        hint(["damage_preventionish_noise"], []),
      ],
      [
        "meat-support",
        hint([], ["survive_meat_damage"]),
      ],
      [
        "meat-noise",
        hint([], ["survive_meat_damageish_noise"]),
      ],
      [
        "meat-effect-support",
        hint([], [], [
          { kind: "prevention_replacement", target: "prevention.meat_damage" },
        ]),
      ],
      [
        "meat-effect-noise",
        hint([], [], [
          { kind: "prevention_replacement", target: "meat_damageish_noise" },
        ]),
      ],
      [
        "trace-support",
        hint([], ["support_trace_defense"]),
      ],
      [
        "trace-noise",
        hint([], ["trace_defenseish_noise"]),
      ],
    ]),
);

vi.mock("../ai-hints", () => ({
  createAiHintsByCard: () => mockedHints,
}));

import {
  corpVisibleRunnerDamagePreventionEvidence,
  corpVisibleRunnerResourceTrashEvidence,
} from "./corp-tag-punish-visible-payoff";

describe("corp tag punish visible payoff", () => {
  it("matches visible runner defense hints by bounded role terms", () => {
    expect(
      corpVisibleRunnerDamagePreventionEvidence(inputWithRig("damage-support")),
    ).toContain("runner_damage_prevention_visible:true");
    expect(
      corpVisibleRunnerDamagePreventionEvidence(inputWithRig("damage-noise")),
    ).toEqual([]);

    expect(
      corpVisibleRunnerDamagePreventionEvidence(inputWithRig("meat-support")),
    ).toContain("runner_meat_damage_prevention_visible:true");
    expect(
      corpVisibleRunnerDamagePreventionEvidence(inputWithRig("meat-noise")),
    ).toEqual([]);
    expect(
      corpVisibleRunnerDamagePreventionEvidence(
        inputWithRig("meat-effect-support"),
      ),
    ).toContain("runner_meat_damage_prevention_visible:true");
    expect(
      corpVisibleRunnerDamagePreventionEvidence(
        inputWithRig("meat-effect-noise"),
      ),
    ).toEqual([]);

    expect(
      corpVisibleRunnerResourceTrashEvidence(
        taggedInput(),
        visibleCard("trace-support"),
      ).evidence,
    ).toContain("runner_resource_trace_defense_visible:true");
    expect(
      corpVisibleRunnerResourceTrashEvidence(
        taggedInput(),
        visibleCard("trace-noise"),
      ).evidence,
    ).toEqual([]);
  });
});

function hint(
  roles: string[],
  planRoles: string[],
  effects: Array<Record<string, unknown>> = [],
) {
  return {
    cardId: "test-card",
    side: "runner",
    roles,
    planRoles,
    aiSupportStatus: "hinted_only",
    effects,
  };
}

function inputWithRig(definitionId: string): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      opponent: {
        tags: 0,
        rig: [visibleCard(definitionId)],
      },
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function taggedInput(): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      opponent: {
        tags: 7,
      },
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function visibleCard(definitionId: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    type: "resource",
    known: true,
    owner: "runner",
    controller: "runner",
  };
}
