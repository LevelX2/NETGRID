# AI Seeds 14/15 Closeout Final Review

## Ergebnis

Die vier freigegebenen KI-Fehlerverträge aus den Benchmark-Seeds 14 und 15 sind generisch umgesetzt und vollständig verifiziert. Beide vorherigen 480er-Aktionslimits verschwinden in der deterministischen Gegenprobe: Seed 14 endet mit einem Runner-Sieg, Seed 15 mit einem Corp-Sieg. Engine-, LegalAction-, Hidden-Info- und Replay-Verträge bleiben unverändert.

## Analysierte Spiele

Runnerdeck `Krash-Clown` gegen Corpdeck `Fast Advance, Baby`, Seeds `krash-clown-core-baseline-v1-14` und `-15`, Controller `current_candidate`, höchstens 480 Aktionen.

### Ausgangsstand

| Seed | Ergebnis | Aktionen | Endstand | Replay |
| --- | --- | ---: | --- | --- |
| 14 | Aktionslimit | 480 | Runner 5 / Corp 4 | OK |
| 15 | Aktionslimit | 480 | Runner 4 / Corp 6 | OK |

### Finaler Kandidat

| Seed | Ergebnis | Aktionen | Endstand | StateHash | Replay |
| --- | --- | ---: | --- | --- | --- |
| 14 | Runner-Sieg | 170 | Runner 7 / Corp 2 | `fnv1a:8a439815` | OK |
| 15 | Corp-Sieg | 90 | Runner 2 / Corp 7 | `fnv1a:ae091f50` | OK |

Die Seed-15-Gegenprobe enthält keinen negativ bewerteten Runner-Funding-Klick mehr. Die verbleibenden frühen negativen Credit-Klicks in Seed 14 gehören zum nicht freigegebenen Handentwicklungsfall und nicht zum korrigierten Run-Funding-Vertrag.

## Umgesetzte Anpassungen

### 1. Runner-Search-Lifecycle

- Vollständig aktive Wall-, Code-Gate- und Sentry-Coverage erzeugt einen side-safe Runtime-Übergang aus `runner.search.breaker` beziehungsweise `runner.rig_first` in sichtbaren HQ-/R&D-Druck.
- Der Übergang erhält bei eigener oder gegnerischer Matchpoint-Situation zusätzliche Dringlichkeits-Evidence.
- Eine echte sichtbare Coverage-Lücke hält den Suchzustand aktiv.

### 2. Zielgebundene Run-Finanzierung

- `runner.opportunistic_central_run` gilt nach einem Funding-Schritt nicht mehr als erfüllt. Plan-Memory hält Serverziel und Status, bis der Zentral-Run tatsächlich startet.
- Funding wird nur erzwungen, wenn die sichtbare Finanzierungslücke innerhalb der verbleibenden Vorbereitungsklicks geschlossen werden kann, ein dringender Remote-Contest finanziert wird oder der Runner tatsächlich unter seiner bestehenden Credit-Reserve liegt.
- Damit bleiben legitime Low-Credit-Recovery und erreichbare Mehrklick-Finanzierung erhalten, während einzelne Leerklicks für weit entfernte Ziele entfallen.

### 3. Corp-Score-Window-Zielbindung

- Der Score-Window-Controller blockiert keine positive off-plan LegalAction mehr, wenn die planförmige Wahl selbst `corp_board_triage_mismatch` trägt und die Alternative nicht.
- Dadurch verlieren Remote-Überbau und falsche ICE-Ziele gegen die bereits vorhandene zielbewusste Board-Triage.
- Garantierte Same-Turn-Score-Konversionen und fachlich passende Support-Aktionen bleiben weiterhin controllergeschützt.

### 4. Score-Window-Stagnation

- Ein planförmiger Credit-Klick mit Board-Triage-Mismatch darf positive, nicht widersprüchliche Entwicklung nicht mehr als angeblich planfremd aussperren.
- Das beendet die in Seed 15 beobachteten Funding-Schleifen oberhalb des sinnvollen Fensters, ohne echtes Ansparen unterhalb einer sichtbaren Reserve zu unterdrücken.

## Grenzen und Nicht-Ziele

- Keine pauschale Archives-Wiederholungsstrafe.
- Keine Änderung an Engine, PlayerView, LegalActions, Kartenregeln, Decks, Hints oder Ontologie-Daten.
- Keine seed-, deck- oder kartennamenspezifische Sonderregel.
- Die Gegenprobe misst die vier bekannten Fehlerverträge, nicht globale Deckbalance oder allgemeine Winrate.

## Verifikation

- Fokussierte Runner-Regressionsgruppe: 124 Tests grün.
- Angrenzende Corp-/Scoreline-Regressionsgruppe: 183 Tests grün.
- Nachbarregressionen für Low-Credit-Recovery: 27 Tests grün.
- Vollständige `@netgrid/ai`-Suite: 284 Testdateien, 1.859 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm check:ai`: grün; bestehende Warning-Klassen unverändert zulässig.
- `corepack pnpm check:ai-deck-doctrine-strategy`: grün.
- Deterministische Seeds 14 und 15: zwei reguläre Sieger, null Aktionslimits, null Replayfehler.
- `git diff --check`: grün.

## Artefakte

- Prozess: `docs/architecture/ai/ai-seeds-14-15-closeout-process-2026-07-11.md`
- Evidence: `docs/reviews/ai/ai-seeds-14-15-closeout-evidence-2026-07-11.md`
- Final Review: dieses Dokument.
- Lokale Benchmark-Rohdaten: `data/local/krash-clown-seeds-14-15-closeout-candidate-v3-*`.

## Integrationsstatus

Branch `codex/ai-seeds-14-15-closeout` ist `FINAL_GREEN` und für den im Prozess vorgeschriebenen lokalen Merge nach `main` freigegeben. Kein Push und kein Pull Request sind Teil dieses Abschlusses.
