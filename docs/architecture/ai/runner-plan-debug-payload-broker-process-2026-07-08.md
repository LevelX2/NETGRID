# Runner-Plan Debug/Payload/Broker Prozess 2026-07-08

Status: umgesetzt, vor lokalem Merge nach `main`

## Quelle/Vorgabe

- Nutzerauftrag vom 2026-07-08: Folgepakete im Worktree mit dem Paketprozess-Skill umsetzen.
- Priorität aus vorangehender Analyse:
  1. Debug-Anzeige für neue Plan- und RunnerRunPlan-Ebene schärfen.
  2. Run-Payload- und Post-success-Planmapping ergänzen.
  3. Broker-/spezialisierte-Credit-Budgetierung verbessern.
- Vorlaufartefakte:
  - `docs/architecture/ai/runner-plan-review-followups-process-2026-07-08.md`
  - `docs/reviews/ai/runner-plan-review-followups-final-2026-07-08.md`

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Die Paketfolge ist festgelegt, die betroffenen Schichten sind erkennbar und die Sicherheitsgrenzen bleiben unverändert. Kleine Modellierungslücken werden konservativ als side-safe Runtime-Heuristiken umgesetzt oder als Folgepunkt dokumentiert.

## Gesamtziel

Die Runner-KI soll nach der Plancontroller-Härtung besser beobachtbar und in drei praktischen Bereichen stärker werden:

- Die Live-Debug-Anzeige zeigt neue Planarten, Tag-Clear, konkrete Required-Subroutinen, Reserve und RunPlan-Entscheidungen verständlich an.
- Runner-Pläne erkennen legale Run-Payload-Aktionen und post-success-Fenster als planpassende Aktionen statt sie dem normalen Action-Score zu überlassen.
- Broker-/Bank-ähnliche Economy und zweckgebundene Credit-Indizien werden konservativ besser geplant, damit wertvolle Economy-Karten nicht zu früh aufgegeben oder untergenutzt werden.

## Annahmen

- Alle Änderungen bleiben AI-intern oder Debug-UI-intern.
- Die KI wählt weiter ausschließlich vorhandene Engine-`LegalActions`.
- Keine Engine-Regeländerung, keine neuen Kartenfreischaltungen, keine PlayerView- oder Replay-Vertragsänderung.
- Debug-Ausgaben bleiben redigiert und enthalten keine verdeckten Korp-Hand-, R&D-, Remote- oder Stackdaten.
- Spezialcredits werden nur genutzt, wenn sie side-safe aus LegalAction/Evidence/öffentlichen Kartensemantiken ableitbar sind.

## Nicht-Ziele

- Kein vollständiger mehrzügiger Suchbaum.
- Keine vollständige Modellierung aller möglichen Run-Event-Karten.
- Keine allgemeine R&D-/HQ-/Remote-Hidden-Info-Ausweitung.
- Keine globale Neukalibrierung aller Plan- und Action-Scores.
- Kein Push, kein Pull Request, keine Remote-Integration.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- UI, Server, menschliche Spieler und KI nutzen nur `LegalActions`.
- Debug- und Trace-Pfade dürfen keine Hidden-Info leaken.
- TacticalPlans sind Plan-, Mapping- und Priorisierungsschicht, keine Action-Erzeugung.
- RunnerRunPlan trifft keine Regelentscheidung, die `applyAction` nicht revalidiert.

## Automatische Fehlerbehandlung

- Bei rotem Test wird im aktiven Paket eng debuggt.
- Bei nicht side-safe ableitbaren Kosten oder Effekten wird konservativ kein positiver Planbonus vergeben.
- Bei Konflikt zwischen Planwirkung und LegalAction-Vertrag wird ein Blocker mit Removal Condition dokumentiert.
- Fremde Änderungen werden nicht revertet.

## Sicherheitsblocker

- Eine Lösung bräuchte verdeckte Korp-Hand-, R&D-, Remote- oder Stackdaten.
- Eine geplante Aktion ist keine aktuelle Engine-`LegalAction`.
- Die UI müsste private AI- oder Engine-Daten in normaler Spieleransicht anzeigen.
- Spezialcredits oder Broker-Erträge müssten aus nicht sichtbaren Informationen geraten werden.

## State Machine

1. Prozessartefakt erstellen und Scope fixieren.
2. Debug-Anzeige für Plan-/RunPlan-Details schärfen.
3. Run-Payload- und Post-success-Planmapping ergänzen.
4. Broker-/spezialisierte-Credit-Budgetierung verbessern.
5. Abschlussbericht, Wissenslog, finale Checks und lokaler Merge nach `main`.

## Paketfolge

### RPPB-0 Prozessartefakt und Scope

Ziel: Prozess, Annahmen, Paketfolge, Sicherheitsgrenzen und Verifikationsregeln dokumentieren.

Kernartefakt: dieses Dokument.

Checks: `git diff --check`.

Commit: `docs(ai): plan runner plan debug payload broker followups`

### RPPB-1 Debug-Anzeige

Ziel: Live-Overlay und JSON-Export zeigen die neue Planebene ausreichend verständlich:

- deutsche Labels für `runner.clear_tags_or_survive`, `clear_tags` und `tag_clear`;
- RunnerRunPlan zeigt Required-Subroutine-Indizes, Survival-/Access-Breakgrund, Abortgrund und Steal-/Trash-Reserve sichtbar;
- Export enthält dieselben client-visible Projektionen.

Kernartefakte:

