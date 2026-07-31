import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { instantiatePlanProposal } from "./plan-instance";
import {
  createRunnerCorePlanModules,
  runnerDevelopmentCardAdmission,
  runnerFundingRouteCandidateIsMaterializable,
  type RunnerCorePlanDomain,
} from "./runner-core-plan-modules";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import { reconcileResidentPlanPortfolio } from "./resident-plan-portfolio";
import type { PlanSchedulerContext } from "./plan-scheduler";

describe("Runner core plan modules", () => {
  it("contains no free play-best-card owner", () => {
    expect(
      createRunnerCorePlanModules().map((module) => module.moduleId),
    ).toEqual([
      "runner.score_installed_agenda",
      "runner.shell_traders_pipeline",
      "runner.resource_lifecycle",
      "runner.credit_bank",
      "runner.recurring_economy",
      "runner.economy",
      "runner.rig_and_coverage",
      "runner.defense_and_recovery",
    ]);
  });

  it("binds a Shell Traders pipeline to its exact source, target, and action", () => {
    const module = coreModule("runner.shell_traders_pipeline");
    const prepare = candidate(
      "prepare-dwarf",
      "trigger_ability",
      "card.persistent_development",
      "onr_v1_176_the-shell-traders",
    );
    prepare.sourceCardInstanceId = "shell-traders-1";
    prepare.targetContext = {
      selectedTargets: [
        {
          targetId: "dwarf-1",
          targetKind: "program",
          targetSide: "runner",
          targetDefinitionId: "onr_v1_107_dwarf",
          visibilityScope: "runner_private",
          evidence: ["legal_action_payload:targetCardId"],
        },
      ],
      targetKind: "program",
      targetZones: ["grip"],
      targetSide: "runner",
      hiddenInfoPolicy: "actor_private_only",
      availableTargetsStatus: "engine_provided",
      targetProfileMatches: [],
      targetConstraintResults: [],
    };
    const runnerContext = context([prepare], {
      shellTradersPipelines: [
        {
          pipelineId: "shell-traders-1:dwarf-1:prepare",
          phase: "prepare",
          sourceCardInstanceId: "shell-traders-1",
          sourceDefinitionId: "onr_v1_176_the-shell-traders",
          targetCardInstanceId: "dwarf-1",
          targetDefinitionId: "onr_v1_107_dwarf",
          targetCardType: "program",
          actionIds: [prepare.actionId],
          priorityClass: "P2",
          value: 12,
          shellCountersBefore: 0,
          shellCountersAfterAction: 3,
          targetInstallCost: 5,
          targetMemoryCost: 1,
          freeMemory: 1,
          replacementAssessment: {
            status: "not_needed",
            requiredMemory: 0,
            selectedProgramInstanceIds: [],
            freedMemory: 0,
            displacedValue: 0,
          },
          coverageBinding: {
            gapId: "coverage:wall:remote-1",
            requiredRole: "breaker_wall",
            targetServerId: "remote-1",
          },
          targetRoles: ["breaker_wall"],
          evidenceCodes: [
            "runner_shell_traders_phase:prepare",
            "runner_shell_traders_source:shell-traders-1",
            "runner_shell_traders_target:dwarf-1",
            "runner_shell_traders_memory:1:1",
            "runner_shell_traders_coverage:breaker_wall:remote-1",
          ],
        },
      ],
    });
    const [proposal] = module.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(proposal).toMatchObject({
      moduleId: "runner.shell_traders_pipeline",
      target: {
        kind: "card",
        id: "dwarf-1",
      },
      initialViability: "ready",
    });
    expect(proposal?.evidenceRefs.map((entry) => entry.code)).toEqual([
      "runner_shell_traders_phase:prepare",
      "runner_shell_traders_source:shell-traders-1",
      "runner_shell_traders_target:dwarf-1",
      "runner_shell_traders_memory:1:1",
      "runner_shell_traders_coverage:breaker_wall:remote-1",
    ]);
    expect(
      module.assess(instance, runnerContext, emptyPortfolio()).priorityClaim,
    ).toMatchObject({
      requestedClass: "P2",
      reasonCode: "survival_threat",
    });
    expect(
      module
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["prepare-dwarf"]);
  });

  it("rejects a Shell Traders candidate whose current target differs from the resident plan", () => {
    const module = coreModule("runner.shell_traders_pipeline");
    const prepare = candidate(
      "prepare-dwarf",
      "trigger_ability",
      "card.persistent_development",
      "onr_v1_176_the-shell-traders",
    );
    prepare.sourceCardInstanceId = "shell-traders-1";
    prepare.targetContext = {
      selectedTargets: [
        {
          targetId: "elf-1",
          targetKind: "program",
          targetSide: "runner",
          targetDefinitionId: "onr_v1_999_elf",
          visibilityScope: "runner_private",
          evidence: ["legal_action_payload:targetCardId"],
        },
      ],
      targetKind: "program",
      targetZones: ["grip"],
      targetSide: "runner",
      hiddenInfoPolicy: "actor_private_only",
      availableTargetsStatus: "engine_provided",
      targetProfileMatches: [],
      targetConstraintResults: [],
    };
    const runnerContext = context([prepare], {
      shellTradersPipelines: [
        {
          pipelineId: "shell-traders-1:dwarf-1:prepare",
          phase: "prepare",
          sourceCardInstanceId: "shell-traders-1",
          sourceDefinitionId: "onr_v1_176_the-shell-traders",
          targetCardInstanceId: "dwarf-1",
          targetDefinitionId: "onr_v1_107_dwarf",
          targetCardType: "program",
          actionIds: [prepare.actionId],
          priorityClass: "P2",
          value: 12,
          shellCountersBefore: 0,
          shellCountersAfterAction: 3,
          targetInstallCost: 5,
          targetMemoryCost: 1,
          freeMemory: 1,
          replacementAssessment: {
            status: "not_needed",
            requiredMemory: 0,
            selectedProgramInstanceIds: [],
            freedMemory: 0,
            displacedValue: 0,
          },
          targetRoles: ["breaker_wall"],
          evidenceCodes: [
            "runner_shell_traders_phase:prepare",
            "runner_shell_traders_source:shell-traders-1",
            "runner_shell_traders_target:dwarf-1",
          ],
        },
      ],
    });
    const [proposal] = module.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(proposal?.initialViability).toBe("blocked");
    expect(
      module.materialize(instance, {} as never, runnerContext).candidates,
    ).toEqual([]);
  });

  it("does not invent a Shell Traders pipeline without a domain signal", () => {
    const module = coreModule("runner.shell_traders_pipeline");
    const prepare = candidate(
      "prepare-dwarf",
      "trigger_ability",
      "card.persistent_development",
      "onr_v1_176_the-shell-traders",
    );

    expect(module.discover(context([prepare], {}))).toEqual([]);
  });

  it("keeps credit-bank cashouts outside generic funding-route search", () => {
    const basicCredit = candidate("basic-credit");
    const bankCashout = candidate("bank-cashout");
    bankCashout.economyProjection = {
      ...bankCashout.economyProjection!,
      grossLiquidCreditGain: 6,
      netLiquidCreditGain: 6,
      storedCreditsTaken: 6,
      payoutMode: "all_available",
      repeatable: "unknown",
      source: "legal_action_payload",
    };

    expect(runnerFundingRouteCandidateIsMaterializable(basicCredit)).toBe(true);
    expect(runnerFundingRouteCandidateIsMaterializable(bankCashout)).toBe(
      false,
    );
  });

  it("binds a profitable card-sourced EndTurn to its resource lifecycle plan", () => {
    const lifecycle = coreModule("runner.resource_lifecycle");
    const leavePlay = candidate(
      "leave-loan",
      "end_turn",
      "turn_flow.end_turn",
      "onr_v1_168_loan-from-chiba",
    );
    leavePlay.sourceCardInstanceId = "loan-1";
    const runnerContext = context([leavePlay], {
      resourceLifecycle: [
        {
          lifecycleId: "onr_v1_168_loan-from-chiba",
          sourceCardInstanceId: "loan-1",
          definitionId: "onr_v1_168_loan-from-chiba",
          phase: "leave_play",
          actionIds: [leavePlay.actionId],
          priorityClass: "P5",
          value: 2,
          evidenceCodes: [
            "runner_loan_from_chiba_leave_avoids_visible_long_horizon_liability:12",
          ],
        },
      ],
    });
    const [proposal] = lifecycle.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(proposal).toMatchObject({
      target: { kind: "card", id: "loan-1" },
      initialViability: "ready",
    });
    expect(
      lifecycle
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([leavePlay.actionId]);
  });

  it("keeps simultaneous Loan-from-Chiba lifecycle plans bound to their own instances", () => {
    const lifecycle = coreModule("runner.resource_lifecycle");
    const firstLoanEnd = candidate(
      "leave-loan-1",
      "end_turn",
      "turn_flow.end_turn",
      "onr_v1_168_loan-from-chiba",
    );
    firstLoanEnd.sourceCardInstanceId = "loan-1";
    const secondLoanEnd = candidate(
      "leave-loan-2",
      "end_turn",
      "turn_flow.end_turn",
      "onr_v1_168_loan-from-chiba",
    );
    secondLoanEnd.sourceCardInstanceId = "loan-2";
    const runnerContext = context([firstLoanEnd, secondLoanEnd], {
      resourceLifecycle: [
        {
          lifecycleId: "onr_v1_168_loan-from-chiba:loan-1",
          sourceCardInstanceId: "loan-1",
          definitionId: "onr_v1_168_loan-from-chiba",
          phase: "leave_play",
          actionIds: [firstLoanEnd.actionId],
          priorityClass: "P5",
          value: 2,
          evidenceCodes: ["runner_loan_from_chiba_leave_play"],
        },
        {
          lifecycleId: "onr_v1_168_loan-from-chiba:loan-2",
          sourceCardInstanceId: "loan-2",
          definitionId: "onr_v1_168_loan-from-chiba",
          phase: "leave_play",
          actionIds: [secondLoanEnd.actionId],
          priorityClass: "P5",
          value: 2,
          evidenceCodes: ["runner_loan_from_chiba_leave_play"],
        },
      ],
    });
    const proposals = lifecycle.discover(runnerContext);

    expect(proposals).toHaveLength(2);
    expect(proposals.map((proposal) => proposal.target?.id).sort()).toEqual([
      "loan-1",
      "loan-2",
    ]);
    expect(
      proposals.map((proposal) =>
        lifecycle
          .materialize(
            instantiatePlanProposal(proposal, 10),
            {} as never,
            runnerContext,
          )
          .candidates.map((entry) => entry.candidate.actionId),
      ),
    ).toEqual([["leave-loan-1"], ["leave-loan-2"]]);
  });

  it("keeps two Loan lifecycle funding children bound to their exact supportable parents", () => {
    const lifecycle = coreModule("runner.resource_lifecycle");
    const economy = coreModule("runner.economy");
    const parentOne =
      "plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1";
    const parentTwo =
      "plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-2";
    const credit = candidate("credit");
    const runnerContext = context([credit], {
      resourceLifecycle: [
        {
          lifecycleId: "onr_v1_168_loan-from-chiba:loan-1",
          sourceCardInstanceId: "loan-1",
          definitionId: "onr_v1_168_loan-from-chiba",
          phase: "retain",
          actionIds: [],
          rejectedActionIds: ["leave-loan-1"],
          supportNeedId: "resource-lifecycle-support:loan-1",
          marginalValue: 10,
          priorityClass: "P5",
          value: 10,
          evidenceCodes: ["runner_loan_waiting_for_funding"],
        },
        {
          lifecycleId: "onr_v1_168_loan-from-chiba:loan-2",
          sourceCardInstanceId: "loan-2",
          definitionId: "onr_v1_168_loan-from-chiba",
          phase: "retain",
          actionIds: [],
          rejectedActionIds: ["leave-loan-2"],
          supportNeedId: "resource-lifecycle-support:loan-2",
          marginalValue: 10,
          priorityClass: "P5",
          value: 10,
          evidenceCodes: ["runner_loan_waiting_for_funding"],
        },
      ],
      fundingNeeds: [
        {
          kind: "parent_plan_support",
          ...fundingRouteContract(credit.actionId),
          needId: "resource-lifecycle-support:loan-1",
          parentPlanInstanceId: parentOne,
          driver: {
            kind: "resource_lifecycle",
            targetId: "loan-1",
            reasonCode: "fund_exact_lifecycle_leave_play_payment",
          },
          targetCredits: 10,
          currentCreditsAtRevalidation: 9,
          gap: 1,
          priorityClass: "P5",
          revalidation: {
            stateVersion: 10,
            status: "material_parent_open",
          },
          evidenceCode: "runner_loan_waiting_for_funding",
        },
        {
          kind: "parent_plan_support",
          ...fundingRouteContract(credit.actionId),
          needId: "resource-lifecycle-support:loan-2",
          parentPlanInstanceId: parentTwo,
          driver: {
            kind: "resource_lifecycle",
            targetId: "loan-2",
            reasonCode: "fund_exact_lifecycle_leave_play_payment",
          },
          targetCredits: 10,
          currentCreditsAtRevalidation: 9,
          gap: 1,
          priorityClass: "P5",
          revalidation: {
            stateVersion: 10,
            status: "material_parent_open",
          },
          evidenceCode: "runner_loan_waiting_for_funding",
        },
      ],
    });

    const parentProposals = lifecycle.discover(runnerContext);
    const childProposals = economy.discover(runnerContext);

    expect(
      parentProposals.map((proposal) => ({
        id: instantiatePlanProposal(proposal, 10).instanceId,
        initialViability: proposal.initialViability,
        blockers: proposal.blockers,
      })),
    ).toEqual([
      {
        id: parentOne,
        initialViability: "ready",
        blockers: [],
      },
      {
        id: parentTwo,
        initialViability: "ready",
        blockers: [],
      },
    ]);
    const portfolio = emptyPortfolio();
    portfolio.instances = parentProposals.map((proposal) =>
      instantiatePlanProposal(proposal, 10),
    );
    expect(
      portfolio.instances.map((instance) =>
        lifecycle.assess(instance, runnerContext, portfolio),
      ),
    ).toEqual([
      expect.objectContaining({
        readiness: "executable_with_support",
        resourceGaps: [
          expect.objectContaining({
            needId: "resource-lifecycle-support:loan-1",
          }),
        ],
      }),
      expect.objectContaining({
        readiness: "executable_with_support",
        resourceGaps: [
          expect.objectContaining({
            needId: "resource-lifecycle-support:loan-2",
          }),
        ],
      }),
    ]);
    expect(
      childProposals.map((proposal) => ({
        parentInstanceId: proposal.parentInstanceId,
        priorityClass: (
          proposal.moduleState as {
            need: { priorityClass: string };
          }
        ).need.priorityClass,
      })),
    ).toEqual([
      { parentInstanceId: parentOne, priorityClass: "P5" },
      { parentInstanceId: parentTwo, priorityClass: "P5" },
    ]);
  });

  it("binds a nonterminal installed-agenda conversion to its explicit action", () => {
    const score = coreModule("runner.score_installed_agenda");
    const scoreAction = candidate(
      "score-theorem",
      "activated_card_ability",
      "agenda.score_installed",
      "onr_classic_004_theorem-proof",
    );
    const runnerContext = context([scoreAction], {
      installedAgendaScores: [
        {
          opportunityId: "theorem-1",
          sourceCardInstanceId: "theorem-1",
          actionIds: ["score-theorem"],
          agendaPoints: 3,
          terminal: false,
          evidenceCode: "runner_installed_agenda_score_conversion",
        },
      ],
    });
    const [proposal] = score.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const planAssessment = score.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );

    expect(proposal).toMatchObject({
      target: { kind: "card", id: "theorem-1" },
      initialViability: "ready",
    });
    expect(planAssessment.priorityClaim).toMatchObject({
      requestedClass: "P3",
      reasonCode: "expiring_conversion",
    });
    expect(
      score
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["score-theorem"]);
  });

  it("does not let a stale generic EndTurn impersonate a Loan-from-Chiba lifecycle action", () => {
    const lifecycle = coreModule("runner.resource_lifecycle");
    const genericEndTurn = candidate(
      "runner.end_turn",
      "end_turn",
      "turn_flow.end_turn",
    );
    const runnerContext = context([genericEndTurn], {
      resourceLifecycle: [
        {
          lifecycleId: "onr_v1_168_loan-from-chiba",
          sourceCardInstanceId: "loan-1",
          definitionId: "onr_v1_168_loan-from-chiba",
          phase: "leave_play",
          actionIds: [genericEndTurn.actionId],
          priorityClass: "P5",
          value: 2,
          evidenceCodes: [
            "runner_loan_from_chiba_leave_avoids_visible_long_horizon_liability:12",
          ],
        },
      ],
    });
    const [proposal] = lifecycle.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(proposal).toMatchObject({
      initialViability: "blocked",
      blockers: [{ code: "resource_lifecycle_leave_play" }],
    });
    expect(
      lifecycle
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([]);
  });

  it("raises a terminal installed-agenda conversion to P1", () => {
    const score = coreModule("runner.score_installed_agenda");
    const runnerContext = context(
      [
        candidate(
          "score-terminal-theorem",
          "activated_card_ability",
          "agenda.score_installed",
          "onr_classic_004_theorem-proof",
        ),
      ],
      {
        installedAgendaScores: [
          {
            opportunityId: "terminal-theorem",
            sourceCardInstanceId: "terminal-theorem",
            actionIds: ["score-terminal-theorem"],
            agendaPoints: 3,
            terminal: true,
            evidenceCode: "runner_installed_agenda_score_conversion",
          },
        ],
      },
    );
    const [proposal] = score.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const planAssessment = score.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );

    expect(proposal).toMatchObject({
      executionClass: "urgent_response",
      initialViability: "ready",
    });
    expect(planAssessment.priorityClaim).toMatchObject({
      requestedClass: "P1",
      reasonCode: "terminal_win",
    });
  });

  it("never lets a non-breaker satisfy exact coverage", () => {
    const installPsychic = candidate(
      "install-psychic",
      "install_card",
      "install.card",
      "onr_classic_030_psychic-friend",
    );
    const installResource = candidate(
      "install-resource",
      "install_card",
      "install.card",
      "runner_resource",
    );
    const module = coreModule("runner.rig_and_coverage", (definitionId) =>
      definitionId.includes("psychic")
        ? ["breaker_code_gate"]
        : ["runner_resource"],
    );
    const runnerContext = context([installPsychic, installResource], {
      coverageGaps: [
        {
          gapId: "code-gate",
          requiredRole: "breaker_code_gate",
          priorityClass: "P5",
          evidenceCode: "visible_code_gate",
          deckHasAnswer: true,
          answerInHand: false,
          fundingActionIds: [],
          directSearchActionIds: [],
          searchEngineSetupActionIds: [],
          drawForAnswerActionIds: [],
        },
      ],
    });
    const proposal = module.discover(runnerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["install-psychic"]);
    expect(materialized.candidates[0]?.sourceRoles).toContain(
      "breaker_code_gate",
    );
  });

  it.each([
    ["breaker_sentry", "breaker_killer"],
    ["breaker_code_gate", "breaker_decoder"],
    ["breaker_wall", "breaker_fracter"],
  ] as const)(
    "maps canonical %s coverage to the concrete card role %s",
    (requiredRole, cardRole) => {
      const install = candidate(
        `install-${cardRole}`,
        "install_card",
        "install.card",
        `card-${cardRole}`,
      );
      const module = coreModule("runner.rig_and_coverage", () => [cardRole]);
      const runnerContext = context([install], {
        coverageGaps: [
          {
            gapId: requiredRole,
            requiredRole,
            priorityClass: "P4",
            evidenceCode: "test_coverage_alias",
            deckHasAnswer: true,
            answerInHand: false,
            fundingActionIds: [],
            directSearchActionIds: [],
            searchEngineSetupActionIds: [],
            drawForAnswerActionIds: [],
          },
        ],
      });
      const proposal = module.discover(runnerContext)[0]!;
      const instance = instantiatePlanProposal(proposal, 10);

      expect(
        module
          .materialize(instance, {} as never, runnerContext)
          .candidates.map((entry) => entry.candidate.actionId),
      ).toEqual([`install-${cardRole}`]);
    },
  );

  it("does not create a second Psychic Friend route after the gap is gone", () => {
    const module = coreModule("runner.rig_and_coverage", () => [
      "breaker_code_gate",
    ]);
    const proposals = module.discover(
      context(
        [
          candidate(
            "install-second-psychic",
            "install_card",
            "install.card",
            "onr_classic_030_psychic-friend",
          ),
        ],
        { coverageGaps: [] },
      ),
    );

    expect(proposals).toEqual([]);
  });

  it("ends the bound economy plan when its concrete gap is satisfied", () => {
    const economy = coreModule("runner.economy");
    const open = economy.discover(
      context([candidate("credit")], {
        fundingNeeds: [
          {
            kind: "parent_plan_support",
            ...fundingRouteContract("credit"),
            needId: "fund-run",
            parentPlanInstanceId:
              "plan:runner.contest_remote:remote%3Aremote_1",
            driver: {
              kind: "contest",
              targetId: "remote_1",
              reasonCode: "material_remote_contest",
            },
            targetCredits: 4,
            currentCreditsAtRevalidation: 1,
            gap: 3,
            priorityClass: "P4",
            revalidation: {
              stateVersion: 10,
              status: "material_parent_open",
            },
            evidenceCode: "run_needs_credits",
          },
        ],
      }),
    );
    const satisfied = economy.discover(
      context([candidate("credit")], {
        fundingNeeds: [
          {
            kind: "parent_plan_support",
            ...fundingRouteContract("credit"),
            needId: "fund-run",
            parentPlanInstanceId:
              "plan:runner.contest_remote:remote%3Aremote_1",
            driver: {
              kind: "contest",
              targetId: "remote_1",
              reasonCode: "material_remote_contest",
            },
            targetCredits: 4,
            currentCreditsAtRevalidation: 4,
            gap: 0,
            priorityClass: "P4",
            revalidation: {
              stateVersion: 10,
              status: "material_parent_open",
            },
            evidenceCode: "run_funded",
          },
        ],
      }),
    );

    expect(open).toHaveLength(1);
    expect(open[0]?.retentionPolicy.abandonWhenTargetMissing).toBe(true);
    expect(satisfied).toEqual([]);
  });

  it("blocks an autonomous P5 economy request without an exact parent", () => {
    const economy = coreModule("runner.economy");
    const [proposal] = economy.discover(
      context([candidate("credit")], {
        fundingNeeds: [
          {
            kind: "parent_plan_support",
            ...fundingRouteContract("credit"),
            needId: "orphaned-reserve",
            parentPlanInstanceId: "",
            driver: {
              kind: "contest",
              targetId: "remote_1",
              reasonCode: "raw_remote_scan",
            },
            targetCredits: 10,
            currentCreditsAtRevalidation: 4,
            gap: 6,
            priorityClass: "P5",
            revalidation: {
              stateVersion: 10,
              status: "material_parent_open",
            },
            evidenceCode: "raw_remote_runway",
          },
        ],
      }),
    );

    expect(proposal).toMatchObject({
      initialViability: "blocked",
      blockers: [{ code: "orphaned_funding_need" }],
    });
  });

  it("executes parent-bound funding only while the exact parent stays material", () => {
    const economy = coreModule("runner.economy");
    const parentPlanInstanceId = "plan:runner.contest_remote:remote%3Aremote_1";
    const runnerContext = context([candidate("credit")], {
      fundingNeeds: [
        {
          kind: "parent_plan_support",
          ...fundingRouteContract("credit"),
          needId: "fund-remote-1",
          parentPlanInstanceId,
          driver: {
            kind: "contest",
            targetId: "remote_1",
            reasonCode: "admitted_remote_contest",
          },
          targetCredits: 7,
          currentCreditsAtRevalidation: 4,
          gap: 3,
          priorityClass: "P4",
          revalidation: {
            stateVersion: 10,
            status: "material_parent_open",
          },
          evidenceCode: "fund_material_remote",
        },
      ],
    });
    const [proposal] = economy.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    expect(proposal).toMatchObject({
      parentInstanceId: parentPlanInstanceId,
      parentNeedId: "fund-remote-1",
    });
    expect(instance).toMatchObject({
      parentInstanceId: parentPlanInstanceId,
      parentNeedId: "fund-remote-1",
    });
    const readyParent = structuredClone(instance);
    readyParent.instanceId = parentPlanInstanceId;
    readyParent.moduleId = "runner.contest_remote";
    readyParent.dedupeKey = "remote:remote_1";
    delete readyParent.parentInstanceId;
    readyParent.moduleState = {
      kind: "remote_contest",
      signal: {
        supportNeedId: "fund-remote-1",
        marginalValue: 120,
      },
    };
    readyParent.blockers = [];
    readyParent.viability = "ready";
    const readyPortfolio = emptyPortfolio();
    readyPortfolio.instances = [readyParent, instance];

    expect(
      economy.assess(instance, runnerContext, readyPortfolio),
    ).toMatchObject({
      readiness: "executable_now",
    });

    const blockedPortfolio = structuredClone(readyPortfolio);
    blockedPortfolio.instances[0]!.viability = "ready";
    blockedPortfolio.instances[0]!.blockers = [
      {
        code: "target_no_longer_material",
        owner: "plan_module",
        removable: true,
        resumeCondition: { code: "target_material_again" },
      },
    ];
    expect(
      economy.assess(instance, runnerContext, blockedPortfolio),
    ).toMatchObject({
      readiness: "blocked",
      blockers: [{ code: "orphaned_funding_need" }],
    });

    const mismatchedSupportPortfolio = structuredClone(readyPortfolio);
    (
      mismatchedSupportPortfolio.instances[0]!.moduleState as {
        signal: { supportNeedId: string };
      }
    ).signal.supportNeedId = "different-need";
    expect(
      economy.assess(instance, runnerContext, mismatchedSupportPortfolio),
    ).toMatchObject({
      readiness: "blocked",
      blockers: [{ code: "orphaned_funding_need" }],
    });
  });

  it("removes parent support as soon as revalidation removes the material need", () => {
    const economy = coreModule("runner.economy");
    const [proposal] = economy.discover(
      context([candidate("credit")], {
        fundingNeeds: [
          {
            kind: "parent_plan_support",
            ...fundingRouteContract("credit"),
            needId: "fund-remote-1",
            parentPlanInstanceId:
              "plan:runner.contest_remote:remote%3Aremote_1",
            driver: {
              kind: "contest",
              targetId: "remote_1",
              reasonCode: "admitted_remote_contest",
            },
            targetCredits: 7,
            currentCreditsAtRevalidation: 4,
            gap: 3,
            priorityClass: "P4",
            revalidation: {
              stateVersion: 10,
              status: "material_parent_open",
            },
            evidenceCode: "fund_material_remote",
          },
        ],
      }),
    );
    const open = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 10,
      timingPoint: "runner_action.main",
      proposals: [proposal!],
    });
    const afterMaterialityLoss = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 11,
      timingPoint: "runner_action.main",
      proposals: [],
      previous: open,
    });

    expect(afterMaterialityLoss.instances).toEqual([]);
    expect(afterMaterialityLoss.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.economy:fund-remote-1",
          reason: "target_disappeared",
        }),
      ]),
    );
  });

  it("keeps a finite portfolio reserve autonomous only until its fixed target is reached", () => {
    const economy = coreModule("runner.economy");
    const runnerContext = context([candidate("credit")], {
      fundingNeeds: [
        {
          kind: "portfolio_reserve",
          ...fundingRouteContract("credit"),
          needId: "runner-portfolio-credit-reserve",
          targetCredits: 8,
          currentCreditsAtRevalidation: 4,
          gap: 4,
          priorityClass: "P6",
          revalidation: {
            stateVersion: 10,
            status: "portfolio_reserve_open",
          },
          evidenceCode: "runner_finite_portfolio_credit_reserve",
        },
      ],
    });
    const [proposal] = economy.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(proposal?.parentInstanceId).toBeUndefined();
    expect(proposal?.parentNeedId).toBeUndefined();
    expect(
      economy.assess(instance, runnerContext, emptyPortfolio()),
    ).toMatchObject({
      priorityClaim: { requestedClass: "P6" },
      readiness: "executable_now",
    });
  });

  it("develops exact basic-credit liquidity through a finite current-turn P6 plan", () => {
    const economy = coreModule("runner.economy");
    const credit = exactBasicCreditCandidate("basic-credit");
    const runnerContext = context([credit], {
      fundingNeeds: [turnLiquidityNeed(credit.actionId, 4, 3)],
    });
    const [proposal] = economy.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(proposal).toMatchObject({
      dedupeKey: "economy-liquidity-development:runner:1",
      initialViability: "ready",
    });
    expect(proposal?.parentInstanceId).toBeUndefined();
    expect(proposal?.parentNeedId).toBeUndefined();
    expect(
      economy.assess(instance, runnerContext, emptyPortfolio()),
    ).toMatchObject({
      priorityClaim: { requestedClass: "P6" },
      readiness: "executable_now",
    });
    expect(
      economy.materialize(instance, {} as never, runnerContext),
    ).toMatchObject({
      step: {
        purpose:
          "Develop one exact unit of unrestricted Runner liquidity with the current basic credit action.",
      },
      candidates: [
        {
          candidate: { actionId: credit.actionId },
          stepValue: 1,
        },
      ],
    });
    expect(turnLiquidityNeed(credit.actionId, 5, 2)).toMatchObject({
      needId: "economy-liquidity-development:runner:1",
      currentCreditsAtRevalidation: 5,
      targetCredits: 7,
      gap: 2,
      cadence: { maximumConversions: 2 },
    });
  });

  it("fails closed when the current-turn liquidity signal is stale or internally unbounded", () => {
    const economy = coreModule("runner.economy");
    const credit = exactBasicCreditCandidate("basic-credit");

    for (const invalidNeed of [
      {
        ...turnLiquidityNeed(credit.actionId, 4, 3),
        revalidation: {
          stateVersion: 9,
          status: "turn_liquidity_open" as const,
        },
      },
      {
        ...turnLiquidityNeed(credit.actionId, 4, 3),
        cadence: {
          kind: "remaining_turn_capacity" as const,
          maximumConversions: 4,
        },
      },
    ]) {
      const [proposal] = economy.discover(
        context([credit], { fundingNeeds: [invalidNeed] }),
      );
      expect(proposal).toMatchObject({
        initialViability: "blocked",
        blockers: [{ code: "invalid_turn_liquidity_revalidation" }],
      });
    }
  });

  it("does not materialize an unprojected or card-sourced action as basic liquidity", () => {
    const economy = coreModule("runner.economy");
    const unprojected = exactBasicCreditCandidate("unprojected-credit");
    delete unprojected.economyProjection;
    const cardCredit = exactBasicCreditCandidate("card-credit");
    cardCredit.sourceKind = "card";
    cardCredit.sourceDefinitionId = "test-card-credit";

    for (const rejected of [unprojected, cardCredit]) {
      const [proposal] = economy.discover(
        context([rejected], {
          fundingNeeds: [turnLiquidityNeed(rejected.actionId, 4, 1)],
        }),
      );
      expect(proposal).toMatchObject({
        initialViability: "blocked",
        blockers: [{ code: "no_compatible_credit_route" }],
      });
    }
  });

  it("materializes only the exact head of the selected funding route", () => {
    const economy = coreModule("runner.economy");
    const runnerContext = context(
      [candidate("selected-credit"), candidate("other-credit")],
      {
        fundingNeeds: [
          {
            kind: "portfolio_reserve",
            ...fundingRouteContract("selected-credit"),
            needId: "runner-portfolio-credit-reserve",
            targetCredits: 8,
            currentCreditsAtRevalidation: 4,
            gap: 4,
            priorityClass: "P6",
            revalidation: {
              stateVersion: 10,
              status: "portfolio_reserve_open",
            },
            evidenceCode: "runner_finite_portfolio_credit_reserve",
          },
        ],
      },
    );
    const [proposal] = economy.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(
      economy
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["selected-credit"]);
  });

  it("rejects a delegated funding action without a complete liquid projection", () => {
    const unprojected = candidate("unprojected-credit");
    delete unprojected.economyProjection;
    const economy = coreModule("runner.economy");
    const [proposal] = economy.discover(
      context([unprojected], {
        fundingNeeds: [
          {
            kind: "portfolio_reserve",
            ...fundingRouteContract("unprojected-credit"),
            needId: "runner-portfolio-credit-reserve",
            targetCredits: 8,
            currentCreditsAtRevalidation: 4,
            gap: 4,
            priorityClass: "P6",
            revalidation: {
              stateVersion: 10,
              status: "portfolio_reserve_open",
            },
            evidenceCode: "runner_finite_portfolio_credit_reserve",
          },
        ],
      }),
    );

    expect(proposal).toMatchObject({
      initialViability: "blocked",
      blockers: [{ code: "no_compatible_credit_route" }],
    });
  });

  it("materializes a composite card action when the exact route delegates it", () => {
    const composite = candidate(
      "composite-draw-credit",
      "play_event",
      "draw.card",
      "test-composite-economy",
    );
    composite.economyProjection =
      candidate("projection-source").economyProjection!;
    const economy = coreModule("runner.economy");
    const runnerContext = context([composite], {
      fundingNeeds: [
        {
          kind: "portfolio_reserve",
          ...fundingRouteContract(composite.actionId),
          needId: "runner-portfolio-credit-reserve",
          targetCredits: 5,
          currentCreditsAtRevalidation: 4,
          gap: 1,
          priorityClass: "P6",
          revalidation: {
            stateVersion: 10,
            status: "portfolio_reserve_open",
          },
          evidenceCode: "runner_finite_portfolio_credit_reserve",
        },
      ],
    });
    const [proposal] = economy.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const materialized = economy.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([composite.actionId]);
    expect(materialized.step.capability.semanticActionTypes).toEqual([
      "draw.card",
    ]);
  });

  it("does not claim a composite card action without exact delegation", () => {
    const composite = candidate(
      "composite-draw-credit",
      "play_event",
      "draw.card",
      "test-composite-economy",
    );
    composite.economyProjection =
      candidate("projection-source").economyProjection!;
    const selectedCredit = candidate("selected-credit");
    const economy = coreModule("runner.economy");
    const runnerContext = context([composite, selectedCredit], {
      fundingNeeds: [
        {
          kind: "portfolio_reserve",
          ...fundingRouteContract(selectedCredit.actionId),
          needId: "runner-portfolio-credit-reserve",
          targetCredits: 5,
          currentCreditsAtRevalidation: 4,
          gap: 1,
          priorityClass: "P6",
          revalidation: {
            stateVersion: 10,
            status: "portfolio_reserve_open",
          },
          evidenceCode: "runner_finite_portfolio_credit_reserve",
        },
      ],
    });
    const [proposal] = economy.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(
      economy
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([selectedCredit.actionId]);
  });

  it("blocks coverage rather than drawing when draw is not a valid route", () => {
    const coverage = coreModule("runner.rig_and_coverage");
    const [proposal] = coverage.discover(
      context([candidate("draw", "draw_card", "draw.card")], {
        coverageGaps: [
          {
            gapId: "sentry",
            requiredRole: "breaker_sentry",
            priorityClass: "P5",
            evidenceCode: "missing_sentry",
            deckHasAnswer: true,
            answerInHand: false,
            fundingActionIds: [],
            directSearchActionIds: [],
            searchEngineSetupActionIds: [],
            drawForAnswerActionIds: [],
          },
        ],
        defense: { drawAllowed: false },
      }),
    );

    expect(proposal).toMatchObject({
      initialViability: "blocked",
      blockers: [{ code: "no_exact_coverage_route" }],
    });
  });

  it("materializes an exact AP search route for special coverage", () => {
    const coverage = coreModule("runner.rig_and_coverage");
    const search = candidate(
      "search-ap",
      "activated_card_ability",
      "card_ability.trigger",
      "runner-special-search",
    );
    const runnerContext = context([search], {
      coverageGaps: [
        {
          gapId: "special:ap",
          requiredRole: "breaker_ap",
          targetServerId: "remote_1",
          priorityClass: "P4",
          evidenceCode: "missing_special_ap_coverage",
          deckHasAnswer: true,
          answerInHand: false,
          fundingActionIds: [],
          directSearchActionIds: ["search-ap"],
          searchEngineSetupActionIds: [],
          drawForAnswerActionIds: [],
        },
      ],
    });
    const [proposal] = coverage.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const materialized = coverage.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(instance.phase).toBe("search_answer");
    expect(materialized.step.capability.capabilityId).toBe(
      "search_answer_breaker_ap",
    );
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["search-ap"]);
  });

  it("keeps an explicitly nonproductive search-engine install out of the coverage route", () => {
    const coverage = coreModule("runner.rig_and_coverage");
    const directInstall = candidate(
      "install-smc-direct",
      "install_card",
      "install.card",
      "onr_v1_059_self-modifying-code",
    );
    const trashInstall = candidate(
      "install-smc-trash.runner_program_trash_before_install",
      "install_card",
      "install.card",
      "onr_v1_059_self-modifying-code",
    );
    const runnerContext = context([directInstall, trashInstall], {
      coverageGaps: [
        {
          gapId: "wall",
          requiredRole: "breaker_wall",
          priorityClass: "P5",
          evidenceCode: "deck_strategy_open_wall_coverage",
          deckHasAnswer: true,
          answerInHand: false,
          fundingActionIds: [],
          directSearchActionIds: [],
          searchEngineSetupActionIds: [
            directInstall.actionId,
            trashInstall.actionId,
          ],
          drawForAnswerActionIds: [],
        },
      ],
    });
    runnerContext.actionDispositions = [
      {
        actionId: trashInstall.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode:
          "runner_program_trash_install_unneeded_direct_install_available",
      },
    ];
    const [proposal] = coverage.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);

    expect(instance.phase).toBe("setup_search_engine");
    expect(
      coverage
        .materialize(instance, {} as never, runnerContext)
        .candidates.map((entry) => entry.candidate.actionId),
    ).toEqual([directInstall.actionId]);
  });

  it("funds a visible in-hand breaker instead of drawing for another answer", () => {
    const coverage = coreModule("runner.rig_and_coverage");
    const runnerContext = context(
      [candidate("draw", "draw_card", "draw.card"), candidate("gain-credit")],
      {
        coverageGaps: [
          {
            gapId: "wall",
            requiredRole: "breaker_wall",
            priorityClass: "P4",
            evidenceCode: "visible_wall",
            deckHasAnswer: true,
            answerInHand: true,
            answerInstallCost: 6,
            fundingGap: 5,
            fundingActionIds: ["gain-credit"],
            directSearchActionIds: [],
            searchEngineSetupActionIds: [],
            drawForAnswerActionIds: [],
          },
        ],
      },
    );
    const [proposal] = coverage.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const materialized = coverage.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(instance.phase).toBe("fund_answer");
    expect(materialized.step.capability.capabilityId).toBe(
      "fund_install_breaker_wall",
    );
    expect(
      materialized.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["gain-credit"]);
  });

  it("prioritizes pending damage, tags, persistent hazard counters, then hand buffer internally", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const prevention = candidate(
      "prevent",
      "activated_card_ability",
      "damage.prevent_net",
    );
    const clearTag = candidate("clear", "remove_tag", "tag.remove");
    const clearHazardCounter = candidate(
      "clear-mastiff-counter",
      "trigger_ability",
      "counter.remove_runner_hazard",
    );
    const draw = candidate("draw", "draw_card", "draw.card");
    const [damage] = defense.discover(
      context([prevention, clearTag, draw], {
        defense: {
          pendingDamage: 2,
          damagePreventionNeeded: true,
          activeTags: 1,
          visibleTagPunish: true,
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
          forgoUnsafeRunCapacity: false,
        },
      }),
    );
    const [tags] = defense.discover(
      context([clearTag, draw], {
        defense: {
          activeTags: 1,
          visibleTagPunish: true,
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
          forgoUnsafeRunCapacity: false,
        },
      }),
    );
    const [buffer] = defense.discover(
      context([draw], {
        defense: {
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
          forgoUnsafeRunCapacity: false,
        },
      }),
    );
    const [traceCounter] = defense.discover(
      context([clearHazardCounter, draw], {
        defense: {
          persistentHazardCounterRemovalAvailable: true,
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
          forgoUnsafeRunCapacity: false,
        },
      }),
    );

    expect(damage?.phase).toBe("prevent_damage");
    expect(tags?.phase).toBe("clear_tags");
    expect(traceCounter?.phase).toBe("clear_persistent_hazard_counter");
    expect(traceCounter?.executionClass).toBe("urgent_response");
    expect(buffer?.phase).toBe("build_hand_buffer");
  });

  it("uses a structured top-heap recovery action to build the required hand buffer", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const recovery = {
      ...candidate(
        "recover-top-heap",
        "activated_card_ability",
        "card_ability.unknown",
        "recovery-resource",
      ),
      effectTargets: ["setup.top_trash_recovery"],
      actionTacticSignals: ["setup.search"],
    };
    const runnerContext = context([recovery], {
      defense: {
        handSize: 1,
        minimumHandBuffer: 3,
        drawAllowed: false,
        handBufferActionIds: [recovery.actionId],
      },
    });
    const [proposal] = defense.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const planAssessment = defense.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );
    const route = defense.materialize(
      instance,
      planAssessment as never,
      runnerContext,
    );

    expect(proposal?.phase).toBe("build_hand_buffer");
    expect(route.step.capability.capabilityId).toBe(
      "build_required_hand_buffer",
    );
    expect(route.candidates.map((entry) => entry.candidate.actionId)).toEqual([
      recovery.actionId,
    ]);
  });

  it("continues with an actionable hand buffer when tag removal is currently blocked", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const draw = candidate("draw", "draw_card", "draw.card");
    const [proposal] = defense.discover(
      context([draw], {
        defense: {
          activeTags: 1,
          visibleTagPunish: true,
          handSize: 1,
          minimumHandBuffer: 5,
          drawAllowed: true,
          forgoUnsafeRunCapacity: false,
        },
      }),
    );

    expect(proposal).toMatchObject({
      initialViability: "ready",
      phase: "build_hand_buffer",
      moduleState: {
        signals: {
          activeTags: 1,
          minimumHandBuffer: 5,
        },
      },
    });
  });

  it("builds an explicit last-click reaction reserve under confirmed damage pressure", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const gainCredit = candidate("gain-reaction-credit");
    const runnerContext = context([gainCredit], {
      defense: {
        reactionReserveNeed: {
          needId: "runner-defense-reaction-reserve",
          parentPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          targetCredits: 10,
          currentCreditsAtRevalidation: 4,
          gap: 6,
          actionIds: ["gain-reaction-credit"],
          revalidation: {
            stateVersion: 10,
            status: "defense_parent_open",
          },
          evidenceCode: "runner_damage_locked_hand_reaction_reserve",
        },
      },
    });
    const [proposal] = defense.discover(runnerContext);
    const instance = instantiatePlanProposal(proposal!, 10);
    const planAssessment = defense.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );
    const route = defense.materialize(
      instance,
      planAssessment as never,
      runnerContext,
    );

    expect(proposal).toMatchObject({
      phase: "build_reaction_reserve",
      executionClass: "bounded_sequence",
      initialViability: "ready",
    });
    expect(planAssessment.priorityClaim.requestedClass).toBe("P3");
    expect(route.step.capability.capabilityId).toBe(
      "build_damage_reaction_reserve",
    );
    expect(route.candidates.map((entry) => entry.candidate.actionId)).toEqual([
      "gain-reaction-credit",
    ]);
  });

  it("fails closed when the defense funding need is stale or arithmetically incomplete", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const gainCredit = candidate("gain-reaction-credit");
    const [proposal] = defense.discover(
      context([gainCredit], {
        defense: {
          reactionReserveNeed: {
            needId: "runner-defense-reaction-reserve",
            parentPlanInstanceId: "plan:runner.defense_and_recovery:runner",
            targetCredits: 10,
            currentCreditsAtRevalidation: 4,
            gap: 5,
            actionIds: ["gain-reaction-credit"],
            revalidation: {
              stateVersion: 9,
              status: "defense_parent_open",
            },
            evidenceCode: "runner_damage_locked_hand_reaction_reserve",
          },
        },
      }),
    );

    expect(proposal).toMatchObject({
      phase: "build_reaction_reserve",
      initialViability: "blocked",
      blockers: [{ code: "invalid_reaction_reserve_need" }],
    });
  });

  it("forgoes restricted run capacity when the required hand buffer cannot be built", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const endTurn = candidate(
      "runner.end_turn",
      "end_turn",
      "turn_flow.end_turn",
    );
    endTurn.sourceKind = "game_rule";
    const run = candidate("runner.run.rd", "start_run", "run.start");
    const runnerContext = context([run, endTurn], {
      defense: {
        pendingDamage: 1,
        handSize: 2,
        minimumHandBuffer: 3,
        drawAllowed: false,
        forgoUnsafeRunCapacity: true,
      },
    });
    const [proposal] = defense.discover(runnerContext);
    expect(proposal).toMatchObject({
      initialViability: "ready",
      phase: "forgo_unsafe_run",
    });
    const instance = instantiatePlanProposal(proposal!, 10);
    const assessment = defense.assess(
      instance,
      runnerContext,
      emptyPortfolio(),
    );
    const materialization = defense.materialize(
      instance,
      assessment as never,
      runnerContext,
    );
    expect(
      materialization.candidates.map((entry) => entry.candidate.actionId),
    ).toEqual(["runner.end_turn"]);
    expect(materialization.earlyEndTurnJustification).toEqual({
      kind: "forgo_restricted_capacity",
      capacityKind: "zero_click_non_basic_run_only",
      explicitlyNonproductiveActionIds: ["runner.run.rd"],
    });
  });

  it("admits card-specific development only with a concrete feasible purpose", () => {
    expect(
      runnerDevelopmentCardAdmission({
        definitionId: "special-card",
        assignedDomainPlanIds: [],
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
      }),
    ).toEqual({ admitted: false, reasonCode: "no_concrete_plan_purpose" });
    expect(
      runnerDevelopmentCardAdmission({
        definitionId: "special-card",
        assignedDomainPlanIds: ["runner.pressure_central"],
        concretePurposeCode: "increase_rnd_access",
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
      }),
    ).toEqual({
      admitted: false,
      reasonCode:
        "assigned_domain_requires_domain_owner:runner.pressure_central",
    });
    expect(
      runnerDevelopmentCardAdmission({
        definitionId: "special-card",
        assignedDomainPlanIds: [],
        concretePurposeCode: "unlock_recurring_draw",
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
      }),
    ).toMatchObject({ admitted: true });
  });
});

