import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import {
  actionHasImmediateCreditGain,
  actionProvidesCredits,
  isBasicCreditAction,
} from "../actions/action-effect-classification";
function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-577-schlaghund-" + name + ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
describe("SP-725 native special damage is never liquid income", () => {
  it.each(["tagged", "zero-tag"])(
    "publishes exact zero income and conditional damage before the %s native action",
    (name) => {
      const f = fixture(name);
      expect(
        Object.values(f.checkpoint.validation).every((x) => x === true),
      ).toBe(true);
      expect(f.provenance.eachPrefixHashMatches).toBe(true);
      expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
      const actions = getLegalActions(f.state, "corp");
      const action = actions.find(
        (a) => a.payload?.v1921AssetAbility === "schlaghund_tag_damage",
      )!;
      expect(action).toBeDefined();
      expect(action.payload).toMatchObject({
        gainCreditsAmount: 0,
        damageType: "meat",
        potentialDamageAmount: 10,
        randomTagThresholdDamage: true,
        effectKind: "damage",
      });
      expect(action.payload?.damageAmount).toBeUndefined();
      expect(action.payload?.v1921DieRoll).toBeUndefined();
      expect(actionProvidesCredits(action)).toBe(false);
      expect(actionHasImmediateCreditGain(action)).toBe(false);
      expect(isBasicCreditAction(action)).toBe(false);
      const basic = actions.find(
        (a) => a.source === "basic_action" && a.type === "gain_credit",
      )!;
      expect(actionProvidesCredits(basic)).toBe(true);
      expect(isBasicCreditAction(basic)).toBe(true);
    },
  );
  it.each(["tagged", "zero-tag"])(
    "keeps real costs, deterministic RNG and actual zero-credit outcome for %s",
    (name) => {
      const f = fixture(name);
      const action = getLegalActions(f.state, "corp").find(
        (a) => a.payload?.v1921AssetAbility === "schlaghund_tag_damage",
      )!;
      const take = () =>
        applyAction(f.state, {
          matchId: f.state.matchId,
          side: "corp",
          actionId: action.actionId,
          clientKnownStateVersion: f.state.stateVersion,
        });
      const a = take(),
        b = take();
      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
      if (!a.ok || !b.ok) throw Error("Native action rejected");
      expect(a.state.corp.credits).toBe(f.state.corp.credits);
      expect(a.state.corp.clicks).toBe(f.state.corp.clicks - 1);
      expect(a.state.randomCounter).toBe(f.state.randomCounter + 1);
      expect(a.state.runner.grip).toEqual(f.state.runner.grip);
      expect(a.state.winner).toBeNull();
      expect(hashGameState(a.state)).toBe(hashGameState(b.state));
    },
  );
});
