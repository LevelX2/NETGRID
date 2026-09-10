import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  aiInput,
  legalAction,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { runnerActionDispositions } from "./plan-first-live-runtime";

describe("recurring-economy deferral of multipurpose coverage hardware", () => {
  it.each([
    "runner_restricted_run_economy_install_deferred",
    "runner_restricted_run_economy_hand_route_deferred",
  ])("keeps exact MU preparation executable despite %s", (evidenceCode) => {
    const definitionId = "onr_proteus_151_sunburst-cranial-interface";
    const actions = ["bound-memory", "unbound-memory"].map((source) =>
      legalAction(
        `runner.install_card.${source}`,
        "runner",
        "install_card",
        "Install memory hardware",
        { credits: 5, clicks: 1 },
        { source, payload: { cardId: source, effectKind: "install_card" } },
      ),
    );
    const input = aiInput("runner", actions);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 2;
    input.playerView.own.memoryUsed = 4;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.gripOrHq = actions.map((action) =>
      visibleCard(action.source!, "runner", "hardware", {
        definitionId,
        installCost: 5,
        memoryLimitBonus: 1,
      }),
    );
    const candidates = buildActionSemanticCandidates({
      legalActions: actions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        actions.map((action) => [action.source!, definitionId]),
      ),
    });
    const gap = {
      gapId: "coverage:breaker_code_gate",
      requiredRole: "breaker_code_gate",
      priorityClass: "P4",
      evidenceCode: "test_exact_code_gate_memory_need",
      answerInHand: true,
      deckHasAnswer: true,
      preparationActionIds: [actions[0]!.actionId],
      installActionIds: [],
      directSearchActionIds: [],
      searchEngineSetupActionIds: [],
      drawForAnswerActionIds: [],
      fundingActionIds: [],
      programInstallMemoryRejectedActionIds: [] as string[],
    };
    const domain = {
      creditBanks: [],
      recurringEconomy: [
        {
          commitmentId: "bound-memory",
          definitionId,
          commitmentActive: false,
          phase: "hold",
          actionIds: [],
          evidenceCodes: [evidenceCode],
        },
      ],
      resourceLifecycle: [],
      shellTradersPipelines: [],
      runWindows: [],
      centralPressure: [],
      remoteContests: [],
      installedAgendaScores: [],
      installedCardLiquidationChoices: [],
      fundingNeeds: [],
      coverageGaps: [gap],
      developments: [],
      defense: {
        activeTags: 0,
        forgoUnsafeRunCapacity: false,
        handBufferActionIds: [],
      },
    };
    const before = structuredClone(domain);
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
        ownerModuleId: "runner.recurring_economy",
        evidenceCode,
      },
    ]);
    // The income-only rejection cannot change the exact coverage plan/step
    // binding. It still applies to another copy that has no current need.
    expect(domain).toEqual(before);
    expect(gap.preparationActionIds).toEqual([actions[0]!.actionId]);
    expect(actions[0]!.expiresAtStateVersion).toBe(
      input.playerView.stateVersion,
    );

    // A genuine install safety rejection is retained at its original owner.
    gap.programInstallMemoryRejectedActionIds.push(actions[0]!.actionId);
    expect(inspect()).toEqual(
      expect.arrayContaining([
        {
          actionId: actions[0]!.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.rig_and_coverage",
          evidenceCode:
            "runner_coverage_search_install_has_no_acceptable_sacrifice",
        },
      ]),
    );
    gap.programInstallMemoryRejectedActionIds.pop();
    gap.preparationActionIds = [];
    expect(inspect()).toHaveLength(2);
  });
});
