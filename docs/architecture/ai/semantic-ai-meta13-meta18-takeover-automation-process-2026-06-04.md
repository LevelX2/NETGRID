# Semantic AI META 13 bis META 18 Takeover-Automationsprozess

Stand: 2026-06-04
Status: Prozessdefinition für direkte sequenzielle Umsetzung
Aktiver Agent: `release-implementation-agent`
Arbeitsbranch: `codex/meta13-meta18-semantic-ai-takeover`
Arbeits-Worktree: `C:\Projekte\NETGRID_META13_META18_SEMANTIC_AI_TAKEOVER`

## Quelle/Vorgabe

Nutzervorgabe vom 2026-06-04: Nach Stufe A ist die Semantic AI produktiv in ausgewählten, abgesicherten Scopes aktiv. Stufe B ist noch nicht erreicht. Die neue KI soll nicht global oder ungeregelt übernehmen, sondern über sechs weitere META-Schritte geführt werden:

```text
META13 Legacy-Freeze-Aktivierung + Extended Monitoring
META14 Low-Risk Scope Expansion
META15 Complex Scope Enablement
META16 Broad Scoped Production Expansion
META17 Semantic Default for Eligible Scopes
META18 Legacy Retirement / Full Takeover Decision
```

Führende Eingangsnachweise:

- `docs/architecture/ai/semantic-ai-production-readiness-automation-process-2026-06-04.md`
- `docs/reviews/ai/semantic-ai-production-readiness-progress-2026-06-04.json`
- `docs/reviews/ai/meta12-legacy-freeze-production-stabilization-2026-06-04.md`
- `docs/reviews/ai/meta12-legacy-freeze-production-stabilization-report-2026-06-04.json`
- `packages/ai/src/semantic-ai-production-readiness.ts`
- `packages/ai/src/semantic-ai-production-readiness.test.ts`

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

Bestimmbar sind:

- Gesamtziel: Semantic AI von `limitedScopedProductionActive` in vier Low-Risk-Scopes über Freeze, Erweiterung, komplexe Scope-Entsperrung, breitere Scope-Produktion, Semantic Default für eligible Scopes und eine separate Retirement-Entscheidung führen.
- Sequenz: META13 bis META18 in dieser Reihenfolge.
- In-Scope: maschinenlesbarer Freeze-Status, Extended Monitoring, low-risk Scope-Expansion, komplexe Scope-Dossiers, scope-by-scope Broad Production, eligible Default-Vertrag und Legacy-Retirement-Entscheidungsmodell.
- Nicht-Ziele: globaler Cutover ohne Scope-Gate, Bulk-Aktivierung, Legacy-Entfernung vor explizitem Signoff, neue Engine-Legalität, Hidden-Info-Projektion, Public-Payload-Änderung, Server-/Webclient-Umbau ohne Gate-Nachweis.
- Artefakte: je META Markdown-Review, JSON-Report, Check-Skript und fokussierte Vitest-Abdeckung; gemeinsamer AI-Harnesscode.
- Verifikation: step-spezifische Check-Skripte, AI-Test, AI-Typecheck, `git diff --check`.
- Worktree-/Git-Erwartung: separater Worktree, Branch `codex/meta13-meta18-semantic-ai-takeover`, Commit je abgeschlossenem Paket, finaler lokaler Merge nach `main`.
- Sicherheitsgrenzen: Semantic Action muss aus Engine-`LegalActions` stammen, Hidden-Info-Verstöße und Engine Rejects bleiben harte Stopper, Rollback und Legacy-Fallback bleiben verfügbar.

Konservative Annahmen:

- META13 aktiviert den Legacy-Freeze nur für die vier stabilisierten META12-Scopes und entfernt keinen Legacy-Code.
- META14 darf höchstens einen neuen Low-Risk-Scope produktiv aktivieren; `remote_contest` benötigt zuerst Target-Scoring-Kalibrierung.
- META15 macht komplexe Scopes höchstens `shadow_ready` oder `agreement_ready`; keine produktive Aktivierung komplexer Scopes.
- META16 erweitert Produktion weiterhin scope-by-scope, nicht global.
- META17 macht Semantic nur für eligible Scopes zum Default; Legacy bleibt Fallback.
- META18 ist ein Entscheidungspunkt. Legacy-Removal ist nur bei explizitem Signoff und erfüllten Langzeitbedingungen möglich; ohne Signoff bleibt Legacy als Fallback erhalten oder wird nur scopeweise eingefroren.

## Gesamtziel

META13 bis META18 führen die Semantic AI kontrolliert von Stufe A in eine mögliche Stufe-B-Entscheidung:

