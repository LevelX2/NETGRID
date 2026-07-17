# AI-Match-B34E-Runner-Remediation-Prozess

Status: Pakete 1 bis 7 abgeschlossen, zur lokalen Integration freigegeben

Quelle: vollständige Decision-Analyse von `match_b34e724e4cfc0362`
vom 17. Juli 2026 und anschließende Nutzerfreigabe.

## Zielprüfung

Der Endzustand ist ausreichend präzise. Drei reproduzierbare Fehlergruppen
werden auf unverändertem Code zuerst durch spielgleiche Decision-Checkpoints
und enge grüne Gegenproben klassifiziert. Nur bestätigte
`behavior_regression`-Fälle dürfen die produktive KI-Logik verändern.

## Gesamtziel

Die Runner-KI soll Such-, Multiaccess- und Draw-Semantik side-sicher
auseinanderhalten, bei zwei fehlenden Agenda-Punkten unmittelbaren
Zentraldruck gegen langsame Vorbereitung abwägen und während eines
ICE-Encounters nur die für den verbleibenden Runpfad tatsächlich nötigen
Kosten bezahlen. Der fertige Arbeitsbranch wird lokal nach `main` integriert;
Worktree und Branch werden anschließend sauber entfernt.

## Annahmen und Abgrenzung

- Die historische SQLite-Datei im Hauptworkspace ist die unveränderte
  Capture-Quelle; sie wird ausschließlich lesend verwendet.
- Für Decisions ab D43 beginnt der Strict-Warmup an D43, weil der lokale
  Watch-Server unmittelbar davor nachweislich neu gestartet wurde. Es gibt
  keinen Warmup über diese Prozessgrenze und kein `rebase`.
- Die aktuelle Rules Engine rekonstruiert die side-sichere Runner-Sicht.
- Die drei Befundgruppen sind Search-Consumer-Drift, Endgame-/Plan-Arbitration
  und Viral-15-Encounter-Sequenzkosten.
- Kartennamen-Sonderregeln, Hidden-Info-Nutzung, Regeländerungen und
  nachträgliches Abschwächen historischer Erwartungen sind Nicht-Ziele.
- Karten- oder Deck-Hints werden nur geändert, wenn ein Checkpoint einen
  tatsächlichen Hint-Defekt belegt. Der vorab ausgeführte Deck-Consumer-Audit
  hat keinen solchen Defekt gezeigt.

## Invarianten

- Die Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Entscheidungen verwenden nur `PlayerView`, side-gefilterte PublicEvents,
  LegalActions und explizit erlaubte Metadaten.
- Suchsemantik stammt aus strukturierten, side-korrekten Effekten und nicht
  aus zufälligen Titeltokens fremder Karten.
- Bei `ownAgendaPoints >= targetAgendaPoints - 2` wird erreichbarer Zentral-
  oder Multiaccess-Druck ausdrücklich als Closeout-Option bewertet.
- Ein Plan darf eine deutlich bessere unmittelbare LegalAction nicht allein
  wegen seiner Planbindung verdrängen.
- Encounter-Kosten werden als gemeinsame Sequenz betrachtet; bereits
  bezahlte Pump-/Break-Kosten und der verbleibende Pfad fließen erneut ein.
- Jede historische Erwartung bleibt nach dem Fix unverändert.

## Fehler- und Blockerbehandlung

Gestoppt wird bei Hidden-Info-Bedarf, fehlender notwendiger LegalAction,
`runtime_or_schema_drift`, nicht reproduzierbarem historischen Zustand,
Engine-/Replay-Fehlern, fachlich nicht auflösbarer Merge-Kollision oder einer
Regression in Engine-Korrektheit, Side-Safety beziehungsweise Determinismus.
Ein technisch roter Test gilt erst nach Klassifikation als Fixauftrag.

## State Machine

`preflight -> evidence -> red-checkpoints -> search-fix -> endgame-fix ->
encounter-fix -> green-verification -> review -> main-integration -> cleanup`

