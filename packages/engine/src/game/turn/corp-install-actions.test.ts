import type { CardInstanceId } from "@netgrid/shared";
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

    expect(buildCorpNewRemoteRootInstallAction(state, cardId, 3)).toMatchObject({
      actionId: "corp.install_card.corp_root_test.new_remote.corp_root_test",
      side: "corp",
      type: "install_card",
      label: "Karte in neuem Remote installieren",
      source: cardId,
      costs: [{ clicks: 1, credits: 3 }],
      payload: { cardId, serverId: "new_remote", placement: "root" },
      visibility: "private_to_actor",
    });
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
});
