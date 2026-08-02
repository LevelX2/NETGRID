import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  type AiDoctrineQualityCaseAnalysis,
  isRedactionSafeCaseAnalysis,
  qualityTagsForActionWithDependencies,
  repeatedLowValueCentralRunTags,
} from "./doctrine-quality-tags";

describe("qualityTagsForActionWithDependencies", () => {
  it("matches economy action roles by bounded role terms", () => {
    expect(tagsForRoles(["economy_operation"])).not.toContain("economy_stall");
    expect(tagsForRoles(["burst_tempo"])).not.toContain("economy_stall");
    expect(tagsForRoles(["microeconomy_noise"])).toContain("economy_stall");
    expect(tagsForRoles(["tempoish_noise"])).toContain("economy_stall");
  });

  it("does not tag a plan-certified same-turn agenda conversion as naked", () => {
    expect(
      tagsForCorpAgendaInstall(corpScoreConversionDecision()),
    ).not.toContain("naked_agenda_install");
  });

  it("keeps the naked-install tag without the exact score conversion contract", () => {
    const noisyDecision = corpScoreConversionDecision();
    noisyDecision.evidence = ["corp_same_turn_score_conversionish:install"];

    expect(tagsForCorpAgendaInstall(noisyDecision)).toContain(
      "naked_agenda_install",
    );
  });
});

describe("repeatedLowValueCentralRunTags", () => {
  it("matches contest and trash reason codes by bounded terms", () => {
    expect(
      repeatedLowValueCentralRunTags([
        centralRun("runner.low_value"),
        centralRun("runner.remote_contest"),
      ]),
    ).toEqual([]);
    expect(
      repeatedLowValueCentralRunTags([
        centralRun("runner.low_value"),
        centralRun("contestable_noise"),
      ]),
    ).toEqual(["repeated_low_value_central_run"]);
    expect(
      repeatedLowValueCentralRunTags([
        centralRun("runner.low_value"),
        centralRun("trash_remote"),
      ]),
    ).toEqual([]);
    expect(
      repeatedLowValueCentralRunTags([
        centralRun("runner.low_value"),
        centralRun("trashcan_noise"),
      ]),
    ).toEqual(["repeated_low_value_central_run"]);
  });
});

describe("isRedactionSafeCaseAnalysis", () => {
  it("rejects exact forbidden hidden-input field tokens", () => {
    expect(
      isRedactionSafeCaseAnalysis(caseAnalysisWithReasonCode("privatePayload")),
    ).toBe(false);
  });

  it("bounds forbidden field detection to exact tokens", () => {
    expect(
      isRedactionSafeCaseAnalysis(
        caseAnalysisWithReasonCode("privatePayloadish"),
      ),
    ).toBe(true);
  });
});

function tagsForRoles(roles: string[]): string[] {
  return qualityTagsForActionWithDependencies(input(), action(), decision(), {
    extractFeatures: () => ({
      serverFeaturesById: new Map(),
      rigRoles: new Set(),
    }),
    findVisibleCard: () => undefined,
    rolesForAction: () => roles,
  });
}

function tagsForCorpAgendaInstall(selectedDecision: AiDecision): string[] {
  const corpInput = {
    side: "corp",
    legalActions: [],
    playerView: {
      side: "corp",
      own: { credits: 3, gripOrHq: [], rig: [] },
      opponent: { agendaPoints: 0 },
      servers: [],
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
  const installAction = {
    actionId: "install-agenda",
    side: "corp",
    type: "install_card",
    label: "Install agenda",
    source: "agenda-instance",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "agenda-instance",
      serverId: "new_remote",
      placement: "root",
    },
  } as LegalAction;
  return qualityTagsForActionWithDependencies(
    corpInput,
    installAction,
    selectedDecision,
    {
      extractFeatures: () => ({
        serverFeaturesById: new Map(),
        rigRoles: new Set(),
      }),
      findVisibleCard: () =>
        ({
          instanceId: "agenda-instance",
          known: true,
          definitionId: "onr_v1_203_hostile-takeover",
          type: "agenda",
        }) as never,
      rolesForAction: () => [],
    },
  );
}

function corpScoreConversionDecision(): AiDecision {
  return {
    reasonCode: "plan_first.corp.score_agenda",
    fallbackUsed: false,
    timeoutUsed: false,
    evidence: [
      "plan_assessment_evidence:corp_same_turn_score_conversion:install_score_target",
    ],
    decisionDebug: {
      planKind: "corp.score_agenda",
    },
  } as AiDecision;
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [],
    playerView: {
      side: "runner",
      own: {
        credits: 0,
        gripOrHq: [],
        rig: [],
      },
      opponent: {
        agendaPoints: 0,
      },
      servers: [],
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "play_event",
    label: "Use action",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function decision(): AiDecision {
  return {
    reasonCode: "test",
    fallbackUsed: false,
    timeoutUsed: false,
  } as AiDecision;
}

function centralRun(reasonCode: string) {
  return {
    side: "runner",
    actionType: "start_run",
    targetServerId: "rd",
    reasonCode,
  } as const;
}

function caseAnalysisWithReasonCode(
  reasonCode: string,
): AiDoctrineQualityCaseAnalysis {
  return {
    version: "ai-deck-doctrine-case-analysis-v1",
    maxExamplesPerMetric: 1,
    totals: {
      nakedAgendaInstalls: 0,
      agendaFloodExposure: 0,
      scoreWindowMissed: 0,
      remoteOverbuild: 0,
      economyStall: 0,
      repeatedLowValueCentralRun: 0,
      rigStall: 0,
      assetTrashNeglect: 0,
    },
    examples: {
      nakedAgendaInstalls: [
        {
          metric: "nakedAgendaInstalls",
          seed: "seed",
          actionIndex: 0,
          stateVersionBefore: 1,
          side: "runner",
          actionType: "start_run",
          reasonCode,
          qualityTags: [],
        },
      ],
      agendaFloodExposure: [],
      scoreWindowMissed: [],
      remoteOverbuild: [],
      economyStall: [],
      repeatedLowValueCentralRun: [],
      rigStall: [],
      assetTrashNeglect: [],
    },
    redactionSafe: true,
  };
}
