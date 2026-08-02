import {
  CARD_DEFINITIONS_BY_ID,
  CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION,
  type CardInstanceId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildCorpNewRemoteIceInstallAction,
  buildCorpNewRemoteRootInstallAction,
  buildCorpServerIceInstallAction,
  buildCorpServerRootInstallAction,
} from "./corp-install-actions";

describe("corp install main actions", () => {
  it("builds a hidden-info-safe new-remote ICE install action", () => {
    const state = createGame({
      seed: "arch-7-corp-new-remote-ice-install",
      setupMode: "completed",
    });
    const cardId = "corp_ice_test" as CardInstanceId;

    expect(buildCorpNewRemoteIceInstallAction(state, cardId)).toMatchObject({
      actionId: "corp.install_card.corp_ice_test.new_remote.corp_ice_test",
      side: "corp",
      type: "install_card",
      label: "ICE vor neuem Remote installieren",
      source: cardId,
      costs: [{ clicks: 1 }],
      payload: { cardId, serverId: "new_remote", placement: "ice" },
      targetRequirements: [],
      visibility: "private_to_actor",
    });
  });

  it("builds an existing-server ICE install action with stable cost payload", () => {
    const state = createGame({
      seed: "arch-7-corp-server-ice-install",
      setupMode: "completed",
    });
    const cardId = "corp_ice_test" as CardInstanceId;

    expect(
      buildCorpServerIceInstallAction(
        state,
        cardId,
        { id: "hq", label: "HQ" },
        {
          baseCost: 1,
          additionalCost: 2,
          reduction: 1,
          reductionSourceDefinitionIds: "reducer",
          increaseSourceDefinitionIds: "increaser",
          totalCost: 2,
        },
      ),
    ).toMatchObject({
      actionId: "corp.install_card.corp_ice_test.hq.corp_ice_test.2.reducer",
      side: "corp",
      type: "install_card",
      label: "ICE vor HQ installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 2 }],
      payload: {
        cardId,
        serverId: "hq",
        placement: "ice",
        iceInstallBaseCost: 1,
        iceInstallAdditionalCost: 2,
        iceInstallReduction: 1,
        iceInstallReductionSourceDefinitionIds: "reducer",
        iceInstallIncreaseSourceDefinitionIds: "increaser",
        iceInstallTotalCost: 2,
      },
      visibility: "private_to_actor",
    });
  });

  it("builds a new-remote root install action without revealing card identity in the label", () => {
    const state = createGame({
      seed: "arch-7-corp-new-remote-root-install",
      setupMode: "completed",
    });
    const cardId = "corp_root_test" as CardInstanceId;

    expect(buildCorpNewRemoteRootInstallAction(state, cardId, 3)).toMatchObject(
      {
        actionId: "corp.install_card.corp_root_test.new_remote.corp_root_test",
        side: "corp",
        type: "install_card",
        label: "Karte in neuem Remote installieren",
        source: cardId,
        costs: [{ clicks: 1, credits: 3 }],
        payload: { cardId, serverId: "new_remote", placement: "root" },
        visibility: "private_to_actor",
      },
    );
  });

  it("builds an existing-server root install action with replacement markers", () => {
    const state = createGame({
      seed: "arch-7-corp-server-root-install",
      setupMode: "completed",
    });
    const cardId = "corp_root_test" as CardInstanceId;

    expect(
      buildCorpServerRootInstallAction(
        state,
        cardId,
        { id: "remote_1", label: "Remote 1" },
        0,
        { replacesRootAsset: true, replacesRegion: true },
      ),
    ).toMatchObject({
      actionId: "corp.install_card.corp_root_test.remote_1.corp_root_test",
      side: "corp",
      type: "install_card",
      label: "Karte in Remote 1 installieren",
      source: cardId,
      costs: [{ clicks: 1 }],
      payload: {
        cardId,
        serverId: "remote_1",
        placement: "root",
        rootReplacement: "asset_to_agenda",
        regionReplacementWarning: true,
      },
      visibility: "private_to_actor",
    });
  });

  it("certifies the exact post-install agenda score click horizon", () => {
    const state = createGame({
      seed: "corp-agenda-install-score-horizon",
      setupMode: "completed",
    });
    const agendaId = Object.values(state.cardInstances).find((instance) => {
      const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
      return (
        instance.owner === "corp" &&
        definition?.type === "agenda" &&
        (definition.advancementRequirement ?? 0) > 0
      );
    })?.instanceId;
    if (!agendaId) throw new Error("Expected a Corp agenda");
    const requirement =
      CARD_DEFINITIONS_BY_ID[state.cardInstances[agendaId]!.definitionId]!
        .advancementRequirement!;
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    state.corp.clicks = 1;
    const previousActionDebt = state.corpActionDebt;
    state.corpActionDebt = { forgoActionsPending: 3, entries: [] };

    const unbounded = buildCorpServerRootInstallAction(
      state,
      agendaId,
      { id: "remote_1", label: "Remote 1" },
      0,
    );
    expect(unbounded.payload).toMatchObject({
      agendaInstallScoreHorizonQuoteSchemaVersion:
        CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION,
      agendaInstallScoreHorizonQuoteComplete: false,
      agendaInstallScoreHorizonQuoteCardId: agendaId,
      agendaInstallScoreHorizonQuoteTargetServerId: "remote_1",
      agendaInstallScoreHorizonQuoteAdvancementRequirement: requirement,
      agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: 0,
      agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn:
        requirement,
      agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks: 0,
    });

    if (previousActionDebt) state.corpActionDebt = previousActionDebt;
    else delete state.corpActionDebt;
    state.corp.clicks = requirement + 1;
    const bounded = buildCorpServerRootInstallAction(
      state,
      agendaId,
      { id: "remote_1", label: "Remote 1" },
      0,
    );
    expect(bounded.payload).toMatchObject({
      agendaInstallScoreHorizonQuoteComplete: true,
      agendaInstallScoreHorizonQuoteAdvancementRequirement: requirement,
      agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: requirement,
      agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: 0,
    });
  });
});
