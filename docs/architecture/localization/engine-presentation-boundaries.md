# Präsentation an Engine- und Servergrenzen

Stand: 2026-09-13. Klassifikation des verbleibenden Präsentationsvertrags,
keine pauschale Migration technischer Texte.

| Familie | Erzeuger und Consumer | Einordnung und Entscheidung |
| --- | --- | --- |
| Deckvalidierung | `packages/decks/src/index.ts` → `apps/web/features/decks/DeckValidationSummary.tsx` | Echte Nutzerpräsentation, inzwischen auf strukturierte `issues` mit Codes, Schweregrad und Parametern umgestellt. Rohe Diagnosen werden nicht gerendert. |
| Deck-Matchstartprüfung | `apps/web/app/page.tsx`, `validateDeckForMatch` → Fehlerzustand | Deckname und lokalisierte Issue-Details verwenden denselben Formatter wie die Summary; keine zweite Satz-/Regexautorität. |
| API-Spielerfehler | `ApiUserErrorCode` → `i18n/presentation.ts` → `localizedUserError` / `applyServerMessage` | Bereits lokalisierte Codes. Englische Serverdiagnose ist keine zusätzliche normale Textautorität. Kein pauschales Ersetzen oder Übersetzen von Codes. |
| LegalAction-Labels | z. B. `game/turn/runner-draw-actions.ts` → Action-Präsentation | Technische Engine-Labels neben den semantischen Action-Fakten. Normale Buttons konsumieren die lokalisierte Actiondarstellung. Keine Locale in Engine, Action-ID oder Replay einführen. |
| Choice-Prompts | `game/view/choice-view.ts` → `choicePromptPresentationLabel` | Lokalisierte Deskriptoren; Select-option-Erzeuger besitzen ein bestehendes Source-Gate. Raw-Return allein ist ohne erreichbaren und unklassifizierten Producer noch kein belegtes Migrationspaket. |
| Choice-Kartentitel | sichtbare `option.card.title` und reine Kartenlabels | Originale Kartentitel bleiben zulässige Ausnahme. Allgemeine Optionen müssen dagegen durch ihre Präsentationssemantik lokalisiert werden. |
| Choice-Beträge | `generic_bid_amount` → `choiceOptionPresentationLabel` | Generische Zahlenoptionen werden aus dem side-sicheren numerischen `option.value` nach Locale formatiert, auch bei `hide_…` und `guess_…` von Social Engineering. Explizite `bid_…`-Optionen behalten ihren Gebotstext. Rohe Labels werden nicht als Zahlenquelle geparst. |
| Privilegierte KI-Diagnose | Debug-Fehler in `page.tsx` → `features/debug` | Zulässige Diagnoseprosa nach bestehender Ausnahmeregistry. Kein neuer normaler Nutzerpfad daraus ableiten. |
| Match-/Snapshot-IDs, Hashes, technische Capability-Keys | Engine, Decks, Server → Diagnose bzw. technische Felder | Machine-Daten; unverändert und locale-neutral. |

## Gates und begrenzte Nacharbeit

`check:i18n` prüft 2431 gleiche Message-Keys in drei Sprachen und 68
kontrollierte Oberflächen: JSX-Literale, ausgewählte sichtbare Attribute,
unmittelbare `setNotice`-Literale sowie jetzt die gemeinsame Issue-Darstellung
in Decksummary und lokalem Matchstart. Eine vollständige dynamische
Datenflussanalyse ist das nicht. Neue Nutzerflächen benötigen weiterhin
einen geprüften Producer-/Consumer-Vertrag.

Die bestehende `i18n-exceptions.json` erlaubt privilegierte Debug-/Katalog-
Diagnosen und gedruckten Karteninhalt. Die normale Deckvalidierung ist keine
Ausnahme und wird auch nicht nachträglich als solche eingetragen.

Der konkrete Umsetzungsschnitt ist abgeschlossen: strukturierte Codes mit
side-sicheren Parametern im bestehenden Deck-Owner, ein gemeinsamer Formatter
für DE/EN/FR und die beiden normalen Consumer. Das fokussierte Gate verhindert
nun rohe Validierungsarrays an diesen Consumers. Der genaue Vertrag steht in
[Deckformat-Validierung](../deck-library/format-validation.md).
Ein generelles Verbot englischer Engine-Strings würde dagegen
technische Diagnose und Karteninhalt falsch behandeln und wird nicht eingeführt.

Regeln, LegalActions, Sichtbarkeit, RNG, Match-StateHash und Replay bleiben
unberührt. Snapshot-Validierungsmetadaten sind keine zweite Regelautorität;
aktuelle V0-Fixtures dürfen bei einer Vertragsumstellung neu erzeugt werden.
