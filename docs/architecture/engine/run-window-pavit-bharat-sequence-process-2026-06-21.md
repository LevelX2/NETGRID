# RunWindow Pavit Bharat Sequence Paketprozess 2026-06-21

## Ziel

Der Paketprozess konsolidiert den naechsten Engine-Strukturschnitt fuer `engine/run-window-pavit-bharat-sequence`.

Im aktuellen Stand sind `RunWindowHost`, `RunRezWindowResult`, `RunWindowRegistry`, `AfterPassingLastIceWindow` und die spielbaren Pavit-Bharat-Vertraege bereits groesstenteils vorhanden. Dieser Prozess fuehrt deshalb die verbleibenden Strukturgrenzen nach:

- RunWindow-Typen und Registry bleiben unter `packages/engine/src/game/run/windows/`.
- Die Pavit-Bharat-`ordered_fort_rebuild_sequence` wird nicht mehr als Scored-Agenda-Folge gefuehrt, sondern als RunWindow-/OnRez-Sequence-Familie.
- Oeffentliche Payloads fuer diese Familie laufen ueber die zentrale RunWindow-Sequence-Payload-Konvention.
- Contract-Tests sichern Registry, Sequence, SurfacePolicy und die roten Regressionen aus dem Paket.

## Paketgrenzen

### P0 - Prozess und Iststand

- eigener Worktree `C:\Projekte\NETGRID_ENGINE_RUN_WINDOW_PAVIT_BHARAT_SEQUENCE`
- Branch `codex/engine-run-window-pavit-bharat-sequence`
- Audit der bereits vorhandenen Strukturarbeit
- Dokumentation dieses Paketprozesses

### P1 - RunWindow-Struktur

- bestehende RunWindow-Host- und Result-Typen pruefen
- Registry-Imports auf `run/windows` halten
- keine neue Parallel-Registry einfuehren

### P2 - Ordered-Fort/Pavit als RunWindow-Familie

- `ordered-fort-rebuild-sequence` in den RunWindow-Windows-Bereich verschieben
- Bootstrap-, Registry- und Test-Imports aktualisieren
- Contract-Matrix auf die neue fachliche Zuordnung ausrichten

### P3 - PayloadPatch-Konvention

- Pavit/Ordered-Fort-Public-Payload ueber `applyRunWindowPayloadPatch` beziehungsweise die gleiche `run_window_sequence`-SurfacePolicy absichern
- keine HQ-Kartenlisten, privaten Labels oder komplexen Objekte in Public/Opponent/Replay-Payloads

### P4 - Tests und Gates

- fokussierte Engine-Tests fuer RunWindow, Ordered-Fort, SurfacePolicy und Proteus-Baseline
- Typecheck
- AI-Grenzcheck, soweit im Repository vorhanden
- durch eigene Aenderungen verursachte rote Tests analysieren und beheben

## Bewusste Nicht-Ziele

Successful-Run-Hidden-Resource-Vertraege sowie Ice Transmutation/Data Fort Reclamation bleiben ausserhalb dieses Pakets. Fuer diese Themen waeren neue fachliche Runtime-Vertraege noetig; sie werden nicht nebenbei ueber eine generische Hilfsfunktion miterledigt.