Genau ein Paket ist aktiv. Ein Paket wird erst nach seinen Checks,
`git diff --check` und einem eigenen Commit abgeschlossen. Kein Paket wird
übersprungen oder mit einem späteren Paket vermischt.

## Paketfolge

### Paket 1 – Preflight und Prozessvertrag

- Ziel: isolierten Worktree und verbindlichen Ablauf herstellen.
- Checks: Worktree/Branch-Zuordnung, sauberer Status, Dokumentprüfung,
  `git diff --check`.
- Done-Gate: Ziel, Invarianten, Pakete, Gates und Cleanup sind eindeutig.
- Commit: `Document AI match b34e remediation process`.

### Paket 2 – Vollständige Match-Evidence

- Ziel: 119/119 Decisions, alle 22 auffälligen Entscheidungen, Deck-Audit
  und die drei kausalen Fehlergruppen dauerhaft dokumentieren.
- Checks: Abgleich gegen SQLite-Inspector, Entscheidungsmengen und
  `git diff --check`.
- Done-Gate: Jede Auffälligkeit ist einer Fehlergruppe oder einer ausdrücklich
  plausiblen Entscheidung zugeordnet.
- Commit: `Document AI match b34e decision evidence`.

### Paket 3 – Spielgleiche rote Checkpoints und Gegenproben

- Ziel: früheste kausale historische Decisions strict capturen und mit dem
  produktiven Chooser als unveränderte `behavior_regression` belegen.
- Arbeit: Search-Consumer-Fälle, Endgame-Entscheidungen und den ersten
  unnötigen Viral-15-Payment-Schritt sichern; legitime Suche, Draw-Semantik,
  dringende Remote-Revalidation und notwendige Break-Sequenzen positiv
  gegenprüfen.
- Checks: Schema-/Fixture-Validierung, direkte Checkpoint-Tests, explizite
  Klassifikation jedes roten Ergebnisses.
- Done-Gate: Zieltests sind ausschließlich wegen des beobachteten Verhaltens
  rot; Gegenproben sind grün.
- Commit: `Add red checkpoints for AI match b34e`.

### Paket 4 – Search-Consumer-Präzision

- Ziel: Titel- und Corp-Quellkartentokens aus der Runner-Suchklassifikation
  entfernen und strukturierte Search-/Draw-/Multiaccess-Semantik erhalten.
- Checks: unveränderte Search-Checkpoints, Gegenproben, fokussierte Runtime-
  und Semantic-Ranking-Tests.
- Done-Gate: `Tutor` und `Library Search` erzeugen keinen falschen
  Coverage-Search-Bonus; echte Runner-Suche bleibt erkennbar.
- Commit: `Fix runner source card answer role semantics`.

### Paket 5 – Runner-Endgame- und Plan-Arbitration

- Ziel: Zwei-Punkte-Closeoutdruck gegen Overflow-Draw und marginales Setup
  priorisieren, ohne legitime Remote-Antwortsuche zu verdrängen.
- Checks: historische Endgame-Checkpoints, Remote-Gegenprobe,
  Plan-/Choice-Ranking-Tests.
- Done-Gate: alle freigegebenen Zentraldruck-Fälle sind grün und die
  dringende Remote-Revalidation bleibt grün.
- Commit: `Harden runner closeout plan arbitration`.

### Paket 6 – Encounter-Sequenzkosten

- Ziel: nur erforderliche Subroutinen bezahlen, Jack-out-Tax ohne geplanten
  Jack-out vermeiden und selbstzerstörende Breaker am Runende korrekt
  bewerten.
- Checks: Viral-15-Checkpoint sowie Gegenproben für wertvolle Programme,
  später benötigte Breaker und echte Jack-out-Kontingenz.
- Done-Gate: der historische Overspend ist grün, notwendige Breaks bleiben
  erhalten.
- Commit: `Fix runner encounter sequence spending`.

### Paket 7 – Gesamtverifikation und Abschlussdokumentation

