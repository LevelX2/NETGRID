---
activityId: act-2026-05-22-priority-requisition-optional-free-rez
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

# Priority Requisition als optionales kostenloses Rez-Fenster

## Ziel

`Priority Requisition` muss beim Scoren optional ein ICE kostenlos rezzen dürfen. Die Korp darf den Scoring-Trigger ohne Rezzen fortsetzen.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Optionalität fehlt im Kartentext oder in der Umsetzung.
- Solltext laut Nutzer: `You may rez a piece of ice, at no cost, when you score Priority Requisition.`
- Lokaler Befund: `packages/engine/src/card-implementations/onr-v1/corp/agendas/priority-requisition.ts` nutzt einen scoredAgenda-Resolver `priority_requisition_rez_ice_at_no_cost` mit Hidden-Info-Barriere.
- Lokaler UI-Erwartungswert: Auswahl `ICE kostenlos rezzen` oder `Überspringen`.

## Scope

- Prüfen, ob der Scoring-Trigger aktuell eine Pflichtauswahl erzwingt oder die Option nicht sichtbar als `may` darstellt.
- Korp-private Choice mit Zielauswahl und expliziter Skip-Option herstellen oder korrigieren.
- Kostenloses Rezzen korrekt ausführen, inklusive Revalidierung von ICE-Ziel, Seite, Timingpunkt, StateVersion und Rezzed-Zustand.
- Angezeigten Kartentext/Katalogtext auf sichtbare Optionalität prüfen.
- Chronik nur bei tatsächlich genutztem kostenlosen Rezzen schreiben; Skip darf keine falsche Rez-Meldung erzeugen.

## Nicht im Scope

- Keine Änderung an normalen ICE-Rez-Kosten außerhalb dieses Scoring-Triggers.
- Keine automatische Zielauswahl durch KI oder UI für menschliche Korp.
- Keine Freigabe anderer Kartentypen als ICE.
- Keine Preisgabe verdeckter ICE-Definitionen an Runner-PlayerViews, PublicEvents, Reconnect oder Logs.

## Akzeptanzkriterien

- [ ] Beim Scoren von `Priority Requisition` kann die Korp ein legales unrezzed ICE kostenlos rezzen.
- [ ] Die Korp kann den Trigger ohne Rezzen überspringen.
- [ ] Wenn kein legales ICE vorhanden ist, wird der Score-Vorgang nicht blockiert.
- [ ] Der Kartentext in App/Katalog enthält sichtbar `may`/`darf`.
- [ ] Chronik meldet ein kostenloses Rezzen nur bei tatsächlicher Nutzung.
- [ ] Tests decken Zielwahl, Skip, fehlende Ziele, Wrong-Side, stale State und Hidden-Info-Redaction ab.

## Umsetzungshinweise

- Bestehende Tests rund um `Priority Requisition` prüfen; falls sie nur den Zielwahlpfad abdecken, Skip- und No-target-Fälle ergänzen.
- Die Choice-Optionen dürfen öffentliche Labels nutzen, aber keine verdeckten Definition-IDs oder Kartentitel an den Runner leaken.

## Ergebnisnotiz

Noch offen.
