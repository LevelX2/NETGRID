# Manhunt-Killplan: spielgleiche Decision-Checkpoint-Remediation

## Status

P0 und P1 abgeschlossen. Vier Fehler sind auf dem aktuellen
Produktions-Chooser als `behavior_regression` rot reproduziert; zwei historische
Abwurffälle sind bereits grün und bleiben ohne neuen Fix als Regressionstests
erhalten. Die roten Zieltests und sieben grünen Kontrollen sind vor der ersten
Verhaltensänderung versioniert. P2 hat noch nicht begonnen.

## Quelle und Arbeitsbereich

- Match: `match_606a546d0ba02826`
- Modus: menschlicher Runner gegen Hard-Corp-KI
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only
- Arbeitsbranch: `codex/ai-manhunt-kill-plan`
- Worktree: `C:\Projekte\NETGRID_AI_MANHUNT_KILL_PLAN`
- Primäre Schichten: DeckDoctrine, StrategicIntent, PlanPortfolio,
  Semantic Runtime, Aktionsarbitrierung, Abwurf und optionale Draw-Disziplin

## Zielprüfung

Der Endzustand ist hinreichend bestimmt: Die Corp soll das konkrete
Tag-/Schadensdeck als Killdeck mit unterstützender Agenda-Konversion erkennen,
Tag- und Schadensschritte als zusammenhängenden Plan ausführen, unmögliche
Scorelines verlassen und die dafür erforderlichen Karten erhalten. Die
freigegebenen Fehler besitzen historische StateVersions und Decision-IDs.

## Gesamtziel

Die sechs freigegebenen Fehlergruppen aus dem Match auf dem aktuellen
Produktions-Chooser prüfen, jeden weiterhin falschen Fall vor dem Fix exakt rot
reproduzieren, danach generisch in der bestehenden Planarchitektur beheben und
die unveränderten Checkpoints samt Gegenproben dauerhaft grün halten.

## /Goal

`/Goal Arbeite den Manhunt-Killplan-Prozess vollständig und sequenziell von P0
bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies
zuerst die Projektanweisungen und dieses Prozessartefakt. Arbeite ausschließlich
im Worktree C:\Projekte\NETGRID_AI_MANHUNT_KILL_PLAN auf Branch
codex/ai-manhunt-kill-plan; nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe jedes
abgeschlossene Paket. Sichere alle reproduzierbaren Fehler vor dem Fix als rote
spielgleiche Checkpoints mit grünen Gegenproben und separatem Red-Evidence-
Commit. Stoppe bei Hidden-Info-, LegalAction-, Fixture-, Engine- oder
Integrationsblockern. Verifiziere nach allen Fixes fokussiert und breit, gleiche
main defensiv ab, merge lokal, prüfe main und entferne anschließend Worktree und
gemergten Branch verifiziert.`

## Annahmen und Nicht-Ziele

- Die bestehende `StrategicIntentState`-/`PlanPortfolio`-Architektur bleibt die
  einzige Planautorität; es entsteht kein paralleler Killplanner.
- Fast Advance bleibt für echte Fast-Advance-Decks und als unterstützende
  Konversion erhalten.
- Dreifache Nutzung endlicher Economy bleibt erlaubt, wenn kein zeitkritisches
  höherwertiges Fenster besteht.
- Banpei wird gegen sichtbaren Matador nicht pauschal erzwungen. Zu korrigieren
  ist die Handhaltung gekonterter Duplikate, nicht eine konkrete Installation.
- Engine-Regeln, Kartenpool und sichtbare Informationen werden nicht erweitert.

## Controller-Invarianten

- Die Engine erzeugt alle `LegalActions`; die KI wählt nur daraus.
- PlayerView, PublicEvents und AI-Input bleiben side-safe.
- Historische FullStates sind ausschließlich testinterne Engine-Fixtures und
  werden nicht als produktiver KI-Input oder Rohreport versioniert.
- Checkpoints stellen den damaligen Runtime-Speicher wieder her und erzeugen
  PlayerView sowie LegalActions neu über die Engine.
- Nur `behavior_regression` zählt als fachlich roter Nachweis.
- Erwartungen werden nach dem Fix nicht abgeschwächt oder ausgetauscht.
- Kartenname-Sonderregeln sind unzulässig, wenn Taktiksignale, Rollen und
  sichtbarer Kontext die Entscheidung generisch beschreiben können.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Bei `engine_legality_drift`, `runtime_state_drift`, Migration oder
  Redaction-Fehlern zuerst die Fixture-Infrastruktur reparieren; der Fall ist
  dann noch kein bestätigter KI-Fehler.
- Bereits grüne historische Kandidaten werden dokumentiert und nicht gefixt.
- Bei neuen roten angrenzenden Tests wird nur innerhalb des aktiven Pakets
  debuggt.
- Hidden-Info-Bedarf, fehlende LegalActions oder nicht verlustfrei lösbare
  Main-Konflikte stoppen den Prozess ohne Workaround.

## State Machine

`preflight -> capture -> red_evidence -> implementation -> green_verification
-> documentation -> main_integration -> cleanup -> complete`

