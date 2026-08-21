import { describe, expect, it } from "vitest";

import {
  deckDoctrineRoleIsAgenda,
  deckDoctrineRoleIsBreaker,
  deckDoctrineRoleIsIce,
  rolesForDeckDoctrineCard,
} from "./deck-doctrine-card-roles";
import { AI_HINTS_BY_CARD } from "./ai-hints";

describe("deck doctrine card role classification", () => {
  it("matches agenda roles by bounded role terms", () => {
    expect(deckDoctrineRoleIsAgenda("agenda")).toBe(true);
    expect(deckDoctrineRoleIsAgenda("agenda_2pt")).toBe(true);
    expect(deckDoctrineRoleIsAgenda("corp_score_agenda")).toBe(true);
    expect(deckDoctrineRoleIsAgenda("agendaish_asset")).toBe(false);
    expect(deckDoctrineRoleIsAgenda("agenda_fast_advance")).toBe(false);
    expect(deckDoctrineRoleIsAgenda("remote_agenda_protection")).toBe(false);
  });

  it("matches breaker roles by bounded role prefixes", () => {
    expect(deckDoctrineRoleIsBreaker("breaker_fracter")).toBe(true);
    expect(deckDoctrineRoleIsBreaker("breaker_decoder")).toBe(true);
    expect(deckDoctrineRoleIsBreaker("breakerish_fracter")).toBe(false);
    expect(deckDoctrineRoleIsBreaker("icebreaker")).toBe(false);
  });

  it("matches ice roles by bounded role terms", () => {
    expect(deckDoctrineRoleIsIce("corp_install_ice")).toBe(true);
    expect(deckDoctrineRoleIsIce("barrier_ice")).toBe(true);
    expect(deckDoctrineRoleIsIce("etr_ice")).toBe(true);
    expect(deckDoctrineRoleIsIce("taxing_ice")).toBe(true);
    expect(deckDoctrineRoleIsIce("nice_noise")).toBe(false);
    expect(deckDoctrineRoleIsIce("icebreaker")).toBe(false);
  });

  it("uses generated CardSpec hint roles without runtime inference fallback", () => {
    const hint = AI_HINTS_BY_CARD.get("simple_upgrade")!;
    expect(rolesForDeckDoctrineCard("simple_upgrade")).toEqual(
      [...new Set([...hint.roles, ...hint.planRoles])].sort(),
    );
    expect(rolesForDeckDoctrineCard("simple_upgrade")).not.toContain(
      "economy_operation",
    );
  });
});
