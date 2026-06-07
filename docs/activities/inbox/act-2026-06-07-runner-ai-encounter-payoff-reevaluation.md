---
activityId: act-2026-06-07-runner-ai-encounter-payoff-reevaluation
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget: runner-ai-encounter-valuation
blockedBy: []
resultArtifacts: []
checks: []
relatedActivities:
  - act-2026-05-17-runner-ai-remote-trash-affordability
  - act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle
  - act-2026-05-18-runner-ai-useless-krash-pump-on-keeper
---

# Runner-KI: Encounter-Break nach ICE-Rez nur bei verbleibendem Remote-Payoff wählen

## Ziel

Die Runner-KI soll während einer ICE-Begegnung nach dem Rez eines zuvor verdeckten ICE neu bewerten, ob Pump- und Break-Kosten noch sinnvoll sind. Wenn die einzige sichtbare ungebrochene Subroutine den Run nur beendet und der bekannte Remote-Zugriff nach dem Break keinen aktuellen Payoff mehr hat, soll die KI das ICE nicht teuer brechen, sondern den End-the-run-Effekt zulassen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07 aus einem Human-Korp-vs-Runner-KI-Playtest.
- Situation: Runner-KI startet als zweite Aktion des Zuges einen Run auf `Remote 2`.
- Korp rezzed zu Beginn des Runs ein zuvor verdecktes `Rock Is Strong` (`onr_v1_265_rock-is-strong`) vor einem bekannten/rezzed `BBS Whispering Campaign` (`onr_v1_309_bbs-whispering-campaign`) im Remote-Root.
- Korp hat `Superior Net Barriers` (`onr_v1_219_superior-net-barriers`) gescored; dadurch bekommen Walls +1 Stärke. `Rock Is Strong` hat dadurch effektiv Stärke 6.
- Runner-KI hat `Dwarf` (`onr_v1_021_dwarf`), startet mit 6 Credits, pumpt dreimal und bricht danach die eine Subroutine von `Rock Is Strong`. Danach bleiben nur 2 Credits.
- `BBS Whispering Campaign` hat Trashkosten 4. Nach dem Break kann die Runner-KI das bekannte Ziel also nicht trashen.
- Nutzererwartung: Bei einer reinen End-the-run-Subroutine ohne zusätzlichen Schaden ist das Brechen in dieser Lage schlechter als den Run enden zu lassen. Anders wäre es bei schädlichen Subroutinen wie Program-Trash, Damage, Tag/Trace oder vergleichbaren Bedrohungen.
- Verwandte erledigte Vorarbeiten:
  - `docs/activities/done/act-2026-05-17-runner-ai-remote-trash-affordability.md`
  - `docs/activities/done/act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle.md`
  - `docs/activities/done/act-2026-05-18-runner-ai-useless-krash-pump-on-keeper.md`
  - `docs/reviews/ai/ai-fix-remote-known-access-payoff-final-report-2026-06-06.md`

## Scope

- Runner-KI-Scoring für `pump_breaker` und `break_subroutine` während `run.encounter_ice` prüfen und korrigieren.
- Eine Encounter-Nachbewertung ergänzen, die nach ICE-Rez und sichtbarer effektiver ICE-Stärke die verbleibenden Credits nach minimalem Pump-/Break-Pfad mit dem bekannten Remote-Payoff vergleicht.
- Reine ETR-Fälle besonders absichern: Wenn ein Break nur den Zugriff ermöglicht, der bekannte Remote-Root danach aber nicht bezahlbar oder sonst nutzlos ist, darf `pump_breaker`/`break_subroutine` nicht weiter hoch bewertet werden.
- Regression mit `Dwarf`, 6 Runner-Credits, `Rock Is Strong` als Wall mit +1 Stärke durch `Superior Net Barriers`, bekannter/rezzed `BBS Whispering Campaign` mit Trashkosten 4: Die Runner-KI soll nicht drei Pumps plus Break wählen, wenn dadurch kein bezahlbarer Remote-Payoff bleibt.
- Positivfall absichern: Mit ausreichend verbleibenden Credits oder bekanntem Agenda-/sonstigem Payoff bleibt Brechen eines ETR-ICE sinnvoll möglich.
- Schädliche Subroutinen getrennt behandeln: Gegen Program-Trash, Damage, Tag/Trace oder andere konkrete Risiken darf die KI weiterhin Credits ausgeben, auch wenn der Remote-Trash danach nicht bezahlbar wäre.

