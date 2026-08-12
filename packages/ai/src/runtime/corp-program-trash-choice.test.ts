import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedCorpProgramTrashChoiceOptionIds } from "./corp-program-trash-choice";

describe("selectedCorpProgramTrashChoiceOptionIds", () => {
  it("binds the exact public encounter choice and prefers a valuable breaker", () => {
    const { input, action, choice } = fixture();

    expect(
      selectedCorpProgramTrashChoiceOptionIds(
        input,
        action,
        choice,
        choice.options,
        (definitionId) =>
          definitionId === "breaker_program" ? ["breaker_sentry"] : [],
      ),
    ).toEqual(["card_breaker_1"]);
  });

  it("binds the same target choice after a trace-success trash effect", () => {
    const { input, action } = fixture();
    const choice = input.playerView.pendingChoice!;
    choice.source = [
      "card_implementation.trash_installed_program",
      "run_1",
      "colonel_1",
      "0",
      "onr_proteus_029_colonel-failure",
      "trace_program_trash",
      "initiate_trace",
      "trace_success",
    ].join(":");
    input.playerView.servers[0]!.ice[0]!.effectiveRunQuote!.subroutines = [
      {
        id: "trace_program_trash",
        type: "initiate_trace",
        traceLimit: 4,
        traceSuccessEffect: {
          type: "end_run_trash_program_and_run_lock",
          amount: 1,
        },
      },
    ];

    expect(
      selectedCorpProgramTrashChoiceOptionIds(
        input,
        action,
        choice,
        choice.options,
        () => [],
      ),
    ).toEqual(["card_utility_1"]);
  });

  it.each([
    [
      "wrong encountered ICE",
      (input: AiDecisionInput) => {
        input.playerView.run!.encounteredIce!.instanceId = "other_ice";
      },
    ],
    [
      "partial option set",
      (input: AiDecisionInput) => {
        input.playerView.opponent.rig!.push(
          program("unbound_program", "utility"),
        );
      },
    ],
    [
      "hidden choice",
      (input: AiDecisionInput) => {
        input.playerView.pendingChoice!.visibility = "hidden_info_barrier";
      },
    ],
  ])("fails closed for %s", (_label, mutate) => {
    const { input, action } = fixture();
    mutate(input);
    const choice = input.playerView.pendingChoice!;

    expect(
      selectedCorpProgramTrashChoiceOptionIds(
        input,
        action,
        choice,
        choice.options,
        () => [],
      ),
    ).toBeUndefined();
  });
});

function fixture(): {
  input: AiDecisionInput;
  action: LegalAction;
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
} {
  const source = [
    "card_implementation.trash_installed_program",
    "run_1",
    "colonel_1",
    "0",
    "onr_proteus_029_colonel-failure",
    "trash_program",
    "trash_installed_program",
    "encounter",
  ].join(":");
  const input = {
    side: "corp",
    seed: "corp-program-trash-choice",
    decisionId: "corp-program-trash-choice:7",
    profileId: "corp-program-trash-choice",
    playerView: {
      stateVersion: 7,
      timingPoint: "run.encounter_ice",
      winner: null,
      own: { credits: 5, gripOrHq: [], scoreArea: [] },
      opponent: {
        credits: 5,
        rig: [
          program("breaker_1", "breaker_program", 2, 1),
          program("utility_1", "utility_program", 8, 2),
        ],
      },
      servers: [
        {
          id: "rd",
          label: "R&D",
          root: [],
          ice: [
            {
              instanceId: "colonel_1",
              definitionId: "onr_proteus_029_colonel-failure",
              known: true,
              effectiveRunQuote: {
                iceInstanceId: "colonel_1",
                iceDefinitionId: "onr_proteus_029_colonel-failure",
                effectiveStrength: 4,
                subroutines: [
                  { id: "trash_program", type: "trash_installed_program" },
                ],
              },
            },
          ],
        },
      ],
      run: {
        runId: "run_1",
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: {
          instanceId: "colonel_1",
          definitionId: "onr_proteus_029_colonel-failure",
          known: true,
        },
      },
      pendingChoice: {
        choiceId: "trash_installed_program_7",
        side: "corp",
        source,
        prompt: "Choose a program",
        kind: "select_cards",
        options: [
          { id: "card_breaker_1", label: "Breaker", value: "breaker_1" },
          { id: "card_utility_1", label: "Utility", value: "utility_1" },
        ],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: 7,
        visibility: "public",
      },
      legalActions: [],
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
  const choice = input.playerView.pendingChoice!;
  const action = {
    actionId: "corp.resolve_choice",
    side: "corp",
    type: "resolve_choice",
    label: "Resolve choice",
    source: "game_rule",
    timingPoint: "run.encounter_ice",
    expiresAtStateVersion: 7,
    costs: [],
    targetRequirements: [],
    visibility: "public",
    choiceRequirements: [
      {
        choiceId: choice.choiceId,
        minSelections: 1,
        maxSelections: 1,
        optionIds: choice.options.map((option) => option.id),
      },
    ],
  } as unknown as LegalAction;
  input.legalActions = [action];
  input.playerView.legalActions = [action];
  return { input, action, choice };
}

function program(
  instanceId: string,
  definitionId: string,
  installCost = 1,
  memoryCost = 1,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    known: true,
    owner: "runner",
    controller: "runner",
    type: "program",
    installCost,
    memoryCost,
  };
}
