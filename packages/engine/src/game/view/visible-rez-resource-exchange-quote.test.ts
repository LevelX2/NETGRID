import type { CardInstanceId, GameState, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { visibleCorpIceRezResourceExchangeQuote } from "./visible-rez-resource-exchange-quote";

const FILTER = "onr_v1_244_filter";
const RENT_I_CON = "onr_classic_031_rent-i-con";
const VEWY_VEWY_QUIET = "onr_v1_071_vewy-vewy-quiet";
const CHIBA_BANK_ACCOUNT = "onr_proteus_133_chiba-bank-account";
const FILTER_ID = "resource_exchange_filter" as CardInstanceId;
const RENT_I_CON_ID = "resource_exchange_rent_i_con" as CardInstanceId;
const VEWY_VEWY_QUIET_ID =
  "resource_exchange_vewy_vewy_quiet" as CardInstanceId;
const CONCEALED_RESOURCE_ID =
  "resource_exchange_concealed_resource" as CardInstanceId;

describe("visible Corp ICE rez resource exchange quote", () => {
  it("certifies the visible Filter/Rent-I-Con current-run exchange", () => {
    const { state, visibleIce } = resourceExchangeState();

    expect(
      visibleCorpIceRezResourceExchangeQuote(state, FILTER_ID, visibleIce),
    ).toEqual({
      context: "installed",
      cardId: FILTER_ID,
      targetServerId: "rd",
      projectedServerId: "rd",
      expiresAtStateVersion: state.stateVersion,
      complete: true,
      runnerBreak: {
        breakerCardId: RENT_I_CON_ID,
        breakerDefinitionId: RENT_I_CON,
        requiredCredits: 1,
        pumpCredits: 0,
        breakCredits: 1,
        breakUses: 1,
        normalCreditsRequired: 1,
        nonNormalRunCreditsApplied: 0,
        canPayFromCurrentCredits: true,
        paymentEvidenceSource: "engine_icebreaker_ability",
        consumedCards: [
          {
            cardId: RENT_I_CON_ID,
            definitionId: RENT_I_CON,
            kind: "trash_at_run_end_after_break",
            evidenceSource: "engine_icebreaker_ability",
          },
        ],
      },
    });
  });

  it("certifies the exact current encounter on a layered server", () => {
    const { state, visibleIce } = resourceExchangeState();
    state.corp.servers
      .find((server) => server.id === "rd")!
      .ice.push("other_ice" as CardInstanceId);

    expect(
      visibleCorpIceRezResourceExchangeQuote(state, FILTER_ID, visibleIce),
    ).toMatchObject({ complete: true });
  });

  it("fails closed when the requested ICE is not the exact approached layer", () => {
    const { state, visibleIce } = resourceExchangeState();
    state.run!.approachedIceId = "other_ice" as CardInstanceId;

    expect(
      visibleCorpIceRezResourceExchangeQuote(state, FILTER_ID, visibleIce),
    ).toMatchObject({ complete: false });
  });

  it("uses eligible run-credit pools while ignoring an inactive concealed resource", () => {
    const { state, visibleIce } = resourceExchangeState();
    state.runner.credits = 0;
    state.runner.rig.programs.push(VEWY_VEWY_QUIET_ID);
    state.cardInstances[VEWY_VEWY_QUIET_ID] = {
      instanceId: VEWY_VEWY_QUIET_ID,
      definitionId: VEWY_VEWY_QUIET,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
      counters: { bit: 2 },
    };
    state.runner.rig.resources.push(CONCEALED_RESOURCE_ID);
    state.cardInstances[CONCEALED_RESOURCE_ID] = {
      instanceId: CONCEALED_RESOURCE_ID,
      definitionId: CHIBA_BANK_ACCOUNT,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };

    expect(
      visibleCorpIceRezResourceExchangeQuote(state, FILTER_ID, visibleIce),
    ).toMatchObject({
      complete: true,
      runnerBreak: {
        breakerCardId: RENT_I_CON_ID,
        requiredCredits: 1,
        normalCreditsRequired: 0,
        nonNormalRunCreditsApplied: 1,
        canPayFromCurrentCredits: true,
      },
    });
  });
});

function resourceExchangeState(): {
  state: GameState;
  visibleIce: VisibleCard;
} {
  const state = createGame({
    seed: "visible-rez-resource-exchange-quote",
    setupMode: "completed",
  });
  state.stateVersion = 12;
  state.runner.credits = 1;
  state.corp.servers.find((server) => server.id === "rd")!.ice.push(FILTER_ID);
  state.cardInstances[FILTER_ID] = {
    instanceId: FILTER_ID,
    definitionId: FILTER,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId: "rd" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  state.runner.rig.programs.push(RENT_I_CON_ID);
  state.cardInstances[RENT_I_CON_ID] = {
    instanceId: RENT_I_CON_ID,
    definitionId: RENT_I_CON,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  state.run = {
    runId: "resource_exchange_run",
    attackedServerId: "rd",
    phase: "approach_ice",
    position: { kind: "ice", serverId: "rd", iceIndex: 0 },
    approachedIceId: FILTER_ID,
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    successful: false,
  };
  return {
    state,
    visibleIce: {
      instanceId: FILTER_ID,
      known: true,
      definitionId: FILTER,
      type: "ice",
      subtypes: ["code gate"],
      strength: 0,
      owner: "corp",
      controller: "corp",
      rezzed: false,
    },
  };
}
