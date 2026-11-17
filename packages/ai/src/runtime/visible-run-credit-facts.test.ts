import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { corpRemoteContestabilityAssessment } from "../corp/defense/corp-remote-contestability";
import { describe, expect, it } from "vitest";
import { visibleRunnerRunCreditPool } from "./visible-run-credit-facts";

describe("visible Runner run-credit facts", () => {
  it("counts each eligible known pool once and keeps other credit purposes separate", () => {
    expect(
      visibleRunnerRunCreditPool([
        {
          known: false,
          counterDisplays: [
            {
              amount: 100,
              creditPool: { uses: ["using_icebreaker_during_run"] },
            },
          ],
        },
        {
          known: true,
          counterDisplays: [
            {
              amount: 3.8,
              creditPool: {
                uses: [
                  "using_icebreaker_during_run",
                  "using_killer_during_run",
                ],
              },
            },
            {
              amount: 2,
              creditPool: { uses: ["using_icebreaker_during_run_non_noisy"] },
            },
            { amount: 4, creditPool: { uses: ["using_killer_during_run"] } },
            { amount: 90, creditPool: { uses: ["paying_to_trash"] } },
            { amount: 80 },
            {
              amount: -2,
              creditPool: { uses: ["using_icebreaker_during_run"] },
            },
          ],
        },
        { known: true },
      ]),
    ).toBe(9);
    expect(visibleRunnerRunCreditPool([])).toBe(0);
  });
});

it("keeps two visible Cloak pools unavailable to Hunter's modern trace", () => {
  const hunter = {
    instanceId: "hunter",
    definitionId: 461,
    type: "ice",
    known: true,
    rezzed: true,
    strength: 5,
    subtypes: ["sentry", "bloodhound"],
    effectiveRunQuote: {
      iceInstanceId: "hunter",
      iceDefinitionId: 461,
      effectiveStrength: 5,
      subroutines: [
        {
          id: "trace",
          type: "initiate_trace",
          sourceDefinitionId: 461,
          sourceTitle: "Hunter",
          amount: 5,
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
          breakTags: ["trace"],
        },
      ],
    },
  } as VisibleCard;
  const rig = ["cloak-a", "cloak-b"].map<VisibleCard>((instanceId) => ({
    instanceId,
    definitionId: 223,
    type: "program",
    known: true,
    rezzed: true,
    controller: "runner",
    counterDisplays: [
      {
        amount: 3,
        id: instanceId + ":cloak-pool",
        displayKind: "recurring_credit",
        label: "Recurring credits",
        ariaLabel: "Recurring credits",
        counterType: "bit",
        creditPool: {
          kind: "recurring_credit",
          uses: ["using_icebreaker_during_run_non_noisy"],
          capacity: 3,
          refresh: {
            timing: "start_of_runner_turn",
            behavior: "refill_to_capacity_if_used",
          },
        },
      },
    ],
  }));
  const input = {
    side: "corp",
    legalActions: [],
    eventTail: [],
    playerView: {
      traceRulesProfile: "modern_open",
      stateVersion: 20,
      publicEvents: [],
      own: { credits: 4 },
      opponent: { credits: 0, clicks: 4, rig },
      servers: [{ id: "remote_1", ice: [hunter], root: [] }],
    },
  } as unknown as AiDecisionInput;
  expect(corpRemoteContestabilityAssessment(input, "remote_1")).toMatchObject({
    visibleRunnerExposureContestCredits: 9,
    creditsAfterPath: 3,
    expectedTagsFromVisibleIce: 1,
  });
});