- Ziel: unveränderte Checkpoints, fokussierte Tests, alle drei KI-Testshards,
  Typecheck, relevante Hint-/Ontology-Gates, Deck-Consumer-Audit, Final Review
  und Wissenslog abschließen.
- Done-Gate: keine fachliche oder technische Regression; sämtliche Evidence
  ist auf den finalen Code bezogen.
- Commit: `Verify AI match b34e remediation`.

### Paket 8 – Integration und Cleanup

- Ziel: aktuelles `main` in den Arbeitsbranch integrieren, final prüfen,
  lokal nach `main` mergen und den sauberen Worktree samt Branch entfernen.
- Done-Gate: `main` enthält alle Paketcommits; fremde Änderungen sind
  unverändert; Worktree ist im Git und Dateisystem entfernt; Branch gelöscht.

## Verifikationsvertrag

- Strict Capture und JSON-Schema-Validierung für jeden historischen Fixture.
- Produktiver Checkpoint-Runner mit unveränderten Erwartungen.
- Fokussierte Vitest-Dateien pro geänderter Runtime-/Plan-Schicht.
- `@netgrid/ai`-Typecheck und alle drei Testshards.
- Relevante AI-Full-Gates, Hint-/Ontology-Gates und Deck-Consumer-Audit.
- `git diff --check`, sauberer Worktree und erneute relevante Prüfung nach
  der Integration.

## Git-Regeln

- Arbeitsort: `C:\Projekte\NETGRID_AI_B34E_RUNNER_REMEDIATION`.
- Branch: `codex/ai-b34e-runner-remediation`.
- Der Hauptworkspace ist bis zur Integration nur Evidence-Quelle.
- Jeder Paketabschluss erhält einen eigenen Commit; rote Evidence bleibt ein
  eigenständiger, bewusst roter Commit.
- Es gibt keinen Push und keinen Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite AI-Match-B34E-Runner-Remediation vollständig und sequenziell
von Paket 1 bis Paket 8 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_B34E_RUNNER_REMEDIATION auf Branch
codex/ai-b34e-runner-remediation. Nutze den Hauptworkspace nur für Read-only-
Evidence und den finalen Merge. Arbeite immer nur am aktuellen Paket,
committe jedes bestandene Done-Gate und entferne Worktree und Branch erst
nach erfolgreicher Integration.`

## Abschlusskriterien

- Alle drei freigegebenen Fehlergruppen sind durch historische, unveränderte
  Checkpoints belegt und generisch behoben.
- Sämtliche Gegenproben und breite Gates sind grün.
- Final Review und Wissenslog nennen Match, Ursache, Maßnahmen und Gates.
- Die Änderungen sind lokal in `main` integriert.
- Worktree und Arbeitsbranch existieren nicht mehr.

## Abschlussstand vor Integration

- Die historische Evidence umfasst 119 von 119 Runner-Entscheidungen und
  ordnet alle 22 Auffälligkeiten vollständig den drei Befundgruppen zu.
- Zehn unveränderte historische Checkpoints wurden strict ab der
  nachgewiesenen Runtime-Neustartgrenze D43 erfasst. Die neun Zielregressionen
  waren vor den Fixes ausschließlich `behavior_regression` und sind auf dem
  finalen Arbeitsstand grün.
- Search-Consumer, Zwei-Punkte-Closeout und Viral-15-Sequenzkosten wurden in
  drei getrennten produktiven Paketen behoben. Die Kontrollen für dringende
  Remote-Antwortsuche, wertvolle Programme, später benötigte Breaker und echte
  Jack-out-Sicherheit bleiben grün.
- Der Deck-Consumer-Audit erfasst 20 eindeutige Runner-Karten beziehungsweise
  45 Karten ohne Ausschluss und meldet null blockierende Findings. Die
  bestehende `MS-todon`-Warnung zur Rolle `noisy` bleibt nicht blockierend.
- AI-Typecheck, 372 Testdateien mit 2.578 Tests und `check:ai:full` sind grün.
  Die Abschlussdetails stehen in
  `docs/reviews/ai/ai-match-b34e-runner-remediation-final-2026-07-17.md`.
