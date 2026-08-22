import { describe, expect, it } from "vitest";

import securityPurgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-177-security-purge-install-targets-d48.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("selfplay 177 Security Purge install targets decision checkpoint", () => {
  it("keeps the exact choice under corp.defend_servers ownership", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(securityPurgeJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    if (!result.ok) return;

    expect(result.decision).toMatchObject({
      actionId: "corp.resolve_choice",
      reasonCode: "plan_first.corp.defend_servers",
      selectedChoices: {
        choiceId: "choice_agenda_purge_install_targets_47",
        selectedOptionIds: [
          "agenda_purge_corp_onr_proteus_012_bug-zapper_2_hq_fixed",
        ],
      },
      decisionDebug: {
        planKind: "corp.defend_servers",
      },
    });
  });
});
