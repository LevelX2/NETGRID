# Präsentation an Engine- und Servergrenzen

Stand: 2026-09-13. Klassifikation des verbleibenden Präsentationsvertrags,
keine pauschale Migration technischer Texte.

| Familie | Erzeuger und Consumer | Einordnung und Entscheidung |
| --- | --- | --- |
| Deckvalidierung | `packages/decks/src/index.ts` → `apps/web/features/decks/DeckValidationSummary.tsx` | Echte Nutzerpräsentation: rohe `errors`/`warnings` werden als JSX angezeigt. Codes fehlen teilweise; Interpolationsparameter fehlen vollständig. Auf strukturierte Issues und lokalisierte Webdarstellung umstellen. |
| Deck-Matchstartprüfung | `apps/web/app/page.tsx`, `validateDeckForMatch` → Fehlerzustand | Zusammengesetzte Diagnose aus Deckname und `validation.errors.join` ist ebenfalls Nutzerpräsententation. Derselbe Issue-Formatter muss die Deckdetails bereitstellen; keine zweite Satz-/Regexautorität. |
| API-Spielerfehler | `ApiUserErrorCode` → `i18n/presentation.ts` → `localizedUserError` / `applyServerMessage` | Bereits lokalisierte Codes. Englische Serverdiagnose ist keine zusätzliche normale Textautorität. Kein pauschales Ersetzen oder Übersetzen von Codes. |
| LegalAction-Labels | z. B. `game/turn/runner-draw-actions.ts` → Action-Präsentation | Technische Engine-Labels neben den semantischen Action-Fakten. Normale Buttons konsumieren die lokalisierte Actiondarstellung. Keine Locale in Engine, Action-ID oder Replay einführen. |
| Choice-Prompts | `game/view/choice-view.ts` → `choicePromptPresentationLabel` | Lokalisierte Deskriptoren; Select-option-Erzeuger besitzen ein bestehendes Source-Gate. Raw-Return allein ist ohne erreichbaren und unklassifizierten Producer noch kein belegtes Migrationspaket. |
| Choice-Kartentitel | sichtbare `option.card.title` und reine Kartenlabels | Originale Kartentitel bleiben zulässige Ausnahme. Allgemeine Optionen müssen dagegen durch ihre Präsentationssemantik lokalisiert werden. |
| Privilegierte KI-Diagnose | Debug-Fehler in `page.tsx` → `features/debug` | Zulässige Diagnoseprosa nach bestehender Ausnahmeregistry. Kein neuer normaler Nutzerpfad daraus ableiten. |
| Match-/Snapshot-IDs, Hashes, technische Capability-Keys | Engine, Decks, Server → Diagnose bzw. technische Felder | Machine-Daten; unverändert und locale-neutral. |

## Gates und begrenzte Nacharbeit

`check:i18n` besteht mit 2399 gleichen Message-Keys in drei Sprachen und 68
kontrollierten Oberflächen. Das Gate prüft JSX-Literale, ausgewählte sichtbare
Attribute und unmittelbare `setNotice`-Literale. Es verfolgt keine dynamischen
`validation.errors`-Werte. Ein grüner Lauf ist daher kein Nachweis einer
vollständig lokalisierten Deckdiagnose.

Die bestehende `i18n-exceptions.json` erlaubt privilegierte Debug-/Katalog-
Diagnosen und gedruckten Karteninhalt. Die normale Deckvalidierung ist keine
Ausnahme und wird auch nicht nachträglich als solche eingetragen.

Der konkrete Umsetzungsschnitt ist `act-2026-09-13-deck-validation-presentation`:
strukturierte Codes mit side-sicheren Parametern im bestehenden Deck-Owner,
ein gemeinsamer Formatter für DE/EN/FR und die beiden normalen Consumer.
Ein fokussiertes Gate soll rohe Validierungsarrays an diesen Consumers
verhindern. Ein generelles Verbot englischer Engine-Strings würde dagegen
technische Diagnose und Karteninhalt falsch behandeln und wird nicht eingeführt.

Regeln, LegalActions, Sichtbarkeit, RNG, Match-StateHash und Replay bleiben
unberührt. Snapshot-Validierungsmetadaten sind keine zweite Regelautorität;
aktuelle V0-Fixtures dürfen bei einer Vertragsumstellung neu erzeugt werden.
