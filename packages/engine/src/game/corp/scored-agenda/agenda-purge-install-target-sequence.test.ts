import { describe, expect, it } from "vitest";
import { isAgendaPurgeInstallTargetChoiceSource } from "./agenda-purge-install-target-sequence";

describe("security purge sequence routing", () => {
  it("recognizes install-target choice sources", () => {
    expect(
      isAgendaPurgeInstallTargetChoiceSource(
        "card_implementation.agenda_purge_install_targets:agenda_purge_agenda:ice_1,asset_1:8",
      ),
    ).toBe(true);
    expect(
      isAgendaPurgeInstallTargetChoiceSource(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
      ),
    ).toBe(false);
  });
});
