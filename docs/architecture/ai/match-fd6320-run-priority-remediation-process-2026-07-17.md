# Match FD6320: Run-Prioritäts-Remediation 2026-07-17

## Status

P1 bis P6 sind abgeschlossen. Beide historischen Findings und ihre
Gegenproben sind grün. F01 erhält die konkrete relative Zentralziel-Qualität
innerhalb derselben Empfehlungsklasse. F02 erhält einen eng begrenzten
terminalen Bonus; ein aktuell nicht abbildbarer Tag-Cleanup-Interrupt darf nur
dieses Matchpoint-Foreground nicht mehr suspendieren. Die breite Prüfung führt
genau die neun bereits auf `main` vorhandenen Broker-/Hint-/DFE6-/MRGSG-
Fehler und keine neue Regression. Der Arbeitsstand wurde lokal nach `main`
integriert; Post-Merge-Fokuslauf und AI-Typecheck sind grün. Worktree und
Arbeitsbranch sind verifiziert entfernt.

## Quelle und Zielprüfung

Ausgangspunkt ist das beendete Match `match_fd63201b6a7fa27a` aus der lokalen
Runtime-SQLite. Die vollständige Prüfung deckte alle 87 Runner-KI-Entscheidungen
ab und isolierte zwei Plan-/Arbitration-Fehler:

1. Decision 11 / StateVersion 21: Der semantisch klar bessere ungeschützte
   HQ-Run wurde durch die grobe `run_now`-Planbewertung von einem riskanteren
   R&D-Run verdrängt.
2. Decision 69 / StateVersion 120: Bei 6 von 7 Agenda-Punkten wurde ein bereits
   kostenlos erreichbarer HQ-Run von langsamer Handentwicklung verdrängt, weil
   der bestehende Matchpoint-Bonus nur `blocked_unpayable`-Runs erfasst.

Die Aufgabe ist präzise genug. Beide Zustände müssen zuerst auf unverändertem
aktuellem Code als spielgleiche `behavior_regression` reproduziert werden.
Nur weiterhin rote Befunde dürfen behoben werden.

## Gesamtziel

Die Runner-KI soll bei mehreren legalen Zentral-Runs die konkrete relative
RunTarget-Qualität auch nach dem TacticalPlan-Mapping erhalten. Am eigenen
Matchpoint soll ein bereits erreichbarer, günstiger HQ- oder R&D-Run mit
plausiblem Access-Payoff langsames Setup überstimmen, ohne bekannte leere,
gefährliche, blockierte oder nicht terminale Runs pauschal zu erzwingen.

## Annahmen

- Die Runtime-SQLite im Hauptworkspace ist die historische Quelle und wird nur
  mit `readOnly: true` geöffnet.
- Actor, Difficulty, Deck-Snapshot, Eventpräfix und vorhandener Runtime-Zustand
  werden durch das bestehende Capture-Tool übernommen.
- Decision 11 erwartet HQ als akzeptable Run-Action; Decision 69 erwartet den
  bereits erreichbaren HQ-Run als akzeptable Matchpoint-Konvertierung.
- Die engsten Gegenproben ändern jeweils nur die fachlich entscheidende Grenze:
  konkrete RunTarget-Qualität beziehungsweise Matchpoint/Payoff/Erreichbarkeit.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, LegalActions oder Hidden-Info-Grenzen.
- Keine Karten-ID-, Deck-ID- oder Match-ID-Sonderregel.
- Keine Hint-Änderung; der Deck-Hint-/Consumer-Audit war vollständig grün.
- Keine pauschale Bevorzugung von HQ gegenüber R&D.
- Kein Zwangsrun auf bekannte leere oder aktuell unproduktive Zentralen.
- Keine Umsetzung der zwei separat als LegalAction-Reproduktionsdrift
  klassifizierten Decisions 51 und 54.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Vor dem ersten Verhaltensfix liegen unveränderte rote historische
  Checkpoints und grüne Gegenproben in einem separaten Commit vor.
- Nur `behavior_regression` gilt als Red-Evidence. Engine-, Runtime-, Fixture-
  oder Redaction-Drift stoppt den jeweiligen Fix.
- Erwartungen werden nach dem Fix nicht abgeschwächt oder umgeschrieben.
- Produktiver Chooser, produktive Plan-/Arbitration-Kette und durch die Engine
  erzeugte PlayerView/LegalActions bleiben Prüfgrundlage.
- Alle neuen Signale sind side-safe und stammen aus PlayerView, PublicEvents,
  LegalActions oder explizit erlaubtem Runtime-Zustand.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Fehlende Worktree-Abhängigkeiten werden über den dokumentierten Hauptworkspace-
  `tsx`-/Vitest-Fallback gelöst; keine Runtime-Server werden gestartet.
- Bei rotem fokussiertem Test wird ausschließlich im aktiven Paket debuggt.
- Hidden-Info-Abhängigkeit, fehlende LegalAction, nicht spielgleicher Capture,
  Engine-Korrektheitsregression oder nicht kollisionsfreier Main-Merge stoppt
  den Prozess ohne Workaround.

## State Machine

`PREPARED -> RED_EVIDENCE -> IMPLEMENTED -> VERIFIED -> DOCUMENTED -> MERGED -> CLEANED`

## Paketfolge

### P1 – Preflight und Prozessvertrag

