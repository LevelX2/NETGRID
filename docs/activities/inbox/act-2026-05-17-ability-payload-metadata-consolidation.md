---
activityId: act-2026-05-17-ability-payload-metadata-consolidation
status: inbox
kind: cleanup
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

# Ability-Payload-Metadaten konsolidieren

## Ziel

Ability-Payload-Schlüssel und PublicPayload-Metadaten sollen weniger pro Releasefamilie dupliziert werden. Ziel ist ein kleiner zentraler Helper für Ability-Family, Ability-ID und Effect-Kind, ohne das öffentliche Payload-Format unnötig zu ändern.

## Kontext und Quellen

- Analyse: `docs/derived/CARD_EFFECT_GENERIC_RESOLVER_ANALYSIS_2026_05_17.md`.
- Hotspot: `packages/engine/src/index.ts` sammelt viele `v1917AssetAbility`, `v1918UpgradeAbility`, `v1919AssetAbility`, `v1920AssetAbility` usw. separat in Action-ID- und PublicPayload-Kontexten.

## Scope

- Prüfen, welche Ability-Payload-Schlüssel aktuell redundant behandelt werden.
- Einen kleinen Helper für Ability-Metadaten schneiden.
- Eine begrenzte Familie auf den Helper umstellen.
- PublicPayload-Kompatibilität erhalten.

## Nicht im Scope

- Keine Umbenennung aller bestehenden Payload-Felder.
- Keine Änderung an Server-/WebSocket-Verträgen.
- Keine Migration aller Kartenfamilien in einem Schritt.

## Akzeptanzkriterien

- [ ] Ein zentraler Helper reduziert Duplikation für mindestens eine Ability-Familie.
- [ ] Bestehende PublicPayload-Felder bleiben kompatibel.
- [ ] ActionId-Stabilität ist geprüft oder Abweichung ist bewusst dokumentiert.
- [ ] Fokussierte Engine-/Chronicle- oder Payload-Tests sind grün.

## Ergebnisnotiz

Noch offen.
