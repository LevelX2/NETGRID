---
activityId: act-2026-05-22-runner-ai-broker-pool-horizon
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-KI: Broker-Pool-Aufbau mit kleinem Planungshorizont bewerten

## Ziel

Die Runner-KI soll `Broker` nicht nur als verzögerte Economy erkennen, sondern den Pool-Aufbau mit einem kleinen, side-sicheren Planungshorizont bewerten. Sie soll weiterhin bei akutem Creditbedarf einfache Credits nehmen können, aber nicht dauerhaft ignorieren, dass wiederholtes Broker-Laden und spätere Auszahlung ein besseres Verhältnis als einzelne Basic-Credits liefern kann.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-22: Runner-KI hat im aktuellen Match einen Credit genommen, obwohl ein installierter `Broker` seit längerer Zeit nicht genutzt wurde.
- Aktueller Trace `ai_trace_match_00ff5d28ba6a855e_1`:
  - Plan `recover_economy`
  - gewählte Action `runner.gain_credit`
  - Broker wurde erkannt als `installed_economy_kind:pool_build`
  - `installed_economy_future_pool_after:3`
  - `economy_need:acute`
  - Score-Beitrag installierte Economy: `-80`
- Erledigtes Vorgängerpaket:
  - `docs/activities/done/act-2026-05-18-runner-ai-resource-economy-plan.md`
- Bekannte bestehende Regression aus späteren Läufen:
  - `separates Broker pool loading from visible pool payout`
- Relevante Codepfade:
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/index.test.ts`
  - optional `data/ai/runner-plan-profiles-1.4.1.json`

## Scope

- Broker-Load-Bewertung in `recover_economy` gezielt prüfen und verbessern.
- Die aktuelle harte Abwertung von `pool_build` bei `own.credits < 4` überprüfen.
- Einen kleinen Planungshorizont modellieren, z. B.:
  - wie viele Klicks sind im aktuellen Zug übrig?
  - gibt es sichtbare dringendere Run-/Trash-/Install-Schwellen?
  - ist Broker in diesem Zug noch ungenutzt?
  - wie hoch wäre der sichtbare Pool nach Load?
  - ist späteres Take absehbar legal und wertvoll?
- Broker Load soll Basic Credit schlagen können, wenn:
  - kein akuter sichtbarer Sofortbedarf besteht,
  - mehrere Klicks oder ein Economy-Aufbau-Zug vorliegen,
  - der Runner bereits genug Credits für sichtbare Mindestschwellen hat,
  - kein höherwertiger Run, Trash, Install oder Draw-Plan anliegt.
- Broker Load soll Basic Credit nicht pauschal schlagen, wenn:
  - ein sichtbarer Run-/Breaker-/Trash-/Install-Schwellenwert sofort erreicht werden muss,
  - der Runner extrem knapp an Credits ist,
  - Take bereits deutlich besser ist,
  - Broker wegen Once-per-turn-Quelle nicht legal oder bereits genutzt ist.
- DecisionDebug/Evidence so ergänzen, dass die Entscheidung nachvollziehbar bleibt.

## Nicht im Scope

- Keine Änderung an Engine-Regeln, LegalActions, Broker-Kartenimplementierung, `applyAction`, Replay oder StateHash.
- Keine Hidden-Info-Nutzung. Die KI darf keine verdeckten Korp-Karten, R&D/HQ-Inhalte oder FullState-Daten verwenden.
- Keine vollständige Neugewichtung der gesamten Runner-KI.
- Keine pauschale Regel „Broker immer laden“.
- Keine UI-Änderung an der Wartungsanzeige; das ist ein separates Paket.

## Akzeptanzkriterien

- [ ] Ein AI-Test reproduziert einen stabilen Economy-Fall: installierter Broker mit 0 gespeicherten Credits, genügend Runner-Credits und legaler Broker-Load; die Runner-KI wählt Broker Load gegenüber Basic Credit.
- [ ] Ein AI-Test deckt akuten Creditbedarf ab: Wenn ein sofortiger sichtbarer Schwellenwert wichtiger ist, darf Basic Credit Broker Load weiterhin schlagen.
- [ ] Ein AI-Test deckt Pool-Auszahlung ab: Bei sichtbaren gespeicherten Broker-Credits wird Take gegenüber Basic Credit sinnvoll priorisiert.
- [ ] Evidence/Debug unterscheidet verständlich `pool_build`, `pool_payout`, `future_pool_after`, `economy_need` und optional einen Broker-Horizontgrund.
- [ ] Bestehende Runner-KI-Regressionsfälle zu Runs, Breaker-Aufbau, Shell Traders und installierter Economy bleiben grün oder bekannte Fremdfehler werden sauber benannt.

## Umsetzungshinweise

- Startpunkte:
  - `evaluateInstalledEconomyActions()`
  - `classifyInstalledEconomyAction()`
  - `runnerInstalledEconomyPriority()`
  - bestehende Tests um `installed_runner_economy_*`
- Nicht nur den Plan-Score anheben: Die Action-Auswahl innerhalb `recover_economy` nutzt `actionPriority()`. Broker kann als Plan enthalten sein und trotzdem gegen `gain_credit` verlieren, wenn die Action-Priorität zu niedrig bleibt.
- Für den aktuellen Trace war die Plan-Evidence bereits korrekt genug, aber die Entscheidungsqualität und Sichtbarkeit waren unbefriedigend.

## Ergebnisnotiz

Offen.
