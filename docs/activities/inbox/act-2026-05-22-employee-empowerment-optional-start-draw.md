---
activityId: act-2026-05-22-employee-empowerment-optional-start-draw
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Employee Empowerment optionalen Startzug-Draw reparieren

## Ziel

`Employee Empowerment` muss nach dem Scoren zu Beginn jedes Korp-Zugs optional eine zusätzliche Karte ziehen lassen und zusätzlich als Agenda-Aktion `A: Draw two cards` anbieten.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Regel ist offenbar falsch oder unvollständig hinterlegt.
- Solltext laut Nutzer: `You may choose to draw an additional card at the start of each of your turns. A: Draw two cards.`
- Difficulty/Agenda: 4/3; diese Werte dürfen nicht als Effektwerte interpretiert werden.
- Lokaler Befund: `packages/engine/src/card-implementations/onr-v1/corp/agendas/employee-empowerment.ts` zieht am Korp-Turnstart aktuell automatisch 1 Karte und bietet zusätzlich die 2-Karten-Aktion.

## Scope

- Start-of-Corp-Turn-Effekt von automatisch auf echte Korp-Choice umstellen.
- Skip-/Pass-Option für die zusätzliche Ziehoption anbieten und side-sicher revalidieren.
- Agenda-Aktion `A: Draw two cards` unverändert oder korrigiert als separate Hauptaktionsfähigkeit erhalten.
- Angezeigten Kartentext und Katalogdaten auf den vollständigen Solltext prüfen.
- Chronikmeldungen für genutzte zusätzliche Ziehoption und Agenda-Aktion mit konkreter Unterscheidung ergänzen.

## Nicht im Scope

- Keine Änderung an der normalen Pflichtkarte am Beginn des Korp-Zugs.
- Keine Änderung an Difficulty 4 oder Agenda Points 3.
- Keine generische Umstellung aller optionalen Start-of-turn-Effekte außer für direkt betroffene Hilfspfade.
- Keine KI-Strategieänderung jenseits der nötigen LegalAction-/Choice-Nutzung.

## Akzeptanzkriterien

- [ ] Nach dem Scoren entsteht zu Beginn jedes Korp-Zugs eine optionale Korp-Entscheidung für den zusätzlichen Draw.
- [ ] Die Korp kann die Option bewusst überspringen, ohne dass der Zug blockiert.
- [ ] Die Agenda-Aktion `A: Draw two cards` bleibt im Korp-Hauptfenster nutzbar und kostet eine Aktion.
- [ ] Pflichtdraw, optionaler Draw und Agenda-Aktion sind in Chronik und Tests unterscheidbar.
- [ ] `applyAction`/Choice-Resolver validieren Seite, Quelle, Timingpunkt, StateVersion und Verfügbarkeit erneut.
- [ ] Replays und StateHash bleiben deterministisch.

## Umsetzungshinweise

- Startpunkt ist die CardImplementation; wahrscheinlich braucht der generische Start-of-turn-Lifecycle einen optionalen Choice-Adapter oder eine kartenspezifisch eng begrenzte Scored-Agenda-Choice.
- Auto-Korp-Pflichtdraw im Webclient darf diese optionale Agenda-Choice nicht still miterledigen.

## Ergebnisnotiz

Noch offen.