## Nicht im Scope

- Keine Änderung an `Dwarf`, `Rock Is Strong`, `BBS Whispering Campaign` oder `Superior Net Barriers` Kartendaten.
- Keine Änderung an Engine-Regeln, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness, sofern die Engine die Actions korrekt anbietet und revalidiert.
- Keine Hidden-Info-Erweiterung: Die KI darf verdeckte Remote-Root-Karten, unrezzed ICE vor dem Rez, HQ-/R&D-Karten oder nicht rechtmäßig bekannte Trashkosten nicht voraussetzen.
- Keine pauschale Regel "ETR nie brechen"; ETR-Breaks bleiben sinnvoll, wenn der Zugriff danach einen side-sicheren Nutzen hat.
- Keine breite Neuplanung der gesamten Runner-Run-Strategie.

## Akzeptanzkriterien

- [ ] Ein fokussierter AI-Test reproduziert den gemeldeten Fall mit `Dwarf`, 6 Credits, `Rock Is Strong` Stärke 6 durch `Superior Net Barriers` und bekanntem/rezzed `BBS Whispering Campaign`; die Runner-KI wählt in der Begegnung nicht die teure Pump-plus-Break-Sequenz.
- [ ] Die Entscheidung erkennt, dass nach 3 Credits Pump plus 1 Credit Break nur 2 Credits bleiben und `BBS Whispering Campaign` mit Trashkosten 4 nicht getrasht werden kann.
- [ ] Bei ausreichenden Runner-Credits oder anderem bekanntem Zugriffsnutzen bleibt der Break eines ETR-ICE möglich und wird nicht durch den Guard pauschal blockiert.
- [ ] Gegen mindestens einen schädlichen Subroutine-Fall bleibt Notfall-Breaking möglich, auch wenn der spätere Remote-Trash dadurch unbezahlbar wird.
- [ ] Die Auswertung nutzt nur `PlayerView`, `LegalActions`, öffentliche Kartendaten, bekannte side-sichere Remote-Positionen und sichtbare Encounter-Informationen.
- [ ] Bestehende Regressionen für Remote-Trash-Affordability, bekannte Remote-Access-Payoffs, sinnvolles Pumpen und unnötiges Pumpen bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts` für Encounter-Action-Scoring von `pump_breaker` und `break_subroutine`.
  - `packages/ai/src/visible-run-analysis.ts` für sichtbare ICE-/Breaker-Kosten.
  - `packages/ai/src/known-remote-access-payoff.ts`, `packages/ai/src/runner-run-target-evaluation.ts` und `packages/ai/src/runner-plans.ts` für vorhandene Remote-Payoff-/Trash-Affordability-Routinen.
  - `packages/ai/src/index.test.ts` für die Regression.
- Der Kern ist ein Budget- und Nutzenvergleich nach dem Rez, nicht eine Änderung der Engine-Legalität.
- Falls die bestehende Payoff-Routine nur Run-Start-/Planebene abdeckt, eine kleine, side-sichere Encounter-Brücke bauen statt Remote-Planlogik breit umzubauen.
- Debug-/Evidence-Hinweise sollten den Grund klar benennen, z. B. `encounter_break_no_remaining_remote_payoff` oder ähnlich, ohne verdeckte Daten auszugeben.

## Ergebnisnotiz

Noch offen.
