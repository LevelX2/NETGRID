import { readFileSync } from "node:fs";
import type { LegalAction } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  pilotScopeAllowsAction,
  semanticPilotChoice,
  type AiPlayStrengthPilotScope,
} from "../decision/pilot-scope-registry";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
  buildRealEngineDecisionCorpusScenarios,
} from "./real-engine-decision-corpus-fixtures";
import {
  buildRealEngineDecisionCorpus,
  type RealEngineDecisionCorpusSample,
  type RealEngineDecisionCorpusScenario,
} from "./real-engine-decision-corpus";

describe("RealEngineDecisionCorpus", () => {
  const originalPilot = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  afterEach(() => {
    if (originalPilot === undefined) {
      delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_PILOT_ENV] = originalPilot;
    }
  });

  it("builds the activation-track corpus from real Engine LegalActions", () => {
    const scenarios = buildRealEngineDecisionCorpusScenarios();
    const samples = buildRealEngineDecisionCorpus(scenarios);

    expect(scenarios.map((scenario) => scenario.scenarioId)).toEqual(
      REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
    );
    expect(scenarios.length).toBe(REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS.length);
    expect(samples.map((sample) => sample.scenarioId)).toEqual(
      REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
    );
    expect(samples.length).toBe(scenarios.length);
    expect(REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS.length).toBeGreaterThanOrEqual(30);
    expect(samples.filter((sample) => sample.legalActionCount === 0)).toEqual(
      [],
    );
    expect(samples.filter((sample) => sample.candidateCount === 0)).toEqual([]);

    for (const sample of samples) {
      const scenario = scenarioFor(scenarios, sample.scenarioId);
      expect(sample.frame.legalActionIds).toEqual(
        scenario.input.legalActions.map((action) => action.actionId),
      );
      expect(sample.candidateCount).toBe(sample.legalActionCount);
      expect(
        traceActionIds(sample).every((id) =>
          sample.frame.legalActionIds.includes(id),
        ),
      ).toBe(true);
      expect(containsForbiddenSemanticMarker(sample)).toBe(false);
      expect(sample.trace.noRuntimeEffect).toBe(true);
      expect(sample.trace.selectedActionId).toBeUndefined();
      expect(sample.deckDoctrine).toBeDefined();
      expect(sample.deckDoctrine?.scope).toBe("diagnostic_only");
      expect(sample.deckDoctrine?.productiveUseAllowed).toBe(false);
      expect(sample.evidence).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^deck_doctrine:/),
          expect.stringMatching(/^deck_doctrine_status:/),
        ]),
      );
    }

    expect(actionTypesFor(scenarios, "runner_real_tag_cleanup")).toContain(
      "remove_tag",
    );
    expect(
      actionTypesFor(scenarios, "corp_real_score_agenda_window"),
    ).toContain("score_agenda");
    expect(
      actionTypesFor(scenarios, "corp_real_advance_score_window"),
    ).toContain("advance_card");
    expect(actionTypesFor(scenarios, "corp_real_rez_value_window")).toContain(
      "rez_ice",
    );
    expect(
      actionTypesFor(scenarios, "corp_real_do_not_rez_when_broke"),
    ).toContain("decline_rez");
    expect(actionTypesFor(scenarios, "runner_real_remote_probe")).toContain(
      "start_run",
    );
    expect(
      actionTypesFor(scenarios, "corp_real_remote_defense_setup"),
    ).toContain("install_card");
    expect(
      sampleFor(samples, "runner_real_low_credits").leagueExpectation
        ?.expectedTopActionTypes,
    ).toEqual(["gain_credit", "draw_card"]);
  });

  it("keeps real run target payloads side-safe and target-alignable", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );

    expect(
      hasServerTargetContext(
        sampleFor(samples, "runner_real_safe_hq_access"),
        "hq",
      ),
    ).toBe(true);
    expect(
      hasServerTargetContext(
        sampleFor(samples, "runner_real_safe_rd_access"),
        "rd",
      ),
    ).toBe(true);
    expect(
      hasServerTargetContext(
        sampleFor(samples, "runner_real_remote_score_threat"),
        "remote_1",
      ),
    ).toBe(true);
  });

  it("keeps scenario fixture mutations behind the real engine fixture builder", () => {
    const source = readFileSync(
      new URL("./real-engine-decision-corpus-fixtures.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/\bstate\.(?:runner|corp|cardInstances)\b[^\n;]*=/);
  });

  it("validates play-strength pilot scopes against real Engine corpus samples", () => {
    const scenarios = buildRealEngineDecisionCorpusScenarios();
    const samples = buildRealEngineDecisionCorpus(scenarios);

    const basicPositive = sampleFor(samples, "runner_real_low_credits");
    expect(
      pilotDecisionFor(scenarios, basicPositive, BASIC_SETUP_PILOT_MODE).allowed,
    ).toBe(true);
    expect(
      pilotChoiceFor(scenarios, basicPositive, BASIC_SETUP_PILOT_MODE)?.choice
        .action.actionId,
    ).toBe(topAction(basicPositive).actionId);
    expect(
      pilotDecisionFor(scenarios, sampleFor(samples, "runner_real_safe_hq_access"), BASIC_SETUP_PILOT_MODE)
        .allowed,
    ).toBe(false);
    expect(
      pilotDecisionFor(scenarios, sampleFor(samples, "corp_real_score_agenda_window"), BASIC_SETUP_PILOT_MODE)
        .allowed,
    ).toBe(false);

    const runnerPositive = sampleFor(samples, "runner_real_safe_hq_access");
    const runnerPositiveDecision = pilotDecisionFor(
      scenarios,
      runnerPositive,
      RUNNER_SAFE_ACCESS_PILOT_MODE,
    );
    expect(runnerPositiveDecision.allowed).toBe(true);
    expect(runnerPositiveDecision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^credits_after_run:/),
        "steal_or_trash_affordable:unknown",
        "risky_universal_coverage:false",
        "score_threat:false",
      ]),
    );
    expect(
      pilotChoiceFor(scenarios, runnerPositive, RUNNER_SAFE_ACCESS_PILOT_MODE)
        ?.choice.action.actionId,
    ).toBe(topAction(runnerPositive).actionId);
    const remoteThreatDecision = pilotDecisionFor(
      scenarios,
      sampleFor(samples, "runner_real_remote_score_threat"),
      RUNNER_SAFE_ACCESS_PILOT_MODE,
    );
    expect(remoteThreatDecision.allowed).toBe(false);
    expect(remoteThreatDecision.reason).toBe("runner_safe_access_non_central_target");
    expect(
      pilotScopeAllowsAction({
        scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
        frame: runnerPositive.frame,
        action: {
          ...legalActionFor(scenarios, runnerPositive),
          payload: { serverId: "remote_missing" },
        },
        top: topAction(runnerPositive),
      }).allowed,
    ).toBe(false);

    const corpPositive = sampleFor(samples, "corp_real_score_agenda_window");
    expect(
      pilotDecisionFor(scenarios, corpPositive, CORP_SCORE_WINDOW_PILOT_MODE)
        .allowed,
    ).toBe(true);
    expect(
      pilotChoiceFor(scenarios, corpPositive, CORP_SCORE_WINDOW_PILOT_MODE)?.choice
        .action.actionId,
    ).toBe(topAction(corpPositive).actionId);
    expect(
      pilotDecisionFor(scenarios, sampleFor(samples, "corp_real_advance_score_window"), CORP_SCORE_WINDOW_PILOT_MODE)
        .allowed,
    ).toBe(false);
    expect(
      pilotDecisionFor(scenarios, sampleFor(samples, "corp_real_rez_value_window"), CORP_SCORE_WINDOW_PILOT_MODE)
        .allowed,
    ).toBe(false);
  });
});

function scenarioFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  scenarioId: string,
): RealEngineDecisionCorpusScenario {
  const scenario = scenarios.find(
    (candidate) => candidate.scenarioId === scenarioId,
  );
  if (!scenario) throw new Error(`Missing scenario ${scenarioId}`);
  return scenario;
}

function sampleFor(
  samples: readonly RealEngineDecisionCorpusSample[],
  scenarioId: string,
): RealEngineDecisionCorpusSample {
  const sample = samples.find(
    (candidate) => candidate.scenarioId === scenarioId,
  );
  if (!sample) throw new Error(`Missing sample ${scenarioId}`);
  return sample;
}

function actionTypesFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  scenarioId: string,
): LegalAction["type"][] {
  return scenarioFor(scenarios, scenarioId).input.legalActions.map(
    (action) => action.type,
  );
}

function traceActionIds(sample: RealEngineDecisionCorpusSample): string[] {
  return [
    ...sample.trace.rankedActions.map((action) => action.actionId),
    ...sample.trace.rejectedActions.map((action) => action.actionId),
    ...(sample.trace.selectedActionId ? [sample.trace.selectedActionId] : []),
  ];
}

function hasServerTargetContext(
  sample: RealEngineDecisionCorpusSample,
  serverId: string,
): boolean {
  return sample.frame.actionCandidates.some(
    (candidate) =>
      candidate.semanticActionType === "run.start" &&
      candidate.targetContext?.availableTargets?.some(
        (target) =>
          target.targetKind === "server" && target.targetId === serverId,
      ) === true,
  );
}

function pilotDecisionFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  sample: RealEngineDecisionCorpusSample,
  scope: AiPlayStrengthPilotScope,
) {
  return pilotScopeAllowsAction({
    scope,
    frame: sample.frame,
    action: legalActionFor(scenarios, sample),
    top: topAction(sample),
  });
}

function pilotChoiceFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  sample: RealEngineDecisionCorpusSample,
  scope: AiPlayStrengthPilotScope,
) {
  process.env[AI_PLAY_STRENGTH_PILOT_ENV] = scope;
  return semanticPilotChoice({
    frame: sample.frame,
    trace: sample.trace,
    currentChoice: fallbackRuntimeChoice(scenarios, sample),
    choices: runtimeChoicesFor(scenarios, sample),
  });
}

function topAction(
  sample: RealEngineDecisionCorpusSample,
): RealEngineDecisionCorpusSample["trace"]["rankedActions"][number] {
  const top = sample.trace.rankedActions[0];
  if (!top) throw new Error(`Missing top action for ${sample.scenarioId}`);
  return top;
}

function legalActionFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  sample: RealEngineDecisionCorpusSample,
): LegalAction {
  const top = topAction(sample);
  const action = scenarioFor(scenarios, sample.scenarioId).input.legalActions.find(
    (candidate) => candidate.actionId === top.actionId,
  );
  if (!action) throw new Error(`Missing LegalAction ${top.actionId}`);
  return action;
}

function runtimeChoicesFor(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  sample: RealEngineDecisionCorpusSample,
): SemanticRuntimeChoice[] {
  const top = topAction(sample);
  return scenarioFor(scenarios, sample.scenarioId).input.legalActions.map((action) => ({
    action,
    scopeId: "real_engine_corpus",
    score: action.actionId === top.actionId ? top.score : Math.max(top.score - 40, 0),
    reasonCode: `real_engine_corpus.${sample.scenarioId}`,
    explanation: "real engine corpus candidate",
    evidence: [`scenario:${sample.scenarioId}`, `action:${action.actionId}`],
  }));
}

function fallbackRuntimeChoice(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
  sample: RealEngineDecisionCorpusSample,
): SemanticRuntimeChoice {
  const top = topAction(sample);
  const fallbackAction =
    scenarioFor(scenarios, sample.scenarioId).input.legalActions.find(
      (action) => action.actionId !== top.actionId,
    ) ?? legalActionFor(scenarios, sample);
  return {
    action: fallbackAction,
    scopeId: "real_engine_corpus_fallback",
    score: Math.max(top.score - 40, 0),
    reasonCode: `real_engine_corpus.fallback.${sample.scenarioId}`,
    explanation: "real engine corpus fallback",
    evidence: [`fallback:${fallbackAction.actionId}`],
  };
}
