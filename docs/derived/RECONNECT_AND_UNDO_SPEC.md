# Reconnect and Undo Spec MVP 0.2

Status: Phase 0.2 requirements freeze candidate  
Stand: 2026-05-03

## Reconnect

Reconnect akzeptiert nur ein seitenspezifisches Reconnect-Token. Bei Erfolg:

1. Alte Connection derselben Seite wird ersetzt.
2. Session `connected` wird aktualisiert.
3. Server sendet aktuelle PlayerView, LegalActions, Pending Choice und EventTail.
4. Gegner erhält `opponent_status`.

Getestete Reconnect-Punkte:

- Action Phase.
- Run/Encounter mit Corp-Rez- oder Runner-Break-Fenster.
- Access mit Pending Access/Trash/Steal-Entscheidung.

## Undo

Undo ist lernfreundlich, aber konservativ.

Flow:

1. Spieler sendet `request_undo`.
2. Server prüft Ziel-Event und Hidden-Info-Barrier.
3. Gegner erhält Anfrage.
4. Bei Zustimmung wird Snapshot wiederhergestellt.
5. Beide Seiten erhalten neue side-gefilterte Views.

Hidden-Info-Barrier:

- HQ random access.
- R&D access.
- Remote root access.
- Archives facedown/offen-Übergang, sofern verdeckte Information sichtbar wurde.
- Jede serverseitig als privatePayload markierte neue Kartenidentität.

Nach Barrier wird Undo blockiert. Die Ablehnung nennt nur einen generischen Grund.

