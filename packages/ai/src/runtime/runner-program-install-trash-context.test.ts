import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createRunnerProgramInstallTrashContext } from "./runner-program-install-trash-context";

describe("selectedRunnerMemoryCheckpointTrashOptionIds", () => {
  it("fails closed when a program-trash install cannot name an acceptable sufficient sacrifice", () => {
    const codeGate = program("only_code_gate", 1);
    const sentry = program("only_sentry", 1);
    const barrier = program("only_barrier", 1);
    const krash = program("krash", 1);
    const rig = [codeGate, sentry, barrier];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const breakerRoleById = new Map([
      [codeGate.instanceId, "decoder"],
      [sentry.instanceId, "killer"],
      [barrier.instanceId, "fracter"],
    ]);
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () =>
        new Map([
          ["decoder", 1],
          ["killer", 1],
          ["fracter", 1],
        ]),
      visibleBreakerRoles: (card) => {
        const role = breakerRoleById.get(card.instanceId);
        return role ? [role] : [];
      },
      rolesForCardId: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      seed: "program-trash-no-acceptable-sacrifice",
      decisionId: "program-trash-no-acceptable-sacrifice:2",
      profileId: "runner-baseline",
      legalActions: [],
      playerView: {
        stateVersion: 2,
        timingPoint: "runner_action.main",
        own: {
          credits: 0,
          gripOrHq: [krash],
          rig,
          memoryUsed: 3,
          memoryLimit: 3,
        },
        opponent: { credits: 0 },
        servers: [],
      },
    } as unknown as AiDecisionInput;
    const options = rig.map((card) => ({
      id: `card_${card.instanceId}`,
      label: card.title ?? card.instanceId,
      value: card.instanceId,
    }));

    expect(
      context.runnerProgramInstallTrashAssessmentForAction(input, {
        actionId:
          "runner.install_card.krash.krash.runner_program_trash_before_install.installer.0.0",
        side: "runner",
        type: "install_card",
        source: {
          kind: "card",
          sourceCardInstanceId: "krash",
          sourceDefinitionId: "krash",
        },
        timingPoint: "runner_action.main",
        costs: [],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: 2,
        payload: {
          cardId: "krash",
        },
      } as never),
    ).toMatchObject({
      memoryRequired: true,
      requiredMemoryToFree: 1,
      canFreeRequiredMemory: false,
    });

    expect(() =>
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source: "runner_program_trash_before_install:krash:2",
        } as never,
        options,
      ),
    ).toThrowError("commitment_invalidated");
  });

  it("trashes only the least valuable sufficient program at an MU checkpoint", () => {
    const expendable = program("expendable", 1);
    const onlyFracter = program("only_fracter", 1);
    const rig = [expendable, onlyFracter];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) =>
        (card as (VisibleCard & { memoryCost?: number }) | undefined)
          ?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () => new Map([["fracter", 1]]),
      visibleBreakerRoles: (card) =>
        card.instanceId === "only_fracter" ? ["fracter"] : [],
      rolesForCardId: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });

    expect(
      context.selectedRunnerMemoryCheckpointTrashOptionIds(
        {
          side: "runner",
          seed: "memory-checkpoint-test",
          decisionId: "memory-checkpoint-test:318",
          profileId: "runner-baseline",
          playerView: {
            own: {
              credits: 0,
              gripOrHq: [],
              rig,
              memoryUsed: 5,
              memoryLimit: 4,
            },
            opponent: { credits: 0 },
            servers: [],
          },
        } as unknown as AiDecisionInput,
        [
          {
            id: "trash_expendable",
            label: "Expendable",
            value: "expendable",
          },
          {
            id: "trash_only_fracter",
            label: "Only Fracter",
            value: "only_fracter",
          },
        ],
      ),
    ).toEqual(["trash_expendable"]);
  });

  it("uses the prepared Shell Traders target to calculate the exact MU replacement", () => {
    const expendable = program("expendable", 1);
    const onlyFracter = program("only_fracter", 1);
    const prepared = program("prepared_killer", 1);
    const rig = [expendable, onlyFracter];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () => new Map([["breaker_fracter", 1]]),
      visibleBreakerRoles: (card) =>
        card.instanceId === "only_fracter" ? ["breaker_fracter"] : [],
      rolesForCardId: (definitionId) =>
        definitionId === "only_fracter" ? ["breaker_fracter"] : [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      playerView: {
        own: {
          credits: 0,
          gripOrHq: [],
          rig,
          memoryUsed: 2,
          memoryLimit: 2,
        },
        opponent: { credits: 0 },
        servers: [],
        specialZones: {
          setAside: [prepared],
          setAsideCount: 1,
          removedFromGame: [],
          removedFromGameCount: 0,
        },
      },
    } as unknown as AiDecisionInput;
    const options = [
      { id: "trash_expendable", label: "Expendable", value: "expendable" },
      {
        id: "trash_only_fracter",
        label: "Only Fracter",
        value: "only_fracter",
      },
    ];

    expect(
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source:
            "v1912.delayed_install_memory:shell-1:prepared_killer:paid:17",
        } as never,
        options,
      ),
    ).toEqual(["trash_expendable"]);
  });

  it("completes a mandatory delayed-install MU continuation even when every sacrifice is protected", () => {
    const onlyFracter = program("only_fracter", 1);
    const prepared = program("prepared_killer", 1);
    const cardsById = new Map([[onlyFracter.instanceId, onlyFracter]]);
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () => new Map([["breaker_fracter", 1]]),
      visibleBreakerRoles: () => ["breaker_fracter"],
      rolesForCardId: () => ["breaker_fracter"],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      playerView: {
        own: {
          credits: 0,
          gripOrHq: [],
          rig: [onlyFracter],
          memoryUsed: 1,
          memoryLimit: 1,
        },
        opponent: { credits: 0 },
        servers: [],
        specialZones: {
          setAside: [prepared],
          setAsideCount: 1,
          removedFromGame: [],
          removedFromGameCount: 0,
        },
      },
    } as unknown as AiDecisionInput;

    expect(
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source:
            "v1912.delayed_install_memory:shell-1:prepared_killer:start_turn:17",
        } as never,
        [
          {
            id: "trash_only_fracter",
            label: "Only Fracter",
            value: "only_fracter",
          },
        ],
      ),
    ).toEqual(["trash_only_fracter"]);
  });

  it("completes an accessed-agenda MU continuation with the minimal forced sacrifice", () => {
    const codecracker = program("codecracker", 1);
    const corrosion = program("corrosion", 1);
    const loonyGoon = program("loony_goon", 1);
    const rig = [codecracker, corrosion, loonyGoon];
    const cardsById = new Map(rig.map((card) => [card.instanceId, card]));
    const context = createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () => cardsById,
      visibleBreakerRoleCounts: () =>
        new Map([
          ["breaker_codecracker", 1],
          ["breaker_corrosion", 1],
          ["breaker_loony_goon", 1],
        ]),
      visibleBreakerRoles: (card) => [`breaker_${card.instanceId}`],
      rolesForCardId: () => [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: () => 0,
      visibleInstallCost: () => 0,
    });
    const input = {
      side: "runner",
      playerView: {
        own: {
          credits: 0,
          gripOrHq: [],
          rig,
          memoryUsed: 3,
          memoryLimit: 4,
        },
        opponent: { credits: 0 },
        servers: [],
      },
    } as unknown as AiDecisionInput;
    const options = rig.map((card) => ({
      id: `card_${card.instanceId}`,
      label: card.title ?? card.instanceId,
      value: card.instanceId,
    }));

    expect(
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        {
          source:
            "runner.program_install_memory:access:theorem_proof:0:runner.steal_agenda.theorem_proof.theorem_proof:access.agenda_install_as_runner_program%3Atheorem_proof%3A2",
        } as never,
        options,
      ),
    ).toHaveLength(1);
  });
});

