import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import {
  aiInput,
  legalAction,
} from "../../semantic-ai-runtime-cutover.test-support";
import {
  corpStartRunRedirectDefenseChoiceSignal,
  planBoundStartRunRedirectSelection,
} from "./start-run-redirect-choice";

function redirectWindow() {
  const action = legalAction(
    "cn",
    "corp",
    "resolve_choice",
    "Start-of-run Utility",
    { credits: 0 },
    { source: "game_rule" },
  );
  const input = aiInput("corp", [action]);
  const choiceId = "corp_start_of_run_redirect_1";
  const source = "corp.start_of_run_redirect:1:hq";
  const options = [
    { id: "pass", label: "Pass" },
    {
      id: "redirect_siren",
      label: "Umleiten",
      value: "siren",
      metadata: { creditCost: 1 },
    },
  ];
  action.choiceRequirements = [
    {
      choiceId,
      minSelections: 1,
      maxSelections: 1,
      optionIds: options.map((o) => o.id),
    },
  ];
  input.playerView.pendingChoice = {
    choiceId,
    source,
    side: "corp",
    prompt: "Utility",
    kind: "select_option",
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "public",
    options,
  };
  input.playerView.run = {
    runId: 1,
    attackedServerId: "hq",
    phase: "approach_ice",
    position: { kind: "ice", serverId: "hq", iceIndex: 0 },
    successful: false,
    badPublicityCredits: 0,
  };
  input.playerView.own.credits = 3;
  input.playerView.own.gripOrHq = [
    { instanceId: "agenda", known: true, type: "agenda" },
  ];
  input.playerView.servers = [
    { id: "hq", label: "HQ", ice: [], root: [] },
    {
      id: "r1",
      label: "Remote",
      ice: [],
      root: [
        {
          instanceId: "siren",
          definitionId: 132,
          type: "asset",
          known: true,
          rezzed: true,
        },
      ],
    },
  ];
  const candidate = {
    actionId: action.actionId,
    actorSide: "corp",
    stateVersion: 1,
    semanticActionType: "choice.resolve",
  } as ActionSemanticCandidate;
  return { input, action, candidate };
}

describe("corp.defend_servers start-of-run redirect", () => {
  it("binds a cheaper agenda-free fort to the actual run, offer and payment quote", () => {
    const { input, action, candidate } = redirectWindow();
    const signal = corpStartRunRedirectDefenseChoiceSignal(
      input,
      [candidate],
      undefined,
      1,
    );
    expect(signal?.choiceResolution).toMatchObject({
      selectedOptionId: "redirect_siren",
      target: { serverId: "r1", sourceCardInstanceId: "siren", creditCost: 1 },
    });
    const state = { kind: "defense", signals: [signal] };
    expect(
      planBoundStartRunRedirectSelection(input, action, state)
        ?.selectedOptionIds,
    ).toEqual(["redirect_siren"]);
    input.playerView.pendingChoice!.options[1]!.metadata!.creditCost = 2;
    expect(
      planBoundStartRunRedirectSelection(input, action, state),
    ).toBeUndefined();
    delete input.playerView.pendingChoice!.options[1]!.metadata;
    expect(
      corpStartRunRedirectDefenseChoiceSignal(input, [candidate], undefined, 1),
    ).toBeUndefined();
  });

  it("declines to spend scoring reserves or pay to protect an agenda-free HQ", () => {
    const { input, candidate } = redirectWindow();
    const selected = (reserve: number) =>
      corpStartRunRedirectDefenseChoiceSignal(
        input,
        [candidate],
        undefined,
        reserve,
      )?.choiceResolution;
    expect(selected(3)).toMatchObject({ selectedOptionId: "pass" });
    input.playerView.own.gripOrHq = [];
    expect(selected(0)).toMatchObject({ selectedOptionId: "pass" });
  });
});
