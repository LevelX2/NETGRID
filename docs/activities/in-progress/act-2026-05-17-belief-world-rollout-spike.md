---
activityId: act-2026-05-17-belief-world-rollout-spike
status: in_progress
kind: architecture
area: ai
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-belief-reconnect-undo-contract
  - act-2026-05-17-ai-match-progression-benchmark
resultArtifacts: []
checks: []
---

# Spike für faire Belief-World-Rollouts

## Ziel

Prüfen, ob die KI langfristig mehrere hypothetische Welten aus ihrem Belief State auswerten kann, ohne echte Hidden Info, FullState oder gegnerische Decklisten zu verwenden. Ergebnis soll eine klare Go/No-Go-Entscheidung oder ein sehr kleiner Prototyp-Schnitt sein.

## Kontext und Quellen

- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`, Abschnitt `P2: Faire Belief-World-Rollouts`.
- Die Analyse bewertet diesen Weg als strategisch nützlich, aber wegen Cheating- und Komplexitätsrisiko ausdrücklich P2.
- Dieses Paket ist blockiert durch belastbare Belief-/Reconnect-/Undo-Verträge und brauchbare Progression-Benchmarks.

## Scope

- Einen Spike-Report oder Minimalprototyp entwerfen, der Belief-Hypothesen von echtem Hidden State trennt.
- Anforderungen an getrennte RNG-Nutzung, Seedbarkeit und Nicht-Kopplung an Engine-Replay festhalten.
- Hidden-State-Variantentest planen oder prototypisch anlegen: gleiche sichtbare Projektion muss gleiche Entscheidung erzeugen.
- Klären, ob Rollouts zuerst nur als Analyse-/Benchmarkwerkzeug laufen dürfen, nicht als Live-Controller.

## Nicht im Scope

- Keine produktive Rollout-KI.
- Keine Nutzung echter verdeckter Kartenidentitäten, FullState, gegnerischer Decklisten oder Storage-Interna.
- Keine Änderung an LegalActions, applyAction, Replay oder StateHash.
- Keine LLM-basierte Regelauslegung.

## Akzeptanzkriterien

- [ ] Der Spike beschreibt eine Architektur, in der Sample-Welten ausschließlich aus Belief-Hypothesen entstehen.
- [ ] Hidden-State-Varianten mit identischer sichtbarer Projektion bleiben entscheidungsgleich oder das Risiko wird als No-Go dokumentiert.
- [ ] RNG-, Replay- und StateHash-Grenzen sind explizit benannt.
- [ ] Eine Entscheidung liegt vor: verwerfen, späterer Prototyp, oder kleines Folgepaket mit klarer Sicherheitsbarriere.
- [ ] Keine produktive Live-KI nutzt den Spike ohne eigenes Gate.

## Umsetzungshinweise

- Erst nach P0/P1-Stabilisierung sinnvoll; sonst misst der Spike schwache Basisheuristiken statt Rollout-Nutzen.
- Wenn Code entsteht, getrennt und experimentell halten, nicht in den normalen AI-Controllerpfad einhängen.
- No-Cheat-Gate: Sample-Welten dürfen nie aus echtem Hidden State generiert werden.

## Ergebnisnotiz

Noch offen.
