import { createTranslator } from "use-intl/core";
import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import {
  chronicleItemBelongsToSystemSetup,
  formatChronicleEffectItems,
  type ChronicleTranslate,
} from "../../app/chronicle";

const messages = { de, en, fr };
const source = {
  effectId: "subroutine_1",
  kind: "resolve_subroutine",
  visibility: "public",
  side: "runner",
  reason: "ice_subroutine",
  sourceDefinitionId: "onr_proteus_006_colonel-failure",
  sourceTitle: "Colonel Failure",
  subroutineIndex: 0,
  subroutineType: "trash_installed_program",
};

function event(
  id: number,
  actionType: string,
  payload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId: `event_${id}`,
    type: actionType,
    stateVersionBefore: id,
    stateVersionAfter: id + 1,
    stateHashAfter: "fnv1a:test",
    publicPayload: { actor: "runner", actionType, ...payload },
  };
}

function items(locale: keyof typeof messages, effect: Record<string, unknown>) {
  const translate = createTranslator({
    locale,
    messages: messages[locale],
    namespace: "Chronicle",
  }) as unknown as ChronicleTranslate;
  return formatChronicleEffectItems(
    event(1, "resolve_choice", {
      actor: "corp",
      resolvedEffects: [{ ...source, ...effect }],
    }),
    "corp",
    undefined,
    translate,
  );
}

describe("program-trash chronicle", () => {
  it.each([
    ["de", "Colonel Failure: Subroutine 1 trasht Krash."],
    ["en", "Colonel Failure: Subroutine 1 trashes Krash."],
    ["fr", "Colonel Failure : Sous-programme 1 envoie Krash à la poubelle."],
  ] as const)(
    "names the public target and subroutine in %s",
    (locale, title) => {
      expect(
        items(locale, {
          cardsTrashed: 1,
          cardDefinitionId: "krash",
          cardTitle: "Krash",
        })[0],
      ).toMatchObject({
        title,
        category: "run",
        visibility: "public",
        cardDefinitionId: "krash",
        cardTitle: "Krash",
      });
    },
  );

  it("distinguishes target selection, no trash, and payment", () => {
    expect(items("de", {})[0]?.title).toBe(
      "Colonel Failure: Subroutine 1 – Programm zum Trashing wählen.",
    );
    expect(items("de", { cardsTrashed: 0 })[0]?.title).toBe(
      "Colonel Failure: Subroutine 1 – kein Programm getrasht.",
    );
    expect(
      items("en", {
        subroutineType: "trash_installed_program_unless_runner_pays",
        cardsTrashed: 0,
        paidCredits: 2,
      })[0]?.title,
    ).toBe(
      "Colonel Failure: Subroutine 1 – The Runner paid 2 credits to prevent trashing.",
    );
    expect(
      items("en", {
        subroutineType: "trash_installed_program_unless_runner_pays",
        cardsTrashed: 1,
        cardTitle: "Krash",
      })[0]?.title,
    ).toBe("Colonel Failure: Subroutine 1 trashes Krash.");
  });

  it("diagnoses missing target identity instead of inventing a program", () => {
    expect(items("de", { cardsTrashed: 1 })[0]?.title).toBe(
      "Colonel Failure: Subroutine 1 – der Name des getrashten Programms fehlt im Ereignis.",
    );
  });

  it("keeps private target data out of the Corp chronicle", () => {
    const [item] = items("en", {
      visibility: "private_to_side",
      cardsTrashed: 1,
      cardDefinitionId: "private_program",
      cardTitle: "Private Program",
    });
    expect(item?.visibility).toBe("redacted");
    expect(JSON.stringify(item)).not.toMatch(/Private Program|private_program/);
  });

  it.each(["de", "en", "fr"] as const)(
    "keeps all three trash choices and their outcomes eligible for the active run group in %s",
    (locale) => {
      const events = [
        event(0, "start_run", {
          serverId: "remote_1",
          serverLabel: "Remote 1",
        }),
      ];
      for (const [index, cardTitle] of [
        "Krash",
        "Dwarf",
        "Wizard’s Book",
      ].entries()) {
        const effect = {
          ...source,
          effectId: `subroutine_${index + 1}`,
          subroutineIndex: index,
        };
        events.push(
          event(events.length, "continue_run", {
            encounterContinue: true,
            programTrashChoiceOpened: true,
            resolvedEffects: [effect],
          }),
          event(events.length + 1, "resolve_choice", {
            actor: "corp",
            trashedCardDefinitionId: `program_${index}`,
            trashedCardType: "program",
            trashedCount: 1,
            resolvedEffects: [
              {
                ...effect,
                cardsTrashed: 1,
                cardDefinitionId: `program_${index}`,
                cardTitle,
              },
            ],
          }),
        );
      }
      events.push(
        event(events.length, "continue_run", {
          encounterContinue: true,
          result: "ended",
          resolvedEffects: [
            {
              ...source,
              effectId: "subroutine_4",
              subroutineIndex: 3,
              subroutineType: "end_the_run",
              endedRun: true,
            },
          ],
        }),
      );
      const translate = createTranslator({
        locale,
        messages: messages[locale],
        namespace: "Chronicle",
      }) as unknown as ChronicleTranslate;
      const effects = events.flatMap((entry) =>
        formatChronicleEffectItems(entry, "corp", undefined, translate),
      );
      expect(effects).toHaveLength(7);
      for (const item of effects) {
        expect(item.category).toBe("run");
        expect(chronicleItemBelongsToSystemSetup(item)).toBe(false);
        expect(item.title).not.toMatch(
          /automatischer Effekt|automatic effect|effet automatique/,
        );
      }
      for (const title of ["Krash", "Dwarf", "Wizard’s Book"]) {
        expect(effects.filter((item) => item.cardTitle === title)).toHaveLength(
          1,
        );
      }
    },
  );
});