Genau ein Paket ist aktiv. Ein Zustandswechsel erfolgt erst nach bestandenem
Done-Gate und Paketcommit.

## Paketfolge

### P0 – Preflight und Prozessvertrag

- Worktree, Branch, Quelle, Invarianten und `/Goal` verankern.
- Checks: sauberer Worktree, `git diff --check`.
- Done-Gate: Prozessartefakt committed.
- Commit: `docs(ai): plan Manhunt kill-line remediation`

### P1 – Spielgleiche rote Checkpoints und Gegenproben

- Runtime-Erwartungen auf stabile Strategie-/Zielmerkmale erweitern, soweit
  Aktions- und Discard-Erwartungen den Doctrine-/Intent-Fehler nicht ausdrücken.
- Kandidaten capturen und auf aktuellem Code prüfen:
  - SV2: Killdoctrine primär, Fast Advance unterstützend;
  - SV136 / DI70: Chance Observation vor BBS-Economy;
  - SV247 / DI111: I Got a Rock behalten;
  - SV287 / DI119: unmögliche Scoreline aufgeben;
  - SV307 / DI129: BBS als finanzierender Killbaustein entwickeln;
  - SV311 / DI133: Audit und Urban Renewal behalten.
- Je bestätigtem Fehler eine grüne Gegenprobe ergänzen.
- Bereits grüne oder nicht sauber reproduzierbare Kandidaten aussondern.
- Checks: Fixture-Validierung, Checkpoint-Lauf mit exakt roten Zieltests und
  grünen Gegenproben, `git diff --check`.
- Done-Gate: Red-Evidence vor jeder Verhaltensänderung separat committed.
- Commit: `test(ai): capture red Manhunt kill-line checkpoints`

### P2 – Doctrine, Intent und Killprojekt

- Relative Siegbedingungsstärke und gekoppelte Tag-/Schadenslinie ableiten.
- Erreichbare Voraussetzungen statt bloß aktuell legaler Payoffs modellieren.
- Verbleibende Scoreline side-safe prüfen und unmögliche Ziele hart blockieren.
- Killprojekt als bestehendes PlanPortfolio-Projekt beziehungsweise Interrupt
  integrieren; Economy bleibt Background/Teilschritt.
- Checks: unveränderte Doctrine-/Intent-/Aktionscheckpoints, Gegenproben,
  fokussierte Unit-Tests, `git diff --check`.
- Done-Gate: strategische und Aktionscheckpoints grün, eigener Commit.
- Commit: `fix(ai): connect Corp tag and damage win lines`

### P3 – Abwurf- und Draw-Disziplin

- „derzeit nicht legal“ von „nicht mehr erreichbar“ unterscheiden.
- Enabler/Payoff-Paare, verbleibende Kopien, sichtbare Konter und Duplikate in
  der Keep-Wertung berücksichtigen.
- Optionalen Draw bei voller HQ und kleinem R&D an konkrete fehlende
  Planrollen und erwartete Abwurfkosten binden.
- Checks: unveränderte Discard-Checkpoints, Gegenproben, angrenzende
  Discard-/Draw-Tests, `git diff --check`.
- Done-Gate: Abwurf- und Draw-Checkpoints grün, eigener Commit.
- Commit: `fix(ai): preserve reachable Corp kill components`

### P4 – Breite Verifikation und Abschlussdokumentation

- Fokussierte Checkpoints, angrenzende AI-Tests, AI-Typecheck, relevante
  Doctrine-/Hint-Gates und realistische breite Suite ausführen.
- Evidence- und Final-Report unter `docs/reviews/ai/` schreiben.
- Dauerhaften Vertrag im Monatslog `Log 2026-07.md` ergänzen.
- Done-Gate: alle erforderlichen Checks dokumentiert und eigener Commit.
- Commit: `docs(ai): close Manhunt kill-line remediation`

### P5 – Main-Integration und Cleanup

- Aktuelles `main` defensiv in den Arbeitsbranch integrieren, falls nötig.
- Finale relevante Checks wiederholen.
- Arbeitsbranch lokal nach `main` mergen.
- Main-Status und Diff-Hygiene prüfen.
- Sauberen Worktree entfernen, Entfernung in Git und Dateisystem bestätigen,
  anschließend gemergten Branch mit `git branch -d` löschen.
- Done-Gate: Main enthält alle Paketcommits; Worktree und Branch sind entfernt.

## Verifikationsregeln

Mindestens:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run <fokussierte Tests>
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:ai-deck-doctrine-strategy
git diff --check
```

Wenn realistisch zusätzlich `corepack pnpm --filter @netgrid/ai test` und das
passende Realitäts-/Simulationstor. Timeout oder Prozessabbruch zählt nicht als
grün.

## Abschlusskriterien

- Jeder implementierte Fix besitzt vorherige rote Match-Evidence.
- Alle unveränderten Zielerwartungen und Gegenproben sind grün.
- Keine neue Hidden-Info-, LegalAction-, Engine- oder Replay-Abweichung.
- Evidence, Final-Report und Wissenslog benennen Grenzen und gelaufene Gates.
- Arbeitsbranch ist lokal in `main` integriert.
- Worktree-Pfad und Arbeitsbranch sind verifiziert entfernt.
