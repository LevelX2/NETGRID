# Semantic AI Production Readiness META 7 bis META 12 Automationsprozess

Stand: 2026-06-04
Status: Prozessdefinition für direkte sequenzielle Umsetzung
Aktiver Agent: `release-planning-agent`
Arbeitsbranch: `codex/meta7-meta12-production-readiness`
Arbeits-Worktree: `C:\Projekte\NETGRID_META7_META12_PRODUCTION_READINESS`

## Quelle/Vorgabe

Nutzervorgabe vom 2026-06-04: Nach abgeschlossenem Semantic AI Core META 1 bis META 6 soll die neue KI nicht sofort breit ersetzt werden. Der Fahrplan trennt zwei Stufen:

```text
Stufe A: Neue KI entscheidet produktiv in ausgewählten, abgesicherten Scopes.
Stufe B: Neue KI ersetzt Legacy breit oder vollständig.
```

Dieser Prozess bearbeitet nur Stufe A und die Stabilisierung danach:

```text
META 7: Multi-Run Evaluation + Human Review Closure
META 8: Internal Semantic Canary
META 9: Production-Safe Shadow / Agreement Canary
META 10: Limited Scoped Production Cutover
META 11: Scope Expansion + Calibration
META 12: Legacy Freeze + Production Stabilization
```

META 13 Legacy Retirement bleibt ein späterer, separater Prozess und ist hier ausdrücklich nicht enthalten.

Führende Eingangsnachweise:

- `docs/architecture/ai/semantic-ai-core-meta-automation-process-2026-06-04.md`
- `docs/reviews/ai/semantic-ai-core-meta-progress-2026-06-04.json`
- `docs/reviews/ai/meta6-semantic-ai-stabilization-legacy-freeze-prep-2026-06-04.md`
- `docs/reviews/ai/meta6-semantic-ai-stabilization-legacy-freeze-prep-report-2026-06-04.json`
- `docs/reviews/ai/ai061-sr-ai067-shadow-readiness-expansion-final-report-2026-06-04.md`
- `docs/reviews/ai/ai067-sr-shadow-readiness-rereview-2026-06-04.md`

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

Bestimmbar sind:

- Gesamtziel: die Semantic AI von `limited_rollout_candidate_for_selected_scopes` zu einem begrenzten, scope-gegateten Produktivpfad mit Legacy-Fallback und späterem Legacy-Freeze für ausgewählte Scopes führen.
- Sequenz: META 7 bis META 12 in dieser Reihenfolge.
- In-Scope: Multi-Run-Evaluation, Human-Review-Closure, internal-only Canary, production-safe Shadow, limited scoped Cutover, Scope-Expansion-Policy, Legacy-Freeze- und Stabilization-Vertrag.
- Nicht-Ziele: Full Production, breiter Cutover, Bulk-Aktivierung, Legacy Removal, produktive Aktivierung blockierter Scopes, neue Engine-Legalität, Hidden-Info-Projektion, Public-Payload-Änderung, Server-/Webclient-Umbau ohne Gate-Nachweis.
- Artefakte: je META Markdown-Review, JSON-Report und Check-Skript; gemeinsamer AI-Modulcode und fokussierte Tests.
- Verifikation: step-spezifische Check-Skripte, AI-Test, AI-Typecheck, `git diff --check`.
- Worktree-/Git-Erwartung: separater Worktree, Branch `codex/meta7-meta12-production-readiness`, Commit je abgeschlossenem Paket, finaler lokaler Merge nach `main`.
- Sicherheitsgrenzen: Semantic action muss aus Engine-`LegalActions` stammen, Hidden-Info-Verstöße und Engine Rejects bleiben harte Stopper, Rollback auf Legacy bleibt verfügbar.

Konservative Annahmen:

- Der aktuelle `main` enthält die META1-bis-META6-Artefakte und den Code inhaltlich, obwohl Git-Ancestry und `CODEX_STATUS.md` noch Integrationsdrift anzeigen. Dieser Prozess startet vom aktuellen `main` und verändert die alten Arbeitsbranches nicht.
- Produktivsetzung bedeutet in META10 nur "selected scopes may produce `actualDecision = semanticDecision` unter harten Gates und default-off/rollbackfähiger Konfiguration". Full Production und Legacy Removal bleiben verboten.
- Produktionsnahe Trace- und Payload-Prüfungen werden in diesem privaten Version-0-Projekt über reportfähige Harnesses und invariantenbasierte Checks modelliert, solange kein expliziter Server-/Webclient-Runtime-Gate für echte externe Produktion freigegeben ist.