function program(instanceId: string, memoryCost: number): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    type: "program",
    known: true,
    memoryCost,
  } as VisibleCard;
}

describe("installed program loss with hosted descendants", () => {
  function contextFor(rig: VisibleCard[]) {
    const roles = (card: VisibleCard) =>
      card.definitionId === "onr_v1_047_pile-driver" ||
      card.definitionId === "onr_v1_021_dwarf"
        ? ["breaker_wall"]
        : card.definitionId === "onr_v1_023_evil-twin"
          ? ["breaker_sentry"]
          : card.definitionId === "onr_v1_016_cyfermaster"
            ? ["breaker_gate"]
            : [];
    return createRunnerProgramInstallTrashContext({
      safeNonNegativeInteger: (value) => Math.max(0, value ?? 0),
      visibleMemoryCost: (card) => card?.memoryCost ?? 0,
      visibleCardsByInstanceId: () =>
        new Map(rig.map((card) => [card.instanceId, card])),
      visibleBreakerRoleCounts: (cards) => {
        const result = new Map<string, number>();
        for (const card of cards)
          for (const role of roles(card))
            result.set(role, (result.get(role) ?? 0) + 1);
        return result;
      },
      visibleBreakerRoles: roles,
      rolesForCardId: (id) =>
        id === "onr_v1_075_zetatech-software-installer" ? ["build_rig"] : [],
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      visibleCounterValue: (card) => card?.counters?.virus ?? 0,
      visibleInstallCost: (card) => card?.installCost ?? 0,
    });
  }
  const ownProgram = (
    id: string,
    definitionId: string,
    hostedOn?: string,
  ): VisibleCard => ({
    ...program(id, 1),
    definitionId,
    ...(hostedOn ? { hostedOn } : {}),
  });
  const inputFor = (rig: VisibleCard[], memoryUsed = 2): AiDecisionInput =>
    ({
      side: "runner",
      legalActions: [],
      playerView: {
        stateVersion: 7,
        timingPoint: "runner_action.main",
        own: { rig, memoryUsed, memoryLimit: memoryUsed, gripOrHq: [] },
        opponent: {},
        servers: [],
        specialZones: { setAside: [program("incoming", 1)] },
      },
    }) as unknown as AiDecisionInput;

  it("preserves a daemon's actual hosted coverage instead of preferring its cheap printed host", () => {
    const host = ownProgram("host", "onr_v1_001_afreet");
    const installer = ownProgram(
      "installer",
      "onr_v1_075_zetatech-software-installer",
    );
    const wall = ownProgram("wall", "onr_v1_047_pile-driver", "host");
    const sentry = ownProgram("sentry", "onr_v1_023_evil-twin", "host");
    const rig = [host, installer, wall, sentry];
    const context = contextFor(rig),
      input = inputFor(rig);
    const choice = {
      source: "v1912.delayed_install_memory:shell:incoming:start_turn:7",
    } as never;
    const options = [host, installer].map((card) => ({
      id: card.instanceId,
      value: card.instanceId,
      label: card.instanceId,
    }));
    const assessment = context.runnerProgramInstallTrashAssessment(
      input,
      choice,
      options,
    );
    expect(
      assessment.candidates.find(
        (candidate) => candidate.card?.instanceId === "host",
      ),
    ).toMatchObject({
      memoryCost: 1,
      protectedRole: true,
      category: "critical",
      reasonCategories: expect.arrayContaining([
        "hosted_programs_lost",
        "unique_breaker_coverage",
      ]),
    });
    expect(
      context.selectedRunnerProgramInstallTrashOptionIds(
        input,
        choice,
        options,
      ),
    ).toEqual(["installer"]);
    // Ordinary development cannot count daemon children as freeable printed MU.
    expect(
      context
        .runnerProgramInstallTrashAssessmentForCard(
          input,
          program("incoming", 1),
        )
        .candidates.map((candidate) => candidate.card?.instanceId),
    ).toEqual(["installer", "host"]);
  });

  it("protects a role even when both copies are lost under the same host", () => {
    const host = ownProgram("host", "onr_v1_001_afreet");
    const first = ownProgram("wall-a", "onr_v1_021_dwarf", "host");
    const second = ownProgram("wall-b", "onr_v1_021_dwarf", "host");
    const input = inputFor([host, first, second], 1);
    const assessment = contextFor([
      host,
      first,
      second,
    ]).runnerProgramInstallTrashAssessmentForCard(
      input,
      program("incoming", 1),
    );
    expect(assessment.candidates).toHaveLength(1);
    expect(assessment.candidates[0]).toMatchObject({
      memoryCost: 1,
      protectedRole: true,
      category: "critical",
    });
  });

  it("does not attribute another host's children to an empty daemon", () => {
    const empty = ownProgram("empty", "onr_v1_001_afreet");
    const full = ownProgram("full", "onr_v1_069_succubus");
    const wall = ownProgram("wall", "onr_v1_047_pile-driver", "full");
    const rig = [empty, full, wall],
      input = inputFor(rig);
    const assessment = contextFor(
      rig,
    ).runnerProgramInstallTrashAssessmentForCard(input, program("incoming", 1));
    expect(
      assessment.candidates.find(
        (candidate) => candidate.card?.instanceId === "empty",
      ),
    ).toMatchObject({
      protectedRole: false,
      sacrificePenalty: 40,
      memoryCost: 1,
    });
  });

  it("keeps printed MU for a program hosted on a non-daemon", () => {
    const host = ownProgram("ordinary-host", "onr_v1_003_baedekers-net-map");
    const child = ownProgram(
      "child",
      "onr_v1_047_pile-driver",
      host.instanceId,
    );
    const rig = [host, child],
      input = inputFor(rig);
    expect(
      contextFor(rig)
        .runnerProgramInstallTrashAssessmentForCard(
          input,
          program("incoming", 1),
        )
        .candidates.find((candidate) => candidate.card?.instanceId === "child"),
    ).toMatchObject({ memoryCost: 1 });
  });

  it.each(["missing-host", "cycle"])(
    "fails closed for a %s own hosting binding",
    (kind) => {
      const broken = ownProgram(
        "broken",
        "onr_v1_001_afreet",
        kind === "cycle" ? "broken" : "absent",
      );
      const rig = [broken],
        input = inputFor(rig, 1);
      expect(() =>
        contextFor(rig).runnerProgramInstallTrashAssessmentForCard(
          input,
          program("incoming", 1),
        ),
      ).toThrowError("invalid_player_view_card_projection");
    },
  );
});
