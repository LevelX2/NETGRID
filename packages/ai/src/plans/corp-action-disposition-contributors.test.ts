import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpPlanDomain } from "./corp-tactical-plan-modules";
import {
  collectCorpActionDispositions,
  type CorpActionDispositionContributorFacts,
} from "./corp-action-disposition-contributors";

describe("corp action disposition contributors", () => {
  it("keeps future recurring capacity with corp.economy before later fallbacks", () => {
    const input = {
      side: "corp",
      legalActions: [],
      playerView: {
        stateVersion: 12,
        timingPoint: "action",
        own: {
          credits: 0,
          clicks: 1,
          gripOrHq: [],
          maxHandSize: 5,
        },
        servers: [],
      },
    } as unknown as AiDecisionInput;
    const candidate = {
      actionId: "recurring-capacity",
      actionType: "play_operation",
      semanticActionType: "play.corp_operation",
      actionCapacityProjection: { kind: "future_recurring_gain" },
    } as unknown as ActionSemanticCandidate;

    expect(
      collectCorpActionDispositions(
        input,
        [candidate],
        emptyDomain(),
        contributorFacts(),
      ),
    ).toEqual([
      {
        actionId: "recurring-capacity",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.economy",
        evidenceCode:
          "corp_future_recurring_action_capacity_has_no_bound_parent_plan",
      },
    ]);
  });
});

function emptyDomain(): CorpPlanDomain {
  return {
    scoreProjects: [],
    remoteProjects: [],
    defenseNeeds: [],
    economyNeeds: [],
    virusPressure: [],
    punishCampaigns: [],
    ambushes: [],
    handManagement: [],
  };
}

function contributorFacts(): CorpActionDispositionContributorFacts {
  const no = vi.fn(() => false);
  const none = vi.fn(() => undefined);
  return {
    turnKey: vi.fn(() => "corp:12"),
    candidateTargetIds: vi.fn(() => []),
    candidateIsVisibleCorpIceInstall: no,
    candidateIsVisibleCorpAgendaInstall: no,
    isCorpInstallServerId: no,
    corpCandidateIsImmediateRootRezEconomySource: no,
    corpCandidateIsScoreAccelerationSupport: no,
    corpCandidateProjectsCardDraw: no,
    corpConditionalRezSupportWithoutCurrentRouteEvidence: none,
    corpDefenseSignalOwnsAction: no,
    corpDefenseTurnPlanningSliceMayOwnAction: no,
    corpDefensiveUpgradePlacement: none,
    corpDefinitionSupportsPunishPlan: no,
    corpDrawCandidatePreservesHandCapacity: no,
    corpEmptyRdDrawOperationDispositionEvidence: none,
    corpExactExecutableNonEconomyPlanOwnsAction: no,
    corpExactOverflowHandConversionPlanOwnsCandidate: no,
    corpHandSignalMatchesCandidate: no,
    corpOpenEconomyPlanOwnsAction: no,
    corpRemoteCreationLockRemovalAction: none,
    corpRunDefenseAbilityAssessment: none,
    corpScoreProjectAssessmentIsUnknown: no,
    corpScoreProjectId: vi.fn(() => "unbound"),
    corpScoredAgendaRevealWithoutPurposeDispositionEvidence: none,
    visibleKnownCardType: none,
    defenseDomainSignalFacts: {
      hasExactNonNegativeCostProfile: no,
      archivesHasVisibleKnownAgenda: no,
    },
  };
}
