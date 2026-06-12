import { describe, expect, it } from "vitest";
import { isSecurityPurgeInstallTargetChoiceSource } from "./security-purge-sequence";

describe("security purge sequence routing", () => {
  it("recognizes install-target choice sources", () => {
    expect(
      isSecurityPurgeInstallTargetChoiceSource(
        "v1922.security_purge_install_targets:security_purge_agenda:ice_1,asset_1:8",
      ),
    ).toBe(true);
    expect(
      isSecurityPurgeInstallTargetChoiceSource(
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
      ),
    ).toBe(false);
  });
});