1. META13 setzt den Freeze für die vier stabilisierten Scopes aktiv und verlängert Monitoring mit Rollback-, Fallback- und Trace-Gates.
2. META14 erweitert Low-Risk-Scopes konservativ, priorisiert `simple_rez`, re-reviewed `simple_run_choice` und kalibriert `remote_contest`.
3. META15 entsperrt komplexe Scopes über explizite Context-Anforderungen oder klassifiziert sie als weiterhin blockiert.
4. META16 erweitert scoped production breit, aber weiterhin ein Scope pro Iteration und ohne globale Aktivierung.
5. META17 macht Semantic für eligible Scopes zum Default-Entscheider, während Legacy-Fallback erhalten bleibt.
6. META18 entscheidet, ob Legacy als Fallback bleibt, scopeweise retired wird oder Full Retirement überhaupt freigabereif ist.

## Nicht-Ziele

- Kein globaler Semantic-AI-Default für blockierte oder nicht eligible Scopes.
- Keine Legacy-Code-Entfernung ohne META18-Signoff.
- Keine Entfernung von Rollback, Kill-Switch oder Legacy-Fallback.
- Keine produktive Aktivierung komplexer Scopes in META15.
- Keine Bulk-Aktivierung mehrerer neuer Scopes in einem Paket.
- Keine Hidden-Info-Nutzung aus FullState, gegnerischer Hand, HQ/R&D, unrezzed ICE, facedown remote content oder privaten Choice-Optionen.
- Keine neue Legalität außerhalb der Rules Engine.
- Keine Änderung an PlayerView, PublicEvents, WebSocket-, Reconnect-, Undo-, Replay-, Client-Fehler- oder öffentlichen Log-Payloads.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Semantic AI darf nur `actionId` aus Engine-`LegalActions` auswählen.
- Cost, Timing, Reachability und Hard Gates schlagen Strategie.
- Jede Produktiventscheidung bleibt scope-, gate- und rollbackfähig.
- Legacy bleibt Fallback, bis META18 explizit eine andere Entscheidung erlaubt.
- Semantic Default gilt nur für eligible Scopes.
- Nicht eligible oder blockierte Scopes bleiben Legacy-only.
- Trace Scrubbing muss hidden-info-riskante Felder entfernen oder den Trace sicher droppen.
- Public Payload Delta, Engine Reject, Hidden-Info-Verstoß, Unsafe Divergence und Rollback Failure bleiben harte Stopper.

## Automatische Fehlerbehandlung

- Kleine Lücken werden als Annahme, Gap oder Follow-up dokumentiert und konservativ fortgeführt.
- Unklare Semantik bleibt `blocked_by_gap`, nicht geraten.
- Hidden-Info-Risiken bleiben `blocked_by_gate`.
- Metriken unter Mindestwert führen zu `blocked`, `candidate` oder `legacy_only`, nicht zu Promotion.
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
- `actualDecision` wird außerhalb freigegebener Scope-Gates semantisch.
- Legacy-Fallback wird entfernt oder unbenutzbar.
- Konflikt mit neuen `main`-Änderungen, der denselben fachlichen Vertrag widersprüchlich definiert.

## State Machine

