import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

function original() {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta576-snowball-strength-horizon.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const input = checkpoint.input as AiDecisionInput;
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  const snowball = input.playerView.own.rig?.find((card) => card.definitionId === 278);
  if (!snowball) throw new Error("Der native Runner-Rig enthält keinen Snowball.");
  return { input, snowballId: snowball.instanceId };
}

describe("Paarung 576: getrennte Begegnungs- und Runstärke", () => {
  it("bezahlt den Encounter-Pump an beiden bekannten Shock.r statt ihn mit Snowballs Breakbonus zu übertragen", () => {
    const { input, snowballId } = original();
    const server = input.playerView.servers.find(
      (server) => server.id === "r1",
    )!;
    const path = assessKnownRezzedIcePath(
      server.ice,
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
      input.playerView.opponent.credits,
    );
    expect(path).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 7,
      creditsAfterPath: 6,
    });
    expect(
      path.carriedBreakerStrengthAfterPath?.[snowballId],
    ).toBe(2);
  });
  it("erhält nur den echten Runbonus nach dem einzelnen äußeren ICE", () => {
    const { input, snowballId } = original();
    const server = input.playerView.servers.find(
      (server) => server.id === "r1",
    )!;
    const path = assessKnownRezzedIcePath(
      server.ice.slice(2),
      input.playerView.own.rig ?? [],
      input.playerView.own.credits,
      server.root,
      input.playerView.opponent.credits,
    );
    expect(path).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 4,
      creditsAfterPath: 9,
    });
    expect(
      path.carriedBreakerStrengthAfterPath?.[snowballId],
    ).toBe(1);
  });
});
