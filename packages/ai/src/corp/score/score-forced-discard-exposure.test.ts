import { describe, expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta734-forced-agenda-discard.json";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpScorelineFeasibilityForDecisionInput } from "../../runtime/corp-scoreline-feasibility";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { corpForcedAgendaDiscardHasSaferTerminalAlternative } from "./score-flood-exposure";
import { scoreProjectForCandidate } from "./score-project-signals";

function checkpoint() {
  const input = structuredClone(
    capture.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  input.playerView.legalActions = input.legalActions;
  const install = input.legalActions.find(
    (action) => action.actionId === capture.expectedOriginal,
  )!;
  const agenda = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === install.source,
  )!;
  return { input, install, agenda };
}

function project(
  input: AiDecisionInputWithDeckCapabilities,
  actionId = capture.expectedOriginal,
) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId:
      visibleSourceDefinitionsByInstanceId(input.playerView),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const candidate = candidates.find(
    (entry) => entry.actionId === actionId,
  )!;
  return scoreProjectForCandidate(
    input,
    candidate,
    corpScorelineFeasibilityForDecisionInput(input),
    undefined,
    false,
    false,
  )[0];
}

describe("forced agenda discard exposure in P734 G34", () => {
  it("withholds the naked match-winning agenda when the actual discard can stay below matchpoint", () => {
    const { input, install, agenda } = checkpoint();
    expect(capture.stateHash).toBe("fnv1a:0ee1e907");
    expect(input.playerView.own.gripOrHq).toHaveLength(6);
    expect(install.payload?.serverId).toBe("new_remote");
    expect(
      corpForcedAgendaDiscardHasSaferTerminalAlternative(input, agenda),
    ).toBe(true);
    const route = project(input);
    expect(route).toMatchObject({
      serverId: "new_remote",
      feasible: false,
    });
    expect(route?.routeAssessment).not.toBe(
      "corp_forced_agenda_discard_score_attempt",
    );
    const existing = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.source === agenda.instanceId &&
        action.payload?.serverId === "remote_2",
    )!;
    expect(project(input, existing.actionId)).toMatchObject({
      serverId: "remote_2",
      feasible: false,
    });
  });

  it("preserves forced relief if every possible discard already allows an immediate Archives win", () => {
    const { input, agenda } = checkpoint();
    input.playerView.opponent.agendaPoints = 5;
    expect(
      corpForcedAgendaDiscardHasSaferTerminalAlternative(input, agenda),
    ).toBe(false);
    expect(project(input)).toMatchObject({
      routeAssessment: "corp_forced_agenda_discard_score_attempt",
      feasible: true,
    });
  });

  it("does not spend the same Corp credit on both central defenses", () => {
    const { input, agenda } = checkpoint();
    input.playerView.own.credits = 3;
    expect(
      corpForcedAgendaDiscardHasSaferTerminalAlternative(input, agenda),
    ).toBe(false);
  });

  it("preserves the uncertainty when visible Runner preparation can fund central access", () => {
    const { input, agenda } = checkpoint();
    input.playerView.opponent.credits = 35;
    expect(
      corpForcedAgendaDiscardHasSaferTerminalAlternative(input, agenda),
    ).toBe(false);
  });
});
