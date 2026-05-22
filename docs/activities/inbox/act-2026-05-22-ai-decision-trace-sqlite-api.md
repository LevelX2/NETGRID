---
activityId: act-2026-05-22-ai-decision-trace-sqlite-api
status: inbox
kind: architecture
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-22-ai-decision-trace-contract
  - act-2026-05-22-ai-decision-trace-schema-top-alternatives
resultArtifacts: []
checks: []
---

# KI-Entscheidungstraces in SQLite speichern und per privater API bereitstellen

## Ziel

Aktivierte KI-Entscheidungstraces werden matchgebunden in der lokalen SQLite-Runtime gespeichert und über private Maintenance-/Analyse-APIs als redigierte Anzeigeprojektion abrufbar.

## Kontext und Quellen

- Nutzerwunsch: Match im Backend auswählen und historische oder laufende KI-Entscheidungen ansehen.
- Bestehender Serverpfad:
  - `apps/server/src/multiplayer.ts`: KI-Schritt, Eventlog, Replay-Projektion.
  - `apps/server/src/storage-sqlite.ts`: lokaler SQLite-Storage.
  - Backend 0.5 Wartungsflächen unter `/api/storage/maintenance/*` als Muster für private lokale Maintenance-Endpunkte.
- Konzeptentscheidung: DB speichert strukturierte Trace-Daten, nicht HTML.

## Scope

- SQLite-Schema für `ai_decision_traces` oder vergleichbare Tabelle ergänzen.
- Matchstart-/Matchoption ergänzen, ob KI-Tracing aus, kurz oder ausführlich aktiv ist.
- `runAiStep` oder äquivalente Serverstelle schreibt Trace nur bei aktivierter Diagnose.
- API für Matchliste/Trace-Index/Trace-Details bereitstellen, z. B. unter privatem Maintenance-Pfad.
- Backend erzeugt ein Anzeige-ViewModel mit Metaebene und Detailsektionen statt unkontrolliertem Roh-JSON.

## Nicht im Scope

- Keine normale Spieler-UI.
- Keine Public-Replay-, Spectator-, Moderation- oder Account-API.
- Kein Exportformat außer ggf. interner JSON-Antwort.
- Keine KI-Entscheidungslogik ändern.
- Keine Replay-/StateHash-Änderung durch Trace-Persistenz.

## Akzeptanzkriterien

- [ ] Traces werden nur gespeichert, wenn das Match Tracing explizit aktiviert hat.
- [ ] Gespeicherte Traces sind match-, event- und stateVersion-gebunden.
- [ ] API-Antworten enthalten Meta- und Detaildaten, aber kein HTML und keine verbotenen Rohdaten.
- [ ] Nicht aktivierte Matches erzeugen keine Trace-Datensätze.
- [ ] Redaction- und Storage-Tests decken SQLite-Roundtrip, deaktivierten Modus und verbotene Felder ab.

## Umsetzungshinweise

- Häufig gefilterte Felder als Spalten speichern: `matchId`, `eventId`, `stateVersion`, `side`, `turn`, `decisionIndex`, `selectedActionType`, `planKind`, `score`, `confidence`, `createdAt`.
- Ausführliche Daten als versioniertes JSON speichern.
- Maintenance-Endpunkte sollten im privaten lokalen Profil bleiben und vorhandene Maintenance-Zugriffsgrenzen respektieren.

## Ergebnisnotiz

Noch offen.
