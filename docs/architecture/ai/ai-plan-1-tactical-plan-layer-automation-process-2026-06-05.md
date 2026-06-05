# AI-PLAN-1 TacticalPlan Runtime Layer

Status: in Umsetzung

## Quelle/Vorgabe

Ausgangspunkt ist der eingefügte Nutzertext vom 2026-06-05. Der Text verweist zusätzlich auf die Review-Artefakte `docs/reviews/ai/ai-plan-layer-current-state-review-2026-06-05.md` und `.json`, die im Hauptworkspace als ungetrackte Quellen liegen. Der Prozess nutzt die Vorgabe als führenden Scope und verändert die ungetrackten Hauptworkspace-Quellen nicht.

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: eine schlanke Live-Planebene zwischen Doctrine/Boardstate und LegalAction-Auswahl einbauen.
- Sequenz: Phase 1 Modell, Phase 2 Mapping, Phase 3 erste Plantypen.
- In Scope: `packages/ai/src/tactical-plans.ts`, Livepfad `chooseSemanticRuntimeAction`, fokussierte AI-Tests und ein kurzer Review.
- Nicht-Ziele: keine neue Kartensemantik, keine Engine-/Legalitätsänderung, keine Hidden-Info-Ausweitung, kein Umbau der Legacy-Planer.
- Abnahme: finale Entscheidung bleibt Engine-`LegalAction`, `applyAction` bleibt Regelautorität, Debug zeigt Plan -> Step -> gemappte LegalActions -> gewählte Action.

## Gesamtziel

`chooseSemanticRuntimeAction(input, legacyDecision)` soll nicht mehr nur direkte `input.legalActions` scoren, sondern zuerst TacticalPlans erzeugen, einen aktuellen PlanStep auswählen, diesen über `ActionSemanticCandidate` auf LegalActions mappen und erst danach die konkrete Engine-Action wählen. Die direkte Semantic-Runtime-Bewertung bleibt Fallback.

## Annahmen

- Der erste Stand rekonstruiert PlanState deterministisch aus `AiDecisionInput`; persistente Planfortschreibung wird nicht eingeführt.
- Reaktive Fenster bleiben Safety-First und dürfen die Planebene übersteuern.
- Broker-/Bank-Aktionen werden über bestehende LegalAction-Labels, Kosten, Quellen und vorhandene Semantic-Candidate-Signale erkannt, nicht über neue Kartendaten.
- Remote-Breaker-Blocker werden nur aus side-safe PlayerView- und LegalAction-Daten abgeleitet.

## Nicht-Ziele

- Keine neuen Kartenresolver.
- Keine neue Kartensemantik oder Hint-Ontologie.
- Keine Engine- oder Shared-LegalAction-Schemaänderung.
- Keine Enterprise-Gate-Kaskade.
- Kein kompletter Ersatz von `runner-plans.ts` oder `corp-plans.ts`.
- Kein Remote-Push und keine PR-Erstellung.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird abgeschlossen, bevor Paketchecks und `git diff --check` grün sind oder ein Blocker dokumentiert ist.
- Jeder abgeschlossene Schritt bekommt einen eigenen Commit.
- Der Hauptworkspace wird nur für den finalen lokalen Merge nach `main` genutzt.

## Automatische Fehlerbehandlung

- Bei TypeScript- oder Testfehlern wird eng im betroffenen Paket debuggt.
- Bei Mergekonflikten werden beide Intentionen gelesen und fachlich kompatibel zusammengeführt.
- Bei Hidden-Info-, Engine-Legalitäts- oder Regelautoritätsrisiko stoppt der Prozess.

## Sicherheitsblocker

- Auswahl einer nicht in `input.legalActions` vorhandenen Action.
- Nutzung verdeckter gegnerischer Kartendaten.
- Änderung an `applyAction`, LegalAction-Erzeugung oder Engine-Regelvalidierung.
- Nicht auflösbarer Konflikt mit bestehenden Semantic-Runtime-Safety-Gates.

