import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../game/create-game";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import type { ActivatedCardAbilityImplementation } from "./definition-types";
import {
  canPayActivatedCardImplementationCosts,
  payActivatedCardImplementationCosts,
} from "./card-implementation-runtime-activated-costs";

const sourceCardId = "viral_pipeline" as CardInstanceId;
const socketAbility = {
  timing: "runner_paid",
  costs: [
    { kind: "action", amount: 1 },
    { kind: "credit", amount: 1 },
    {
      kind: "corp_purgeable_runner_virus_counter",
      counterType: "socket_hq",
      server: "hq",
      amount: 1,
    },
  ],
  effects: [],
} as unknown as ActivatedCardAbilityImplementation;

describe("activated CardImplementation costs", () => {
  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid central virus-counter state %s before any mutation",
    (invalidAmount) => {
      const state = createGame({
        seed: `invalid-central-virus-counter-${String(invalidAmount)}`,
        setupMode: "completed",
      });
      state.runner.clicks = 3;
      state.runner.credits = 5;
      state.purgeableRunnerVirusCounters = {
        servers: { hq: { socket_hq: invalidAmount } },
      };
      const before = structuredClone(state);
      const legalAction = {
        side: "runner",
        costs: [{ clicks: 1, credits: 1 }],
        payload: {},
      } as unknown as LegalAction;
      const deps = new Proxy(
        {},
        {
          get: (_target, property) => () => {
            throw new Error(`unexpected dependency call: ${String(property)}`);
          },
        },
      ) as CardImplementationRuntimeDependencies;

      expect(() =>
        canPayActivatedCardImplementationCosts(
          state,
          "runner",
          sourceCardId,
          socketAbility,
        ),
      ).toThrow("runtime_invalid_central_virus_counter_amount");
      expect(() =>
        payActivatedCardImplementationCosts(
          deps,
          state,
          legalAction,
          "runner",
          sourceCardId,
          socketAbility,
        ),
      ).toThrow("runtime_invalid_central_virus_counter_amount");
      expect(state).toEqual(before);
      expect(legalAction.payload).toEqual({});
    },
  );
});
