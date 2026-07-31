import { describe, expect, it } from "vitest";

import rezFreeEtrDecoyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-01-rez-free-etr-decoy-d70.json";
import continueZurichScoreJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-02-continue-zurich-score-d84.json";
import rezFreeEtrAgendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-03-rez-free-etr-agenda-d89.json";
import activateBbsEconomyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-04-activate-bbs-economy-d102.json";
import preserveAccountsThresholdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-05-preserve-accounts-threshold-d120.json";
import bindVaporDecoyRouteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-06-bind-vapor-decoy-route-d66.json";
import preserveVeniceTargetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-07-preserve-venice-target-d103.json";
import avoidUnfundedRdOverstackJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-08-avoid-unfunded-rd-overstack-d110.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("e6aca Corp remediation red decision checkpoints", () => {
  it.each([
    ["rejects declining a free effective ETR in the decoy remote", rezFreeEtrDecoyJson],
    ["continues the already started Zurich score line", continueZurichScoreJson],
    ["rejects declining a free effective ETR over the agenda", rezFreeEtrAgendaJson],
    ["activates installed BBS economy instead of drawing past it", activateBbsEconomyJson],
    ["preserves the exact Accounts Receivable threshold", preserveAccountsThresholdJson],
    ["owns the Vapor Ops install as a typed decoy route", bindVaporDecoyRouteJson],
    ["does not drift away from the bound Venice score remote", preserveVeniceTargetJson],
    ["prices an unfunded fifth R&D layer against its opportunity cost", avoidUnfundedRdOverstackJson],
  ])("captures the pre-fix behavior regression: %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(json) as AiDecisionCheckpointV1,
    );

    expect(result.ok).toBe(false);
    expect(result.code).toBe("behavior_regression");
  });
});
