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
| Social-Engineering-Chronik | öffentliche `amounts`-/`targets`-Ergebnisdaten → semantischer Chronikformatter | DE/EN/FR zeigen nach dem Korp-Guess beide Beträge, richtig/falsch und Creditverlust beziehungsweise Zielwahl/fehlendes ICE. Die anschließende Zielwahl nennt Server und ICE-Position. Die vorangehende geheime Betragswahl bleibt unterdrückt; fehlende Ergebnisdaten werden ausdrücklich benannt. |
| Privilegierte KI-Diagnose | Debug-Fehler in `page.tsx` → `features/debug` | Zulässige Diagnoseprosa nach bestehender Ausnahmeregistry. Kein neuer normaler Nutzerpfad daraus ableiten. |
| Match-/Snapshot-IDs, Hashes, technische Capability-Keys | Engine, Decks, Server → Diagnose bzw. technische Felder | Machine-Daten; unverändert und locale-neutral. |

## Gates und begrenzte Nacharbeit

`check:i18n` prüft 2444 gleiche Message-Keys in drei Sprachen und 68
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

## Semantische Chronikdetails und Regressionen

`formatChronicleEvent` verwendet bei gesetztem `context.translate` direkt
`formatSemanticChronicleEvent`. Die Spezialfälle des älteren deutschen
Formatters werden dabei nicht automatisch übernommen. Der produktive Pfad
bindet deshalb `chronicle-detail-presentation.ts` für strukturierte
Ereignisdetails, Zusatzinformationen und Effektergebnisse ein.

Die Formatierung in DE/EN/FR umfasst insbesondere:

- Würfel und Wahlfolgen (Social Engineering, Playful AI, Blink, Startzugwürfe),
  erfolgreiche und fehlgeschlagene Breaks sowie Run-Ende ohne ICE-Passieren;
- Umleitungen, Rücksetzen, Begegnungskosten, Run-Sperren und zusätzliche
  Begegnungen sowie Trace-Gebote und ihre Folgen;
- Aufdecken, Zugriffsaustausch, Gypsy-Agenda nach HQ, Such- und
  Installationsschritte, MU-Bereinigung, temporäre Installationen und Rückgaben;
- Agenda-Aktionen, Counter-Ziele, Purge/Aktionsschuld, installierte und
  wiederkehrende Credits, Kosten und öffentliche Karteneffekte;
- ursprünglichen, verhinderten und verbleibenden Subroutinenschaden sowie
  öffentliche Folgen von Zugriffseffekten.

Karteneffekte, die mit einem Spieleintrag zusammengefasst werden, stehen mit
ihrem tatsächlichen Ergebnis im Titel und bleiben damit auch im einfachen
Chronikmodus sichtbar. Unterstützende Informationen (etwa Zahlungsquellen,
MU danach oder Listen aufgedeckter Karten) stehen in der Beschreibung.
Geplante Mengen sind kein Ergebnis: Bei unterbrochenem Kartenziehen zählt
`resolvedEffects[].amount`, nicht die ursprünglich geplante `drawCardsAmount`.
Verzögertes Agenda-Stehlen darf noch keine gewonnenen Agendapunkte melden.

Nur öffentliche oder für die Betrachtungsseite freigegebene Ereignisfelder
sind Datenquellen. Texte aus `label`, Regeltexten oder KI-Begründungen werden
nicht als Mechanikergebnisse geparst. Verdeckte Bewegungen behalten ihre
Redaktion, einschließlich entfernter Kartenmetadaten. Öffentliche
Zugriffsschäden, getrashte installierte Programme und Zugriffscounter werden
anhand ihres strukturierten Zugriffskontexts beschrieben; die Ausnahme wird
nicht auf beliebige private Effekte erweitert.

`chronicle-detail-localization.test.ts` prüft 419 Ereignis- und Effektfälle
mit echten Übersetzern in allen drei Sprachen. Die Fixture entstand aus dem
Abgleich der bestehenden Chroniktests; historische Playful-AI-Feldaliasse und
rein labelbasierte Ableitungen gehören nicht zum aktuellen V0-Vertrag.
Zusätzliche Ergebnisprüfungen sichern Würfelfolgen, Blink/Dropp, Gypsy,
Schadensverhinderung, Umleitungen, tatsächliche Ziehmengen, MU, Kosten,
Trace-Sperren und Counter-Ziele ab. Social Engineering und weitere gemeinsame
Pfade bleiben außerdem durch `chronicle-localization.test.ts` abgesichert.
Tests ohne Translator allein belegen den produktiven Informationsgehalt nicht.

Das I18N-Gate liest ICU-Parameter aus dem Parser-AST, einschließlich
verschachtelter Auswahl- und Pluralzweige. Einfache Wörter in Zweigtexten
(z. B. `1 {Credit}`) sind keine Parameter. Der Parser wird bereits von der
Übersetzungslaufzeit verwendet und ist für das Gate explizit deklariert;
`node --test scripts/lib/icu-parameters.test.mjs` prüft diesen Vertrag.
