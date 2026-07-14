# KI-Remediation für Match E676 (2026-07-14)

Status: Abgeschlossen; P0 bis P6 erfüllt

## Quelle und Gesamtziel

Quelle ist das zuletzt abgeschlossene Spiel der noch laufenden Matchserie aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`:

- Match: `match_e6761d8fcdbd7996`
- Serie: `series_965df0b61731277b`, Status `between_games`
- Modus: Mensch-Runner gegen Corp-KI `corp-ai-v0.9-hard`
- Ergebnis: Corp gewinnt 8:4 durch Agenda-Punkte
- Evidence: 367 Events, 367 Snapshots und 173 detaillierte
  AI-Decision-Traces

`/Goal`: Die drei freigegebenen Corp-KI-Fehler aus diesem Spiel sequenziell
im eigenen Worktree zuerst als spielgleiche rote Decision-Checkpoints mit
grünen Gegenproben sichern, nur weiterhin reproduzierbare Ursachen generisch
und side-safe beheben, vollständig verifizieren, lokal nach `main`
integrieren und Worktree sowie Arbeitsbranch sauber entfernen.

- Arbeitsbranch: `codex/ai-match-e676-decision-fixes`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_E676_DECISION_FIXES`
- Ausgangs-`main`: `5140d468bc299236c301a059bf88590a77b804df`
- Runtime-Daten: ausschließlich read-only aus dem Hauptworkspace

## Freigegebene Fehlerverträge

1. **Unsichere Tycho-Exposition am Matchpoint:** Bei SV162 / DI78 steht Corp
   6:0, benötigt nur einen Punkt und hält genau eine 4-Punkte-Agenda. Die
   eigene Scoring-Window-Diagnose bewertet das Fenster als `unsafe`, `slow`
   und vor dem Score erreichbar. Die Agenda darf dort nicht in den Remote
   installiert werden.
2. **Kostenloser persistenter Chester-Mix-Modifikator bleibt inaktiv:** Bei
   SV221 / DI101 ist Chester Mix legal für 0 Credits rezzbar und würde die
   unmittelbar folgende Fetch-Installation auf HQ verbilligen. Die KI muss
   den Modifikator vor der begünstigten ICE-Installation aktivieren.
3. **Höherwertige Ökonomie wird absolut blockiert:** Bei SV340 / DI158 ist
   Night Shift gegenüber dem Basis-Credit bei gleichem Klick strikt
   ertragreicher und zieht die Siegagenda früher. Der Scoreline-Reserveplan
   darf diese legale Ökonomieaktion nicht absolut zugunsten von
   `gain_credit` blockieren.

## Annahmen, Invarianten und Nicht-Ziele

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Checkpoints erzeugen PlayerView und LegalActions aus dem exakten
  historischen GameState und dem öffentlichen Eventpräfix neu.
- Spätere Hidden-Info wird weder in Fixtures noch in produktiven
  Entscheidungen verwendet.
- Runtime-Fixes sind generisch. Match-, Seed- und Kartennamen werden nicht als
  produktive Sonderfälle eingebaut.
- Die langfristige Planebene bleibt führend. Korrigiert werden nur lokale
  Controller- und Bewertungsverträge, die dem bereits diagnostizierten
  Plan widersprechen.
- Der frühe unbezahlbare Liche-Bluff und das zweite Trace-Gebot sind keine
  freigegebenen Fehler und bleiben außerhalb dieses Prozesses.
- Es werden keine Selfplays oder Benchmarks gestartet. Der Nachweis erfolgt
  über die spielgleichen Checkpoints, fokussierte Unit-Regressionen und die
  bestehende AI-Suite.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` gilt als roter Verhaltensnachweis.
- Bereits grüne historische Erwartungen werden dokumentiert und nicht durch
  einen neuen Fix verändert.
- `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, Redaction- oder Fixture-Fehler sind zuerst
  Infrastrukturarbeit.
- Fehlende LegalActions, Hidden-Info-Bedarf oder nicht auflösbare
  Schichtkonflikte stoppen das betroffene Paket ohne KI-Workaround.
- Zielerwartungen werden nach dem Fix nicht abgeschwächt.

## State Machine

`preflight -> captured -> red_evidence -> fixed -> verified -> documented -> merged -> cleaned`

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Jedes Paket erhält
seine Checks und einen eigenen Commit.

