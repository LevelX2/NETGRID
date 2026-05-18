# Release-Dokumentation

`docs/releases/` ist der Zielbereich für gebündelte Releasefamilien. Jede Familie bekommt einen eigenen Ordner mit einem knappen `README.md` und den zugehörigen Requirements, Spezifikationen, Testmatrizen, Implementation Reviews, Final Reviews und historischen Plänen.

## Regeln

- Moves nach `docs/releases/` erfolgen nur familienweise.
- Vor jedem Move wird ein Linkaudit durchgeführt.
- Final Reviews, Implementation Reviews, Requirements und Testmatrizen bleiben als Audit-Trail erhalten.
- Historische Detailpläne werden nicht gelöscht, solange kein Rollup und keine Linkprüfung vorliegen.

## Aktive Pilotstruktur

- `backend-ops/backend-0-5/`: privater Backend-/Ops-Schnitt für Storage-Maintenance.
- `special/s01/`: abgeschlossene Sonderphase für Spielende, Ergebnisfenster, private Matchserie und opt-in Audio.
- `v1/`: schrittweise migrierte V1-Releasefamilien; aktuell V1.0.2 und V1.0.4.