```text
worktree_preflight
-> process_defined
-> META13_in_progress
-> META13_done
-> META14_in_progress
-> META14_done
-> META15_in_progress
-> META15_done
-> META16_in_progress
-> META16_done
-> META17_in_progress
-> META17_done
-> META18_in_progress
-> META18_done
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
| `META13` | Legacy-Freeze-Aktivierung + Extended Monitoring | Freeze aktiv für vier META12-Scopes, Monitoring verlängert, Rollback/Fallback/Trace-Gates grün, Legacy Removal false. |
| `META14` | Low-Risk Scope Expansion | `simple_rez` ist höchstens ein neuer produktiver Scope, `simple_run_choice` re-reviewed, `remote_contest` kalibriert aber nicht unreviewed produktiv. |
| `META15` | Complex Scope Enablement | Komplexe Scopes haben Context-Anforderungen, Shadow-/Agreement-Status oder Blocker; keine komplexe Produktivaktivierung. |
| `META16` | Broad Scoped Production Expansion | Breitere scope-by-scope Produktion mit stabilen Low-/Medium-Risk-Scopes, keine Bulk-Aktivierung, Legacy/Rollback verfügbar. |
| `META17` | Semantic Default for Eligible Scopes | Semantic wird Default nur für eligible Scopes; blocked/nicht eligible bleiben Legacy-only; Fallback bleibt aktiv. |
| `META18` | Legacy Retirement / Full Takeover Decision | Retirement-Entscheidung ist explizit; Full Removal bleibt ohne Signoff blockiert, Legacy-Fallback-Modell dokumentiert. |

## Paketdetails

### META13

Ziel:

- `legacyFreezeActiveForScopes` maschinenlesbar setzen.
- Mindestbeobachtung, Decision Count, Rollback Count, Semantic Share, Legacy Fallback Share, Latenz und Trace Scrub Rate reporten.
- Regression Suite gegen Legacy-Fallback, Rollback, Engine-LegalAction, Public-Payload-Delta und Hidden-Info-Leak sichern.

Commit-Vorschlag: `ai: add meta13 legacy freeze monitoring`

### META14

Ziel:

- `simple_rez` Dossier mit Credit Reserve, Rez Cost, Timing Window, Server Threat, ICE Relevance, Runner Pressure und Board Urgency.
- `simple_run_choice` Re-Review mit Legacy-Preferred-Grund.
- `remote_contest` Target-Scoring-Kalibrierung ohne verdeckte Remote-Identität.
- Höchstens ein neuer Scope produktiv.

Commit-Vorschlag: `ai: add meta14 low-risk scope expansion`

### META15

Ziel:

- `access_trash_steal`, `trace_payment`, `damage_prevention` und `multi_target_multi_ability` nach Context-Anforderungen, Risiken und Gates klassifizieren.
- Blockierte Fälle bleiben blockiert, statt geraten zu werden.
- Keine Produktivaktivierung komplexer Scopes.

Commit-Vorschlag: `ai: add meta15 complex scope enablement`

### META16

Ziel:

- Scope-Gruppen für low-, medium- und high-risk definieren.
- Jeder Scope durchläuft `shadow_ready -> agreement_ready -> limited_candidate -> internal_canary_ready -> production_shadow_stable -> limited_scoped_production_active -> freeze_ready`.
- Breitere Produktivsetzung bleibt einzeln, messbar, rollbackfähig und ohne globalen Default.

Commit-Vorschlag: `ai: add meta16 broad scoped production expansion`

### META17

Ziel:

- Eligible Scope Definition maschinenlesbar abbilden.
- Runtime-Vertrag: Semantic Default nur für eligible Scopes, LegalAction-Membership, grüne Gates und nicht erzwungenen Rollback.
- Legacy Fallback Share darf sinken, aber Fallback bleibt verfügbar.

Commit-Vorschlag: `ai: add meta17 semantic default eligible scopes`

### META18

Ziel:

- Entscheidung zwischen Legacy bleibt Fallback, scopeweisem Retirement oder Full-Retirement-Readiness.
- Full Legacy Retirement nur mit Mindestbeobachtung, Decision Count, Signoff, Rollback-Ersatzplan und gelösten oder bewusst legacy-only klassifizierten blockierten Scopes.
- Ohne explizites Signoff bleibt `legacyRemovalReady = false`.

Commit-Vorschlag: `ai: add meta18 legacy retirement decision`

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
node scripts/check-meta13-legacy-freeze-extended-monitoring.mjs
node scripts/check-meta14-low-risk-scope-expansion.mjs
node scripts/check-meta15-complex-scope-enablement.mjs
node scripts/check-meta16-broad-scoped-production-expansion.mjs
node scripts/check-meta17-semantic-default-eligible-scopes.mjs
node scripts/check-meta18-legacy-retirement-full-takeover-decision.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-production-readiness.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree `C:\Projekte\NETGRID_META13_META18_SEMANTIC_AI_TAKEOVER`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Genau ein META-Paket ist aktiv.
- Ein lokaler Commit je grünem META-Paket.
- Prozess-/Progress-Artefakte dürfen separat vor META13 committed werden.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.
- Vor finalem Merge aktuellen `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Bevorzugt Fast-Forward-Merge nach `main`.
- Nach erfolgreichem Merge `git status --short --branch` und `git diff --check` auf `main`.
- Worktree erst nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite Semantic AI META 13 bis META 18 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und docs/architecture/ai/semantic-ai-meta13-meta18-takeover-automation-process-2026-06-04.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_META13_META18_SEMANTIC_AI_TAKEOVER auf Branch codex/meta13-meta18-semantic-ai-takeover.
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

1. META13 bis META18 in Reihenfolge abgeschlossen sind.
2. Alle sechs Markdown-Reports, JSON-Reports und Check-Skripte vorliegen.
3. Der gemeinsame AI-Code und die Tests grün sind.
4. Alle harten Safety-Counter auf 0 stehen.
5. Hidden-Info-, Public-Payload-, Determinismus-, LegalAction- und Engine-Reject-Gates bestanden sind.
6. Scope-Erweiterung einzeln und dokumentiert erfolgt ist.
7. Semantic Default nur für eligible Scopes gilt.
8. Legacy-Fallback und Rollback verfügbar bleiben.
9. Legacy-Removal ohne Signoff ausgeschlossen bleibt.
10. Wissensbasis/Status nach Relevanz aktualisiert sind.
11. Der Branch lokal nach `main` gemerged ist.
12. Der separate Worktree entfernt ist.