- Worktree-/Branch-Kollisionen prüfen und separaten Arbeitsstrang anlegen.
- Scope, Invarianten, Pakete, Checks und `/Goal` dokumentieren.
- Done-Gate: Prozessartefakt vollständig, Worktree sauber, `git diff --check`.
- Commit: `docs(ai): define FD6320 run priority process`

### P2 – Spielgleiche rote Checkpoints und Gegenproben

- Decision 11 und Decision 69 strikt aus dem historischen Match capturen.
- Fixtures validieren und exakte Eventpräfix-/Runtime-Drift prüfen.
- Unveränderten produktiven Chooser als `behavior_regression` rot bestätigen.
- Je Finding eine enge positive und negative Gegenprobe sichern.
- Evidence-Report mit Zielaktion, Consumer-Kette und Red-Ergebnis anlegen.
- Done-Gate: beide Zieltests rot als `behavior_regression`, Kontrollen grün,
  `git diff --check`.
- Commit: `test(ai): lock FD6320 run priority regressions`

### P3 – Relative Zentral-Run-Qualität erhalten

- Planbewertung so erweitern, dass gleich klassifizierte Zentral-Runs ihre
  konkrete relative RunTarget-Qualität nicht verlieren.
- R&D-Basis bleibt nur Tie-/Drucksignal und darf einen deutlich besseren HQ-
  Zielwert nicht überschreiben.
- Done-Gate: Decision 11 und Gegenproben grün; angrenzende RunTarget-Plan-Tests
  grün.
- Commit: `fix(ai): preserve relative central run quality`

### P4 – Erreichbare Matchpoint-Runs konvertieren

- Matchpoint-Priorität auch für bereits erreichbare günstige HQ-/R&D-Runs mit
  produktivem sichtbarem Payoff abbilden.
- Bekannte leere, nicht terminale, unproduktive oder nicht sicher konvertierbare
  Lagen explizit als Gegenproben erhalten.
- Done-Gate: Decision 69 und Gegenproben grün; angrenzende Endgame- und
  Run-Lock-Tests grün.
- Commit: `fix(ai): convert reachable central matchpoint runs`

### P5 – Breite Verifikation und Abschlussdokumentation

- Beide unveränderten Checkpoints, Gegenproben und angrenzende ältere
  Decision-Checkpoints ausführen.
- AI-Testshards beziehungsweise vollständige AI-Suite, AI-Typecheck und
  `git diff --check` ausführen.
- Evidence-/Final-Report und Juli-Betriebslog ergänzen.
- Done-Gate: keine relevante Regression, Arbeitsbranch sauber dokumentiert.
- Commit: `docs(ai): close FD6320 run priority remediation`

### P6 – Main-Integration und Cleanup

- Aktuelles `main` defensiv in den Arbeitsbranch integrieren, falls notwendig.
- Relevante Checks auf dem Integrationsstand wiederholen.
- Arbeitsbranch lokal bevorzugt per Fast-Forward nach `main` mergen.
- Sauberen Worktree entfernen, Entfernung in Git und Dateisystem verifizieren
  und den vollständig gemergten Arbeitsbranch mit `git branch -d` löschen.
- Done-Gate: `main` grün und sauber, Worktree und Branch entfernt.

## Worktree-, Git- und Verifikationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_MATCH_FD6320_RUN_PRIORITY`
- Branch: `codex/ai-match-fd6320-run-priority`
- Hauptworkspace ausschließlich für Runtime-SQLite und finalen lokalen Merge.
- Jedes Paket endet mit fokussierten Checks, `git diff --check`, selektivem
  Staging und eigenem Commit.
- Mindestchecks: neue FD6320-Decision-Checkpoints, Gegenproben,
  `tactical-plan-runner-run-targets`-Tests, angrenzende Matchpoint-
  Decision-Checkpoints, `corepack pnpm --filter @netgrid/ai typecheck`, AI-
  Testshards oder vollständige AI-Suite sowie `git diff --check`.

## Controller-Prompt-Kern

`/Goal Arbeite die Match-FD6320-Run-Prioritäts-Remediation vollständig und`
`sequenziell von P1 bis P6 ab und merge den abgeschlossenen Arbeitsbranch`
`lokal nach main. Arbeite ausschließlich im Worktree`
`C:\Projekte\NETGRID_AI_MATCH_FD6320_RUN_PRIORITY auf Branch`
`codex/ai-match-fd6320-run-priority. Sichere beide historischen Findings vor`
`dem Fix als spielgleiche behavior_regression mit Gegenproben, implementiere`
`nur weiterhin rote Befunde generisch und side-safe, committe jedes Paket,`
`verifiziere den Integrationsstand und entferne danach Worktree und Branch.`

## Abschlusskriterien

- Beide historischen Fehler sind spielgleich rot reproduziert und danach mit
  unveränderter Erwartung grün.
- Die Gegenproben belegen die fachlichen Grenzen beider Prioritäten.
- Keine Hidden-Info-, LegalAction-, Engine- oder Hint-Änderung wurde benötigt.
- Fokussierte Tests, angrenzende Regressionen, AI-Typecheck und breite AI-
  Prüfung sind grün oder ein echter Blocker ist dokumentiert.
- Evidence-/Final-Report und dauerhafte Wissenspflege sind abgeschlossen.
- `main` enthält alle Paketcommits; Worktree und Arbeitsbranch sind verifiziert
  entfernt.
