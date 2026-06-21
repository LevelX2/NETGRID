import { describe, expect, it } from "vitest";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import {
  REAL_ENGINE_ACCESS_CORPUS_SCENARIO_IDS,
  buildRealEngineAccessCorpus,
} from "./real-engine-access-corpus";

describe("real engine access corpus", () => {
  it("builds the complete report-only access intelligence corpus", () => {
    const corpus = buildRealEngineAccessCorpus();

    expect(corpus.map((scenario) => scenario.scenarioId)).toEqual(
      REAL_ENGINE_ACCESS_CORPUS_SCENARIO_IDS,
    );
    expect(corpus).toHaveLength(15);
    expect(corpus.every((scenario) => scenario.reportOnly)).toBe(true);
    expect(
      corpus.every((scenario) => scenario.productiveUseAllowed === false),
    ).toBe(true);
    expect(
      corpus.every((scenario) => scenario.runtimeConsumerStatus === "none"),
    ).toBe(true);
    expect(corpus.every((scenario) => scenario.legalAction.type === "start_run"))
      .toBe(true);
    expect(corpus.every((scenario) => scenario.remoteFingerprint.length > 0))
      .toBe(true);
    expect(containsForbiddenSemanticMarker(corpus)).toBe(false);
  });

  it("covers expected recommendation classes without runtime consumption", () => {
    const corpus = buildRealEngineAccessCorpus();

    expect(new Set(corpus.map((scenario) => scenario.expectedRecommendation)))
      .toEqual(
        new Set([
          "run_now",
          "gain_credits_first",
          "known_no_current_payoff",
          "remote_changed_reassess",
          "declined_trash_memory_active",
        ]),
      );
    expect(
      scenario(corpus, "access_declined_trash_memory_active").accessOutcomeMemory,
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
    });
    expect(
      scenario(corpus, "access_memory_remote_fingerprint_changed")
        .accessOutcomeMemory,
    ).toMatchObject({
      applies: false,
      invalidationReason: "remote_fingerprint_changed",
    });
    expect(scenario(corpus, "access_memory_economy_improved").accessOutcomeMemory)
      .toMatchObject({
        applies: false,
        invalidationReason: "credits_or_reserve_improved",
      });
  });

  it("keeps target-choice dry-runs inside access projections", () => {
    const trashDryRun = scenario(
      buildRealEngineAccessCorpus(),
      "access_target_choice_trash_dry_run",
    );
    const declineDryRun = scenario(
      buildRealEngineAccessCorpus(),
      "access_target_choice_decline_dry_run",
    );

    expect(trashDryRun.projection.projections).toEqual([
      "asset_trash",
      "target_choice_would_select",
    ]);
    expect(trashDryRun.projection.targetChoiceWouldSelect).toMatchObject({
      optionId: "trash",
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    });
    expect(declineDryRun.projection.projections).toEqual([
      "decline_trash",
      "target_choice_would_select",
    ]);
    expect(declineDryRun.projection.targetChoiceWouldSelect).toMatchObject({
      optionId: "decline",
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    });
  });

  it("ranks agenda before asset and valuable asset before low-value upgrade", () => {
    const corpus = buildRealEngineAccessCorpus();

    expect(
      scenario(corpus, "access_rank_agenda_before_asset").rankedTargets.map(
        (target) => target.targetKind,
      ),
    ).toEqual(["agenda", "asset"]);
    expect(
      scenario(
        corpus,
        "access_rank_asset_before_low_value_upgrade",
      ).rankedTargets.map((target) => target.targetKind),
    ).toEqual(["asset", "upgrade"]);
  });

  it("keeps the LegalAction payload contract side-safe", () => {
    const payloadScenario = scenario(
      buildRealEngineAccessCorpus(),
      "access_side_safe_payload_contract",
    );

    expect(payloadScenario.legalAction.payload).toEqual({ serverId: "remote_1" });
    expect(payloadScenario.evidence).toEqual(
      expect.arrayContaining([
        "access_decision_projection_server:remote_1",
        "expected_recommendation:known_no_current_payoff",
      ]),
    );
  });
});

function scenario(
  corpus: ReturnType<typeof buildRealEngineAccessCorpus>,
  scenarioId: (typeof REAL_ENGINE_ACCESS_CORPUS_SCENARIO_IDS)[number],
) {
  const found = corpus.find((candidate) => candidate.scenarioId === scenarioId);
  if (!found) throw new Error(`Missing scenario ${scenarioId}`);
  return found;
}