function coreModule(
  moduleId: string,
  rolesForDefinitionId?: (definitionId: string) => readonly string[],
) {
  return createRunnerCorePlanModules(
    rolesForDefinitionId ? { rolesForDefinitionId } : {},
  ).find((module) => module.moduleId === moduleId)!;
}

function emptyPortfolio(): ResidentPlanPortfolio {
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion: 10,
    instances: [],
    completionHistory: [],
    transitions: [],
  };
}

function context(
  actionCandidates: ActionSemanticCandidate[],
  overrides: {
    fundingNeeds?: RunnerCorePlanDomain["fundingNeeds"];
    coverageGaps?: RunnerCorePlanDomain["coverageGaps"];
    creditBanks?: RunnerCorePlanDomain["creditBanks"];
    installedAgendaScores?: RunnerCorePlanDomain["installedAgendaScores"];
    resourceLifecycle?: RunnerCorePlanDomain["resourceLifecycle"];
    shellTradersPipelines?: RunnerCorePlanDomain["shellTradersPipelines"];
    defense?: Partial<RunnerCorePlanDomain["defense"]>;
  },
): PlanSchedulerContext {
  const domain: RunnerCorePlanDomain = {
    fundingNeeds: overrides.fundingNeeds ?? [],
    coverageGaps: overrides.coverageGaps ?? [],
    creditBanks: overrides.creditBanks ?? [],
    installedAgendaScores: overrides.installedAgendaScores ?? [],
    resourceLifecycle: overrides.resourceLifecycle ?? [],
    shellTradersPipelines: overrides.shellTradersPipelines ?? [],
    defense: {
      activeTags: 0,
      visibleTagPunish: false,
      persistentHazardCounterRemovalAvailable: false,
      pendingDamage: 0,
      damagePreventionNeeded: false,
      handSize: 5,
      minimumHandBuffer: 3,
      drawAllowed: true,
      handBufferActionIds: actionCandidates
        .filter((candidate) => candidate.semanticActionType === "draw.card")
        .map((candidate) => candidate.actionId),
      forgoUnsafeRunCapacity: false,
      handBufferPriorityClass: "P5",
      evidenceCodes: [],
      ...overrides.defense,
    },
  };
  return {
    input: {
      side: "runner",
      legalActions: actionCandidates.map((value) => ({
        actionId: value.actionId,
        type: value.actionType,
      })),
      playerView: { stateVersion: 10, timingPoint: "runner_action.main" },
    } as unknown as AiDecisionInput,
    actionCandidates,
    turnKey: "runner:1",
    domain,
  };
}

