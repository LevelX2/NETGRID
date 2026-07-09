# Runner-Plancontroller Review-Followups 2 Prozess 2026-07-09

Status: Paketumsetzung abgeschlossen; lokale Integration vorbereitet

## Quelle/Vorgabe

- Nutzerauftrag vom 2026-07-09: Git reparieren und sinnvolle Punkte aus der externen Analyse mittels `paketprozess-worktree-goal` umsetzen.
- Feedbackdatei `a4eeec95-842c-4828-8b0d-b7a68e03888c/pasted-text.txt`: Review des aktuellen `main`-Stands mit Schwerpunkt Runner-Planebene, RunnerRunPlan, Success-Windows, Tag-Clear, Steal-Kosten, Future-Path-Modifikatoren und Spezialcredits.
- Lokaler Vorbereitungsstand: Git-`packed-refs` war durch Nullbytes unlesbar, wurde gesichert und durch Fetch/Loose-Refs wieder nutzbar gemacht; bestehende Runner-Encounter-Fixes wurden vor diesem Prozess committed.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Die Analyse nennt konkrete betroffene Module und fachliche Risiken. Nicht alle Punkte sind gleich reif: Tag-Clear-Dominance, Success-Window im aktiven RunPlan und Step-Matching sind direkte Korrekturen; Steal-Kosten, Future-Path-Modifikatoren und Spezialcredits werden konservativ erweitert, soweit side-safe Daten bereits in LegalActions, PlayerView oder AI-Evidence vorliegen.

## Gesamtziel

Die Runner-Planebene soll die in der Review belegten Selbstumgehungen schließen:

- Survival-/Tag-Clear-Pläne werden gegen normale Off-plan-Ausreißer geschützt.
- Success-Window-Aktionen werden auch bei aktivem RunnerRunPlan vor dem normalen Access geprüft.
- Plan-Step-Matching akzeptiert keine generischen Kartenaktionen ohne passende Semantik.
- Plan-Step-Mapping sortiert mehrere Tag-Clear- und Success-Window-Aktionen nach konkretem Planwert.
- Steal-Kosten werden side-safe in Access-Projektion und RunnerRunPlan-Reserve berücksichtigt.
- Future-Path-Modifikatoren werden als Planrisiko behandelt, wenn sie den bekannten Restpfad oder Safety-Fenster sichtbar verschlechtern.
- Spezialcredit-Budgetierung bleibt an der Quelle modelliert und wird nicht in der Anzeige oder im Score nachkorrigiert.

## Annahmen

- `runner.build_credit_base` bleibt bewusst ein weicher Support-Plan und wird nicht in die harte Plan-Dominance-Liste aufgenommen.
- `runner.obtain_breaker_coverage` bleibt als Legacy-/Kompatibilitäts-Typ erhalten, obwohl blockierte Zielpläne Coverage inzwischen als Substep tragen.
- Steal-Kosten werden nur aus aktueller LegalAction-Payload, PublicContext-/AI-Evidence oder sichtbaren/rezzed Quellen abgeleitet. Verdeckte Agendas oder verdeckte Korp-Upgrades werden nicht erraten.
- Future-Path-Modifikatoren werden nicht pauschal mandatory; nur sichtbare harte Folgewirkungen mit bekanntem Restpfad oder Safety-Risiko erzwingen Break/Abort.

## Nicht-Ziele

- Kein neuer Runner-Planner.
- Keine Engine-Regeländerung und keine neuen LegalActions.
- Keine Hidden-Info-Erweiterung in PlayerViews, Debug, Replay oder KI-Input.
- Keine globale Neukalibrierung aller Plan- und Action-Scores.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Legalitätsautorität.
- Die KI wählt ausschließlich vorhandene Engine-`LegalActions`.
- Planebene bleibt Mapping- und Priorisierungsschicht, keine LegalAction-Erzeugung.
- Runtime-Korrekturen passieren an der fachlichen Quelle, nicht als UI-/Display-Kompensation.
- Debug-Evidence muss Planentscheidung, Step-Matching und Budgetannahmen nachvollziehbar machen.

