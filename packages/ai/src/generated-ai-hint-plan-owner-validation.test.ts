import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import { validateGeneratedArtifact } from "./generated-ai-hint-artifact-validation";

describe("generated AI-hint plan-owner validation", () => {
  it("accepts exact sorted bindings and rejects duplicate or forged rows", () => {
    const valid = artifactWithBrokerBindings();
    expect(() => validateGeneratedArtifact(valid)).not.toThrow();

    const duplicate = artifactWithBrokerBindings();
    brokerHint(duplicate).actionPlanOwnerBindings.push({
      capabilityKey: "withdraw_credits",
      owner: "runner.credit_bank",
      route: "cash_out",
    });
    expect(() => validateGeneratedArtifact(duplicate)).toThrow(
      "invalid_card_spec_ai_hint_artifact_hint:onr_v1_154_broker",
    );

    const forged = artifactWithBrokerBindings();
    brokerHint(forged).actionPlanOwnerBindings[0]!.owner = "corp.score_agenda";
    delete brokerHint(forged).actionPlanOwnerBindings[0]!.route;
    expect(() => validateGeneratedArtifact(forged)).toThrow(
      "invalid_card_spec_ai_hint_artifact_hint:onr_v1_154_broker",
    );
  });
});

function artifactWithBrokerBindings(): any {
  const artifact = structuredClone(generatedArtifact) as any;
  brokerHint(artifact).actionPlanOwnerBindings = [
    {
      capabilityKey: "store_credits",
      owner: "runner.credit_bank",
      route: "build",
    },
    {
      capabilityKey: "withdraw_credits",
      owner: "runner.credit_bank",
      route: "cash_out",
    },
  ];
  return artifact;
}

function brokerHint(artifact: any): any {
  return artifact.cards.find(
    (record: any) => record.cardId === "onr_v1_154_broker",
  ).hint;
}
