---
activityId: act-2026-05-17-v2-public-replay-policy-projection
status: done
kind: architecture
area: shared
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.8
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-8-public-replay/public-replay-policy-projection.md
checks:
  - git diff --check
---

# Public-Replay-Policy und Projektionsinventar

## Ziel

Für V2.8 soll vor einer Implementierung geklärt werden, welche öffentlichen Replay-Projektionen überhaupt erlaubt wären, welche Consent-/Privacy-Entscheidungen fehlen und welche vorhandenen Event-/Replay-Bausteine wiederverwendbar sind.

## Kontext und Quellen

- V2.8 Roadmap: public sanitized Replays, Consent/Privacy, Policy, Public/private Projektionen, Löschung/Unlisting, Abuse-/Moderationsintegration, RulesBaseline-Versionierung.
- Bestehende Engine-Replays und StateHash-Verifikation sind privat vorhanden; Public Replay ist kein automatischer Nebeneffekt.
- Frühere Architekturarbeit trennt EngineEvent, ServerEventRecord und PublicGameEvent.

## Scope

- Vorhandene Replay- und Event-Projektionsschichten inventarisieren.
- Policy-Fragen sammeln: Consent, Decklisten-Sichtbarkeit, Hidden-Info-Timing, KI-Debugdaten, Löschung/Unlisting, alte RulesBaselines.
- Minimalen Public-Replay-Datenvertrag skizzieren.
- Redaction-Testkandidaten für Public Replay benennen.
- Folgeactivities für Projection-Builder, Consent-UI oder Replay-Redaction-Tests anlegen, wenn konkret genug.

## Nicht im Scope

- Keine Public-Replay-Implementierung.
- Kein Spectator.
- Keine Replay-Suche.
- Keine öffentliche KI-Analyse oder LLM-Zusammenfassung.
- Keine Kartenbildfreigabe.

## Akzeptanzkriterien

- [x] Public Replay ist klar von privatem Replay und Spectator getrennt.
- [x] Offene Consent-, Privacy-, Decklisten- und KI-Debug-Fragen sind sichtbar.
- [x] Ein minimaler erlaubter Projektionstyp ist skizziert oder begründet blockiert.
- [x] Nächste testbare Folgepakete sind angelegt oder benannt.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Public Replay darf keine FullState- oder Hidden-Daten als Komfortabkürzung übernehmen.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/v2/v2-8-public-replay/public-replay-policy-projection.md` trennt Public Replay von privaten Runner-/Korp-Replays, `local_analysis` und Spectator. Der minimal denkbare Pfad ist eine neue `public_sanitized_timeline_v1`-Projektion nach Consent-, Unlisting-, Moderations-, Redaction- und Asset-Gates. Folgepakete sind benannt: `public-replay-redaction-harness`, `public-replay-consent-unlisting-contract`, `public-sanitized-replay-projection-builder`.
