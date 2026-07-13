# Manhunt-Killplan: Decision-Checkpoint Red Evidence

## Stand

Der spielgleiche Audit von `match_606a546d0ba02826` ist auf dem aktuellen
Produktions-Chooser abgeschlossen. Vor jeder Verhaltensänderung sind vier
fachliche Zieltests rot, zwei historische Abwurffälle bereits grün und fünf
synthetische Gegenproben grün.

## Fixture-Herkunft

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only geöffnet
- Match: `match_606a546d0ba02826`
- Actor: Corp, Difficulty `hard`
- Fixtures: `data/scenarios/ai-decision-checkpoints/cp-manhunt-01.json` bis
  `cp-manhunt-06.json`
- CP01: strikter Warmup, eine kompatible Vorentscheidung, keine Drift
- CP02 bis CP06: expliziter Rebase-Warmup wegen zweier bereits abweichender
  früher ICE-Platzierungen bei Decision 27 und 34; am spätesten Ziel verbleiben
  98 kompatible historische Entscheidungen am Stück
- Runtime-Restore: StrategicIntent in allen Fixtures; TacticalPlan und
  PlanPortfolio soweit am Ziel vorhanden; kein RunnerRunPlan für den Corp-Actor
- PlayerView und LegalActions werden beim Test aus dem historischen GameState
  und dem ausschließlich öffentlichen Eventpräfix neu über die Engine erzeugt

Die beiden Warmup-Abweichungen betreffen `Filter` und `Data Wall`, die der
heutige Chooser vor HQ statt vor R&D installieren würde. Sie sind keine
Rotnachweise für diesen Prozess. Der Rebase-Modus verwirft den inkompatiblen
Speicherabschnitt und persistiert nur den danach wieder kompatiblen Suffix.

## Stabiler Runtime-Erwartungsvertrag

Der Decision-Checkpoint-Vertrag kann neben Aktionen und Discard-Choices nun
stabile Merkmale des nach der produktiven Entscheidung gespeicherten
StrategicIntent prüfen:

- erlaubte oder verbotene primäre Strategie-IDs;
- erlaubte Strategie-Familien;
- verbotene Target-Kinds.

Interne Scorewerte, Planobjekt-Layouts oder Debugtexte werden bewusst nicht
festgeschrieben. Runtime-Migration, Restore-Drift, Redaction- oder
LegalAction-Fehler bleiben von `behavior_regression` getrennt.

## Bestätigte rote Befunde

| Checkpoint | State / Decision | Unveränderte Erwartung                                                       | Aktueller Befund                                                            |
| ---------- | ---------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| CP01       | SV2 / DI2        | Tag- oder Schadensfamilie primär; Fast Advance und Scoreline verboten        | `corp.fast_advance` bleibt primär; `behavior_regression`                    |
| CP02       | SV136 / DI70     | `Chance Observation` spielen; BBS-Aktivierung verboten                       | BBS-Aktivierung gewählt; `behavior_regression`                              |
| CP04       | SV287 / DI119    | nach Ausschöpfen aller Agendas Tag-/Schadensfamilie statt Scoreline          | Vacuum Link vor HQ unter weiter aktivem Fast Advance; `behavior_regression` |
| CP05       | SV307 / DI129    | BBS installieren, um Audit/Urban zu finanzieren und HQ-Overflow zu vermeiden | Basic Credit gewählt; `behavior_regression`                                 |

Alle vier Zieltests schlagen im Checkpoint-Runner wegen der fachlichen
Erwartung fehl. Es liegt kein Fixture-, Migration-, Runtime-, Redaction- oder
Legality-Fehler vor.

## Bereits grüne historische Fälle

| Checkpoint | State / Decision | Erwartung                                            | Aktueller Nachweis                                    |
| ---------- | ---------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| CP03       | SV247 / DI111    | `I Got a Rock` behalten                              | grün; aktueller Chooser wirft die Karte nicht mehr ab |
| CP06       | SV311 / DI133    | `Audit of Call Records` und `Urban Renewal` behalten | grün; aktueller Chooser erhält beide Killbausteine    |

Gemäß Red-first-Vertrag entsteht für diese beiden historischen Funde kein
neuer Verhaltensfix. Die exakten Zustände bleiben dauerhaft versioniert, damit
spätere Plan- oder Discard-Änderungen das bereits korrekte Verhalten nicht
wieder verlieren.

## Grüne Gegenproben

1. Ein Decksnapshot ohne Tag- und Schadenslinie behält Fast Advance als
   primäre Strategie.
2. Ohne sofort verfügbare Chance Observation darf die Corp BBS weiter nutzen.
3. Wenn wieder genügend Agendapunkte in R&D liegen, bleibt die Fast-Advance-
   Scoreline aktiv.
4. Ohne sichtbares Audit/Urban-Paar bleibt der einfache Creditgewinn zulässig.
5. Wenn alle Tag-Quellen ausgeschöpft sind, darf I Got a Rock abgeworfen werden.

Zusammen mit den zwei bereits grünen historischen Zielzuständen ergibt der
Vor-Fix-Lauf sieben grüne Kontrollen.

## Roter Testlauf

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/match-manhunt-decision-checkpoints.test.ts `
  --reporter=verbose
```

Ergebnis vor dem Fix:

```text
Test Files  1 failed (1)
Tests       4 failed | 7 passed (11)
```

Die vier roten Zieltests und sieben grünen Kontrollen sind damit der
Mutation-Witness für P2 und P3. Ihre Erwartungen dürfen während der
Verhaltenskorrektur nicht angepasst werden.

## Gleichzeitig grüne Infrastrukturchecks

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/checkpoint-runner.test.ts `
  --reporter=verbose
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Der Checkpoint-Runner-Test umfasst vier grüne Tests einschließlich der neuen
StrategicIntent-Erwartung. Der AI-Typecheck und die Diff-Hygiene sind grün.
