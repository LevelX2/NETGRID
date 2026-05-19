# V1 CardImplementation Migration Waves

Stand: 2026-05-19. Dieses Dokument priorisiert die Migration des V1-Kartenpools nach Architekturgewinn und Risiko. Es ist keine Aufforderung, mehrere Wellen in einem Schritt umzusetzen. Die konkreten Kartenzuordnungen werden aus dem am 2026-05-19 gegen Originalspoiler validierten Inventory abgeleitet.

## Welle 0: Stabilisierung der bestehenden Tranche

Ziel: Dokumentation, Coverage, Registry und Review-Regeln stabil halten. Keine neuen Karten oder Mechaniken.

POCs/Arbeitspakete: Registry-Duplicate-Schutz, automatisierbare Kommentar-/Coverage-Checks, Tranche-Dokumentation aktuell halten.

Tests: Coverage/Registry-Konsistenz, keine doppelten CardDefinitionIds, card name/text Kommentare in konkreten Dateien.

## Welle 1: Weitere einfache on_play Karten

Pilotkarten: eine eindeutige lose-credit Operation/Prep, eine eindeutige remove-tag Karte, eine simple damage Karte nur als separater Damage-POC.

Bausteine: vorhandene gain/draw/ordered effects; fehlend lose_credits, tags, damage, trash/reveal/search.

Nicht mitmachen: targets, reveal/search, run replacement, triggers.

## Welle 2: Weitere activated abilities mit vorhandenen Effects

Pilotkarten: eine Runner-installed action ability mit gain/draw; eine Corp rezzed-root action ability mit gain/draw; danach erst credit/trash cost als eigener POC.

Bausteine: vorhanden activated_card_ability/action cost; fehlend credit/trash/counter/agenda-point costs, limits, target binding.

Nicht mitmachen: Trigger Registry, Target Binding, recurring credits.

## Welle 3: Passive modifiers

Pilotkarten: MRAM Chip / Militech MRAM Chip für hand_size; einfacher link/MU modifier; trash_cost oder agenda_difficulty erst nach Scope-Klärung.

Bausteine: vorhanden rezzed corp-root query, rez_cost, install_cost, ice_strength, additional_subroutine; fehlend Runner-installed query, hand_size, memory_units, link, trash_cost, agenda_difficulty, trace/run/access cost modifiers.

## Welle 4: On-install / on-rez / turn lifecycle triggers

Pilotkarten: Loan from Chiba als reichhaltiger, aber riskanter Lifecycle-Pilot; kleinere on-install gain/counter Karte falls eindeutig; start-of-turn take-credit Karte nach Countermodell.

Bausteine: Trigger Registry/event dispatcher, lifecycle trigger definitions, persistent counters/debt state, leave_play effects.

## Welle 5: Run and access replacement

Pilotkarten: fixed-server run event; simple successful-run replacement; Corporate Negotiating Center erst W7 wegen Hidden Info.

Bausteine: make_run, run target binding, access replacement/resolvedEffects, replacement priority, stale run state handling.

## Welle 6: ICE/subroutine system

Pilotkarten: Tesseract Fort Construction nur bei kleiner Erweiterung; Tutor nur bei klarer repeated-subroutine-Semantik; Startup Immolator kreuzt W5/W6.

Bausteine: vorhanden public ETR additional_subroutine; fehlend repeated_subroutine, replacement, cannot_break, trace/damage/trash typed subroutine effects.

## Welle 7: Reveal / expose / hidden information

Pilotkarten: Corporate Negotiating Center; simple expose installed card; look-at-top without rearrange before search/shuffle.

Bausteine: hidden-zone query DSL, public redaction, private player payload, reveal/expose distinction, chronicle redaction, search/shuffle replay records.

## Welle 8: Target binding

Pilotkarten: Restrictive Net Zoning; one-shot choose-installed-card effect; choose-ICE effect after ICE target helpers.

Bausteine: target descriptor DSL, selection LegalAction flow, public/private labels, stale target revalidation, persistent target cleanup.

## Welle 9: Region / uniqueness / replacement rules

Pilotkarten: Jerusalem City Grid first; another City Grid only after Jerusalem model is reviewed.

Bausteine: region type/rules, install precondition can-pay-rez, replacement/trash older region, server-scoped uniqueness.