## State Machine

`preflight` -> `package_1_model` -> `package_2_mapping` -> `package_3_plans` -> `final_verify` -> `merge_main` -> `complete`

## Paketfolge

### Paket 1: TacticalPlan + PlanStep Modell

Ziel: neues Modul mit Typen, Factory-/Ranking-Helfern, Prozessartefakt und fokussiertem Modelltest.

Done-Gate:

- `packages/ai/src/tactical-plans.ts` existiert.
- Modelltypen für Plan, Step, Blocker, Capability, Lifecycle und ScoreBreakdown existieren.
- Fokussierter Test prüft Plan-/Step-Grundform.
- `corepack pnpm --filter @netgrid/ai typecheck`, fokussierter Vitest und `git diff --check` sind grün.

Commit-Vorschlag: `AI-PLAN-1 Paket 1: TacticalPlan-Modell anlegen`

### Paket 2: PlanStep-to-LegalAction Mapping

Ziel: `buildActionSemanticCandidates(input.legalActions)` im Livepfad nutzen, PlanStep-Mapping einbauen und Debug-Ausgabe für Plan/Step/Action-Mapping ergänzen.

Done-Gate:

- Mapper `mapPlanStepToLegalActions` existiert.
- `chooseSemanticRuntimeAction` nutzt Plan-/Step-Ranking vor direktem Action-Fallback.
- Reaktive Fenster bleiben bevorzugt.
- Tests zeigen Candidate-Nutzung und Fallback-Verhalten.

Commit-Vorschlag: `AI-PLAN-1 Paket 2: PlanStep-Mapping integrieren`

### Paket 3: Erste konkrete Plantypen

Ziel: die ersten Plantypen aus der Vorgabe live erzeugen und mit Regressionstests absichern.

Plantypen:

- `runner.obtain_breaker_coverage`
- `runner.contest_remote`
- `runner.opportunistic_central_run`
- `runner.build_credit_bank`
- `runner.cash_out_credit_bank`
- `corp.create_score_window`
- `corp.build_credit_bank`
- `corp.rez_defense`

Done-Gate:

- Blockierter Remote-Contest erzeugt `obtain_breaker_coverage`.
- Opportunistischer Central-Run bleibt möglich.
- Broker-artige Bank-Aktionen können Aufbau und Auszahlung bedienen.
- Corp Score Window und Rez Defense werden abgedeckt.
- Review `docs/reviews/ai/ai-tactical-plan-layer-implementation-2026-06-05.md` existiert.

Commit-Vorschlag: `AI-PLAN-1 Paket 3: Erste TacticalPlans aktivieren`

## Verifikationsregeln

- `corepack pnpm --filter @netgrid/ai typecheck`
- Fokussierte Vitest-Läufe für `tactical-plans` und Semantic-Runtime-Cutover
- `git diff --check`
- Finale erneute Checks vor Merge nach `main`

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_PLAN_1_TACTICAL_PLAN_LAYER`
- Branch: `codex/ai-plan-1-tactical-plan-layer`
- Integrationsbranch: `main`
- Der Hauptworkspace `C:\Projekte\NETGRID` bleibt bis zum finalen Merge unverändert.
- Die ungetrackten Review-Artefakte im Hauptworkspace bleiben dort unberührt.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-PLAN-1 TacticalPlan Runtime Layer vollständig und sequenziell von Paket 1 bis Paket 3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAN_1_TACTICAL_PLAN_LAYER auf Branch codex/ai-plan-1-tactical-plan-layer.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Drei Paketcommits liegen auf `codex/ai-plan-1-tactical-plan-layer`.
- Finale Checks sind grün oder eng begründet.
- Branch ist lokal nach `main` gemerged.
- Worktree ist entfernt.
- Restpunkte sind im Thread benannt.
