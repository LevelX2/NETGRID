# Corp Flipped-Seed Triage Fix

Status: umgesetzt
Quelle: flipped seed `latest-match-baseline-014`, alter Corp-Sieg `b70355e44` gegen aktuellen Runner-Sieg `26926f7b7`.

## Gesamtziel

Die Corp-KI soll den neuen ICE-Placement-/Triage-Pfad beibehalten, aber die im Flip belegten Anschlussfehler beheben:

- gleiche Zielserver-Rez-Aktionen bei `protect_hq`/`protect_rd` dürfen nicht hart als Mismatch fallen, wenn das ICE bezahlbar und nicht sicher wirkungslos ist;
- Effective-Defense muss für eigene sichtbare installierte ICE auf Karten-/Definition-Daten zurückfallen, wenn Action-Signale unvollständig sind;
- `force_scoreline_clock` darf im Opening keine komplette Central-Exposure ignorieren, wenn vor dem Score ein Runner-Zug mit realistischem Zugriff entsteht;
- fokussierte Regressionen sichern diese Fälle.

## Nicht-Ziele

- Keine Engine- oder LegalAction-Änderungen.
- Keine Hidden-Info-Annahmen über Runner-Hand, Runner-Stack oder verdeckte Runner-Ressourcen.
- Keine Rücknahme des neuen ICE-Placement-Moduls oder der überarbeiteten Hints.

## Paketfolge

1. Prozess- und Evidence-Artefakt anlegen.
2. Effective-Defense-Fallback und Triage-Alignment korrigieren.
3. Regressionstests ergänzen und fokussierte Checks ausführen.
4. Arbeitsbranch lokal nach `main` mergen.
5. 100 Spiele mit denselben Seeds, Batchgröße 5 und `maxActions=480` wiederholen und mit dem letzten Lauf vergleichen.

## Verifikationsregeln

- Fokussierte Vitest-Regressionen für `semantic-runtime-corp-effective-defense` und `semantic-runtime-corp-board-triage`.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- `git diff --check`.
- Nach Merge: 100er-Benchmark mit `scripts/run-ai-match-deck-baseline.ts`, Match `match_41020769c9f35150`, Seed-Präfix `latest-match-baseline`, `maxActions=480`.

## Einzelspiel-Check

Vor dem 100er-Benchmark wurde `latest-match-baseline-014` im Fix-Worktree erneut mit `maxActions=480` simuliert.

- Ergebnis: Corp gewinnt 7:4 nach 292 Actions.
- Replay: erfolgreich.
- Illegal Actions: 0.
- `unsafeScoreChosen`: 0.
- `scoreWindowMissed`: 0.
- Auffälligkeit: Der Trace zeigt eine frühe `decline_rez`-Entscheidung bei R&D trotz installiertem ICE, aber nicht mehr die spielentscheidende Quandary-Fehlbewertung aus dem Regression-Stand. R&D wird später korrekt rezzed und der Scoreplan konvertiert.