- `apps/web/features/debug/AiDecisionDebugOverlay.tsx`
- `apps/web/app/maintenance.ts`
- `packages/ai/src/diagnostics/semantic-runtime-decision-debug.ts`
- RunnerRunPlan-Diagnostiktests.

Checks: Web-Debug-UI-Tests, fokussierte AI-Diagnostiktests, `@netgrid/web` oder passende Typechecks, `git diff --check`.

Commit: `fix(ai): surface runner plan debug details`

### RPPB-2 Run-Payload und Post-success

Ziel: TacticalPlan-Mapping erkennt legale Run-Payload- und post-success-Aktionen:

- Run-Preps/Run-Events mit Zielserver, Multiaccess, Bypass, access-payload oder ähnlichem können zu `run_target`/`probe_central` passen;
- post-success-Fenster bekommen eine eigene Planlinie oder Sonder-Mapping-Klasse, damit legale Follow-ups nach erfolgreichem Run nicht gegen normale Economy-/Setup-Aktionen verlieren;
- Mapping bleibt LegalActions-only und side-safe.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-types.ts`
- `packages/ai/src/plans/tactical-plan-step-semantics.ts`
- `packages/ai/src/plans/tactical-plan-runner-plans.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- fokussierte Plan-/Mapping-Tests.

Checks: Plan-Step-/TacticalPlan-/Runtime-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): map runner run payload and success windows`

### RPPB-3 Broker und spezialisierte Credits

Ziel: Economy-Planung wird für Broker-/Bank-ähnliche Karten und zweckgebundene Credits konservativ stärker:

- Broker/Bank-Aufbau bevorzugt Mindestladungen und verhindert zu frühes Cash-out, solange kein akuter FundingNeed besteht;
- Cash-out bleibt erlaubt, wenn dadurch ein wichtiger Run-/Survival-/Score-Plan unmittelbar ausführbar wird;
- Spezialcredit-Indizien werden im RunPlan-Budget und in Debug-Evidence sichtbar, ohne sie als normale Credits zu überschätzen.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-bank-tools.ts`
- `packages/ai/src/plans/tactical-plan-runner-plans.ts`
- `packages/ai/src/runtime/runner-run-plan-start.ts`
- `packages/ai/src/runtime/runner-run-plan-types.ts`
- fokussierte Bank-/RunPlan-Budget-Tests.

Checks: Bank-/TacticalPlan-/RunPlan-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Commit: `fix(ai): improve runner bank and run credit budgets`

Umgesetzt:

- Runner-Credit-Banks verwenden eine explizite Hysterese: Aufbauziel 12 gespeicherte Credits, dringende Auszahlung erst ab 6 gespeicherten Credits bei niedrigem Creditpool oder sofort bei konkretem Plan-FundingNeed.
- Die Score-Hilfe für Bank-Cashout wurde an diese Hysterese angeglichen, damit niedrige Credits allein keinen einmal geladenen Broker entladen.
- RunnerRunPlans erfassen Run-only-, recurring Breaker-/Killer-/Link-, Stealth- und Non-noisy-Breaker-Credits aus LegalAction-Payloads und sichtbaren Rig-Counter-Displays.
- Die Debug-Anzeige zeigt diese Zweckcredits als eigene Runner-RunPlan-Zeile.

Checks:

- `corepack pnpm exec vitest run packages/ai/src/tactical-plans.test.ts packages/ai/src/runtime/runner-bank-investment-context.test.ts packages/ai/src/runtime/runner-run-plan-memory.test.ts packages/ai/src/diagnostics/semantic-runtime-decision-debug.test.ts apps/web/app/maintenance.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

### RPPB-4 Abschluss und Integration

Ziel: Final-Report, Wissenslog, kompletter fokussierter Verify-Lauf und lokaler Merge nach `main`.

Kernartefakte:

- `docs/reviews/ai/runner-plan-debug-payload-broker-final-2026-07-08.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`

Checks: alle Paketchecks erneut, `git status --short`, `git diff --check`, lokaler Merge nach `main`, Main-Checks.

Commit: `docs(ai): finalize runner plan debug payload broker followups`

## Verifikationsregeln

- Jedes Codepaket braucht fokussierte Unit-Tests oder eine dokumentierte engere Verifikation.
- `corepack pnpm --filter @netgrid/ai typecheck` ist Pflicht für AI-Codepakete.
- Für Web-Debug-Änderungen ist ein passender Web-Test oder Typecheck Pflicht.
- `git diff --check` ist vor jedem Commit und nach finalem Merge Pflicht.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_RUNNER_PLAN_DEBUG_PAYLOAD_BROKER`
- Branch: `codex/runner-plan-debug-payload-broker`
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.
- Jeder Paketstand wird separat committed.
- Nach Abschluss wird der Arbeitsbranch lokal nach `main` gemerged.

## Controller-Prompt-Kern

`/Goal Arbeite Runner-Plan Debug/Payload/Broker Followups vollständig und sequenziell von RPPB-0 bis RPPB-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, apps/web/AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_RUNNER_PLAN_DEBUG_PAYLOAD_BROKER auf Branch codex/runner-plan-debug-payload-broker. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket, dokumentiere Blocker mit Removal Condition und markiere das Goal erst nach erfolgreichem lokalen Merge und Main-Verify complete.`

## Abschlusskriterien

- Alle RPPB-Pakete sind umgesetzt und committed oder mit hartem Blocker dokumentiert.
- Finale fokussierte Checks sind grün.
- Branch ist lokal nach `main` integriert.
- Keine nicht klassifizierten Arbeitsdateien bleiben offen.
