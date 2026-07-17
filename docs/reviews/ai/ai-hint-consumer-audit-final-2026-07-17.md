# KI-Hint-Consumer-Audit: Abschlussreview vom 17.07.2026

## Status

Lokal nach `main` integriert.

## Anlass und Scope

Das gespeicherte Runner-Match `match_520180ba217781ad` enthielt einen
`deckSnapshot`. Der verpflichtende Audit über
`cp-5201-02-preserve-wall-breaker-d98` prüft daher alle 23 eindeutigen
Karten (45 Deckkarten) über aktiven Hint, kompilierten Hint, Inspector,
Derived Facts sowie Capability- und Strategy-Consumer.

## Befund vor der Korrektur

- Die Hintdaten von `Boostergang Connections` waren korrekt:
  `stack_search`, Setup und Wiederherstellung einer Schlüsselkarte.
- `DeckCapabilityProfile.searchAccess` konsumierte diese allgemeine
  Stack-Suche nicht als Programm-/Breaker-Zugang. Damit konnte die
  Wall-Coverage nicht als jetzt durchsuchbar gelten.
- Der gleiche Consumer klassifizierte `Schematics Search Engine` fälschlich
  als Suchwerkzeug. Das Textfallback las den Kartennamen `Search Engine`
  zusammen mit dem Kartentyp `program`, obwohl der Kartentext ausschließlich
  HQ-Access und Expose beschreibt.
- Der Deck-Audit war deshalb rot mit
  `consumer_search_without_search_semantics`.

## Umgesetzte Korrektur

- Der Search-Consumer betrachtet nur noch tatsächlichen Kartentext und
  strukturierte Rollen, nicht Titel, Karten-ID oder Typ.
- `stack_search` ist als allgemeine Suche korrekt ein Programm- und
  Breaker-Zugang. `legalNow` bleibt unverändert ausschließlich an die
  passende LegalAction des Werkzeuges gebunden.
- `Boostergang Connections` wird dadurch als Search-Tool erkannt;
  `Schematics Search Engine` nicht mehr.
- Das Audit-Script bestimmt den Repository-Root aus seinem eigenen Pfad.
  Der dokumentierte gefilterte `pnpm`-Aufruf funktioniert damit auch dann,
  wenn `pnpm` in `apps/server` ausführt.
- Der Spielanalyse-Skill erzwingt für jedes `deckSnapshot` den Deck-Audit als
  Abschlussgate. Ein fehlgeschlagener Audit darf nicht mehr als vollständig
  geprüfte Hint-/Consumer-Kette ausgegeben werden.

## Verifikation

| Check | Ergebnis |
| --- | --- |
| Audit aus gefiltertem Server-Workspace, Vorzustand | Pfadstabil; erwarteter Consumer-Finding rot |
| Deck-Audit nach Fix | grün; 23 Karten, Search-Tool nur Boostergang, 1 nichtblockierende Warnung |
| Deck-Capability-, Match-5201- und Self-Damage-Tests | 25/25 grün |
| `@netgrid/ai` Typecheck | grün |
| `check:ai` | grün, keine Fehler; bekannte Warnungen unverändert |
| Vollständige `@netgrid/ai`-Suite | nicht als Ergebnis gewertet: der direkte Lauf wurde nach 64 Sekunden durch das Tool-Zeitlimit abgebrochen |

Die verbleibende Warnung betrifft `MS Todon`: Die Legacy-Klassifikation
`noisy` bleibt bewusst aus der Strategiebildung heraus. Sie ist weder ein
Search- noch ein Wall-Coverage-Finding.

## Nicht-Ziele

Die Korrektur erzwingt keine Spielaktion und bewertet nicht rückwirkend jede
frühere Entscheidung mit Boostergang als richtig. Sie stellt nur sicher, dass
eine legal angebotene allgemeine Stack-Suche als sichtbarer Zugang zu
Programmen und Wall-Breakern in die aktuelle Capability-Kette gelangt.

## Referenzen

- Prozess: `docs/architecture/ai/ai-hint-consumer-audit-remediation-process-2026-07-17.md`
- Vorheriger Matchabschluss: `docs/reviews/ai/ai-match-520180ba-runner-wall-breaker-final-2026-07-17.md`
