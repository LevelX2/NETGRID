# KI-Runner-Contest-Remediation für Match 9D15 (2026-07-16)

Status: P0 aktiv

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_9d15b8e9a2d9269d` aus der lokalen
SQLite-Runtime. Die vollständige Analyse schloss 84 von 84 Runner-KI-
Entscheidungen und belegte zwei unabhängige Fehlergruppen:

1. Decision 22 / StateVersion 39: Ein konkreter erreichbarer Inside-Job-Run
   auf die akut bedrohte Remote wird trotz `run_now` durch den abstrakten
   `draw_for_answer`-Plan verdrängt; Decision 23 wiederholt den Fehler.
2. Decision 81 / StateVersion 147: Die legale Run-Lock-Freigabe wird bei einer
   sichtbaren möglichen Zwei-Punkte-Terminal-Remote nicht priorisiert;
   Decision 82 wiederholt den Fehler.

Die Vorgabe ist präzise genug für direkte sequenzielle Umsetzung. Der parallel
laufende Broker-Optimierungsstrang bleibt vollständig außerhalb dieses
Prozesses.

## Gesamtziel und `/Goal`

`/Goal`: Die zwei freigegebenen Findings aus Match 9D15 im eigenen Worktree
zuerst als spielgleiche rote Decision-Checkpoints sichern, nur weiterhin rote
Verhaltensfehler generisch in Runner-Planung und side-sicherer
Terminalbedrohungsbewertung beheben, unveränderte Erwartungen und enge
Gegenproben grün verifizieren, den Analyse-Skill mit wiederverwendbaren
Runtime-/Schema-/Toolinformationen härten, dokumentieren, lokal nach `main`
integrieren und Worktree sowie Arbeitsbranch verifiziert entfernen.

- Arbeitsbranch: `codex/ai-match-9d15-runner-contest`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_9D15_RUNNER_CONTEST`
- Ausgangs-`main`: `8f4515b7abcfd309a8a1fc0a40fbd1582c4e9623`
- Hauptworkspace: nur für Runtime-Evidence und finalen lokalen Merge
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Erwartungen verwenden nur damalige Runner-PlayerViews, LegalActions,
  öffentliche Eventpräfixe und erlaubte Runtime-Metadaten.
- Eine Contest-Priorität nutzt die beste sichtbare Chance; sie behauptet
  keinen garantierten Steal oder Sieg.
- Keine Match-, Seed-, Karteninstanz- oder Kartennamen-Sonderregel entsteht.
- Broker-Installation, Laden, Cashout, Bankplanung, Portfolio und Scoring
  werden weder geändert noch bewertet.
- Engine-Kartentext, LegalAction-Erzeugung, Replay und Hidden-Info-Grenzen
  bleiben unverändert, sofern kein reproduzierbarer Engine-Blocker entsteht.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Die KI verwendet nur side-sichere PlayerViews und öffentliche Events.
- Produktionscode wird erst nach einem roten `behavior_regression`-Nachweis
  geändert.
- Bereits grüne historische Funde werden dokumentiert, nicht künstlich
  repariert.
- Checkpoint-Erwartungen werden nach dem Red-Nachweis nicht abgeschwächt.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration,
  Warmup-Drift oder Redaction-Fehler sind Infrastrukturarbeit und kein
  bestätigter Verhaltensfehler.
- Erfordert eine Lösung Hidden Info oder eine KI-Aktion außerhalb der
  LegalActions, stoppt der Prozess.
- Überschneidungen mit dem Broker-Worktree werden nicht übernommen.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder AI-Gate-Fehler
  blockieren den Abschluss.

## State Machine

