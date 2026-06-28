import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";

import { bestLegalCoverageAnswerRole } from "./tactical-plan-legal-coverage-answers";

type TestVisibleCardOverrides = Omit<Partial<VisibleCard>, "type"> & {
  type?: string;
};

describe("bestLegalCoverageAnswerRole", () => {
  it("uses structured recovery targets and ignores label-only recovery text", () => {
    expect(
      bestLegalCoverageAnswerRole(
        input([
          action({
            actionId: "label-only-recovery",
            label: "Junkyard BBS recovery from heap",
          }),
        ]),
        "breaker_wall",
      ),
    ).toBeUndefined();

    expect(
      bestLegalCoverageAnswerRole(
        input([
          action({
            actionId: "structured-recovery",
            label: "Use ability",
            payload: { targetCardDefinitionId: "onr_v1_021_dwarf" },
          }),
        ]),
        "breaker_wall",
      ),
    ).toBe("recovery_answer");
  });

  it("ignores substring-only coverage roles from visible source cards", () => {
    expect(
      bestLegalCoverageAnswerRole(
        input(
          [
            action({
              actionId: "research-action",
              source: "research-source",
            }),
          ],
          [
            visibleCard({
              instanceId: "research-source",
              definitionId: "test_lab",
              type: "research",
            }),
          ],
        ),
        "breaker_wall",
      ),
    ).toBeUndefined();
  });

  it("ignores substring-only coverage roles from structured recovery targets", () => {
    expect(
      bestLegalCoverageAnswerRole(
        input(
          [
            action({
              actionId: "recover-research",
              source: "recovery-source",
              payload: { targetCardId: "research-target" },
            }),
          ],
          [
            visibleCard({
              instanceId: "recovery-source",
              definitionId: "junkyard_source",
              title: "Junkyard BBS",
              type: "resource",
            }),
            visibleCard({
              instanceId: "research-target",
              definitionId: "test_lab_target",
              type: "research",
              known: true,
            }),
          ],
        ),
        "breaker_wall",
      ),
    ).toBeUndefined();
  });
});

function input(
  legalActions: LegalAction[],
  visibleCards: VisibleCard[] = [],
): AiDecisionInput {
  const playerView = {
    side: "runner",
    own: { rig: visibleCards, gripOrHq: [], heapOrArchives: [], scoreArea: [] },
    servers: [],
  } as unknown as PlayerView;
  return {
    side: "runner",
    legalActions,
    playerView,
  } as unknown as AiDecisionInput;
}

function visibleCard(overrides: TestVisibleCardOverrides): VisibleCard {
  return {
    instanceId: "card",
    definitionId: "card",
    title: "Card",
    owner: "runner",
    controller: "runner",
    type: "resource",
    known: true,
    subtypes: [],
    ...overrides,
  } as unknown as VisibleCard;
}

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
