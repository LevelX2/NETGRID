# Trapdoor-/Dumpster-Deflector-Remediation (2026-07-14)

Status: P0 aktiv

## Quelle und Gesamtziel

Quelle ist das gespeicherte Hard-Runner-KI-Spiel
`match_f450485d3e5be1ab` aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.
Der belegte Ablauf bei StateVersion 91 bis 100 lautet:

`R&D -> Trapdoor -> Remote 1 -> Dumpster -> Archives`.

Gesamtziel ist, die freigegebenen Deflector-Lücken zuerst auf aktuellem Code
als spielgleiche Decision-Checkpoints zu klassifizieren, danach die
Start-Run- und Encounter-Planung generisch, side-safe und LegalAction-basiert
zu korrigieren, die bestehende Redirect-Revalidation und Chronik gezielt zu
beweisen und den fertigen Branch lokal nach `main` zu integrieren.

- Arbeitsbranch: `codex/trapdoor-dumpster-ai-redirect-fix`
- Worktree: `C:\Projekte\NETGRID_AI_TRAPDOOR_DUMPSTER_REDIRECT`
- Ausgangs-`main`: `d60f82a5d083d1618ad585cc0bcbd133ba310b7d`
- KI-Profil: Runner `hard`

## Zielprüfung und aktuelle Abgrenzung

Der Scope ist präzise genug für direkte Umsetzung. Seit der fachlichen
Freigabe wurden auf `main` bereits andere F450-/10311-Korrekturen integriert.
Insbesondere rebasiert die Run-Plan-Revalidation einen bereits umgeleiteten
Run auf den aktuell angegriffenen Server. Diese bestehende Korrektur wird mit
dem historischen Archives-Zustand geprüft und nur erweitert, wenn der
Checkpoint weiterhin rot ist.

Die aktuelle Chronik kann generische Classic-Deflector-Payloads bereits als
konkrete Zielwechsel ausgeben. Dieser Prozess ergänzt die bislang
Entrapment-zentrierte Abdeckung um die konkrete Trapdoor-Dumpster-Kette; alte
Runtime-Events ohne die nötigen Public-Payload-Felder werden nicht migriert.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Checkpoints erzeugen PlayerView und LegalActions erneut über die Engine.
- Nur das öffentliche Eventpräfix bis zur Ziel-StateVersion wird genutzt.
- Produktiver Code erhält keine Match-, Seed-, Deck- oder Kartennamenlogik.
- Deflector-Projektion verwendet ausschließlich sichtbare gerezzte ICE,
  öffentliche Serverstruktur und im PlayerView verfügbare Regelmetadaten.
- Bei mehreren Korp-Zieloptionen darf die Runner-KI keinen für sie günstigen
  Zielentscheid unterstellen.
- Die zwei fremden offenen Engine-Aenderungen im Hauptworkspace werden weder
  verändert noch übernommen.

## Sicherheitsblocker und automatische Fehlerbehandlung

- Nur `behavior_regression` gilt als roter Verhaltensnachweis.
- `engine_legality_drift`, `runtime_state_drift`, Fixture-, Redaction- oder
  Warmup-Fehler werden vor jeder Verhaltensänderung als Infrastrukturproblem
  behandelt.
- Bereits grüne historische Erwartungen führen zu keinem künstlichen Fix.
- Fehlen für eine generische Redirect-Projektion side-safe Metadaten im
  PlayerView, stoppt das betroffene Paket ohne FullState-Workaround.
- Erwartungen werden nach dem Fix nicht abgeschwächt.

## State Machine

`P0 Preflight -> P1 Checkpoints/Red-Evidence -> P2 Deflector-Projektion ->`
`P3 Revalidation/Chronik -> P4 breite Verifikation -> P5 Integration/Cleanup`

Genau ein Paket ist aktiv. Ein Paket wird erst nach seinen Checks und einem
eigenen Commit abgeschlossen.

## Paketfolge

### P0 - Preflight und Prozessvertrag