## Automatische Fehlerbehandlung

- Bei rotem Pakettest wird eng im aktuellen Paket debuggt.
- Wenn ein Review-Punkt side-safe Daten braucht, die aktuell nicht existieren, wird er als Follow-up mit Removal Condition dokumentiert.
- Falls eine Änderung einen Hidden-Info- oder LegalAction-Vertrag berühren müsste, stoppt der Prozess mit Blocker statt Umgehung.

## Sicherheitsblocker

- Benötigte Informationen liegen nur verdeckt bei der Korp.
- Die KI müsste eine nicht angebotene Aktion erzeugen.
- Eine Kosten- oder Subroutine-Annahme kann nicht aus LegalAction, sichtbarer PlayerView oder side-safe PublicContext/Evidence abgeleitet werden.

## State Machine

1. `prepared`: Prozessartefakt committed, Worktree aktiv.
2. `plan_control_hardened`: Tag-Clear-Dominance und Step-Matching/Priorität gehärtet.
3. `runplan_success_windowed`: Aktiver RunnerRunPlan priorisiert Success-Windows vor Access.
4. `access_reserve_hardened`: Steal-Kosten fließen side-safe in Access-Projektion und RunPlan-Reserve.
5. `path_risk_hardened`: Future-Path-Risiken und Spezialcredit-Konsolidierung geprüft/umgesetzt.
6. `integrated`: Arbeitsbranch lokal nach `main` gemerged.

## Paketfolge

### RPF2-0 - Prozessartefakt und Scope

Ziel: Prozess, Invarianten, Paketfolge und Grenzen versioniert festhalten.

Kernartefakte: diese Datei.

Checks: `git diff --check`.

Done-Gate: Prozessartefakt ist committed.

Commit: `docs(ai): plan runner review followups 2`

### RPF2-1 - Plan-Dominance und Step-Matching härten

Ziel: `runner.clear_tags_or_survive` gegen normale Off-plan-Ausreißer schützen; `clear_tags` und `convert_success_window` nicht mehr über generische Karten-ActionTypes matchen lassen; minimale Step-Prioritäten ergänzen.

Status: erledigt 2026-07-09. Gates grün: gezielte `semantic-choice-ranking`-/`tactical-plan-step-candidate-matching`-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Kernartefakte:

- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/plans/tactical-plan-step-semantics.ts`
- `packages/ai/src/plans/tactical-plan-step-candidate-matching.ts`
- betroffene AI-Tests

Checks: gezielte TacticalPlan-/Runtime-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Done-Gate: Tag-Clear bleibt bei hohem Off-plan-Score plan-dominant; generische Trigger/Event-Aktionen ohne passende Semantik matchen nicht als Tag-Clear oder Success-Window.

Commit: `fix(ai): harden runner plan step matching`

### RPF2-2 - Success-Window in aktiven RunnerRunPlan integrieren

Ziel: Aktiver RunnerRunPlan prüft legale Success-/Follow-up-/Access-Payoff-Aktionen vor normalem Access, damit `access_card` nicht wichtige Vor-Access-Fenster schluckt.

Status: erledigt 2026-07-09. Gates grün: gezielte `runner-run-plan-policy`-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Kernartefakte:

- `packages/ai/src/runtime/runner-run-plan-policy.ts`
- `packages/ai/src/runtime/runner-run-plan-policy.test.ts`

Checks: gezielte RunPlan-Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Done-Gate: Bei erfolgreichem Run mit legalem Success-Followup und Access wählt der RunPlan zuerst das Followup.

Commit: `fix(ai): honor success windows in runner run plans`

### RPF2-3 - Steal-Kosten in Access-Reserve modellieren

Ziel: Sichtbare/current-access Steal-Kosten aus LegalActions/Evidence in `AccessDecisionProjection` und RunnerRunPlan-Reserve einführen, ohne verdeckte Kartenwerte zu erraten.

Status: erledigt 2026-07-09. Gates grün: gezielte Access-Projektions-/Invariant-/Window-Tests, `runner-run-plan-memory`-/Access-Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Kernartefakte:

- `packages/ai/src/decision/access-decision-projection.ts`
- `packages/ai/src/access/access-decision-invariants.ts`
- `packages/ai/src/runtime/runner-run-plan-start.ts`
- betroffene Tests

Checks: Access-Projection-Tests, RunPlan-Start-/Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Done-Gate: Red-Herrings-/Fetal-AI-artige aktuelle Steal-Cost-Payloads reservieren Credits und erscheinen in Evidence.

Commit: `fix(ai): reserve visible agenda steal costs`

### RPF2-4 - Future-Path und Spezialcredit-Konsolidierung

Ziel: Harte sichtbare Future-Path-Modifikatoren als Plan-Budget-/Safety-Risiko behandeln; vorhandene Spezialcredit-Modelle auf Doppelungen prüfen und nur an der Budgetquelle konsolidieren.

Status: erledigt 2026-07-09. Gates grün: gezielte `runner-run-plan-path-quote`-/Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`. Spezialcredit-Modelle wurden nicht durch neue Score- oder Display-Korrekturen ergänzt; die bestehende Budgetquelle (`runner-encounter-credit-budget`/sichtbare Rig-Pools) bleibt maßgeblich.

Kernartefakte:

- `packages/ai/src/runtime/runner-run-plan-path-quote.ts`
- `packages/ai/src/runtime/runner-encounter-credit-budget.ts`
- `packages/ai/src/visible-run-analysis.ts`
- betroffene Tests

Checks: gezielte Path-Quote-/RunPlan-Policy-Tests, `@netgrid/ai` Typecheck, `git diff --check`.

Done-Gate: Future-Path-Hardlocks werden nicht als harmlose `may_allow`-Effekte behandelt; Spezialcredits bleiben in Sequenzkosten/Evidence konsistent.

Commit: `fix(ai): classify hard future path run risks`

## Verifikationsregeln

Pro Paket mindestens `git diff --check` und die eng betroffenen Tests. Vor finalem Merge zusätzlich:

```powershell
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm exec vitest run packages/ai/src/runtime/runner-run-plan-policy.test.ts packages/ai/src/runtime/runner-run-plan-path-quote.test.ts packages/ai/src/runtime/runner-run-plan-access-policy.test.ts packages/ai/src/decision/access-decision-projection.test.ts packages/ai/src/tactical-plans.test.ts packages/ai/src/runtime/semantic-choice-ranking.test.ts
```

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAN_REVIEW_FOLLOWUPS_2`
- Branch: `codex/ai-plan-review-followups-2`
- Hauptworkspace nur für finalen lokalen Merge nach `main`.
- Jeder Paketabschluss wird separat committed.
- Keine Remote-Integration ohne ausdrücklichen Nutzerauftrag.

## Controller-Prompt-Kern

`/Goal` Arbeite diesen Prozess vollständig und sequenziell von RPF2-0 bis RPF2-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `agents/release-implementation-agent.md` und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_PLAN_REVIEW_FOLLOWUPS_2` auf Branch `codex/ai-plan-review-followups-2`. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange die Annahmen konservative automatische Fortsetzung erlauben. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblocker mit Removal Condition.

## Abschlusskriterien

- Alle Pakete RPF2-0 bis RPF2-4 sind umgesetzt oder mit begründetem Blocker dokumentiert.
- Paket- und finale Checks sind grün oder bestehende externe Testschulden sind klar getrennt.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree ist entfernt.
- `/Goal` ist erst nach erfolgreichem Merge abgeschlossen.
