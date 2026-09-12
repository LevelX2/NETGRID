import { describe, expect, it } from "vitest";
import type { PlayerView, ServerId } from "@netgrid/shared";
import { choiceOptionPresentationLabel } from "./action-board-ui";

type Choice = NonNullable<PlayerView["pendingChoice"]>;

const choice: Choice = {
  choiceId: "purge_targets",
  side: "corp",
  source: "card_implementation.agenda_purge_install_targets:agenda:ice:8",
  presentationKey: "security_purge_targets",
  prompt: "Security Purge",
  kind: "select_option",
  options: [],
  minSelections: 1,
  maxSelections: 1,
  stateVersion: 8,
  visibility: "hidden_info_barrier",
};

function targetOption(
  serverId: ServerId,
  variant = "fixed",
): Choice["options"][number] {
  return {
    id: `agenda_purge_ice_${serverId}_${variant}`,
    label: "Chihuahua rezzen",
    value: `ice|${serverId}|${variant}`,
    metadata: {
      cardTitle: "Chihuahua",
      targetServerId: serverId,
      optionKind: variant,
      creditCost: 0,
    },
  };
}

describe("Security Purge target labels", () => {
  it.each([
    [
      "de",
      [
        "In HQ installieren",
        "In R&D installieren",
        "In den Archiven installieren",
        "In Remote 1 installieren",
        "In einem neuen Remote installieren",
      ],
    ],
    [
      "en",
      [
        "Install in HQ",
        "Install in R&D",
        "Install in Archives",
        "Install in Remote 1",
        "Install in a new remote",
      ],
    ],
    [
      "fr",
      [
        "Installer dans HQ",
        "Installer dans R&D",
        "Installer dans les Archives",
        "Installer dans Serveur distant 1",
        "Installer dans un nouveau serveur distant",
      ],
    ],
  ] as const)(
    "distinguishes every destination in %s instead of repeating the ICE title",
    (locale, expected) => {
      const labels = (
        ["hq", "rd", "archives", "remote_1", "new_remote"] as const
      ).map((server) =>
        choiceOptionPresentationLabel(choice, targetOption(server), locale),
      );
      expect(labels).toEqual(expected);
      expect(new Set(labels).size).toBe(5);
    },
  );

  it("keeps special rez variants distinguishable at the same destination", () => {
    const subtype = targetOption("rd", "alternate_subtype:sentry");
    subtype.metadata = { ...subtype.metadata, targetTitle: "Sentry,AP" };
    expect(
      [
        targetOption("rd"),
        targetOption("rd", "x_strength:3"),
        targetOption("rd", "paid_end_the_run_subroutines:2"),
        subtype,
      ].map((option) => choiceOptionPresentationLabel(choice, option, "de")),
    ).toEqual([
      "In R&D installieren",
      "In R&D installieren (X=3)",
      "In R&D installieren (2 ETR-Subroutinen)",
      "In R&D installieren (Sentry/AP)",
    ]);
  });

  it("preserves card names for the separate free-rez choice and revealed cards", () => {
    expect(
      choiceOptionPresentationLabel(
        { ...choice, presentationKey: "free_rez_ice" },
        targetOption("hq"),
        "de",
      ),
    ).toBe("Chihuahua rezzen");
    expect(
      choiceOptionPresentationLabel(
        choice,
        {
          id: "agenda_purge_revealed_ice",
          label: "Chihuahua",
          value: "ice",
          selectable: false,
        },
        "de",
      ),
    ).toBe("Chihuahua");
  });
});
