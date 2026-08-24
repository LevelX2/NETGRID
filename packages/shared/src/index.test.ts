import { describe, expect, it } from "vitest";
import { CURRENT_RULES_BASELINE } from "./baselines";
import { ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS } from "./ability-payload";
import { CORE_DEMO_DECK_IDS } from "./demo-fixtures";
import { DEMO_DECKS } from "./demo-decks";
import {
  DEMO_DECK_IDS,
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
  AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  PUBLIC_COUNTER_MUTATION_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE as INDEX_CURRENT_RULES_BASELINE,
  DEMO_DECKS as INDEX_DEMO_DECKS,
  ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS as INDEX_ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
  type PublicCounterMutation,
  type PublicEventPayload,
  sanitizeAiDecisionDebug,
} from "./index";

describe("current ability payload discriminator registry", () => {
  it("covers current runtime discriminator families without dead v1919 aliases", () => {
    expect(ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS).toEqual(
      expect.arrayContaining([
        "v1911HiddenZoneAbility",
        "v1917AssetAbility",
        "v1919OperationAbility",
        "v1922RunnerEventAbility",
        "v1922CorpOperationAbility",
        "agendaAbility",
        "resourceAbility",
      ]),
    );
    expect(ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS).not.toContain(
      "v1919AssetAbility",
    );
    expect(ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS).not.toContain(
      "v1919UpgradeAbility",
    );
    expect(new Set(ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS).size).toBe(
      ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS.length,
    );
    expect(INDEX_ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS).toBe(
      ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
    );
  });
});

describe("demo deck fixture registry", () => {
  it("groups current demos separately from legacy fixture decks", () => {
    expect(CORE_DEMO_DECK_IDS).toEqual([
      "demo_runner_001",
      "demo_corp_001",
      "demo_runner_004",
      "demo_corp_004",
      "demo_runner_008",
      "demo_corp_008",
    ]);
    expect(DEMO_DECK_IDS).toEqual(CORE_DEMO_DECK_IDS);
    expect(Object.keys(DEMO_DECKS).sort()).toEqual([...DEMO_DECK_IDS].sort());
    expect(INDEX_DEMO_DECKS).toBe(DEMO_DECKS);
  });
});

describe("rules baseline registry", () => {
  it("keeps the current rules baseline in a dedicated shared module and re-exports it", () => {
    expect(CURRENT_RULES_BASELINE.cardTextSnapshotId).toBe("mvp-0.99-demo");
    expect(CURRENT_RULES_BASELINE.simulationSchemaVersion).toBe("0.99.0");
    expect(INDEX_CURRENT_RULES_BASELINE).toBe(CURRENT_RULES_BASELINE);
  });
});

describe("Engine-randomized ICE install selection schema", () => {
  it("keeps the replayable actor-private contract explicitly versioned", () => {
    expect(ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION).toBe(
      "engine-randomized-ice-install-selection-v1",
    );
  });
});

describe("public counter mutation contract", () => {
  it("keeps aggregate before, change and remaining values at an exact side-safe scope", () => {
    const mutation = {
      schemaVersion: PUBLIC_COUNTER_MUTATION_SCHEMA_VERSION,
      operation: "remove",
      counterType: "spy",
      scope: { kind: "server", serverId: "remote_1" },
      before: 2,
      amount: 1,
      after: 1,
    } satisfies PublicCounterMutation;
    const payload = {
      effectKind: "counter_change",
      counterMutations: [mutation],
    } satisfies PublicEventPayload;

    expect(PUBLIC_COUNTER_MUTATION_SCHEMA_VERSION).toBe(
      "public-counter-mutation-v1",
    );
    expect(payload.counterMutations).toEqual([
      expect.objectContaining({
        operation: "remove",
        scope: { kind: "server", serverId: "remote_1" },
        before: 2,
        amount: 1,
        after: 1,
      }),
    ]);
  });

  it("uses a position anchor instead of a private Corp instance id", () => {
    const mutation = {
      schemaVersion: PUBLIC_COUNTER_MUTATION_SCHEMA_VERSION,
      operation: "set",
      counterType: "power",
      scope: {
        kind: "installed_corp_card",
        serverId: "remote_2",
        area: "ice",
        positionKey: "ice:1",
      },
      before: 3,
      amount: 1,
      after: 2,
    } satisfies PublicCounterMutation;

    expect(mutation.scope).toEqual({
      kind: "installed_corp_card",
      serverId: "remote_2",
      area: "ice",
      positionKey: "ice:1",
    });
    expect(mutation.scope).not.toHaveProperty("cardInstanceId");
  });
});

