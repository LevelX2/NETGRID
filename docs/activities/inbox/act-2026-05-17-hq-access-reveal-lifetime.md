---
activityId: act-2026-05-17-hq-access-reveal-lifetime
status: inbox
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# HQ-Access: aufgedeckte Handkarte bleibt sichtbar

## Ziel

Eine beim HQ-Zugriff gesehene Handkarte darf nicht sofort verschwinden, sondern muss die konfigurierte Anzeigezeit oder ein manuelles Bestätigungsfenster respektieren.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: HQ-Handkarte blitzt nur kurz auf und ist danach nur noch in der Chronik sichtbar.
- Betroffener Kernworkflow: Run/Breach/Access auf HQ.

## Scope

- HQ-Access-Reveal-Pfad gegen R&D-, Archives- und Remote-Access vergleichen.
- Prüfen, ob Access-State, Run-Ende oder Chronik-Logging das Reveal-Overlay zu früh schließt.
- Reveal als eigenes sichtbares UI-/PublicEvent mit definierter Lebensdauer behandeln, falls nötig.

## Nicht im Scope

- Keine Änderung an HQ-Randomisierung oder Multiaccess-Reihenfolge; dafür gibt es separate Pakete.
- Kein Leaken anderer HQ-Handkarten.

## Akzeptanzkriterien

- [ ] Die aufgedeckte HQ-Karte bleibt für die konfigurierte Eventdauer sichtbar oder ist manuell bestätigbar.
- [ ] Run-Ende, Access-Cleanup und Chronik schließen das Overlay nicht vorzeitig.
- [ ] Reconnect/Multiplayer zeigen keine unzulässigen zusätzlichen HQ-Informationen.
- [ ] Tests oder E2E-Smoke decken den HQ-Handkartenzugriff ab.

## Umsetzungshinweise

- Hidden-Info-Grenze besonders prüfen: Nur die tatsächlich accessierte Karte darf sichtbar werden.
- Eventdauer an bestehendem Reveal-/Cue-System ausrichten.

## Ergebnisnotiz

Noch offen.
