import { expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-731-r2-g11-d197.json";
import { buildBoundedCorpPunishRouteRequests } from "../../corp/punish/punish-route-quote-input";

const checkpoint = capture as unknown as {
  input: AiDecisionInput;
  validation: Record<string, boolean>;
};

it("requests the exact current agenda-funded damage head from the real SP-848 decision", () => {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const input = checkpoint.input;
  const action = input.legalActions.find(
    (a) => a.payload?.v1920AssetAbility === "tagged_meat_damage",
  )!;
  const [route] = buildBoundedCorpPunishRouteRequests(input).filter((r) =>
    r.steps.some((step) => step.sourceCardInstanceId === action.source),
  );
  expect(route?.steps).toEqual([
    expect.objectContaining({
      kind: "meat_damage",
      sourceCardInstanceId: action.source,
      sourceCapabilityId:
        "onr_v1_327_i-got-a-rock:unique_direct_longtail_tagged_meat_damage_meat",
      currentLegalActionId: action.actionId,
    }),
  ]);
});
