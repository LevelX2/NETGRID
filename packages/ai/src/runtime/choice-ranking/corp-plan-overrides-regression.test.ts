import { describe, expect, it } from "vitest";
import {
  strongerExistingCorpOverrideMustBePreserved,
  tacticalPlanCorpScoreConversionBlocksOffPlanOverride,
} from "./corp-plan-overrides";
import {
  choice,
  legalAction,
  scoreConversionMapping,
  scoreComponentEvidence,
  scorelineSupportMapping,
  strategicEvidence,
} from "./semantic-choice-ranking.test-support";

describe("Corp plan override preservation", () => {
  it("keeps stronger board triage above a weaker strategic credit action", () => {
    const remoteIce = legalAction("install-remote-ice", "install_card");
    const rdIce = legalAction("install-rd-ice", "install_card");
    const gain = legalAction("gain", "gain_credit");
    const strongerOverride = choice(
      rdIce,
      4193,
      scoreComponentEvidence("corp_board_triage_alignment"),
      {
        key: "corp_board_triage_alignment",
        value: 24,
        reason: "critical R&D pressure",
      },
    );
    const weakerStrategicChoice = choice(gain, 1270, strategicEvidence("kind"));

    expect(
      strongerExistingCorpOverrideMustBePreserved(
        scorelineSupportMapping([remoteIce]),
        strongerOverride,
        weakerStrategicChoice,
      ),
    ).toBe(true);
  });

  it("yields a claimed same-turn conversion to a positive action when the scoreline is game-ending unsafe", () => {
    const unsafeAgenda = legalAction("install-unsafe-agenda", "install_card");
    const protectRd = legalAction("protect-rd", "install_card");
    const mappedChoice = choice(unsafeAgenda, -4600, [], {
      key: "corp_game_ending_scoreline_exposure_penalty",
      value: -4600,
      reason: "runner would win before the agenda can score",
    });
    const overrideChoice = choice(protectRd, 2100);

    expect(
      tacticalPlanCorpScoreConversionBlocksOffPlanOverride(
        scoreConversionMapping([unsafeAgenda]),
        mappedChoice,
        overrideChoice,
        new Set([unsafeAgenda.actionId]),
      ),
    ).toBe(false);
  });
});
