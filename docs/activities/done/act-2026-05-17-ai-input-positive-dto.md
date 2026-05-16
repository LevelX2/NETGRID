---
activityId: act-2026-05-17-ai-input-positive-dto
status: done
kind: architecture
area: ai
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/input-dto.ts
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "AI controller contract"
  - corepack pnpm --filter @netgrid/ai typecheck
---

# AI-Input-Sicherheit von Blacklist auf positive DTOs umstellen

## Ziel

Die KI-Input-Sicherheit soll mittelfristig nicht nur über String-Blacklist-Checks abgesichert werden, sondern über positiv konstruierte AI-Input-DTOs oder Snapshot-Builder mit explizit erlaubten Feldern.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: AI-Input wird korrekt aus `getPlayerView` und `getLegalActions` gebaut, aber `assertAiInputIsSideSafe` prüft nur String-Nadeln.
- Betroffene Anker: `packages/ai/src/index.ts` ca. Zeile 381 und 463.
- Beobachtung: Blacklist-Begriffe wie `cardInstances`, `privatePayload`, `Tokens` erkennen bekannte Leaks, aber keine neuen privaten Felder mit anderem Namen.
- Risiko: Die eigentliche Sicherheit hängt stark an PlayerView; neue private Felder könnten Blacklist-Checks umgehen.

## Scope

- AI-Input-DTO oder Snapshot-Builder entwerfen, der nur erlaubte Felder konstruiert.
- Bestehende KI-Planung unverändert lassen, soweit möglich.
- Blacklist-Check zunächst als zusätzliche Guard-Schicht behalten, bis positive DTOs ausreichend getestet sind.
- Snapshot-/schema-basierte Leak-Tests je Side ergänzen.
- Neue Mechanikfelder bewusst in die Allowlist aufnehmen oder ablehnen.

## Nicht im Scope

- Keine Änderung an KI-Strategie, Bewertung oder Spielstärke.
- Keine Erweiterung von KI-Wissen über erlaubte PlayerView-/LegalAction-Daten hinaus.
- Keine Änderung an Engine-Redaction.
- Keine Live-Regelakteur- oder LLM-Integration.

## Akzeptanzkriterien

- [x] AI-Input wird über einen positiven Builder/DTO erzeugt oder ein solcher Builder ist eingeführt und verwendet.
- [x] Zulässige Felder sind explizit dokumentiert oder typisiert.
- [x] Bestehende Blacklist-Leak-Tests bleiben grün.
- [x] Neue Snapshot-/schema-basierte Leak-Tests prüfen Runner- und Korp-Perspektive.
- [x] Mindestens ein Test simuliert ein neues privates Feld und zeigt, dass es nicht in den AI-Input gelangt.

## Umsetzungshinweise

- Start in `packages/ai/src/index.ts` und `packages/ai/src/index.test.ts`.
- DTO möglichst nahe an AI-Eingang bauen, nicht in Engine oder Server.
- Keine privaten GameState-Strukturen in Tests als erlaubte AI-Basis etablieren.

## Ergebnisnotiz

Abgeschlossen. `buildAiDecisionInput` delegiert jetzt auf den positiven DTO-Builder `buildAiDecisionInputDto` in `packages/ai/src/input-dto.ts`. Der Builder rekonstruiert `PlayerView`, `LegalAction`, `PublicGameEvent`, `eventTail` und optionale Deck-Doctrine-Daten aus explizit erlaubten Feldern; der bestehende String-Blacklist-Guard bleibt als zusätzliche Sicherung erhalten.

Die AI-Contract-Tests prüfen die Top-Level-DTO-Felder für Runner und Korp und simulieren zusätzliche private Felder auf `PlayerView`, `VisibleCard`, Event-Kopien und LegalActions. Diese Felder gelangen nicht in den AI-Input. Engine-Redaction, KI-Strategie und Spielstärke wurden nicht geändert.
