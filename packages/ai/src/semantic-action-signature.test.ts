import { describe, expect, it } from "vitest";
import {
  buildSemanticActionSignature,
  signatureInputIsRedactionSafe,
} from "./semantic-action-signature";

describe("semantic action signatures", () => {
  it("builds the same signature for the same semantic legal-action shape", () => {
    const input = {
      actionType: "install_card",
      semanticActionType: "board_development",
      sourceKind: "visible_card_or_ability",
      sourceDefinitionId: "onr_v1_001_afreet",
      abilityId: "install",
      targetIdentity: "ownCard:grip:onr_v1_001_afreet",
      costClass: "known:known,click:1,credit:3",
      timingClass: "phase:main,turn:runner",
    };

    expect(buildSemanticActionSignature(input).signatureKey).toBe(
      buildSemanticActionSignature({ ...input }).signatureKey,
    );
  });

  it("separates otherwise identical actions by target identity", () => {
    const first = buildSemanticActionSignature({
      actionType: "start_run",
      semanticActionType: "run_pressure",
      sourceKind: "basic_action",
      targetIdentity: "server:rd",
      costClass: "known:known,click:1",
      timingClass: "phase:main,turn:runner",
    });
    const second = buildSemanticActionSignature({
      actionType: "start_run",
      semanticActionType: "run_pressure",
      sourceKind: "basic_action",
      targetIdentity: "server:hq",
      costClass: "known:known,click:1",
      timingClass: "phase:main,turn:runner",
    });

    expect(first.signatureKey).not.toBe(second.signatureKey);
  });

  it("blocks hidden-info markers from the emitted signature fields", () => {
    const unsafe = buildSemanticActionSignature({
      actionType: "trigger_ability",
      semanticActionType: "unknown",
      sourceKind: "card",
      targetIdentity: "cardInstances.runner.hidden.0",
      costClass: "known:unknown",
      timingClass: "phase:main",
    });

    expect(signatureInputIsRedactionSafe({ targetIdentity: "deckTop.0", actionType: "draw_card" })).toBe(
      false,
    );
    expect(JSON.stringify(unsafe)).not.toContain("cardInstances");
    expect(unsafe.targetIdentity).toBe("unknown_hidden_blocked");
  });
});