## Welle 10: High-complexity cards

Pilotkarten: Olivia Salazar if timing system exists; Loan from Chiba if lifecycle and lose condition are ready; random/die card only after seeded random records are designed.

Bausteine: depends on W4-W9 primitives and deterministic replay support.

## Abhängigkeitsmatrix

| Primitive / Infrastruktur | Benötigt von | Hängt ab von | Hinweise |
|---|---|---|---|
| gain_credits | simple economy cards, Newsgroup Filter | effect-interpreter | vorhanden |
| draw_cards | draw cards, ESA Contract | draw host primitive, hidden-info redaction | vorhanden |
| ordered effects | mixed on_play cards | effect aggregation | vorhanden |
| activated_card_ability | installed action abilities | LegalAction generation/revalidation | vorhanden für action cost |
| rez_cost | Data Masons, Encoder, Skälderviken, Jerusalem | rezzed corp-root modifier query | vorhanden |
| install_cost | Fortress Architects | Corp ICE install quote | vorhanden für Corp ICE |
| ice_strength | Data Masons, Jerusalem | strength calculation | vorhanden für Corp ICE |
| additional_subroutine | Encoder, future Tesseract/Tutor-like cards | dynamic subroutine list, attribution, break/resolve | vorhanden nur public ETR after_existing |
| hand_size | MRAM/Militech MRAM | Runner-installed passive modifier query | fehlt |
| memory_units/hosting | many Runner programs/hardware | install legality, MU accounting | fehlt |
| link | link hardware/resources | Runner passive query | fehlt |
| trace | many ICE/resources/actions | trace bidding/resolution | fehlt |
| damage | ICE/subroutines/events | damage host primitive, prevention windows | fehlt |
| trash_card | many effects/costs | target binding, zone movement | fehlt |
| counters/hosted credits | recurring/counter cards | persistent card state, refresh timing | fehlt |
| Trigger Registry | lifecycle/run/access cards | timing model and ordering | fehlt |
| Target Binding | choose-card/server/ICE effects | target descriptors, public labels | fehlt |
| Reveal/Search | hidden-info cards | redaction, private payloads, replay records | fehlt |
| Region System | Jerusalem and City Grids | server install/replacement rules | fehlt |
| Seeded random/dice effect | random cards | random records and replay | fehlt |

## Coverage-Regeln

- Jede V1-Karte muss in Coverage erscheinen.
- Jede konkrete CardImplementation braucht Coverage `implemented` oder `partial_implementation`.
- `partial_implementation` nennt fehlende Textteile.
- `legacy_engine_special_case` nennt den aktuellen Implementierungsort.
- `pending_implementation` ist konservativ und muss bei Bearbeitung präzisiert werden.
- `no_engine_behavior_required` wird nur gesetzt, wenn die Karte sicher keine Engine-Wirkung braucht.

## Teststrategie für jede Migration

- LegalAction erscheint im richtigen Timing und nicht im falschen Timing.
- Kosten werden korrekt angezeigt und vor Wirkung revalidiert.
- Wirkung tritt exakt einmal ein.
- Alte Resolver erzeugen keinen Doppeleffekt.
- PublicPayload bleibt kompatibel.
- PlayerView leakt keine Hidden Info.
- Chronik hat Kartenbezug.
- ResolvedEffects sind typisiert.
- Replay/StateHash bleiben stabil, wenn Resolve-Pfade betroffen sind.
- Coverage ist korrekt und Registry enthält keine doppelten IDs.
- Negativfälle und stale action/source/target/quote werden getestet.

## Arbeitsregeln für zukünftige Codex-Threads

- Zuerst Zielbilddokument lesen.
- Zuerst CardImplementation-Coverage prüfen.
- Keine neue Kartenlogik in `index.ts`, wenn CardImplementation möglich ist.
- Keine Mechanik-Sammeldateien.
- Pro Karte eine konkrete Datei.
- Generische Bausteine in `ability-engine`.
- Keine ausführbare Engine-Logik in Shared/CardDefinition.
- Kommentare mit `card name` / `text`.
- Kein Doppeleffekt durch Legacy plus neue Implementation.
- Tests vor und nach Migration.
- Bei Unsicherheit `partial_implementation` oder `pending_implementation`, nicht falsches `implemented`.
