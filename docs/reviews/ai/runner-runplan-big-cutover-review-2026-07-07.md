# Runner-RunPlan Big-Cutover Review

Status: `ready_for_final_verify`

Arbeitsbranch: `codex/runner-runplan-big-cutover`

## Kurzfazit

RUNPLAN-0 bis RUNPLAN-7 wurden sequenziell umgesetzt. Der Runner-Run wird im
AI-Runtime-Fenster nicht mehr als lose Folge reaktiver Einzelentscheidungen
geführt: Run-Starts erzeugen einen `RunnerRunPlan`, aktive Runs verlangen einen
aktiven Plan, Encounter-Entscheidungen folgen geplanten Pump-/Break-Sequenzen,
und Access-Entscheidungen respektieren Ziel und Reserve des Plans.

Der Umbau bleibt AI-intern. Es gibt keine neue LegalAction-Erzeugung, keine
Engine-Regeländerung, keine `applyAction`-Lockerung und keine Rekonstruktion
eines fehlenden Plans aus PlayerView-Daten.

## Paketabschluss

- RUNPLAN-0: Prozessartefakt, Scope und Sicherheitsblocker dokumentiert.
- RUNPLAN-1: RunPlan-Typen, Memory und Missing-Plan-Guard eingeführt.
- RUNPLAN-2: Run-Start-Auswahl an Planerzeugung und TacticalPlan-Memory
  angebunden.
- RUNPLAN-3: Known-Path-Quote mit Budget, Reserve und Pump-/Break-Sequenzen
  ergänzt.
- RUNPLAN-4: Encounter-Policy auf Plan-Obligations umgestellt; legaler
  Pump-then-Break schlägt `continue_run` durch End-the-run.
- RUNPLAN-5: Revalidation bei veränderten Kosten-, Ziel- und Boardbedingungen
  eingebaut.
- RUNPLAN-6: Access-Policy hält den Plan bis zum Access-Fenster und wahrt
  Steal-/Trash-Reserve.
- RUNPLAN-7: Redigierte RunPlan-Diagnose, Debug-Overlay-Anzeige, Export und
  fokussierte Regressionen ergänzt.

## Führende Artefakte

- `docs/architecture/ai/runner-runplan-big-cutover-process-2026-07-07.md`
- `packages/ai/src/runtime/runner-run-plan-types.ts`
- `packages/ai/src/runtime/runner-run-plan-memory.ts`
- `packages/ai/src/runtime/runner-run-plan-policy.ts`
- `packages/ai/src/runtime/runner-run-plan-start.ts`
- `packages/ai/src/runtime/runner-run-plan-path-quote.ts`
- `packages/ai/src/runtime/runner-run-plan-revalidation.ts`
- `apps/web/features/debug/AiDecisionDebugOverlay.tsx`

## Abschlussnotiz

Dieses Review dokumentiert den Stand vor dem abschließenden Verify- und
Main-Merge-Lauf. Der finale Integrationsstatus wird im Chatabschluss und im
lokalen Git-Verlauf sichtbar.
