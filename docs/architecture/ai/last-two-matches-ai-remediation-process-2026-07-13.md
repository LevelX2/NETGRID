# KI-Remediation der letzten zwei Spiele (2026-07-13)

Status: P0 und P1 abgeschlossen; P2 aktiv; P3 bis P5 offen

## Quelle und Gesamtziel

Quelle sind die zwei zuletzt abgeschlossenen Spiele aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`:

- `match_543e35cbdf91cee3`: Mensch-Corp gegen Runner-KI, Flatline bei
  StateVersion 20;
- `match_1d63717d70fc81ef`: KI gegen KI, Runner-Sieg durch leeres Corp-R&D
  bei StateVersion 588.

`/Goal`: Die vier freigegebenen KI-Fehler aus beiden Spielen sequenziell im
eigenen Worktree zuerst als spielgleiche rote Decision-Checkpoints mit grünen
Gegenproben sichern, danach generisch und side-safe beheben, vollständig
verifizieren, lokal nach `main` integrieren und Worktree sowie Arbeitsbranch
sauber entfernen.

- Arbeitsbranch: `codex/ai-last-two-matches-20260713`
- Worktree: `C:\Projekte\NETGRID_AI_LAST_TWO_MATCHES_20260713`
- Ausgangs-`main`: `5c3884a633ca51811acca1905c9481e967e0f6fc`
- KI-Profile: Runner `hard`, Corp `hard`

## Freigegebene Fehlerverträge

1. Zeitlich begrenzte Vorbereitung: Ein Effekt wie `Prearranged Drop`, dessen
   Nutzen noch im aktuellen Zug durch einen Agenda-Zugriff eingelöst werden
   muss, darf ohne verbleibenden ausführbaren Zugriffspfad nicht gewählt
   werden. Historische Anker: SV12 im Kurzspiel sowie SV74, SV141 und SV272 im
   KI-Spiel.
2. Run-Phasengrenze: Während `movement` darf das nächste ICE nicht wie das
   bereits aktive Encounter behandelt werden. Ist der side-safe Restpfad
   erreichbar und bezahlbar, muss `continue_run` gegenüber einem falschen
   Sicherheitsabbruch zulässig bleiben. Historische Anker: SV209, SV271,
   SV334, SV378, SV412, SV523 und SV571.
3. Aktueller Trace-Kontext: Ein Trace-Bid muss an den aktuellen
   Pending-Choice-Trace und dessen öffentliche Basisstärke gebunden sein.
   Frühere Trace-Ereignisse dürfen die Berechnung nicht kontaminieren.
   Historischer Anker: SV529; erwartetes Gebot 5 mit sichtbarer sofortiger
   Damage-Konvertierung.
4. Sicherer Deckout: Ist Corp-R&D leer und der nächste obligatorische
   Corp-Draw unvermeidbar, priorisiert der Runner das Zugende und verbraucht
   keine Ressourcen für wirkungslose Runs. Historischer Anker: SV558/SV560.

## Invarianten und Nicht-Ziele

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Checkpoints erzeugen PlayerView und LegalActions erneut über die Engine.
- Spätere Hidden-Info wird weder in Fixtures noch in Runtime-Entscheidungen
  verwendet.
- Runtime-Fixes sind generisch; Match-, Seed- und Kartennamen werden nicht als
  Sonderfälle in produktiven Code eingebaut.
- Strategisch nur fragwürdige Agenda-Haltung, Matador-Installation und
  Broker-Zyklen bleiben außerhalb dieses Prozesses.
- Bestehende fremde Änderungen im Hauptworkspace werden nicht übernommen,
  zurückgesetzt oder committed.

## Koordinierter Integrationspunkt

Der aktive Arbeitsbranch `codex/ai-manhunt-execution-refinement` verändert
bereits den produktiven Trace-Kontext, den Bid-Vertrag und die
Checkpoint-Choice-Infrastruktur. Dieser Prozess dupliziert den Runtime-Fix
nicht. Er sichert den eigenen SV529-Vertrag und übernimmt den fertig
integrierten Stand später ausschließlich über aktuelles `main`. Bleibt der
fremde Branch bis zum Integrationspunkt ungemergt, ist P3 blockiert; fremde
Commits werden nicht eigenmächtig übernommen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` gilt als roter Verhaltensnachweis.
- Bereits grüne historische Erwartungen führen zu Dokumentation, nicht zu
  einem neuen Fix.
