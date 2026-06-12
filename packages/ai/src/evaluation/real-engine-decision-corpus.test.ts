import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
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
  it("builds the activation-track corpus from real Engine LegalActions", () => {
    const scenarios = buildRealEngineDecisionCorpusScenarios();
    const samples = buildRealEngineDecisionCorpus(scenarios);

    expect(samples.map((sample) => sample.scenarioId)).toEqual(
      REAL_ENGINE_DECISION_CORPUS_SCENARIO_IDS,
    );
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
