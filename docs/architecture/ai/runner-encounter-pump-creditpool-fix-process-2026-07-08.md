# Runner Encounter Pump Creditpool Fix Process 2026-07-08

## Status

In Umsetzung auf Branch `codex/ai-pump-creditpool` im Worktree `C:\Projekte\NETGRID_AI_PUMP_CREDITPOOL`.

## Quelle

Playtest-Fund im aktiven Match `match_17ac410bb31694c5`: Runner begann in Zug 20 einen Run auf R&D gegen `Keeper`, installierte vorher `Codecracker`, hatte 2 Pool-Credits und 2 `Vewy Vewy Quiet` Run-Bits, ließ aber die End-the-run-Subroutine auslösen.

## Gesamtziel

Die Runner-KI muss im Encounter dieselben sichtbaren Restricted-Run-Creditpools für Pump-/Break-Folgen berücksichtigen wie die Run-Start-Pfadbewertung. Eine bezahlbare Folge aus `pump_breaker` und späterem `break_subroutine` darf nicht als `pump_cannot_reach_break_strength` ausgeschlossen werden.

## Annahmen

- Die Engine ist Regelautorität und hat im Snapshot die vier Pump-Schritte als legal bestätigt.
- Die PlayerView enthält die relevante Information side-safe in `counterDisplays[].creditPool.uses`.
- Keine Hidden-Info-Erweiterung ist erforderlich.

## Nicht-Ziele

- Keine kartenspezifische Sonderregel für `Keeper`, `Codecracker` oder `Vewy Vewy Quiet`.
- Keine Änderung an Engine-`LegalActions`.
- Keine Änderung an Run-Start-Planprioritäten.

## Controller-Invarianten

- KI nutzt nur `AiDecisionInput`, `PlayerView`, `LegalActions` und sichtbare CounterDisplays.
- `applyAction` bleibt finaler Guardrail.
- Restricted Credits werden nur für passende CreditPool-Uses berücksichtigt.
- Noisy-Ausschlüsse müssen respektiert bleiben.

## Paketfolge

### Paket 1: Pump-Creditpool-Modell

Ziel: `runner-pump-viability-context.ts` nutzt sichtbare Run-Creditpools für Pump- und geschätzte Break-Kosten.

Kernartefakte:
- `packages/ai/src/runtime/runner-pump-viability-context.ts`
- fokussierter Regressionstest in angrenzender AI-Testdatei

Done-Gate:
- Regression für Codecracker/Keeper mit 2 Pool-Credits plus 2 Non-Noisy-Run-Bits ist grün.
- Gegenprobe für zu wenig Pool-Credits bleibt ausgeschlossen.

### Paket 2: Verify und Integration

Ziel: Relevante AI-Checks laufen, Arbeitsbranch wird lokal nach `main` gemerged.

Checks:
- fokussierter Vitest-Lauf
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Sicherheitsblocker

Stoppen, falls die Lösung FullState, verdeckte Karten, nicht sichtbare Payment-Daten oder nicht-legal-action-basierte Entscheidungen benötigt.