describe("AI decision debug sanitizing", () => {
  it("keeps enough detail sections for semantic precision reports", () => {
    const detailSections = Array.from({ length: 16 }, (_, index) => ({
      id: `section_${index + 1}`,
      title: `Section ${index + 1}`,
      items: [`item_${index + 1}`],
    }));

    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections,
    });

    expect(sanitized?.detailSections).toHaveLength(16);
    expect(sanitized?.detailSections?.at(-1)?.id).toBe("section_16");
  });

  it("keeps extended detail section items for rich AI plan diagnostics", () => {
    const items = Array.from(
      { length: 160 },
      (_, index) => `item_${index + 1}`,
    );

    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections: [{ id: "tactical_plan", title: "Tactical Plan", items }],
    });

    expect(sanitized?.detailSections?.[0]?.items).toHaveLength(160);
    expect(sanitized?.detailSections?.[0]?.items.at(-1)).toBe("item_160");
  });

  it("still bounds oversized detail section item payloads", () => {
    const items = Array.from(
      { length: 300 },
      (_, index) => `item_${index + 1}`,
    );

    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections: [{ id: "tactical_plan", title: "Tactical Plan", items }],
    });

    expect(sanitized?.detailSections?.[0]?.items).toHaveLength(256);
    expect(sanitized?.detailSections?.[0]?.items.at(-1)).toBe("item_256");
  });

  it("keeps action alternative raw scores distinct from display priority", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      actionAlternatives: [
        {
          rank: 1,
          actionId: "runner.gain_credit",
          actionType: "gain_credit",
          selected: true,
          score: 979,
          priority: 1229,
        },
      ],
    });

    expect(sanitized?.actionAlternatives?.[0]).toMatchObject({
      score: 979,
      priority: 1229,
    });
  });

  it("keeps the side-safe semantic decision chain and redacts forbidden values", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      decisionChain: {
        schemaVersion: "ai-decision-chain-debug-v1",
        legalActionCount: 2,
        legalActionIds: ["corp.gain_credit", "corp.install"],
        exclusions: [
          {
            actionId: "corp.install",
            key: "hidden-card",
          },
        ],
        rawScoreWinner: { actionId: "corp.gain_credit", score: 700 },
        priorityCandidates: [
          { route: "semantic_score", actionId: "corp.gain_credit" },
        ],
        initialSelection: {
          route: "semantic_score",
          actionId: "corp.gain_credit",
        },
        adjustments: [],
        finalSelection: {
          actionId: "corp.gain_credit",
          selectedOptionCount: 0,
        },
      },
    });

    expect(sanitized?.decisionChain).toMatchObject({
      schemaVersion: "ai-decision-chain-debug-v1",
      legalActionCount: 2,
      rawScoreWinner: { actionId: "corp.gain_credit", score: 700 },
      initialSelection: {
        route: "semantic_score",
        actionId: "corp.gain_credit",
      },
      finalSelection: {
        actionId: "corp.gain_credit",
        selectedOptionCount: 0,
      },
    });
    expect(sanitized?.decisionChain?.exclusions[0]?.key).toBe(
      "[redacted-debug-value]",
    );
  });

  it("keeps the structured side-safe plan-first authority contract", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
        stateVersion: 12,
        lane: "plan",
        selectionAuthority: "resident_plan_instance",
        rootPlanInstanceId: "plan:corp.score_agenda:general",
        leafExecutorInstanceId: "plan:corp.economy:score-material",
        executionOrigin: {
          rootPlanInstanceId: "plan:corp.score_agenda:general",
          leafPlanInstanceId: "plan:corp.economy:score-material",
          commitmentId: "commitment:corp:turn:4",
          side: "corp",
          windowKind: "main_action",
          windowId: "corp_action:12",
          stateVersion: 12,
          timingPoint: "corp_action",
        },
        selectedStep: {
          planInstanceId: "plan:corp.economy:score-material",
          stepId: "draw_score_material",
          parentInstanceId: "plan:corp.score_agenda:general",
          needId: "score-material:general",
          supportAssignmentId: "assignment:score-material",
        },
        selectedPlan: {
          instanceId: "plan:corp.economy:score-material",
          dedupeKey: "score-material:general",
          moduleId: "corp.economy",
          moduleVersion: "1",
          viability: "ready",
          portfolioRole: "foreground",
          executionState: "executor",
          persistencePolicy: "flexible_support",
          phase: "fund_parent_need",
          milestone: "open",
          parentInstanceId: "plan:corp.score_agenda:general",
          parentNeedId: "score-material:general",
          openNeedIds: [],
          blockers: [],
          evidenceCodes: ["engine_certified_draw_quote"],
        },
        priority: {
          requestedClass: "P5",
          effectiveClass: "P5",
          reasonCode: "required_parent_support",
          horizon: "current_turn",
          readiness: "executable_now",
          intentFit: "aligned",
          validationReasonCodes: ["priority_claim_accepted"],
          delegatedFromPlanInstanceId: "plan:corp.score_agenda:general",
          parentNeedId: "score-material:general",
        },
        route: {
          planInstanceId: "plan:corp.economy:score-material",
          stepId: "draw_score_material",
          capabilityId: "draw_card",
          purpose: "Satisfy the exact score-material need.",
          actionId: "corp.draw",
          actionType: "draw_card",
          semanticActionType: "economy.draw",
          stateVersion: 12,
        },
        strategicContext: {
          authority: "diagnostic_only",
          primaryStrategyId: "corp.remote_scoring",
          phase: "convert",
          intentFit: "aligned",
          signals: [],
        },
        engineQuoteEvidence: {
          status: "certified",
          evidenceCodes: ["engine_certified_draw_quote"],
        },
        assessmentEvidenceCodes: ["required_parent_support"],
        dispositions: [
          {
            actionId: "corp.install",
            disposition: "assessment_unknown",
            ownerModuleId: "corp.defend_servers",
            evidenceCode: "corp_install_quote_unknown",
          },
        ],
        portfolio: [],
        turnPlanning: {
          schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
          mode: "shadow",
          stateVersion: 12,
          sideSafePlanningFingerprint: "planning-state:test",
          planningRulesFingerprint: "planning-rules:test",
          turnKey: "corp:turn:4",
          heads: [
            {
              candidateId: "head:corp.draw",
              moduleId: "corp.economy",
              rootPlanInstanceId: "plan:corp.score_agenda:general",
              executorPlanInstanceId: "plan:corp.economy:score-material",
              actionId: "corp.draw",
              semanticActionType: "economy.draw",
              invocationKey: "invocation:test",
              witnessValid: true,
            },
          ],
          selectedLine: {
            lineId: "line:corp.draw",
            stopReason: "observation_boundary",
            projectedFrameKey: "projected-frame:test",
            cursor: { phaseIndex: 0, nodeIndex: 0 },
            phases: [
              {
                phaseId: "phase:score-material",
                rootPlanInstanceId: "plan:corp.score_agenda:general",
                rootModuleId: "corp.economy",
                rootProvenance: "admitted_support",
                entryFrameKey: "projected-frame:entry",
                completionCode: "observation_required",
                transitionKind: "observation_boundary",
                supportBindings: [
                  {
                    planInstanceId: "plan:corp.economy:score-material",
                    parentNeedId: "score-material:general",
                    assignmentId: "assignment:score-material",
                  },
                ],
                nodes: [
                  {
                    nodeId: "node:corp.draw",
                    semanticActionType: "economy.draw",
                    boundaryAfter: "private_observation",
                  },
                ],
              },
            ],
          },
          commitment: {
            commitmentId: "commitment:corp:turn:4",
            status: "active",
            cursor: {
              phaseIndex: 0,
              nodeIndex: 0,
              phaseId: "phase:score-material",
              nodeId: "node:corp.draw",
            },
            phaseEntry: {
              phaseId: "phase:score-material",
              status: "validated",
              reasonCode: "phase_entry_validated",
            },
            rematerialization: {
              status: "executable",
              actionId: "corp.draw",
              leaseId: "lease:corp.draw",
            },
            observationClass: "expected_progress",
            continuation: {
              status: "retained",
              previousCommitmentId: "commitment:corp:turn:3",
              previousOwnerRootPlanInstanceId:
                "plan:corp.score_agenda:general",
              intendedNextMilestoneId: "score-material-ready",
              boundaryKind: "plan_internal_continuation",
              nextCommitmentId: "commitment:corp:turn:4",
              evidenceCodes: ["same_root_continuation_line_rematerialized"],
            },
          },
          boundary: {
            kind: "private_observation",
            residualTurnValueBasis: "hand_quality_distribution",
            optionalityUnit: "hand_quality_band",
            optionalityMinimum: 0,
            optionalityMaximum: 1,
          },
          agendaComparison: {
            opportunityKey: "opening-rush:2:agenda-1:remote_1",
            selectedFamily: "combined_rush",
            selectionReason: "best_expected_value",
            randomizationEligible: false,
            lines: [
              {
                lineId: "line:combined",
                family: "combined_rush",
                actionCount: 3,
                agendaProgress: 55,
                defense: 25,
                economy: 0,
                risk: 10,
                worstCaseFloor: 58,
                expectedValue: 86,
              },
            ],
          },
          defenseComparison: {
            selectedLineId: "line:defense",
            lines: [
              {
                lineId: "line:defense",
                targetServerId: "rd",
                disposition: "fund_then_install",
                actionCount: 2,
                fundingGapBefore: 2,
                fundingGapAfter: 0,
                rezReadyAfterLine: true,
                bluffValue: 0,
                defenseValue: 18,
                economyValue: 8,
                totalValue: 26,
              },
            ],
            rejected: [
              {
                defenseId: "central-defense:hq",
                actionId: "install-hq",
                reasonCode: "productive_defense_install_available",
              },
            ],
          },
          campaigns: [
            {
              campaignId: "campaign:agenda:agenda-1:remote_1",
              kind: "opening_rush",
              status: "awaiting_opponent_outcome",
              rootPlanInstanceId: "plan:corp.score_agenda:general",
              moduleId: "corp.score_agenda",
              milestoneId: "agenda_installed",
              targetServerId: "remote_1",
              targetCardInstanceId: "agenda-1",
              openingRushOpportunityKey: "opening-rush:2:agenda-1:remote_1",
              requoteStatus: "awaiting_next_own_turn",
              requoteReasonCode: "campaign_waits_for_public_opponent_outcomes",
              reactionStatus: "paused",
              openReactionWindowKinds: ["trace"],
              reactionDeadline: "current_run_end",
              claimDisposition: "reserved",
              reactionReasonCode: "campaign_paused_for_public_reaction_windows",
              publicOutcomes: [
                {
                  outcomeId: "event-run:run_declared:campaign",
                  eventId: "event-run",
                  eventType: "start_run",
                  stateVersionAfter: 8,
                  kind: "run_declared",
                  milestoneId: "opponent_run_observed",
                  origin: "public_event",
                  targetServerId: "remote_1",
                  evidenceCode: "campaign_public_run",
                },
              ],
              evidenceCodes: ["campaign_status:awaiting_opponent_outcome"],
            },
          ],
          shadowComparison: {
            liveActionId: "corp.draw",
            shadowActionId: "corp.draw",
            shadowRootPlanInstanceId: "plan:corp.score_agenda:general",
            boundedBaselineActionId: "corp.gain-credit",
            agreement: true,
            comparisonClass: "two_step_changes_head",
            twoStepChangedHead: true,
          },
          coverage: {
            status: "pass",
            coveragePercent: 100,
            legalActionCount: 3,
            productiveActionCount: 2,
            explicitlyNonproductiveActionCount: 1,
            assessmentUnknownActionCount: 0,
            engineWindowActionCount: 0,
            missingActionCount: 0,
            conflictingActionCount: 0,
            issueCodes: [],
            missingActionIds: [],
            conflictingActionIds: [],
          },
          search: {
            headCount: 2,
            lineCount: 2,
            expandedNodeCount: 3,
            protectedPartitionCount: 1,
            conservativeBaselineCount: 1,
            maximumDepth: 2,
            maximumExpandedNodes: 64,
            maximumBranchesPerPartition: 16,
            maximumParetoLinesPerPartition: 4,
            selectedLineScalarValue: 42,
            selectedLineStepCount: 2,
          },
          consideredLines: [
            {
              lineId: "line:corp.draw",
              firstActionId: "corp.draw",
              rootPlanInstanceId: "plan:corp.score_agenda:general",
              stepCount: 2,
              scalarValue: 42,
              stopReason: "observation_boundary",
              violatedObligationCount: 0,
              steps: [
                {
                  candidateId: "head:corp.draw",
                  semanticActionType: "economy.draw",
                  rootPlanInstanceId: "plan:corp.score_agenda:general",
                  nextMilestoneId: "score-material-ready",
                  currentActionId: "corp.draw",
                },
              ],
              evaluationValues: { economy: 42 },
              evidenceCodes: ["score_material_needed"],
            },
          ],
          pruneEvents: [],
          evidenceCodes: ["turn_planning_projection_contract_only"],
        },
      },
    });

    expect(sanitized?.planFirstDecision).toMatchObject({
      schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
      lane: "plan",
      rootPlanInstanceId: "plan:corp.score_agenda:general",
      leafExecutorInstanceId: "plan:corp.economy:score-material",
      executionOrigin: {
        commitmentId: "commitment:corp:turn:4",
        side: "corp",
        windowKind: "main_action",
        stateVersion: 12,
      },
      selectedStep: {
        parentInstanceId: "plan:corp.score_agenda:general",
        needId: "score-material:general",
        supportAssignmentId: "assignment:score-material",
      },
      priority: {
        effectiveClass: "P5",
        parentNeedId: "score-material:general",
      },
      route: {
        actionId: "corp.draw",
        stepId: "draw_score_material",
      },
      strategicContext: { authority: "diagnostic_only" },
      dispositions: [
        expect.objectContaining({ disposition: "assessment_unknown" }),
      ],
      turnPlanning: expect.objectContaining({
        schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
        commitment: expect.objectContaining({
          commitmentId: "commitment:corp:turn:4",
          continuation: expect.objectContaining({
            status: "retained",
            boundaryKind: "plan_internal_continuation",
          }),
          phaseEntry: expect.objectContaining({ status: "validated" }),
          rematerialization: expect.objectContaining({
            status: "executable",
          }),
        }),
        selectedLine: expect.objectContaining({
          stopReason: "observation_boundary",
        }),
        heads: [
          expect.objectContaining({
            rootPlanInstanceId: "plan:corp.score_agenda:general",
            executorPlanInstanceId: "plan:corp.economy:score-material",
          }),
        ],
        shadowComparison: expect.objectContaining({
          liveActionId: "corp.draw",
          comparisonClass: "two_step_changes_head",
        }),
        coverage: expect.objectContaining({
          status: "pass",
          coveragePercent: 100,
        }),
        search: expect.objectContaining({
          maximumDepth: 2,
          selectedLineStepCount: 2,
        }),
        campaigns: [
          expect.objectContaining({
            kind: "opening_rush",
            status: "awaiting_opponent_outcome",
            requoteStatus: "awaiting_next_own_turn",
          }),
        ],
      }),
    });

    const cutover = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        selectionAuthority: "turn_plan_commitment",
        turnPlanning: {
          ...sanitized?.planFirstDecision?.turnPlanning,
          mode: "cutover",
        },
      },
    });
    expect(cutover?.planFirstDecision).toMatchObject({
      selectionAuthority: "turn_plan_commitment",
      turnPlanning: {
        mode: "cutover",
        commitment: {
          status: "active",
          rematerialization: { status: "executable" },
        },
      },
    });

    const malformedTurnPlanning = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        turnPlanning: {
          ...sanitized?.planFirstDecision?.turnPlanning,
          selectedLine: {
            ...sanitized?.planFirstDecision?.turnPlanning?.selectedLine,
            cursor: { phaseIndex: "zero", nodeIndex: 0 },
          },
        },
      },
    });
    expect(malformedTurnPlanning?.planFirstDecision).toBeUndefined();

    const untypedReplanReason = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        turnPlanning: {
          ...sanitized?.planFirstDecision?.turnPlanning,
          commitment: {
            ...sanitized?.planFirstDecision?.turnPlanning?.commitment,
            replanReason: "free_text_is_not_a_replan_contract",
          },
        },
      },
    });
    expect(untypedReplanReason?.planFirstDecision).toBeUndefined();

    const untypedShadowComparison = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        turnPlanning: {
          ...sanitized?.planFirstDecision?.turnPlanning,
          shadowComparison: {
            ...sanitized?.planFirstDecision?.turnPlanning?.shadowComparison,
            comparisonClass: "free_text_shadow_result",
          },
        },
      },
    });
    expect(untypedShadowComparison?.planFirstDecision).toBeUndefined();

    const untypedCampaignStatus = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        turnPlanning: {
          ...sanitized?.planFirstDecision?.turnPlanning,
          campaigns: [
            {
              ...sanitized?.planFirstDecision?.turnPlanning?.campaigns?.[0],
              status: "free_text_campaign_status",
            },
          ],
        },
      },
    });
    expect(untypedCampaignStatus?.planFirstDecision).toBeUndefined();

    const p6WithoutNarrowContract = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        priority: {
          ...sanitized?.planFirstDecision?.priority,
          requestedClass: "P6",
          effectiveClass: "P6",
        },
      },
    });
    expect(p6WithoutNarrowContract?.planFirstDecision).toBeUndefined();

    const unknownField = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        ...sanitized?.planFirstDecision,
        undeclaredDiagnostic: "must-not-cross-the-side-safe-contract",
      },
    });
    expect(unknownField?.planFirstDecision).toBeUndefined();
  });

  it("drops incomplete plan-first authority data instead of guessing fields", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planFirstDecision: {
        schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
        stateVersion: 12,
        lane: "plan",
        selectionAuthority: "resident_plan_instance",
        rootPlanInstanceId: "plan:corp.score_agenda:general",
        leafExecutorInstanceId: "plan:corp.economy:score-material",
        selectedPlan: {
          instanceId: "plan:corp.economy:score-material",
        },
        strategicContext: {
          authority: "diagnostic_only",
          signals: [],
        },
        engineQuoteEvidence: {
          status: "unknown",
          evidenceCodes: [],
        },
        assessmentEvidenceCodes: [],
        dispositions: [],
        portfolio: [],
      },
    });

    expect(sanitized?.planFirstDecision).toBeUndefined();
  });
});
