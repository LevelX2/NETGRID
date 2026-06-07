---
activityId: act-2026-06-07-ai-bad-publicity-relevance-gating
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-faked-hit-self-damage-semantics
resultArtifacts: []
checks: []
---

# Bad-Publicity-Relevanz für Runner-KI gewichten

## Ziel

Die Runner-KI soll Bad-Publicity-Aktionen nicht schon deshalb hoch bewerten, weil sie der Korp 1 Bad Publicity geben. Ein einzelner Bad-Publicity-Punkt soll nur dann stark sein, wenn daraus ein unmittelbarer Closeout, ein realistischer Bad-Publicity-Plan oder ein klarer Deck-/Board-Payoff entsteht.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: `Faked Hit` machte in der beobachteten Decklage wenig Sinn; der Runner erhielt nur 1 Bad Publicity für die Korp, nahm aber 2 Core Damage und flatlinete. Selbst wenn der Damage überlebt würde, ist ein einzelner Bad-Publicity-Punkt ohne passende Gesamtstrategie oft zu schwach.
- Eingefügter Analyse-Text vom 2026-06-07: Bad Publicity soll als Support-/Closeout-Linie gelten; ohne Deck-Intent oder erreichbaren 7-Bad-Publicity-Abschluss darf `Faked Hit` nicht stark priorisiert werden.
- Karte und Engine: `onr_proteus_108_faked-hit`, `packages/engine/src/card-implementations/proteus/runner/events/faked-hit.ts`.
- Bestehende AI-Linie: `runner.bad_publicity_pressure`/`corp.bad_publicity_pressure` existiert, aber Bad Publicity ist nach den Guide-Regeln nicht automatisch eine belastbare Strategy-ID.
- Verwandtes Paket: `act-2026-06-07-ai-self-damage-survival-guard` verhindert nur selbsttödliche Aktionen; dieses Paket bewertet zusätzlich den strategischen Nutzen überlebbarer Bad-Publicity-Aktionen.

## Scope

- Prüfen, wie `RunnerStrategicIntent`, `DeckCapabilityProfile`, `RunnerEconomyPosture`, TacticalGoals oder TacticalPlans aktuell Bad-Publicity-Karten bewerten.
- Eine kleine Bad-Publicity-Relevanzbewertung oder gleichwertige Evidence ergänzen:
  - `currentCorpBadPublicity`,
  - `badPublicityGainFromAction`,
  - `immediateBadPublicityCloseout`,
  - `badPublicityPlanPresent`,
  - `badPublicitySupportCount`,
  - `payoffLikelyWithinHorizon`,
  - `drawbackSeverity`,
  - `badPublicityRelevanceScore`.
- Closeout-Regel: Wenn `currentCorpBadPublicity + gain >= 7`, darf eine Bad-Publicity-Aktion stark priorisiert werden und auch harte Drawbacks übersteuern, sofern der Game-End-Vertrag dies trägt.
- Ohne Closeout und ohne erkennbaren Bad-Publicity-Plan:
  - einzelne Bad-Publicity-Aktionen niedrig bewerten,
  - starke Drawbacks wie Self-Damage, Self-Tag oder teure Kosten klar als Malus berücksichtigen,
  - keine pauschale Install-/Play-Priorität aus einem einzelnen Supportsignal ableiten.
- Mit erkennbarem Bad-Publicity-Plan:
  - Bad-Publicity-Aktionen dürfen steigen,
  - Survival-/Drawback-Gates bleiben trotzdem vorgeschaltet.

## Nicht im Scope

- Keine neue Strategy-ID, solange kein eigener Bad-Publicity-Strategievertrag beschlossen ist.
- Keine Änderung der Bad-Publicity-Engine-Regel oder des 7-BP-Game-End-Gates.
- Keine LegalAction-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine versteckte Korp-Hand-, Deck- oder Remote-Information.
- Keine pauschale Abwertung aller Bad-Publicity-Karten; Closeout und echte Decklinien bleiben erlaubt.

## Akzeptanzkriterien

- [ ] `Faked Hit` bei Korp Bad Publicity 0 bis 5 und ohne erkennbare Bad-Publicity-Decklinie wird niedrig bewertet, selbst wenn Self-Damage überlebt würde.
- [ ] `Faked Hit` oder gleichwertige Aktion bei Korp Bad Publicity 6 wird als unmittelbarer Closeout erkannt.
- [ ] Eine überlebbare Bad-Publicity-Aktion mit starker Drawback-Schwere verliert gegen sichere Economy-/Setup-/Pressure-Alternativen, wenn kein Closeout oder Deckplan erkennbar ist.
- [ ] Eine erkennbare Bad-Publicity-Linie darf Support-Aktionen aufwerten, aber nicht den Self-Damage-Survival-Guard umgehen.
- [ ] Keine neue Strategy-ID wird eingeführt; Evidence bleibt redigiert und side-sicher.

## Umsetzungshinweise

- Bad-Publicity-Relevanz gehört in die KI-Bewertung, nicht in die Rules Engine.
- Bestehende `runner.bad_publicity_pressure`-/`corp.bad_publicity_pressure`-Signale können als Support zählen, dürfen aber keinen automatischen Strategy-Anker erzwingen.
- Bei unklarer Decklinie konservativ bleiben und in Debug erklären: `bad_publicity_support_only`, `no_bad_publicity_closeout`, `drawback_outweighs_bp_gain`.
- Passende Checks nach Umsetzung:
  - `corepack pnpm --filter @netgrid/ai exec tsc --noEmit`
  - fokussierte Vitest-Dateien für Runner Strategic Intent, TacticalGoals und TacticalPlans
  - `git diff --check`

## Ergebnisnotiz

Noch offen.
