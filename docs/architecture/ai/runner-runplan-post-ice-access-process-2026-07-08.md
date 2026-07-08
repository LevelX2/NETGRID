# RunnerRunPlan Post-ICE Access Fix Process

Status: in Umsetzung

Quelle/Vorgabe: Playtest-Befund aus dem aktiven Match `match_427831dbf32a303c` am 2026-07-08. Der Runner startete in StateVersion 161 einen HQ-Run, brach Keeper bis StateVersion 166 korrekt und jackte in StateVersion 168 aus, statt nach StateVersion 167 den Zugriff fortzusetzen.

## Gesamtziel

Der RunnerRunPlan darf nach einem bereits ueberwundenen ICE die bezahlten ICE-Kosten nicht erneut als verbleibenden Restpfad rechnen. Wenn der Runner im aktiven Run die Serverposition erreicht hat und eine legale `continue_run`-Aktion den Zugriff oeffnet, muss der Plan den Zugriff fortsetzen statt wegen einer falschen Revalidation `jack_out` zu erzwingen.

## Annahmen

- Die Engine bleibt Regelautoritaet; die KI waehlt weiterhin nur `LegalActions`.
- Es wird keine Hidden-Info verwendet. Grundlage sind PlayerView, LegalActions und redigierte Trace-/Replay-Daten.
- Der Fix ist AI-intern und betrifft die RunnerRunPlan-Pfadquote, Revalidation und Regressionstests.
- Debug-Anzeige wird nur angepasst, wenn die eigentliche Ursache in diesem Paket sichtbar behoben oder abgesichert werden kann.

## Nicht-Ziele

- Keine neue Run-Regel in der Engine.
- Keine Aenderung an Access-Queue, Breach-Mechanik oder LegalAction-Erzeugung.
- Keine generelle Neukalibrierung von Zentral-Run- oder Economy-Scores.
- Keine Veraenderung verdeckter Daten in PlayerViews, Events oder Traces.

## Controller-Invarianten

- Bei `run.phase === "movement"` und `run.position.kind === "server"` ist das zuletzt ueberwundene Server-ICE kein verbleibendes ICE mehr.
- Ein aktiver RunnerRunPlan darf `jack_out` nur erzwingen, wenn der verbleibende Pfad real nicht access-erhaltend fortsetzbar ist.
- Wenn `continue_run` legal ist und keinen Encounter-End-the-Run-Effekt transportiert, darf ein zuvor bezahltes ICE nicht zu `abort_recommended` fuehren.
- Revalidation darf den Plan wegen Zielwechsel invalidieren, aber nicht wegen reinem Fortschritt zum Server abbrechen.

## State Machine

1. `start_run`: Plan wird mit Ziel, Budget und erstem Pfadangebot erzeugt.
2. `encounter_ice`: Plan waehlt Pump-/Break-/Continue-Sequenzen, um Zugriff zu erhalten.
3. `movement` auf ICE-Position: Noch nicht passierte innere ICE bleiben quote-relevant.
4. `movement` auf Serverposition: Verbleibende ICE-Kosten sind null; Zugriff ist erreichbar, sofern LegalActions dies erlauben.
5. `access`: Plan priorisiert `access_card`, `steal_agenda`, `trash_accessed_card` oder `decline_trash` nach AccessIntent.

## Paketfolge

### Paket 1: Prozessartefakt

Ziel: Prozess, Evidence und Invarianten dokumentieren.

Kernartefakte:

- `docs/architecture/ai/runner-runplan-post-ice-access-process-2026-07-08.md`

Checks:

- `git diff --check`

Commit:

- `Document RunnerRunPlan post-ICE access fix process`

### Paket 2: Restpfad-Quote korrigieren

Ziel: `quoteRunnerRunPath` erkennt den aktiven Run-Fortschritt nach dem letzten ICE und setzt den Restpfad am Server auf erreichbar statt bereits passierte ICE erneut zu rechnen.

Kernartefakte:

- `packages/ai/src/runtime/runner-run-plan-path-quote.ts`
- betroffene Tests in `packages/ai/src/runtime/*runner-run-plan*.test.ts`

Checks:

- fokussierte Vitest-Tests fuer PathQuote/Revalidation/Policy
- `git diff --check`

Commit:

- `Fix RunnerRunPlan post-ICE path quote`

### Paket 3: Regression und Debug-Wahrheit

Ziel: Der konkrete Fehler wird als Regression abgedeckt: nach Keeper/Codecracker-artigem bezahltem ICE und Serverposition muss `continue_run` gewaehlt werden. Debug-/WhyNot-Aussagen duerfen die Auswahl nicht als Score-Ranking verfaelschen.

Kernartefakte:

- `packages/ai/src/runtime/runner-run-plan-policy.test.ts`
- bei Bedarf Debug-/Ranking-Code oder ein fokussierter Test gegen irrefuehrende WhyNot-Texte

Checks:

- fokussierte Vitest-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `Cover RunnerRunPlan post-ICE continue behavior`

## Sicherheitsblocker

- Wenn eine korrekte Loesung Engine- oder PlayerView-Daten braucht, die derzeit nicht legal sichtbar sind, stoppt der Prozess mit Blocker statt KI-Workaround.
- Wenn Tests zeigen, dass `jack_out` bei real gefaehrlichem ungebrochenem ICE nicht mehr funktioniert, wird der Fix enger geschnitten.

## Abschlusskriterien

- Arbeitsbranch ist sauber committed.
- Fokussierte RunnerRunPlan-Tests und AI-Typecheck bestehen.
- Branch ist lokal nach `main` gemerged.
- Hauptworkspace ist sauber; kein Push erfolgt.