## Gesamtziel

META 7 bis META 12 führen die neue Semantic AI kontrolliert bis zur begrenzten Stufe-A-Produktivsetzung:

1. META 7 beweist über mehrere deterministische Runs, dass ausgewählte Scopes stabil, erklärbar, human-review-geschlossen und ohne Hard-Gate-Verstoß entscheiden.
2. META 8 erlaubt semantische `actualDecision` nur in internen Canary-Läufen für freigegebene Scopes und testet Rollback aktiv.
3. META 9 validiert production-safe Shadow und Agreement Canary ohne Verhaltens- oder Public-Payload-Delta.
4. META 10 aktiviert den ersten limited scoped production cutover nur pro Scope und nur unter harten Gates.
5. META 11 erweitert Scopes einzeln mit Kalibrierung und Regression Suite, ohne Bulk-Aktivierung.
6. META 12 stabilisiert freigegebene Scopes und erlaubt Legacy-Freeze für ausgewählte Scopes, aber keine Legacy-Entfernung.

## Nicht-Ziele

- Kein Full Replacement der Legacy-KI.
- Kein Legacy Removal und keine Vorbereitung, die Rollback unmöglich macht.
- Keine globale Semantic-AI-Aktivierung.
- Keine Bulk-Aktivierung mehrerer neuer Scopes in META11.
- Keine produktive Freigabe blockierter Scopes wie `access_trash_steal`, `trace_payment`, `damage_prevention` oder `multi_target_multi_ability`.
- Keine Hidden-Info-Projektion aus FullState, verdeckten Karten, gegnerischer Hand, HQ/R&D, unrezzed ICE, facedown remote content oder privaten Choice-Optionen.
- Keine neue Legalität außerhalb der Rules Engine.
- Keine Änderung an PlayerView, PublicEvents, WebSocket-, Reconnect-, Undo-, Replay-, Client-Fehler- oder öffentlichen Log-Payloads.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Semantic AI darf nur `actionId` aus Engine-`LegalActions` auswählen.
- Cost, Timing, Reachability und Hard Gates schlagen Strategie.
- Boardstate darf Doctrine überstimmen.
- Jede Entscheidung hat Goal, Doctrine, Candidate, Gates, Score/Evidence und WhyNot.
- Jeder verworfene Kandidat hat WhyNot oder Gate-Grund.
- `actualDecision` darf nur dann semantisch sein, wenn Scope, Gate, Rollback und Trace-Vertrag dies explizit erlauben.
- Legacy bleibt Fallback bis zu einem späteren, separaten Retirement-Prozess.
- Produktive Flags bleiben default konservativ; Scope-Aktivierung muss einzeln und explizit sein.
- Trace Scrubbing muss hidden-info-riskante Felder entweder entfernen oder den Trace sicher droppen.

## Automatische Fehlerbehandlung

- Kleine Lücken werden als Annahme, Gap oder Follow-up dokumentiert und konservativ fortgeführt.
- Unklare Semantik bleibt `blocked_by_gap`, nicht geraten.
- Hidden-Info-Risiken bleiben `blocked_by_gate`.
- Metriken unter Mindestwert führen zu `blocked` oder `candidate`, nicht zu Promotion.
- Runtime-Overhead ohne belastbare Messbasis wird dokumentiert und für echte externe Produktion als Gate offen gehalten.
- Tests werden paketlokal debuggt; kein Wechsel zum nächsten Paket bei rotem Done-Gate.

## Sicherheitsblocker

Bei einem dieser Befunde stoppt der Prozess ohne Zwischenfrage und schreibt einen Blocker-Report mit Removal Condition:

