import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import activeHints from "../../../data/ai/ai-card-hints-active.json";
import inspectorIndex from "../../../data/ai/ai-hint-inspector-index.json";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "./actions/action-card-semantic-profiles";
import { createAiHintsByCard } from "./ai-hints";
import type { TacticalGoalLike } from "./decision/semantic-decision-frame";
import { corpPunishCandidates } from "./plans/tactical-plan-corp-helpers";
import type { TacticalPlanBuildContext } from "./plans/tactical-plan-types";
import { candidateRequiresSuccessfulTrace } from "./runtime/trace-tag-success-estimate";
import { buildCorpIceCardPlacementProfile } from "./runtime/corp-ice-placement/corp-ice-placement";

type Hint = {
  cardId: string;
  roles?: string[];
  planRoles?: string[];
  requiredMechanics?: string[];
  tacticSignals?: string[];
  strategySupportPairs?: Array<{ strategyId: string }>;
};

describe("match FD7671 card-hint contract", () => {
  it.each([["active", activeHints.cards]])(
    "models Rex as trace run-lock ICE without tag semantics in %s hints",
    (_source, cards) => {
      const rex = (cards as Hint[]).find(
        (hint) => hint.cardId === "onr_v1_264_rex",
      );
      expect(rex).toBeDefined();
      expect(rex?.roles).not.toContain("tag");
      expect(rex?.planRoles).not.toContain("tag_pressure");
      expect(rex?.requiredMechanics).not.toContain("add_tag");
      expect(rex?.requiredMechanics).toContain("end_the_run");
      expect(rex?.tacticSignals).toEqual(
        expect.arrayContaining([
          "corp_ice.conditional_end_run",
          "corp_ice.run_lock",
          "corp_ice.trace_source",
          "trace.source",
        ]),
      );
      expect(rex?.strategySupportPairs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ strategyId: "corp.ice_tax_glacier" }),
        ]),
      );
      expect(rex?.strategySupportPairs).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ strategyId: "corp.tag_trace_punish" }),
        ]),
      );
    },
  );

  it("preserves Rex run-lock defense through active runtime consumers", () => {
    const runtimeHint = createAiHintsByCard().get("onr_v1_264_rex");
    expect(runtimeHint?.roles).toEqual(["ice", "trace"]);
    expect(runtimeHint?.planRoles).toEqual(["defend_server"]);

    const profile = buildCorpIceCardPlacementProfile({
      instanceId: "rex-consumer-contract",
      definitionId: "onr_v1_264_rex",
      known: true,
      title: "Rex",
      type: "ice",
      rulesText:
        "Trace 3 - If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay 2 credits.",
    } satisfies VisibleCard);
    expect(profile).toMatchObject({
      immediateStop: true,
      tagTrace: true,
      runLock: true,
      damage: false,
    });

    const rexInspector = inspectorIndex.cards.find(
      (entry) => entry.cardId === "onr_v1_264_rex",
    );
    expect(rexInspector?.derivedStrategyAnchors).toContain(
      "corp.ice_tax_glacier",
    );
    expect(rexInspector?.planRolesClassification).toEqual([
      expect.objectContaining({ value: "defend_server" }),
    ]);
  });

  it("does not project Rex install or rez actions as productive trace-punish actions", () => {
    const actions = [
      rexAction("install-rex", "install_card"),
      rexAction("rez-rex", "rez_ice"),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: actions,
      observerSide: "corp",
      visibleSourceDefinitionsByInstanceId: {
        "rex-instance": "onr_v1_264_rex",
      },
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });

    for (const candidate of candidates) {
      expect(candidate.actionTacticSignals).not.toContain("trace.source");
      expect(candidate.strategySupport).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ strategyId: "corp.tag_trace_punish" }),
        ]),
      );
      expect(candidateRequiresSuccessfulTrace(candidate)).toBe(false);
    }
    expect(
      corpPunishCandidates(
        {
          input: rexCorpInput(actions),
          candidates,
        } as TacticalPlanBuildContext,
        { goalId: "corp.apply_punish_pressure" } as TacticalGoalLike,
      ),
    ).toEqual([]);
  });
});

function rexAction(
  actionId: string,
  type: "install_card" | "rez_ice",
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source: "rex-instance",
    timingPoint: "corp_action.main",
    costs: [],
    payload: {},
    targetRequirements: [],
    visibility: "public",
  } as unknown as LegalAction;
}

function rexCorpInput(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "corp",
    actorSide: "corp",
    legalActions,
    playerView: {
      side: "corp",
      legalActions,
      own: {
        credits: 8,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        rig: [],
        scoreArea: [],
      },
      opponent: {
        credits: 4,
        clicks: 4,
        agendaPoints: 0,
        rig: [],
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}
