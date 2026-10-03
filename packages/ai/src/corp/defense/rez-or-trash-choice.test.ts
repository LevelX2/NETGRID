import { beforeAll, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpRezOrTrashDefenseChoiceSignal } from "./rez-or-trash-choice";
import { selectedCorpRezOrTrashIceOptionId } from "./defense-choice-binding";

const native = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-g37-d224-rez-or-trash-native.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInput & { ownDeckSnapshot: { deckSnapshotId: string } };
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

function currentInput(): AiDecisionInput {
  const source = structuredClone(native.input) as unknown as AiDecisionInput;
  return { ...source, ...buildAiDecisionInputDto(source) };
}

describe("Corp plan-bound rez-or-trash ICE choice", () => {
  let portfolio: ResidentPlanPortfolio;
  let projects: CorpScoreProjectSignal[];
  const candidates = [
    { actionId: "corp.resolve_choice", semanticActionType: "choice.resolve" },
  ] as ActionSemanticCandidate[];
  beforeAll(() => {
    const input = currentInput();
    expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
    restoreAiRuntimeCheckpoint(
      input,
      native.input.ownDeckSnapshot.deckSnapshotId,
      native.runtime as unknown as AiRuntimeCheckpointV1,
    );
    const decision = chooseAiAction(input);
    const plan = decision.decisionDebug!.planFirstDecision!;
    portfolio = residentPlanPortfolioSnapshot(input)!;
    projects = portfolio.instances
      .filter((i) => i.moduleId === "corp.score_agenda")
      .map((i) => (i.moduleState as { signal: CorpScoreProjectSignal }).signal);
    expect(decision.actionId).toBe("corp.resolve_choice");
    expect(decision.selectedChoices).toMatchObject({
      choiceId: input.playerView.pendingChoice!.choiceId,
      selectedOptionIds: ["trash_ice"],
    });
    expect(plan.selectedPlan?.moduleId).toBe("corp.defend_servers");
    expect(plan.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: 223,
      planInstanceId: portfolio.executorInstanceId,
    });
    expect(plan.rootPlanInstanceId).toBe(portfolio.executorInstanceId);
  });

  it("keeps the exact native score continuation while an already rezzed ICE stops access", () => {
    const input = currentInput();
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({
      kind: "rez_or_trash_ice",
      selectedOptionId: "trash_ice",
      preservedScoreProjectId:
        "agenda:corp_onr_classic_003_unlisted-research-lab_1:remote_2",
      sourceStateVersion: 223,
    });
    expect(
      selectedCorpRezOrTrashIceOptionId(
        input,
        input.legalActions[0]!,
        input.playerView.pendingChoice!,
        input.playerView.pendingChoice!.options,
        portfolio,
      ),
    ).toBe("trash_ice");
  });

  it("reconstructs the same bound defense decision after runtime memory is cleared", () => {
    const input = currentInput();
    restoreAiRuntimeCheckpoint(
      input,
      native.input.ownDeckSnapshot.deckSnapshotId,
      { schemaVersion: native.runtime.schemaVersion },
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("corp.resolve_choice");
    expect(decision.selectedChoices).toMatchObject({
      selectedOptionIds: ["trash_ice"],
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.defend_servers");
  });

  it("keeps affordable ICE when rez leaves the certified credit floor intact", () => {
    const input = currentInput();
    input.playerView.own.credits = 3;
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "rez_ice" });
  });

  it("retains the affordable rez when no score continuation claim exists", () => {
    expect(
      corpRezOrTrashDefenseChoiceSignal(currentInput(), candidates, [])
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "rez_ice" });
  });

  it("preserves the terminal score when redundant rez spends required agenda points", () => {
    const input = currentInput();
    input.playerView.own.credits = 3;
    const quote = input.playerView.servers.find((s) => s.id === "remote_2")!
      .ice[1]!.effectiveRezCostQuote!;
    if (!quote.complete) throw new Error("Expected complete native quote");
    quote.mandatoryAdditionalCosts.agendaPoints = 1;
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "trash_ice" });
  });

  it("does not replace a missing Runner rig projection with an empty rig", () => {
    const input = currentInput();
    delete input.playerView.opponent.rig;
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects),
    ).toBeUndefined();
  });

  it("does not call ICE redundant when the existing rezzed stop is absent", () => {
    const input = currentInput();
    input.playerView.servers.find((s) => s.id === "remote_2")!.ice.shift();
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "rez_ice" });
  });

  it("does not treat unknown protection as a certified stop", () => {
    const input = currentInput();
    input.playerView.servers.find((s) => s.id === "remote_2")!.ice[0]!.known =
      false;
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "rez_ice" });
  });

  it("trashes an ICE when the Engine offers only trash", () => {
    const input = currentInput();
    input.playerView.pendingChoice!.options =
      input.playerView.pendingChoice!.options.filter(
        (o) => o.id === "trash_ice",
      );
    input.legalActions[0]!.choiceRequirements![0]!.optionIds = ["trash_ice"];
    expect(
      corpRezOrTrashDefenseChoiceSignal(input, candidates, projects)
        ?.choiceResolution,
    ).toMatchObject({ selectedOptionId: "trash_ice" });
  });

  it.each(["missing_quote", "stale_quote", "mismatched_action"])(
    "fails closed for %s",
    (defect) => {
      const input = currentInput();
      const ice = input.playerView.servers.find((s) => s.id === "remote_2")!
        .ice[1]!;
      if (defect === "missing_quote") delete ice.effectiveRezCostQuote;
      if (defect === "stale_quote")
        ice.effectiveRezCostQuote!.expiresAtStateVersion--;
      if (defect === "mismatched_action")
        input.legalActions[0]!.choiceRequirements![0]!.choiceId = "other";
      expect(
        corpRezOrTrashDefenseChoiceSignal(input, candidates, projects),
      ).toBeUndefined();
      expect(() =>
        selectedCorpRezOrTrashIceOptionId(
          input,
          input.legalActions[0]!,
          input.playerView.pendingChoice!,
          input.playerView.pendingChoice!.options,
          portfolio,
        ),
      ).toThrowError(
        expect.objectContaining({ code: "window_origin_missing" }),
      );
    },
  );

  it("rejects a stale portfolio instead of opening a second decision authority", () => {
    const input = currentInput();
    const stale = { ...portfolio, stateVersion: 222 };
    expect(() =>
      selectedCorpRezOrTrashIceOptionId(
        input,
        input.legalActions[0]!,
        input.playerView.pendingChoice!,
        input.playerView.pendingChoice!.options,
        stale,
      ),
    ).toThrowError(expect.objectContaining({ code: "window_origin_missing" }));
  });
});