- Hidden-Info-Leak oder Trace-Scrub-Verstoß.
- Semantic selected action nicht in Engine-`LegalActions`.
- Illegale semantische Entscheidung.
- Engine Reject in einem freigegebenen semantischen Pfad.
- Non-Determinism, Runtime-Mutation oder Public Payload Delta.
- Rollback-Fehler.
- Default-on produktives Globalflag.
- `actualDecision` wird außerhalb freigegebener internal/production-scoped Gates semantisch.
- Legacy-Fallback wird entfernt oder unbenutzbar.
- Konflikt mit neuen `main`-Änderungen, der denselben fachlichen Vertrag widersprüchlich definiert.

## State Machine

```text
worktree_preflight
-> process_defined
-> META7_in_progress
-> META7_done
-> META8_in_progress
-> META8_done
-> META9_in_progress
-> META9_done
-> META10_in_progress
-> META10_done
-> META11_in_progress
-> META11_done
-> META12_in_progress
-> META12_done
-> integration_preflight
-> merged_to_main
-> worktree_removed
-> complete
```

Blocker-Pfad:

```text
current_step -> blocked
```

## Paketfolge

| Paket | Titel | Done-Gate |
| --- | --- | --- |
| `META7` | Multi-Run Evaluation + Human Review Closure | Multi-Run-Korpus, TacticalGoalState-Metriken, Divergenzreview, Human-Review-Closure und Scope-Readiness-Promotion ohne Hard-Gate-Verstoß. |
| `META8` | Internal Semantic Canary | Internal-only Canary erlaubt semantische `actualDecision` in freigegebenen Scopes, Rollback-Fälle sind getestet, Default bleibt Legacy-only. |
| `META9` | Production-Safe Shadow / Agreement Canary | Production-safe Shadow läuft ohne Behavior Delta, Public Payload Delta, Hidden-Info-Leak oder Trace-Scrub-Verstoß. |
| `META10` | Limited Scoped Production Cutover | Erste selected scopes können unter Scope-Flags und harten Gates semantische `actualDecision` liefern; Legacy-Fallback und Auto-Rollback bleiben aktiv. |
| `META11` | Scope Expansion + Calibration | Erweiterung ist scope-by-scope modelliert, Regression Suite erweitert, keine Bulk-Aktivierung, neue Scopes nur bei grünem Dossier. |
| `META12` | Legacy Freeze + Production Stabilization | Stabile selected scopes können Legacy-Freeze erhalten; Legacy-Fallback bleibt verfügbar, Legacy Removal bleibt false. |

## Paketdetails

### META7

Ziel:

- Reproduzierbaren Multi-Run-Korpus mit mindestens 3 Run-Sets und mindestens 100 Decision Points modellieren.
- `goalPersistenceSuccessRate`, `goalProgressionRate`, `goalSatisfiedRate`, `goalValidExpirationRate`, `goalWrongAbandonRate` und `blockedGoalExplanationRate` auswerten.
- Semantic-vs-Legacy-Abweichungen kategorisieren.
- Human-Review-Queue für geprüfte Scopes schließen.
- Scope Readiness nur schrittweise anheben.

Kernartefakte:

- `packages/ai/src/semantic-ai-production-readiness.ts`
- `packages/ai/src/semantic-ai-production-readiness.test.ts`
- `docs/reviews/ai/meta7-multi-run-semantic-evaluation-human-review-2026-06-04.md`
- `docs/reviews/ai/meta7-multi-run-semantic-evaluation-human-review-report-2026-06-04.json`
- `scripts/check-meta7-multi-run-semantic-evaluation-human-review.mjs`

Commit-Vorschlag: `ai: add meta7 multi-run semantic evaluation`

### META8

Ziel:

- Internal-Canary-Flags und Scope-Gates modellieren.
- Für freigegebene Scopes `actualDecision = semanticDecision` nur intern erlauben.
- Rollback-Fälle für forced legacy, illegal semantic action, hidden-info block, missing trace und engine reject prüfen.
- Runtime-Overhead reporten.

Commit-Vorschlag: `ai: add meta8 internal semantic canary`

### META9

Ziel:

- Production-safe Trace Scrubber gegen verbotene Datenklassen härten.
- Agreement-only production-like Shadow ohne Behavior Delta modellieren.
- PlayerView, WebSocket, Replay, Undo, Client error payload und Logs als unchanged/scrubbed nachweisen.
- Metriken für Agreement, Availability, Gate-Blocking, Scrubbing und Overhead sammeln.

Commit-Vorschlag: `ai: add meta9 production-safe shadow canary`

