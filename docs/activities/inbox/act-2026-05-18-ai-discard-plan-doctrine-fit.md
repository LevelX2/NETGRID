---
activityId: act-2026-05-18-ai-discard-plan-doctrine-fit
status: inbox
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-18
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-18-ai-discard-keep-value-baseline
resultArtifacts: []
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "discard|plan|doctrine"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# KI-Discard: Plan- und Deckstrategie-Bonus einbinden

## Ziel

Die Keep-Value-Discard-Auswahl soll die aktuelle Plansetzung und die erkannte eigene Deckstrategie als begrenzten Bonus berücksichtigen. Dadurch soll die KI Karten behalten, die zu ihrem nächsten sinnvollen Spielplan oder zu ihrer Deck-Doctrine passen, ohne die Discard-Phase zu einer versteckten Vollplanung umzubauen.

## Ausführungsabhängigkeit

Dieses Paket ist abhängig von `act-2026-05-18-ai-discard-keep-value-baseline`. Es darf erst beginnen, wenn die deterministische Keep-Value-Baseline existiert und getestet ist. Dieses Paket liefert die fachliche Grundlage für `act-2026-05-18-ai-discard-regression-benchmark`.

## Kontext und Quellen

- Nutzerfrage vom 2026-05-18: Discard soll Plansetzung und erkannte Deckstrategie berücksichtigen können.
- `packages/ai/src/corp-plans.ts`: Korp-Planarten wie `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `recover_economy`.
- `packages/ai/src/runner-plans.ts`: Runner-Planarten wie `build_rig`, `recover_economy`, `draw_for_answers`, `pressure_hq`, `pressure_rnd`, `contest_remote`.
- `packages/ai/src/deck-doctrine.ts`: `ownDeckDoctrine` mit Archetype-Tags, Rollenverteilung und Planweights.
- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`: KI ist LegalActions-/PlayerView-gebunden und nutzt Planlogik, Belief State und Deck Doctrine side-sicher.

## Scope

- Auf Basis der vorhandenen Keep-Value-Baseline einen `DiscardContext` ableiten, der nur erlaubte Daten nutzt:
  - eigene sichtbare/private Hand aus `PlayerView`,
  - aktuelle Boardlage,
  - eigene `ownDeckDoctrine`,
  - side-sichere öffentliche Events und Belief-State-Zusammenfassung, soweit bereits im AI-Input vorhanden.
- Planfit als begrenzten Bonus einführen:
  - Runner: `build_rig` hält benötigte Breaker, Memory und Setup; `recover_economy` hält Economy; `pressure_hq`/`pressure_rnd`/`contest_remote` halten passende Run-, Breaker- und Economy-Unterstützung.
  - Korp: `score_now`/`score_next_turn` halten scorebare Agendas, Advance-/Economy- und Remote-Schutzkarten; `protect_hq`/`protect_rnd` halten passendes ICE; `recover_economy` hält Economy.
- Deck-Doctrine als schwachen, stabilen Bias einführen:
  - Runner-`rig_builder` hält Setup/Breaker/Memory höher.
  - Runner-`hq_pressure`/`rnd_pressure` hält passende Druck- und Multiaccess-Karten höher.
  - Korp-`rush` hält günstige Score-/ICE-/Tempo-Linien höher.
  - Korp-`glacier` hält ICE/Economy/Remote-Schutz höher.
  - Korp-`asset_remote` hält Assets, Upgrades und Bait-Unterstützung höher.
- Die Planmodule nicht blind über `chooseRunnerPlanDecision`/`chooseCorpPlanDecision` aus der Discard-Phase aufrufen, wenn dort nur `resolve_choice` legal ist. Stattdessen planrelevante Bewertungsfeatures wiederverwenden oder einen expliziten Discard-spezifischen Planfit ableiten.
- Score-Beiträge so begrenzen, dass Basissicherheit dominiert: Ein planpassender Bonus darf keine offensichtlich notwendige Economy-/Breaker-/Agenda-Sicherheitskarte verdrängen.
- Evidence abstrahieren, z. B. `discard_keep:doctrine_rig_builder`, `discard_keep:corp_score_next_turn`, `discard_low:off_plan_duplicate`.

## Nicht im Scope

- Keine mehrzügige Vollplanung, keine Suche über hypothetische künftige Hände und keine Simulation versteckter Karten.
- Keine Änderung an den normalen Planwählern für Action-Phase-Entscheidungen, außer kleine gemeinsame Helfer werden sauber extrahiert.
- Keine Persistenz eines neuen geheimen KI-Zustands.
- Keine Offenlegung eigener Deckliste, eigener Hand oder Discard-Begründungen an den Gegner.
- Keine Balance- oder Schwierigkeitsprofile über den engen Bonusrahmen hinaus.

## Akzeptanzkriterien

- [ ] Der Discard-Score enthält getrennt nachvollziehbare Beiträge für Basiswert, situativen Planfit und Deck-Doctrine-Fit.
- [ ] Runner-Test: Ein `rig_builder` hält Setup/Breaker/Memory eher als ein off-plan Run-Event.
- [ ] Runner-Test: Bei aktivem sichtbarem Zentralserverdruck hält die KI passende Pressure-/Breaker-/Economy-Karten höher.
- [ ] Korp-Test: Eine `glacier`- oder Remote-orientierte Corp hält ICE/Economy/Remote-Schutz eher als off-plan Bait.
- [ ] Korp-Test: Bei erkennbarem `score_next_turn`-Kontext hält die KI Score-/Remote-Unterstützung höher.
- [ ] Doctrine-Bonus ist schwach genug, dass ein klarer Sicherheits- oder Spielbarkeitsbedarf aus Paket 1 nicht überstimmt wird.
- [ ] Debug-/Evidence-Ausgaben bleiben side-sicher und enthalten keine gegnerischen verdeckten Informationen.

## Umsetzungshinweise

- Bestehende Rollenquellen wiederverwenden: AI-Hints, Runtime-Kartentypen, `ownDeckDoctrine.planWeights`, vorhandene Planrollen.
- Wenn Planfeatures aus `corp-plans.ts` oder `runner-plans.ts` benötigt werden, lieber kleine reine Helfer exportieren als Discard-Logik mit Action-Phase-Planentscheidung zu vermischen.
- Begrenze numerische Boni bewusst, z. B. Basissicherheit > Spielbarkeit > Planfit > Doctrinefit > Tie-Break.
- Diese Activity soll keine neuen Folgepakete für einzelne Karten anlegen, außer es zeigt sich eine echte Rollen-/Hint-Lücke.

## Ergebnisnotiz

Noch offen.