function candidate(
  actionId: string,
  actionType = "gain_credit",
  semanticActionType = "economy.gain_credit",
  sourceDefinitionId?: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "runner",
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    stateVersion: 10,
    sourceKind: sourceDefinitionId ? "card" : "basic_action",
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    abilityBindingMethod: "unresolved",
    semanticActionType,
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 10,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...(semanticActionType === "economy.gain_credit"
      ? {
          economyProjection: {
            schemaVersion: "action-economy-projection-v1",
            kind: "immediate_liquid",
            timing: "immediate",
            creditRestriction: "general",
            clickCost: 1,
            creditCost: 0,
            grossLiquidCreditGain: 1,
            netLiquidCreditGain: 1,
            cardsDrawn: 0,
            cardsConsumed: 0,
            netHandDelta: 0,
            payoutMode: "fixed",
            repeatable: true,
            reliability: "guaranteed",
            source: "basic_action_contract",
            confidence: "high",
            evidence: ["test_immediate_liquid_credit"],
          } as const,
        }
      : {}),
  };
}

function exactBasicCreditCandidate(actionId: string): ActionSemanticCandidate {
  const value = candidate(actionId);
  value.costProfile.clickCost = 1;
  value.costProfile.creditCost = 0;
  value.economyProjection = {
    ...value.economyProjection!,
    source: "basic_action_contract",
    confidence: "medium",
  };
  return value;
}

