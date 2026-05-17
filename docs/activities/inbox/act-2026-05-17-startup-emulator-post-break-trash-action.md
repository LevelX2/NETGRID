---
activityId: act-2026-05-17-startup-emulator-post-break-trash-action
status: inbox
kind: fix
area: cards
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

# Startup Emulator: Opferaktion nach gebrochener Subroutine anbieten

## Ziel

`Startup Emulator` muss nach dem Brechen aller relevanten Subroutinen eines ICE eine sichtbare Aktion anbieten, um die Karte zu opfern und das ICE zu trashen, sofern der Kartentext dies erlaubt.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Nach dem Brechen der einzigen Subroutine eines ICE erschien keine erkennbare Startup-Emulator-Aktion.

## Scope

- Trigger-Implementierung und Timing-Fenster prüfen.
- Erkennung `alle Subroutinen des encountered ICE gebrochen` validieren.
- Zielbindung zum encountered ICE über Encounter-/Run-Ende hinweg prüfen.
- UI-Aktion und Chronik für Opferung und ICE-Trash ergänzen.

## Nicht im Scope

- Keine generelle Runner-Hardware-/Resource-Opferarchitektur, außer der Trigger nutzt sie.
- Keine Änderung an ICE-Breaking-Regeln außerhalb des Zielnachweises.

## Akzeptanzkriterien

- [ ] Bei erfüllten Voraussetzungen erscheint `Startup Emulator opfern: ICE trashen` oder ein äquivalentes klares Label.
- [ ] Die Aktion ist nur im korrekten Timing-Fenster legal.
- [ ] `applyAction` revalidiert Quelle, Kosten/Opferung, Ziel-ICE und StateVersion.
- [ ] Startup Emulator und Ziel-ICE werden regelgerecht bewegt.
- [ ] Chronik dokumentiert Quelle, Opferung, Ziel und Kartenbewegungen.

## Umsetzungshinweise

- Falls der Kartentext Timing nach Encounter oder nach Run verlangt, Zielreferenz entsprechend haltbar und side-sicher modellieren.

## Ergebnisnotiz

Noch offen.
