---
activityId: act-2026-05-22-maintenance-ai-trace-action-detail-view
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-22-ai-trace-action-level-alternatives
resultArtifacts: []
checks: []
---

# Wartungsansicht: KI-Trace-Details auf Action-Ebene anzeigen

## Ziel

Die Wartungsseite `KI-Entscheidungen` soll bei einer aufgeklappten KI-Entscheidung nicht nur Plan-Ranking und Score-Komponenten zeigen, sondern eine verdauliche Action-Level-Liste. Dadurch soll sichtbar werden, wie die KI einzelne LegalActions innerhalb des gewählten Plans bewertet hat, z. B. `Broker laden` gegenüber `1 Credit nehmen`.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-22: Im Backend auf zweitem Bildschirm Match auswählen, KI-Entscheidungen live verfolgen und bei Bedarf Details aufklappen.
- Aktueller Befund: Im Trace ist Broker nur indirekt im `planId` und in Evidence sichtbar. Für Playtest-Diagnose ist das zu schwer lesbar.
- Abhängiges Datenpaket:
  - `docs/activities/inbox/act-2026-05-22-ai-trace-action-level-alternatives.md`
- Relevante Codepfade:
  - `apps/web/app/maintenance/page.tsx`
  - `apps/web/app/maintenance.ts`
  - `apps/web/app/maintenance.test.ts`

## Scope

- Wenn Trace-Details Action-Level-Daten enthalten, diese in `AiTraceDetailView` als eigener aufklappbarer oder kompakter Abschnitt anzeigen.
- Pro Action mindestens anzeigen:
  - Rang oder Markierung
  - Action-Label oder Typ
  - Quelle, soweit side-sicher bekannt
  - ausgewählt/nicht ausgewählt
  - Kurzgrund
  - zentrale Kennzahlen, z. B. Score/Priority, `immediateGain`, `netCredits`, `futurePoolAfter`
- Economy-Actions so formatieren, dass Broker-Fälle lesbar sind:
  - `Broker laden`: jetzt 0 Credits, Pool nachher 3
  - `Credit nehmen`: jetzt +1
  - `Broker auszahlen`: sichtbarer Poolwert, sofern legal
- Bestehende Metaebene beibehalten: Details sollen optional tiefer gehen und nicht die Hauptansicht überladen.

## Nicht im Scope

- Keine Änderung am Trace-Schema oder an der KI-Bewertung.
- Keine Anzeige von Roh-JSON als primärer Nutzerpfad.
- Keine Ausgabe versteckter Karten, FullState, privater Payloads, Tokens oder Decklisten.
- Kein Redesign der gesamten Maintenance-Seite.

## Akzeptanzkriterien

- [ ] Eine KI-Entscheidung mit Action-Level-Daten zeigt eine eigene Action-Liste.
- [ ] Die ausgewählte Action ist visuell eindeutig markiert.
- [ ] Nicht gewählte Actions zeigen mindestens einen verständlichen Grund oder Kennzahlen, aus denen die Abwertung nachvollziehbar ist.
- [ ] Bei fehlenden Action-Level-Daten bleibt die bestehende Detailansicht stabil und zeigt keine leeren oder irreführenden Sektionen.
- [ ] Web-Helper-/Rendering-Tests decken mindestens einen Broker-vs-Basic-Credit-Beispielfall ab.
- [ ] Die Redaktionsprüfung `findForbiddenMaintenanceMarkers` bleibt auf Detail- und Exportpfaden wirksam.

## Umsetzungshinweise

- Erst aktiv werden, wenn das Datenpaket Action-Level-Felder bereitstellt.
- Die UI sollte für lange Listen begrenzen oder gruppieren, z. B. gewählte Action, beste Alternativen, übrige gekürzt.
- Für Diagnosezwecke sind kleine Tabellen oder Definition Lists geeigneter als lange Fließtexte.

## Ergebnisnotiz

Offen.
