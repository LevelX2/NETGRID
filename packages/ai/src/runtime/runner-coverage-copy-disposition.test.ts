import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  aiInput,
  legalAction,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { runnerActionDispositions } from "./plan-first-live-runtime";

describe("exact Runner coverage-copy ownership", () => {
  it.each([
    ["onr_v1_014_codecracker", "breaker_code_gate"],
    ["onr_proteus_083_corrosion", "breaker_wall"],
  ] as const)(
    "defers an unselected %s copy without changing the selected route",
    (definitionId, requiredRole) => {
      const actions = ["bound", "alternative"].map((source) =>
        legalAction(
          `runner.install_card.${source}`,
          "runner",
          "install_card",
          "Install breaker",
          { credits: 3, clicks: 1 },
          { source, payload: { cardId: source, effectKind: "install_card" } },
        ),
      );
      const input = aiInput("runner", actions);
      input.playerView.own.gripOrHq = actions.map((action) =>
        visibleCard(action.source!, "runner", "program", { definitionId }),
      );
      const candidates = buildActionSemanticCandidates({
        legalActions: actions,
        observerSide: "runner",
        stateVersion: 1,
        visibleSourceDefinitionsByInstanceId: {
          bound: definitionId,
          alternative: definitionId,
        },
      });
      const gap = {
        gapId: "exact-upgrade",
        requiredRole,
        priorityClass: "P4",
        evidenceCode: "test_exact_upgrade",
        answerInHand: true,
        deckHasAnswer: true,
        installActionIds: [actions[0]!.actionId],
        preparationActionIds: [],
        directSearchActionIds: [],
        searchEngineSetupActionIds: [],
        drawForAnswerActionIds: [],
        fundingActionIds: [],
      };
      const domain = {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        coverageGaps: [gap],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
        developments: [
          {
            developmentId: "card:alternative",
            definitionId,
            phase: "execute",
            assignedDomainPlanIds: ["runner.rig_and_coverage:exact-upgrade"],
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: true,
            semanticActionTypes: ["install.card"],
            actionIds: [actions[1]!.actionId],
            priorityClass: "P4",
            value: 70,
            evidenceCode: "test_coverage_alternative",
          },
        ],
      };
      const inspect = () =>
        runnerActionDispositions(
          input,
          candidates,
          domain as never,
          [],
          [],
          () => undefined,
        );
      expect(inspect()).toEqual([
        {
          actionId: actions[1]!.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.rig_and_coverage",
          evidenceCode:
            "runner_coverage_install_alternative_to_bound_same_definition_answer",
        },
      ]);
      expect(gap.installActionIds).toEqual([actions[0]!.actionId]);
      expect(actions.map((action) => action.actionId)).toEqual([
        "runner.install_card.bound",
        "runner.install_card.alternative",
      ]);
      gap.installActionIds.push(actions[1]!.actionId);
      expect(inspect()).toEqual([]);
      gap.installActionIds.pop();
      Object.assign(gap, {
        requesterModuleId: "runner.pressure_central",
        requesterPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
        requesterNeedId: gap.gapId,
      });
      const parent = {
        pressureId: "central:rd",
        serverId: "rd",
        supportNeedId: gap.gapId,
        reachable: false,
        marginalValue: 0,
        preparationActionIds: [],
        runActionAssessments: {},
      };
      (domain.centralPressure as unknown[]).push(parent);
      expect(inspect()).toEqual(
        expect.arrayContaining([
          {
            actionId: actions[0]!.actionId,
            disposition: "explicitly_nonproductive",
            ownerModuleId: "runner.rig_and_coverage",
            evidenceCode:
              "runner_coverage_install_deferred_by_nonpositive_bound_parent",
          },
        ]),
      );
      parent.marginalValue = 60;
      expect(inspect().some((d) => d.actionId === actions[0]!.actionId)).toBe(
        false,
      );
      parent.marginalValue = -31;
      // An independent current need for this exact installation must survive.
      domain.coverageGaps.push({ ...gap, gapId: "independent-need" });
      expect(inspect().some((d) => d.actionId === actions[0]!.actionId)).toBe(
        false,
      );
      domain.coverageGaps.pop();
      domain.centralPressure.pop();
      candidates[0]!.sourceDefinitionId = "onr_v1_039_krash";
      input.playerView.own.gripOrHq[0]!.definitionId = "onr_v1_039_krash";
      // A different answer is not proven interchangeable. Do not conceal that
      // ownership defect with a blanket unowned-action disposition.
      expect(inspect()).toEqual([]);
    },
  );
});
