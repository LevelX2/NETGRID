import { createGameAfterSetup, getPlayerView } from "@netgrid/engine";
import type { GameState, Side } from "@netgrid/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "use-intl/react";
import { describe, expect, it } from "vitest";
import {
  apply,
  MECHANIC_SMOKE_DECKS,
  putCorpIceOnServer,
  toRunnerTurn,
} from "../../../../packages/engine/src/test-fixtures/mechanic-smoke-fixtures";
import de from "../../messages/de.json";
import { actionSlotSideForView } from "./board-view-helpers";
import { ActiveMatchResourceStrip } from "./ResourceStrip";

function renderStrip(state: GameState, side: Side) {
  const view = getPlayerView(state, side);
  return renderToStaticMarkup(
    <IntlProvider locale="de" messages={de} timeZone="UTC">
      <ActiveMatchResourceStrip
        view={view}
        actionCapacities={{ corp: 3, runner: 4 }}
        agendaPointsToWin={view.agendaPointsToWin}
        ariaHidden={false}
      />
    </IntlProvider>,
  );
}

describe("turn actions in the resource strip", () => {
  it.each([
    ["corp_draw_phase", "runner", "corp"],
    ["corp_action_phase", "runner", "corp"],
    ["corp_discard_phase", "runner", "corp"],
    ["runner_action_phase", "corp", "runner"],
    ["runner_discard_phase", "corp", "runner"],
    ["setup", "runner", "runner"],
    ["game_over", "corp", "corp"],
  ] as const)(
    "shows %s with priority held by %s using the %s meter",
    (phase, activeSide, expected) => {
      expect(actionSlotSideForView({ phase, activeSide })).toBe(expected);
    },
  );

  it("keeps the Runner's remaining actions visible to both players while the Corp decides whether to rez Quandary", () => {
    const corpDeck = MECHANIC_SMOKE_DECKS.globalModifiers.corp;
    const corpTurn = createGameAfterSetup({
      seed: "resource-strip-quandary",
      corpDeck: {
        ...corpDeck,
        cards: [...corpDeck.cards, { id: 473, quantity: 1 }],
      },
    });
    const runnerTurn = toRunnerTurn(corpTurn);
    const ice = putCorpIceOnServer(runnerTurn, "hq", 473);
    const approach = apply(
      runnerTurn,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(approach.activeSide).toBe("corp");
    const encounter = apply(
      approach,
      "corp",
      (action) => action.type === "rez_ice" && action.source === ice,
    );

    for (const side of ["corp", "runner"] as const) {
      expect(renderStrip(corpTurn, side)).toContain("Korp am Zug");
      expect(renderStrip(runnerTurn, side)).toContain(
        "Runner am Zug, 4 Aktionen",
      );
      for (const runState of [approach, encounter]) {
        const strip = renderStrip(runState, side);
        expect(strip).toContain("Runner am Zug, 3 Aktionen");
        expect(strip).toContain("resourceStripTurn side-runner");
        expect(strip.match(/class="actionSlot available\b/g)).toHaveLength(3);
        expect(strip.match(/class="actionSlot spent\b/g)).toHaveLength(1);
      }
    }
  });
});
