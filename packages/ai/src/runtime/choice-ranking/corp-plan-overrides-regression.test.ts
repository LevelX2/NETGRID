import { describe, expect, it } from "vitest";
import { strongerExistingCorpOverrideMustBePreserved } from "./corp-plan-overrides";
import {
  choice,
  legalAction,
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
});
