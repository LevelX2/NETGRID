---
activityId: act-2026-09-16-maintenance-card-images-task-tabs
status: in-progress
kind: concept
area: ui
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-16
startedAt: 2026-09-16
completedAt:
branch: codex/activity-run-20260916-091351
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Maintenance-Bildverwaltung nach Aufgaben in Untertabs aufteilen

## Ziel

Die Kartenbildverwaltung zeigt jeweils einen Arbeitsablauf statt gleichzeitig
CSV-Import, Bildpaketimport und Paketbau. Der häufige Import fertiger ZIPs ist
direkt erreichbar.

## Kontext und Quellen

- Nutzerfund vom 16.09.2026: Die Maintenance-Bildverwaltung wirkt überfrachtet;
  unterschiedliche Möglichkeiten sollen durch Untertabs getrennt werden.
- `apps/web/app/maintenance/card-images/page.tsx`
- `docs/architecture/card-images/personal-card-image-import.md`
- Vorangegangener Bedienfund: Der gemeinsame Buildordner mit mehreren ZIPs
  wurde mit einem einzelnen importierbaren Paketordner verwechselt.

## Scope

- Drei Untertabs: „Bildpakete importieren“ (Standard), „CSV importieren“ und
  „Pakete erstellen“. Keine neue Einzelbild-Importfunktion erfinden.
- ZIP- und Paketordner-Auswahl zusammen mit Prüflauf, Konfliktbehandlung und
  Import im ersten Tab; CSV-Vorlagen, Zuordnung und lokale/HTTPS-Quellen im
  zweiten; Profil, vollständige Zuordnung und Ausgabeformat im dritten.
- Bestand kompakt oberhalb der Tabs anzeigen. Laufender Auftrag und sein
  Ergebnis bleiben beim Tabwechsel sichtbar beziehungsweise erreichbar.
- Hilfetexte auf den jeweiligen Arbeitsablauf begrenzen. Unterschied zwischen
  einer ZIP, einem vollständigen Paketordner und dem übergeordneten Buildordner
  beim Import erklären; Übernahme in den lokalen Importbereich benennen.

## Nicht im Scope

- Neue Importformate, Downloadquellen, Bildbearbeitung oder Änderungen an
  Paketformat, Regeln, Authentifizierung und Importsemantik.
- Änderung des vom Browser vorgegebenen „Hochladen“-Texts im Ordnerdialog.
- Installerreparatur und der separat beobachtete Pfadfehler der Bildanzeige.

## Akzeptanzkriterien

- [ ] Nur die Formulare des aktiven Untertabs sind sichtbar.
- [ ] ZIP-Import ist ohne Wechsel in einen anderen Untertab ausführbar.
- [ ] Tabwechsel verliert keine Formulareingaben, Uploadfortschritte oder Jobs
  und startet beziehungsweise unterbricht keine Operation.
- [ ] Tabs sind per Tastatur bedienbar, korrekt beschriftet und auf schmalen
  Bildschirmen nutzbar; Texte folgen der vorhandenen DE/EN/FR-Lokalisierung.
- [ ] Fokussierte UI-Prüfung deckt Wechsel mit Eingaben und laufendem Auftrag
  sowie die Erreichbarkeit aller drei Arbeitsabläufe ab.

## Umsetzungshinweise

Zustand und Jobabfrage oberhalb der Tabinhalte halten. Vorhandene Tabmuster
wiederverwenden. Keine automatische zusätzliche Importprüfung auslösen.

## Ergebnisnotiz

Offen; als Umsetzungsvorschlag erfasst, noch keine UI-Änderung.
