# Corp Scoring Remote Iterations Process 2026-07-06

Status: active

## Quelle/Vorgabe

Der Prozess folgt aus den bisherigen Corp-KI-Benchmarks nach dem Merge `merge: corp ai game-ending scoreline gift gate`. Der belegte Stand verbessert die Corp-Winrate stark, aber zu einem großen Teil über Flatlines. Offene Schwäche: konsequentes Agenda-Scoring über ein vorbereitetes Remote bleibt instabil.

## Gesamtziel

Die Corp-KI soll vorbereitete sichere oder temporär nutzbare Remote-Scorelines konsequenter in Agenda-Punkte umsetzen, ohne die belegte Gesamtspielstärke des aktuellen `main` zu verschlechtern.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Der Arbeitsbranch ist `codex/corp-scoring-remote-iterations`.
- Der Worktree ist `C:\Projekte\NETGRID-corp-scoring-remote-iterations`.
- Die Benchmark-Decks werden aus der lokalen Runtime-SQLite des Hauptworkspaces gelesen.
- Feste Seeds mit Prefix `latest-match-baseline` bleiben Vergleichsgrundlage.
- Der vorherige verworfene Kandidat `corp_force_scoreline_visible_window` wird nicht erneut übernommen, solange kein neuer Plan-Layer-Befund ihn rechtfertigt.

## Nicht-Ziele

- Keine Engine-, LegalAction-, Kartenregel- oder Hidden-Info-Änderungen.
- Keine globale KI-Architekturrevision.
- Kein Tuning nur für einen einzelnen Kartennamen.
- Keine Übernahme eines Kandidaten, der nur einen Einzel-Seed verbessert, aber 30er/100er-Metriken verschlechtert.

## Controller-Invarianten

- Nur bestehende legale Aktionen werden bewertet.
- Die Engine bleibt Regelautorität.
- Verdeckte Runner-Hand, Stack oder Ressourcen werden nicht angenommen.
- Jeder Kandidat muss vor Commit mindestens fokussierte Tests, `@netgrid/ai`-Typecheck und Seed-/Batch-Vergleich bestehen.
- Verworfene Kandidaten werden zurückgenommen, nicht als halbe Heuristik liegengelassen.

## State Machine

1. `baseline`: aktuellen Stand messen und konkrete Seeds/Fenster identifizieren.
2. `candidate`: genau eine Hypothese ändern.
3. `focused_verify`: Unit-/Typecheck und betroffene Seeds laufen lassen.
4. `batch_verify`: 5er und 30er mit identischen Seeds vergleichen.
5. `promotion_gate`: nur bei klarer Verbesserung 100er ausführen und committen.
6. `reject`: bei neutralem oder schlechtem 30er/100er Kandidaten vollständig zurücknehmen.
7. `integrate`: bei bemerkenswertem Fortschritt lokal nach `main` mergen.

## Paketfolge

### Paket 1: Baseline und Seed-Auswahl

Ziel: aktuelle Scoring-Schwächen ohne neue Codeänderung belegen.

Arbeit:
- Status und verfügbare Benchmark-Artefakte prüfen.
- Aktuellen 30er All-Legs-Stand als Isolationsbasis nutzen oder neu erzeugen, falls Metadaten veraltet sind.
- 2 bis 4 konkrete Seeds mit Scoring-Stall, Remote-Unterbau oder Plan-Mapping-Blockade auswählen.

Checks:
- JSON-Artefakte parsebar.
- Vergleich nutzt identische Seeds und Deck-Snapshots.

Done-Gate:
- Eine kurze Review-Notiz benennt Zielmetrik, Kandidaten-Seeds und Ablehnungsregeln.

Commit:
- `docs(ai): start corp scoring remote iteration process`

### Paket 2: Plan-Mapping-/Scoreline-Blockade untersuchen

Ziel: klären, warum Scoreline-Aktionen mit besserem semantischen Score gegen gemappte Ability-/Operation-Pläne verlieren.

Arbeit:
- `semantic-choice-ranking.ts`, `tactical-plan-corp-plans.ts`, `tactical-plan-corp-helpers.ts` und relevante Runtime-Evidence prüfen.
- Einen minimalen Testfall bauen, der eine bessere Scoreline gegen eine schwächere gemappte Nicht-Scoreline-Aktion abbildet.
- Nur wenn der Test den echten Fehler modelliert, eine kleine zentrale Korrektur implementieren.

Checks:
- Fokussierte Vitests für Choice-Ranking/Corp-Score.
- Betroffener Seed muss sich fachlich verbessern.

Done-Gate:
- 5er und 30er gleicher Seeds dürfen Gesamtmetriken nicht verschlechtern.

Commit:
- `fix(ai): let scoreline override stale corp plan mapping`

### Paket 3: Remote-Scoreline-Abschluss statt Stalling

Ziel: Fälle mit 6 Corp-AP, vorbereitetem Remote und vorhandener Agenda/Scoreline in Sieg umwandeln, ohne Runner-Steals zu erhöhen.

Arbeit:
- Nur wenn Paket 2 nicht reicht oder neue Evidenz entsteht.
- Advance-/Score-/Install-Sequenzen prüfen, besonders same-turn closeout und next-turn scoreline.
- Passive Ability-/Operation-Auswahl in Scoreline-Fenstern nur mit konkreter Triage-/Window-Evidence unterdrücken.

Checks:
- Fokussierte Runtime-Tests.
- Seed-Regressionen für mindestens einen Limit-Seed und einen Runner-Win-Seed.
- 30er Gate.

Done-Gate:
- Corp-Wins oder Limits verbessern ohne Runner-Steals/unsafeScoreChosen relevant zu erhöhen.

Commit:
- `fix(ai): finish prepared corp scorelines before passive setup`

### Paket 4: 100er Vergleich und Integration

Ziel: nur belegte Kandidaten übernehmen.

Arbeit:
- 100er `current_vs_current` mit `latest-match-baseline`.
- Bei größerem Verhaltenseingriff zusätzlich 30er All-Legs.
- Ergebnisse als Review-Artefakt versionieren.
- Erfolgreichen Branch lokal nach `main` mergen.

Checks:
- `corepack pnpm --filter @netgrid/ai typecheck`
- relevante Vitests
- `git diff --check`
- Benchmark-Artefakte parsebar

Done-Gate:
- Verbesserung ist im 100er mindestens in Corp-Wins, Limits oder Scoring-Metrik sichtbar und verschlechtert nicht klar Runner-Steals/unsafeScoreChosen.

Commit:
- `docs(ai): record corp scoring remote benchmark`

## Sicherheitsblocker

- Hidden-Info-Leak oder neue Annahme über Runner-Hand/Stack.
- Engine-Legalität oder `applyAction`-Vertrag müsste geändert werden.
- Reproduzierbare `ERR_INVALID_TARGET`-Zunahme durch Kandidat.
- 100er zeigt klare Verschlechterung gegenüber `main`.

## Verifikationsregeln

Minimal je Codepaket:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run <fokussierte-tests> --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Benchmark-Beispiel:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-match-deck-paired-baseline.ts --sqlite C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite --games 30 --batch-size 5 --max-actions 480 --seed-prefix latest-match-baseline --legs current_vs_current --out docs/reviews/ai/<name>.json --markdown-out docs/reviews/ai/<name>.md
```

## Abschlusskriterien

- Jeder übernommene Kandidat ist committed.
- Verworfene Kandidaten sind aus dem Code entfernt.
- Ein finaler Benchmarkvergleich liegt vor.
- Der Arbeitsbranch ist bei signifikantem Fortschritt lokal nach `main` gemerged.