function turnLiquidityNeed(
  actionId: string,
  currentCredits: number,
  remainingClicks: number,
): Extract<
  RunnerCorePlanDomain["fundingNeeds"][number],
  { kind: "develop_liquidity" }
> {
  return {
    kind: "develop_liquidity",
    needId: "economy-liquidity-development:runner:1",
    actionIds: [actionId],
    currentCreditsAtRevalidation: currentCredits,
    targetCredits: currentCredits + remainingClicks,
    gap: remainingClicks,
    projectedCreditGain: 1,
    priorityClass: "P6",
    cadence: {
      kind: "remaining_turn_capacity",
      maximumConversions: remainingClicks,
    },
    completion: {
      kind: "target_credits_or_no_clicks",
    },
    revalidation: {
      stateVersion: 10,
      status: "turn_liquidity_open",
    },
    evidenceCode: "runner_engine_certified_basic_liquidity_development",
  };
}

function fundingRouteContract(actionId: string) {
  return {
    routeActionIds: [actionId],
    routeAssessment: {
      stateVersion: 10,
      routeId: `test-route:${actionId}`,
      status: "covered_guaranteed" as const,
      reliability: "guaranteed" as const,
      horizon: "same_turn" as const,
      projectedGap: 0,
      totalClickCost: 1,
      firstStepActionId: actionId,
      evidenceCodes: [`test_route_head:${actionId}`],
    },
  };
}