## Paketfolge

### P0 – Preflight und Prozessvertrag

- Ziel: Worktree, Scope, Invarianten und `/Goal` sichern.
- Checks: sauberer Worktree, `git diff --check`.
- Done-Gate: dieses Prozessartefakt ist separat committed.
- Commit: `docs(ai): plan match e676 decision remediation`

### P1 – Spielgleiche Captures und Gegenproben

- Ziel: SV162/DI78, SV221/DI101 und SV340/DI158 mit historischem
  Runtime-Zustand capturen, Fixture-Schema validieren und pro Fehler eine
  eng begrenzte Gegenprobe ergänzen.
- Kernartefakte: Fixtures unter
  `data/scenarios/ai-decision-checkpoints/` und eine fokussierte Testdatei
  unter `packages/ai/src/evaluation/decision-checkpoints/`.
- Checks: Capture-Warmup, Fixture-Validierung, Checkpoint-Infrastruktur.
- Done-Gate: alle drei Fixtures sind spielgleich und die Gegenproben sind
  fachlich bestimmt.
- Commit erfolgt zusammen mit P2, damit Red-Evidence und Erwartungen einen
  atomaren Testcommit bilden.

### P2 – Rote Verhaltens-Evidence

- Ziel: alle drei unveränderten Zielerwartungen gegen aktuellen Code rot und
  alle Gegenproben grün nachweisen.
- Checks: fokussierter Vitest-Lauf, Fehlercodes einzeln auf
  `behavior_regression` prüfen, `git diff --check`.
- Done-Gate: kein Legality-, Runtime-, Fixture- oder Redaction-Drift.
- Commit: `test(ai): capture match e676 decision regressions`

### P3 – Generische Runtime-Korrekturen

- Ziel: Die weiterhin roten Verträge für kostenlosen persistenten Rez-Vorteil
  und Reserveaktions-Arbitration jeweils an der verursachenden Schicht
  beheben. Der bereits grüne Tycho-Vertrag bleibt ohne Produktionsänderung.
- Checks: unveränderte Checkpoints und neue fokussierte Unit-Regressionen.
- Done-Gate: alle Zieltests und Gegenproben grün; keine Match-ID- oder
  Kartennamen-Sonderregeln im produktiven Code.
- Commit: `fix(ai): refine corp reserve action sequencing`

### P4 – Breite Verifikation

- Ziel: Checkpoints, angrenzende Tests, AI-Typecheck und vollständige
  AI-Suite prüfen.
- Checks: fokussierte Vitest-Dateien,
  `corepack pnpm --filter @netgrid/ai typecheck`,
  `corepack pnpm --filter @netgrid/ai test`, `git diff --check`.
- Done-Gate: alle verpflichtenden Checks grün; nicht ausgeführte optionale
  Checks sind begründet.
- Commit: nur falls Verifikationsartefakte geändert werden.

### P5 – Evidence, Wissen und Abschlussreview

- Ziel: Red-Evidence, Final-Report und Monatslog aktualisieren.
- Checks: Dokumentationslinks, `git diff --check`.
- Done-Gate: Ursachen, Grenzen, Checks und Integrationsstand sind dauerhaft
  dokumentiert.
- Commit: `docs(ai): close match e676 decision remediation`

### P6 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv in den Arbeitsbranch integrieren, final
  prüfen, lokal bevorzugt per Fast-Forward nach `main` mergen und Worktree
  sowie Branch verifiziert entfernen.
- Checks: sauberer Arbeitsbranch, Main-Verifikation, doppelte
  Worktree-Entfernungskontrolle, `git branch -d`.
- Done-Gate: lokales `main` enthält alle Pakete; Worktree-Pfad und Branch
  existieren nicht mehr.

## Controller-Regeln

- Der Hauptworkspace wird bis zum finalen Merge nicht verändert.
- Fremde Worktrees und Branches werden nicht angefasst.
- Vor jedem Paketcommit werden nur paketzugehörige Dateien gestaged.
- Bei zwischenzeitlich fortgeschrittenem `main` werden beide fachlichen
  Intentionen erhalten und relevante Tests nach der Integration wiederholt.
- Es gibt keinen Push und keinen Pull Request.
