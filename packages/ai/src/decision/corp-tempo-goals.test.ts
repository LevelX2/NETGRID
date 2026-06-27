import { describe, expect, it } from "vitest";
import { classifyCorpTempoGoal } from "./corp-tempo-goals";

describe("corp tempo goal resolution", () => {
  it("classifies Corporate Boon as economy-only without conversion evidence", () => {
    const result = classifyCorpTempoGoal({
      type: "activated_card_ability",
      sourceTitle: "Corporate Boon",
      evidence: ["credit gain"],
    });

    expect(result.fit).toBe("economy_only");
    expect(result.progressRelevant).toBe(false);
  });

  it("classifies score and advance actions as scoreline progress", () => {
    expect(
      classifyCorpTempoGoal({
        type: "score_agenda",
        corpScoreTerminalWindowScoreLegal: true,
      }).fit,
    ).toBe("safe_score");
    expect(
      classifyCorpTempoGoal({
        type: "advance_card",
        corpScoreTerminalWindowAdvanceToScoreLegal: true,
      }).fit,
    ).toBe("advance_to_score");
  });

  it("keeps opaque abilities opaque without side-safe tempo evidence", () => {
    const result = classifyCorpTempoGoal({
      type: "activated_card_ability",
      sourceTitle: "Unknown visible ability",
    });

    expect(result.fit).toBe("opaque_ability");
    expect(result.progressRelevant).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(
      /cardInstances|privatePayload|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("ignores label-only tempo text and keeps explicit evidence active", () => {
    const labelOnly = classifyCorpTempoGoal({
      type: "activated_card_ability",
      label: "Protect remote scoreline",
      sourceTitle: "Unknown visible ability",
    });
    const explicitEvidence = classifyCorpTempoGoal({
      type: "activated_card_ability",
      label: "Use ability",
      sourceTitle: "Unknown visible ability",
      evidence: ["protect remote scoreline"],
    });

    expect(labelOnly.fit).toBe("opaque_ability");
    expect(labelOnly.progressRelevant).toBe(false);
    expect(explicitEvidence.fit).toBe("protect_remote");
    expect(explicitEvidence.progressRelevant).toBe(true);
  });

  it("classifies meaningful ICE protection from visible server evidence", () => {
    const rez = classifyCorpTempoGoal({
      type: "rez_ice",
      targetServerId: "remote_1",
      evidence: ["protect remote scoreline"],
    });
    const install = classifyCorpTempoGoal({
      type: "install_card",
      targetServerId: "rd",
      evidence: ["protect central"],
    });

    expect(rez.fit).toBe("protect_remote");
    expect(install.fit).toBe("protect_central");
  });
});