- Ziel: Worktree, Scope, Invarianten und bestehende Vorarbeiten sichern.
- Gate: sauberer Worktree, korrekter Branch, `git diff --check`.
- Commit: `docs(ai): plan deflector redirect remediation`

### P1 - Spielgleiche Checkpoints und rote Evidence

- Capture DI52/SV92: Bei 10 Credits muss die bezahlbare Krash-Sequenz mit
  `pump_breaker` beginnen, damit Trapdoor gebrochen und R&D erhalten wird.
- Capture DI56/SV96: Bei nur 7 Credits darf der bekannte aussichtslose
  R&D-Pfad nicht erneut gestartet werden.
- Capture DI57/SV97 als Gegenprobe: Ist die Trapdoor-Sequenz im Encounter
  unbezahlbar, bleibt das Auslösen der Subroutine zulässig.
- Capture DI59/SV99: Nach der vollzogenen Dumpster-Umleitung auf freie
  Archives soll der aktuelle Run fortgesetzt werden; ein bereits grüner
  Checkpoint bestätigt die vorhandene Revalidation ohne neuen Fix.
- Gate: Zielpunkte ausschließlich `behavior_regression` oder bereits grün;
  Gegenproben grün; Fixture-Validierung und `git diff --check` grün.
- Commit: `test(ai): capture deflector redirect regressions`

### P2 - Generische Deflector-Projektion

- Ziel: `deflect_run` als zugriffsverändernde sichtbare Encounter-Wirkung in
  Start-Run-Pfadbewertung, Pump-Viability und Break-Priorisierung abbilden.
- Die Projektion muss den Erhalt des ursprünglichen Zugriffs durch Brechen,
  die sichtbaren Redirect-Ziele sowie die Bezahlbarkeit unterscheiden.
- Gate: unveränderte Checkpoint-Erwartungen und Unit-Gegenproben grün;
  keine Sonderprüfung auf Trapdoor- oder Dumpster-Kartennamen.
- Commit: `fix(ai): model visible deflector run paths`

### P3 - Redirect-Revalidation und Chronik

- Ziel: den bereits integrierten Redirect-Rebase am Archives-Checkpoint
  bestätigen und die generische Chronik mit Trapdoor -> Remote 1 sowie
  Dumpster -> Archives absichern.
- Gate: DI59 grün, vorhandene Run-Plan-Regressionen grün, neue
  Chronik-Regressionen für beide Redirect-Arten grün.
- Commit: `test(run): cover chained deflector redirects`

### P4 - Breite Verifikation und Reviews

- Ziel: fokussierte Tests, angrenzende AI-/Web-Suiten, AI-/Web-Typechecks,
  vollständige AI-Suite soweit realistisch und `git diff --check` ausführen.
- Evidence- und Final-Review unter `docs/reviews/ai/` pflegen.
- Gate: alle verpflichtenden Checks grün; Abweichungen dokumentiert.
- Commit: `docs(ai): close deflector redirect remediation`

### P5 - Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv integrieren, relevante Checks wiederholen,
  per Fast-Forward lokal nach `main` mergen und Worktree sowie Branch
  verifiziert entfernen.
- Gate: Main-Prüfung grün; Worktree weder registriert noch im Dateisystem;
  gemergter Arbeitsbranch gelöscht. Kein Push und kein Pull Request.

## Verifikationsregeln

Mindestens:

```powershell
corepack pnpm exec vitest run `
  packages/ai/src/evaluation/decision-checkpoints/trapdoor-dumpster-deflector-decision-checkpoints.test.ts `
  packages/ai/src/runtime/runner-pump-viability-context.test.ts `
  packages/ai/src/runtime/runner-run-plan-revalidation.test.ts `
  packages/ai/src/runtime/runner-run-plan-policy.test.ts `
  apps/web/app/chronicle.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Wenn der fokussierte Stand stabil ist, folgen die vollständige AI-Suite und
die für die geänderte Webschicht passenden Checks.