`preflight -> process_committed -> red_evidence_committed -> bypass_fixed -> run_lock_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Prozessbasis und isolierter Worktree

- Ziel: Scope, `/Goal`, Invarianten, Branch und Worktree versionieren.
- Check: `git diff --check`.
- Done-Gate: Prozessartefakt ist auf dem Arbeitsbranch committed.
- Commit: `docs(ai): plan match 9d15 runner contest remediation`

### P1 – Spielgleiche rote Decision-Checkpoints

- Ziel: Decision 22 und Decision 81 vor Produktionsänderungen capturen.
- Zielverträge:
  - D22 akzeptiert den konkreten erreichbaren Bypass-Run auf Remote 1.
  - D81 akzeptiert die Run-Lock-Freigabe, wenn danach ein bezahlbarer
    Contest gegen die sichtbare mögliche Terminal-Remote verbleibt.
- Gegenproben:
  - Bypass reicht bei verbleibendem zweiten blockierenden ICE nicht aus.
  - Run-Lock-Freigabe greift ohne Folgeclick, ohne Finanzierung oder ohne
    terminale Score-Gefahr nicht.
- Done-Gate: Historische Zieltests sind ausschließlich als
  `behavior_regression` rot; Gegenproben sind grün; separater Commit.
- Commit: `test(ai): capture match 9d15 runner regressions`

### P2 – Bypass-Contest-Arbitration härten

- Ziel: Eine konkrete, erreichbare Run-Action für dieselbe akut bedrohte
  Remote unterbricht generisch einen abstrakten Coverage-Suchplan.
- Arbeit: RunTargetEvaluation, TacticalGoal/Plan-Mapping und finale
  Arbitration ohne Karten-ID-Sonderregel verbinden.
- Done-Gate: Unveränderte D22-Erwartung und Bypass-Gegenproben sind grün;
  angrenzende Plan-/RunTarget-Tests bleiben grün.
- Commit: `fix(ai): prefer viable bypass for urgent remote contest`

### P3 – Mehrpunkt-Terminalbedrohung bei Run-Lock berücksichtigen

- Ziel: Run-Lock-Freigabe und Matchpoint-Contest nicht nur bei exakt einem
  fehlenden Agenda-Punkt aktivieren.
- Arbeit: Eine ausschließlich öffentlich sichtbare Terminalbedrohung aus
  Scorestand, Advancement-/Remote-Signalen und erreichbarem Folgepfad
  verwenden; keine verdeckte Agendaidentität lesen.
- Done-Gate: Unveränderte D81-Erwartung und negative Gegenproben sind grün;
  bestehende Ein-Punkt-Matchpoint-Verträge bleiben grün.
- Commit: `fix(ai): contest visible multi-point terminal remotes`

### P4 – Verifikation, Evidence, Wissenspflege und Skill-Härtung

- Ziel: Fokussierte und breite Gates sowie dauerhafte Dokumentation
  abschließen und wiederkehrende Sucharbeit im Analyse-Skill eliminieren.
- Artefakte: Evidence-/Final-Review unter `docs/reviews/ai/`, AI-README und
  Monatslog; Skill-Referenz für Checkpoint-Capture, Workspace-Toolpfade,
  Testfallbacks und relevante Runtime-Codepfade.
- Pflichtchecks: Checkpoints, angrenzende Runtime-/Plan-/RunTarget-Tests,
  AI-Typecheck, `check:ai`, realistisch vollständige AI-Suite,
  Skill-Validierung und `git diff --check`.
- Done-Gate: alle Checks und Grenzen dokumentiert; Arbeitsbranch sauber.
- Commit: `docs(ai): close match 9d15 runner contest remediation`

### P5 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, erneut verifizieren, bevorzugt
  Fast-Forward mergen und Worktree sowie Branch entfernen.
- Done-Gate: lokales `main` enthält alle Paketcommits; Status und Diff-
  Hygiene sind grün; Worktree-Pfad und Arbeitsbranch existieren nicht mehr.

## Verifikationsregeln

- Historische Expectations bleiben nach ihrem Red-Nachweis unverändert.
- Jede positive Regel erhält mindestens eine eng variierte negative
  Gegenprobe.
- Fokussierte Vitest-Dateien direkt aufrufen, wenn pnpm-Filterargumente nicht
  zuverlässig durchgereicht werden.
- Bei fehlendem `node_modules` im Worktree entweder den dokumentierten
  Workspace-Binary-Fallback nutzen oder `pnpm install --frozen-lockfile`
  ausführen.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_9D15_RUNNER_CONTEST` auf Branch
`codex/ai-match-9d15-runner-contest`. Arbeite immer nur am aktuellen Paket,
stelle historische Verhaltensverträge vor dem jeweiligen Fix fachlich rot,
ändere ihre Expectations danach nicht und committe jedes abgeschlossene Paket
separat. Nutze den Hauptworkspace erst für den finalen Merge. Ändere keine
Broker-Logik.

## Abschlusskriterien

- Beide reproduzierbaren historischen Fehler besitzen dauerhafte
  spielgleiche Checkpoints und enge Gegenproben.
- Zieltests waren vor dem Fix rot und sind danach unverändert grün.
- Produktionsänderungen sind generisch, side-safe und Broker-unabhängig.
- Pflichtchecks und bewusst nicht ausgeführte Checks sind dokumentiert.
- Der Analyse-Skill kennt die stabilen Schema-, Tool-, Capture- und
  Verifikationspfade ohne erneute breite Suche.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
