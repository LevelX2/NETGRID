import { describe, expect, it } from "vitest";

import turnCompletionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-01-turn-completion-d11.json";
import unsafeCorporateWarJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-02-unsafe-corporate-war-d24.json";
import fundedSecondLayerRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-03-funded-second-layer-rez-d46.json";
import overtimeOverflowJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-04-overtime-overflow-d75.json";
import counterBankReplacementJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-05-counter-bank-replacement-d101.json";
import terminalRdDefenseJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-06-terminal-rd-defense-d122.json";
import counterBankReadyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-a36a-07-counter-bank-ready-d89.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { readKnownCorpCentralAgendaThreat } from "../../runtime/corp-central-defense-facts-adapter";

describe("match a36a9664 Corp plan decision checkpoints", () => {
  it.each([
    [
      "uses remaining normal clicks for exact R&D defense instead of ending the turn",
      turnCompletionJson,
    ],
    [
      "does not expose Corporate War behind visibly answerable single ICE",
      unsafeCorporateWarJson,
    ],
    ["rezzes the funded second agenda-defense layer", fundedSecondLayerRezJson],
    [
      "does not buy action capacity merely to resolve HQ overflow",
      overtimeOverflowJson,
    ],
    [
      "installs the agenda away from its bound counter bank",
      counterBankReplacementJson,
    ],
    [
      "installs R&D defense against a terminal central-access threat",
      terminalRdDefenseJson,
    ],
    [
      "uses exact R&D defense instead of entering a credit loop",
      counterBankReadyJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps the terminal central fallback tied to the exact matchpoint", () => {
    const result = runAiDecisionCheckpoint(fixture(terminalRdDefenseJson));
    const nonTerminalInput = structuredClone(result.input);
    nonTerminalInput.playerView.opponent.agendaPoints = 0;

    expect(
      readKnownCorpCentralAgendaThreat({
        input: result.input,
        serverId: "rd",
      })?.threat,
    ).toBe("terminal");
    expect(
      readKnownCorpCentralAgendaThreat({
        input: nonTerminalInput,
        serverId: "rd",
      })?.threat,
    ).toBe("material");
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