### META10

Ziel:

- Final Scope Freeze für erste low-risk Scopes.
- Pro-Scope-Cutover-Flags statt globaler Aktivierung.
- Runtime-Entscheidung nur bei LegalAction-Membership, Scope-Freigabe, Hard Gates, Trace-Vertrag und Rollback-Freigabe.
- Live-Rollback und Monitoring/Kill-Switch-Metriken modellieren.

Commit-Vorschlag: `ai: add meta10 limited scoped production cutover`

### META11

Ziel:

- Pro Scope ein Dossier mit Status, Risiko, Gates, Fixtures, Human Review und Release-Entscheidung.
- Score-/Goal-Kalibrierung pro Scope prüfen.
- Regression Suite um hidden-info, illegal-action, rollback, engine-reject, agreement-only, scoped-override, legacy-fallback, trace-scrubber, determinism und goal-persistence Guards erweitern.
- Nur ein neuer Scope pro Iteration.

Commit-Vorschlag: `ai: add meta11 scope expansion calibration`

### META12

Ziel:

- Legacy-Freeze-Kriterien für selected scopes schließen oder begründet blockieren.
- Freeze klar von Removal trennen.
- Stabilitätsdashboard und Expansion-Policy finalisieren.
- Legacy-Retirement nur als spätere Bedingungsliste dokumentieren, nicht ausführen.

Commit-Vorschlag: `ai: add meta12 production stabilization legacy freeze`

## Verifikationsregeln

Jedes Paket muss mindestens erfüllen:

- Step-Check-Skript grün.
- Relevanter AI-Test grün.
- `corepack pnpm --filter @netgrid/ai typecheck` grün bei Codeänderung.
- `git diff --check` grün.
- JSON- und Markdown-Report stimmen mit Builder-Ausgabe überein oder das Check-Skript prüft die notwendigen invarianten Felder.
- Keine Runtime-Importe aus `apps/server`, `apps/web`, `packages/engine` oder bestehenden AI-Legacy-Planern, sofern das Paket dies nicht explizit und default-off erlaubt.

Finale Checks:

```text
node scripts/check-meta7-multi-run-semantic-evaluation-human-review.mjs
node scripts/check-meta8-internal-semantic-canary.mjs
node scripts/check-meta9-production-safe-shadow-agreement-canary.mjs
node scripts/check-meta10-limited-scoped-production-cutover.mjs
node scripts/check-meta11-scope-expansion-calibration.mjs
node scripts/check-meta12-legacy-freeze-production-stabilization.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-production-readiness.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree `C:\Projekte\NETGRID_META7_META12_PRODUCTION_READINESS`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Genau ein META-Paket ist aktiv.
- Ein lokaler Commit je grünem META-Paket.
- Prozess-/Progress-Artefakte dürfen separat vor META7 committed werden.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.
- Vor finalem Merge aktuellen `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Bevorzugt Fast-Forward-Merge nach `main`.
- Nach erfolgreichem Merge `git status --short --branch` und `git diff --check` auf `main`.
- Worktree erst nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite Semantic AI Production Readiness META 7 bis META 12 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_META7_META12_PRODUCTION_READINESS auf Branch codex/meta7-meta12-production-readiness.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen META-Paket.
Schreibe/aktualisiere Paketartefakte, Reports, Check-Skripte und Tests.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

Der Prozess ist abgeschlossen, wenn:

1. META 7 bis META 12 in Reihenfolge abgeschlossen sind.
2. Alle sechs Markdown-Reports, JSON-Reports und Check-Skripte vorliegen.
3. Der gemeinsame AI-Code und die Tests grün sind.
4. Alle harten Safety-Counter auf 0 stehen.
5. `limited_scoped_production_active` höchstens für ausgewählte, freigegebene Scopes gilt.
6. Hidden-Info-, Public-Payload-, Determinismus-, LegalAction- und Engine-Reject-Gates bestanden sind.
7. Rollback auf Legacy verfügbar und getestet bleibt.
8. Bulk-Aktivierung, Full Production und Legacy Removal ausgeschlossen bleiben.
9. Wissensbasis/Status nach Relevanz aktualisiert sind.
10. Der Branch lokal nach `main` gemerged ist.
11. Der separate Worktree entfernt ist.
