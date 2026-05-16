---
activityId: act-2026-05-17-generic-counter-credit-pool-resolver
status: inbox
kind: architecture
area: engine
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-17-card-effect-generic-resolver-analysis
resultArtifacts: []
checks: []
---

# Generische Counter-/Credit-Pool-Helfer schneiden

## Ziel

Wiederkehrende Muster für Counter auf Karten, gespeicherte Credits, recurring Credits und Pool-Ausgaben sollen gemeinsame Profil-/Payload-Helfer bekommen.

## Kontext und Quellen

- Analyse: `docs/derived/CARD_EFFECT_GENERIC_RESOLVER_ANALYSIS_2026_05_17.md`.
- Bestehende Helfer: `cardCounter`, `addCardCounter`, `spendCardCounter`.
- Musterbereiche: Investment-Firm-Credits, Spinn-Bits, Runner recurring/stealth credits, Krumz/Paris-City-Grid-Pools.

## Scope

- Gemeinsame Hilfen für Add/Spend/Refresh von sichtbaren Card-Countern definieren.
- PublicPayload-Felder für Countertyp, add/remove amount und remaining counters zentraler befüllen.
- Eine kleine Musterfamilie migrieren, z. B. Investment Firm plus ein weiterer sichtbarer Credit-/Counterpool.
- UI-Sichtbarkeit nur prüfen, nicht redesignen.

## Nicht im Scope

- Keine Zusammenlegung aller Trace- oder Run-Kostenquellen in einem Schritt.
- Keine Änderung an Countertypen oder Shared-State-Formaten ohne Not.
- Keine Migration von Virus-Purge- und Damage-Prevention-Sonderfällen.

## Akzeptanzkriterien

- [ ] Mindestens zwei Counter-/Credit-Pool-Pfade nutzen denselben Helper.
- [ ] Counteränderungen erscheinen weiterhin in PlayerView und PublicPayload.
- [ ] Hidden-Info bleibt unverändert.
- [ ] Replay und StateHash bleiben deterministisch.
- [ ] Fokussierte Engine-Tests decken Add, Spend/Refresh und PublicPayload ab.

## Ergebnisnotiz

Noch offen.
