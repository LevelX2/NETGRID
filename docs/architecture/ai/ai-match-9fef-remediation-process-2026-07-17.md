# AI-Match-9FEF-Remediation-Prozess

Status: in Umsetzung

Quelle: vollständige Decision-Analyse von `match_9fef30abd4b16341`
vom 17. Juli 2026 und anschließende Nutzerfreigabe.

## Zielprüfung

Der Endzustand ist ausreichend präzise. Acht reproduzierbare Fehlergruppen
sollen auf dem aktuellen Code zuerst durch spielgleiche Decision-Checkpoints
klassifiziert und nur bei `behavior_regression` generisch behoben werden.
Pauschale Kartennamen-Sonderregeln und Hidden-Info-Nutzung sind Nicht-Ziele.

## Gesamtziel

Die Runner-KI soll Folgechoices, ICE-Control-Karten, servergebundene Taxes,
Informationsruns, vollständige Runbudgets und Mehrschrittpläne so bewerten,
dass jede einzelne Decision einen fachlich sinnvollen, side-sicheren Beitrag
leistet. Der fertige Arbeitsbranch wird lokal nach `main` integriert.

## Präzisierter Informationsrun-Vertrag

Ein Run auf einen Server mit unrezztem ICE darf sinnvoll sein, obwohl der
Runner den vollständigen Pfad voraussichtlich nicht bezahlen kann. Der
Informationsrun darf das äußerste ICE aufdecken, Rez-Credits binden und vor
dem ersten nicht sinnvoll bezahlbaren ICE auschecken.

Nicht akzeptabel sind dagegen:

- mehrere Funding-Klicks für einen angeblich vollständigen Run, dessen
  bekannte und risikogewichtete Gesamtkosten nicht finanzierbar sind;
- das Brechen des ersten ICE, wenn danach kein sinnvoller Restpfad, Access
  oder sonstiger Payoff mehr finanzierbar ist;
- eine Pfadquote, die öffentliche ICE-Anzahl oder öffentliche
  Stärkemodifikatoren als bloße Diagnose ausweist, aber nicht in die
  Fortsetzungsentscheidung einbezieht.

Die Tests müssen deshalb einen legitimen Probe-Run positiv erhalten und nur
die unbezahlbare Break-/Fortsetzungsentscheidung beziehungsweise falsche
Vollrun-Vorbereitung ablehnen.

## Invarianten

- Die Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Entscheidungen verwenden nur `PlayerView`, side-gefilterte PublicEvents,
  LegalActions und explizit erlaubte Metadaten.
- Jede Parent- und Child-Choice wird als eigene Aufgabe bewertet.
- Ein Parent-Score darf eine bereits planbare wertlose Child-Choice nicht
  ausblenden.
- Ein Mehrschrittplan beginnt nur, wenn sein nächster fachlicher Done-State
  erreichbar ist, und wird nach jeder Zustandsänderung revalidiert.
- Runbudgets trennen Probe-/Rez-Information, Break-/Fortsetzungskosten,
  Access-/Trash-Payoff und strategische Reserve.
- Eine zweite Broker-Aktivierung bleibt verboten, wenn sie von der Engine
  wegen der Kartenregel nicht als legal angeboten wird.

## Nicht-Ziele

- Die fünf nicht freigabereifen Decisions D1, D42, D137, D158 und D160
  werden nicht durch Verhaltensregeln festgeschrieben.
- Eurocorpse wird nicht verändert; die Karte war nicht im Matchdeck.
- Frühe Informationsruns werden nicht pauschal abgewertet.
- Historische Erwartungen werden nach einem Fix nicht aufgeweicht.

## State Machine

`preflight -> evidence -> red-checkpoints -> choice-and-hint-fixes ->
run-and-plan-fixes -> green-verification -> review -> main-integration ->
cleanup`

Genau ein Paket ist aktiv. Ein Paket wird erst nach Checks,
`git diff --check` und eigenem Commit abgeschlossen.

## Paketfolge

### Paket 1 – Prozess und Evidence

- Ziel: Prozessvertrag, Match-Evidence und acht Akzeptanzverträge versionieren.
- Checks: Dokumentprüfung, `git diff --check`.
- Done-Gate: Informationsrun-Vertrag und alle Findings sind eindeutig.
- Commit: `Document AI match 9fef remediation process`.

### Paket 2 – Spielgleiche rote Checkpoints

- Ziel: Früheste kausale Decisions und enge Gegenproben capturen.
- Arbeit: historische Zustände mit `strict` capturen, produktiven Chooser
  ausführen, Drift von echtem `behavior_regression` trennen.
- Checks: Fixture-Validierung und direkte Checkpoint-Tests.
- Done-Gate: Jeder aktuell reproduzierbare Fehler ist rot, Gegenproben sind
  grün; bereits grüne Funde werden ohne Fix dokumentiert.
- Commit: `Add red checkpoints for AI match 9fef`.

### Paket 3 – Choices, Hints und ICE-Control

- Ziel: Priority-Wreck-Folgechoice, Jettison-Plan/Discard und
  Restrictive-Net-Zoning-Semantik generisch korrigieren.
- Checks: Checkpoints, Hint-/Ontology-Gates, fokussierte Vitest-Tests.
- Done-Gate: Eltern- und Folgeentscheidungen sowie Target-Ranking sind grün.
- Commit: `Fix runner choice and ICE control semantics`.

### Paket 4 – Runs, Budgets und Planfortsetzung

- Ziel: Punkte 4 bis 8 mit gemeinsamer Budget- und Revalidation-Semantik
  beheben, ohne legitime Prüfruns zu unterdrücken.
- Checks: positive Prüfrun-Gegenprobe, vollständige Pfad-/Reservefälle,
  Plan-Done-Gates und angrenzende Run-Tests.
- Done-Gate: Checkpoints sind grün und die Informationsrun-Gegenprobe bleibt
  grün.
- Commit: `Harden runner run budgets and plan revalidation`.

### Paket 5 – Gesamtverifikation und Abschlussdokumentation

- Ziel: unveränderte Checkpoints, AI-Suite, Typecheck, Hint-Gates,
  Deck-Consumer-Audit, Final Review und Wissenslog abschließen.
- Done-Gate: keine neue fachliche oder technische Regression.
- Commit: `Verify AI match 9fef remediation`.

### Paket 6 – Integration und Cleanup

- Ziel: aktuelles `main` in den Arbeitsbranch integrieren, final prüfen,
  bevorzugt fast-forward nach `main` mergen und den sauberen Worktree samt
  gemergtem Branch entfernen.
- Done-Gate: `main` geprüft, Worktree im Git und Dateisystem entfernt, Branch
  gelöscht.

## Sicherheitsblocker

Gestoppt wird bei Hidden-Info-Bedarf, fehlender notwendiger LegalAction,
Engine-/Runtime-Drift statt Verhaltensregression, nicht auflösbarer
fachlicher Merge-Kollision oder Regression in Engine-Korrektheit,
Side-Safety beziehungsweise Replay.

## Controller-Prompt-Kern

`/Goal Arbeite AI-Match-9FEF-Remediation vollständig und sequenziell von
Paket 1 bis Paket 6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach
main. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_MATCH_9FEF_ANALYSIS auf Branch
codex/ai-match-9fef-analysis. Nutze den Hauptworkspace nur für Read-only-
Evidence und den finalen Merge. Arbeite immer nur am aktuellen Paket,
committe jedes bestandene Done-Gate und entferne Worktree und Branch erst
nach erfolgreicher Integration.`

