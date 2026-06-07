---
activityId: act-2026-06-07-runner-hand-development-evaluation
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-runner-hand-development-creditbase-contract
resultArtifacts:
  - packages/ai/src/runner-hand-development.ts
  - packages/ai/src/runner-hand-development.test.ts
  - packages/ai/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-hand-development.test.ts
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - git diff --check
---

# Runner-Handkarten als Entwicklungsoptionen bewerten

## Ziel

Die Runner-KI soll eigene Handkarten nicht nur als Kosten oder unmittelbare Blockerlösung sehen, sondern nützliche Setup-, Access-, Memory-, Economy- und Defense-Karten als mittelfristige Entwicklungsoptionen bewerten.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Der Runner spielt selten nützliche Handkarten aus, solange sie nicht Eisbrecher oder 0-Kosten-Karten sind.
- Vorgängerpaket: `act-2026-06-07-runner-hand-development-creditbase-contract`.
- AI-STRAT hat bereits `RunnerStrategicIntentProfile`, `RunnerRunTargetEvaluation`, `RunnerEconomyPosture` und `RunnerTacticalGoal` eingeführt.
- Relevante Codeanker:
  - `packages/ai/src/runner-strategic-intent.ts`
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/deck-capabilities.ts`
  - `packages/ai/src/action-semantic-candidate.ts`

## Scope

- AI-interne `RunnerHandDevelopmentEvaluation` oder gleichwertige Struktur einführen.
- Eigene Grip-/Handkarten ausschließlich aus side-sicherer Runner-PlayerView, AIInput und vorhandenen LegalActions bewerten.
- Pro Kandidat mindestens ableiten:
  - Karte/Titel nur für eigene Hand beziehungsweise redigierte Debugfläche,
  - Verfügbarkeit: legal_now, missing_credits, missing_mu, timing_blocked, not_relevant_now,
  - Entwicklungsrolle: access_payoff, breaker_or_rig_piece, memory_support, economy_engine, bank_tool, draw_or_search_engine, defense_support, run_event, duplicate_or_low_value, unknown,
  - strategische Passung,
  - aktueller Bedarf,
  - Install-/Play-Priorität,
  - FundingNeed,
  - Defer-Reason,
  - redigierte Evidence.
- Bestehende Quellen bevorzugen:
  - DeckCapabilityProfile,
  - RunnerStrategicIntent,
  - ActionSemanticCandidates,
  - LegalAction-Kosten/Timing,
  - vorhandene Karten-/Hintdaten, soweit bereits AI-intern erlaubt.
- Unklare Karten konservativ behandeln und nicht zu starken Install-Zielen aufblasen.
- Fokussierte AI-Tests für mindestens diese Muster ergänzen:
  - R&D-/HQ-Access-Payoff in Hand passt zu Central-Pressure,
  - Memory-Hardware bei MU-Druck,
  - Economy-/Banktool bei Setupbedarf,
  - Defensekarte ohne erkennbare Bedrohung wird zurückgestellt,
  - Duplikat oder aktuell nutzlose Karte wird nicht priorisiert.

## Nicht im Scope

- Keine Creditbase-Planung mit Floors und Reserven; dafür gibt es ein Folgepaket.
- Keine finale Action-Mapping-Priorisierung; dafür gibt es ein Folgepaket.
- Keine neuen LegalActions und keine Änderung daran, welche Handkarten legal spielbar sind.
- Keine neue Kartentext-Parsing- oder Hintmigration.
- Keine Engine-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine Nutzung gegnerischer Hidden-Info, FullState, Storage-Interna oder gegnerischer Decklisten.

## Akzeptanzkriterien

- [ ] Nützliche eigene Handkarten erhalten eine nachvollziehbare Entwicklungsrolle und Priorität.
- [ ] Nicht bezahlbare, MU-blockierte oder timing-blockierte Karten werden getrennt ausgewiesen.
- [ ] Low-Value-, Duplikat- und Defense-ohne-Bedrohung-Fälle werden konservativ zurückgestellt.
- [ ] Die Bewertung nutzt nur side-sichere Runner-Information und vorhandene LegalActions/PlayerView-Daten.
- [ ] Redigierte Evidence enthält keine vollständige Deckliste, Deckreihenfolge, `cardInstances`, `privatePayload`, gegnerische Hidden-Info oder private Snapshot-ID.
- [ ] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Falls der Vertrag aus dem Vorgängerpaket bestehende Goal-Namen bevorzugt, die Evaluation trotzdem als Evidence-Lieferant schneiden.
- Access-Payoff soll nicht nur bei sofortigem Run-Payoff zählen; er kann ein mittelfristiger Planverstärker sein.
- Keine Karte allein wegen "spielbar" hoch priorisieren. StrategicFit und CurrentNeed müssen zusammenpassen.

## Ergebnisnotiz

Abgeschlossen. `RunnerHandDevelopmentEvaluation` bewertet eigene Runner-Handkarten side-sicher nach Verfügbarkeit, Entwicklungsrolle, strategischer Passung, aktuellem Bedarf, Priorität, FundingNeed, Defer-Reason und redigierter Evidence. Rollen für Access-Payoff, Breaker/Rig, Memory, Economy/Bank, Draw/Search, Defense, Run-Event, Duplicate/Low-Value und Unknown sind konservativ abgedeckt. Die Evaluation liest nur eigene Runner-PlayerView, LegalActions, optional ActionSemanticCandidates, StrategicIntent und DeckCapabilities; sie erzeugt keine LegalActions und ändert keine Engine-, Replay-, StateHash- oder Zufallspfade.
