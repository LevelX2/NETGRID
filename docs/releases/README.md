# Release-Dokumentation

`docs/releases/` ist der Zielbereich für gebündelte Releasefamilien. Jede Familie bekommt einen eigenen Ordner mit einem knappen `README.md` und den zugehörigen Requirements, Spezifikationen, Testmatrizen, Implementation Reviews, Final Reviews und historischen Plänen.

## Regeln

- Moves nach `docs/releases/` erfolgen nur familienweise.
- Vor jedem Move wird ein Linkaudit durchgeführt.
- Final Reviews, Implementation Reviews, Requirements und Testmatrizen bleiben als Audit-Trail erhalten.
- Historische Detailpläne werden nicht gelöscht, solange kein Rollup und keine Linkprüfung vorliegen.

## Aktive Pilotstruktur

- `backend-ops/backend-0-5/`: privater Backend-/Ops-Schnitt für Storage-Maintenance.
- `mvp/`: historische MVP-0.x-Releasekette von MVP 0.1 bis MVP 0.99.
- `proteus/`: planning-only Proteus-Import-, Coverage-, Slicing- und Mechanikvertragsartefakte ohne Kartenpromotion.
- `special/s01/`: abgeschlossene Sonderphase für Spielende, Ergebnisfenster, private Matchserie und opt-in Audio.
- `v1/`: migrierte V1-Releasefamilien von V1.0 bis V1.9.22.
- `v2/`: aktive V2-Plattform-, Datenschutz-, Public-Lobby-, Moderations- und Replay-Verträge.