- Engine-, Runtime-, Fixture- oder Redaction-Drift wird zuerst als
  Infrastrukturproblem behandelt.
- Fehlende LegalActions, Hidden-Info-Bedarf oder nicht auflösbare
  Vertragskonflikte stoppen das betroffene Paket ohne KI-Workaround.
- Tests bleiben rot, bis die Ursache behoben oder als klarer Blocker
  dokumentiert ist; Erwartungen werden nach dem Fix nicht abgeschwächt.

## Paketfolge

### P0 – Preflight und Prozessvertrag

- Ziel: Worktree, Scope, Invarianten, Parallelitätsgrenze und `/Goal` sichern.
- Checks: Worktree sauber, `git diff --check`.
- Done-Gate: Prozessartefakt separat committed.
- Commit: `docs(ai): plan last-two-matches remediation`

### P1 – Spielgleiche Red-Evidence

- Ziel: Historische Zustände und öffentliche Event-Präfixe capturen; rote
  Zielerwartungen und grüne Gegenproben mit produktivem Chooser ausführen.
- Kernartefakte: Fixtures unter `data/scenarios/ai-decision-checkpoints/`,
  Testdatei unter `packages/ai/src/evaluation/decision-checkpoints/` und
  Evidence-Report unter `docs/reviews/ai/`.
- Checks: Fixture-Validierung, fokussierter Vitest-Lauf, `git diff --check`.
- Done-Gate: Jede weiterverfolgte Fehlergruppe ist
  `behavior_regression`; Gegenproben sind grün.
- Commit: `test(ai): capture last-two-matches regressions`

### P2 – Runner-Zeitfenster und Run-Phasenvertrag

- Ziel: Tote temporale Vorbereitung unterdrücken und Movement/Encounter sauber
  trennen.
- Checks: unveränderte Checkpoints, neue Unit-Regressionen, angrenzende
  RunnerRunPlan-Tests, `git diff --check`.
- Done-Gate: Zielerwartungen und Gegenproben grün.
- Commit: `fix(ai): respect runner timing and encounter phases`

### P3 – Trace-Kontext und Deckout-Endspiel

- Ziel: SV529 gegen den über `main` koordinierten Trace-Fix prüfen und den
  sicheren Deckout-Endspielplan generisch ergänzen.
- Checks: SV529-Choice, Trace-Gegenproben, Deckout-Checkpoint,
  Endgame-Unit-Tests, `git diff --check`.
- Done-Gate: SV529 verlangt exakt das kleinste garantierende und
  payoff-erhaltende Gebot; Deckout-Ziel und Gegenprobe sind grün.
- Commit: `fix(ai): bind trace choices and lock deckout wins`

### P4 – Breite Verifikation

- Ziel: alle fokussierten und angrenzenden Tests, AI-Typecheck und möglichst
  die vollständige AI-Suite ausführen.
- Checks: Decision-Checkpoints, RunnerRunPlan, Trace/Choice, Endgame,
  `corepack pnpm --filter @netgrid/ai typecheck`,
  `corepack pnpm --filter @netgrid/ai test`, `git diff --check`.
- Done-Gate: alle verpflichtenden Checks grün; Warnungen dokumentiert.
- Commit: `test(ai): close last-two-matches verification`

### P5 – Review, Wissen, Main-Integration und Cleanup

- Ziel: Final-Report und Monatslog aktualisieren, aktuelles `main` integrieren,
  final verifizieren, per Fast-Forward nach `main` mergen und Worktree sowie
  Branch entfernen.
- Checks: sauberer Arbeitsbranch, Main-Verifikation, doppelte
  Worktree-Entfernungskontrolle, Branch-Cleanup.
- Done-Gate: lokales `main` enthält alle Pakete und ist geprüft; Worktree und
  Arbeitsbranch existieren nicht mehr.
- Commit: `docs(ai): close last-two-matches remediation`

## Controller-Regeln

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Nach jedem Paket
werden seine Checks ausgeführt, nur zugehörige Dateien gestaged und ein eigener
Commit erstellt. Vor dem finalen Merge wird aktuelles `main` in den
Arbeitsbranch integriert. Push oder Pull Request sind nicht Teil dieses
Prozesses.
