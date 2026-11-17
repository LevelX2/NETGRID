# Aktionspersistenz in SQLite

Stand: 2026-10-11
Status: aktueller Implementierungsvertrag

## Zuständigkeit und Ladepfad

`apps/server/src/multiplayer.ts` definiert `loadForAction`, `saveActionDelta`
und `actionPersistenceBaseline`. `apps/server/src/storage-sqlite.ts`
implementiert den begrenzten Aktionsload und den atomaren Delta-Save.
Normale Aktionen benötigen keine vollständige Hydration aller öffentlichen
Events, KI-Traces, Receipts und Snapshots. Der aktuelle GameState bleibt
einschließlich seiner Engine-Historie verfügbar.

Der aktuelle Spielzustand steht in `game_states`. Die JSON-Metadaten in
`matches.record_json` enthalten keinen Spielzustand. Zustände und Snapshots
speichern Zufallsaufzeichnungen als Tripel aus Zähler, numerischer Position
des Zwecks und Zufallswert. Eine gemeinsame Zweckliste gilt für beide
Zufallsprotokolle des Zustands. Der Leseweg stellt die Engine-Datensätze
wieder her und bezieht die Historie aus `engine_events`.

Ein Match adressiert seinen Initialsnapshot mit 1. Gerade IDs binden
Vor-Aktionssnapshots an die Nummer des Übergangs, ungerade IDs oberhalb
von 1 binden Diagnose-Snapshots an die Nummer des KI-Versuchs. Ein
blockiertes Undo speichert keinen Snapshot-Verweis. Ein erfolgreiches
Undo entfernt den Vor-Aktionssnapshot des verworfenen Übergangs, damit
das nächste Aktionsangebot an diesem Zustand einen Snapshot mit der
aktuellen MatchVersion erhält.

Karteninstanzen werden in Zuständen und Snapshots als kompakte Zeilen
gespeichert. Jede Zeile trägt Instanzreferenz, Definition, Zonenposition,
Flags und Grundwerte. Besitzer, Controller, Aufdeckung und Rez-Zustand
belegen jeweils ein Bit. Die Kartenzeilen verweisen auf eine gemeinsame
Zonenliste des Zustands. Optionale kartenspezifische Felder werden bei
Bedarf angehängt.
Identitäten, Hand, Deck, Ablage, Punktebereiche, Server und Rig verwenden
beim Speichern die Position der zugehörigen Kartenzeile. Beim Laden
stellt der Codec daraus die Instanzreferenzen der Engine wieder her.

KI-Traces verwenden die Entscheidungsnummer als Schlüssel im Match. Die
Detailabfrage liest genau die durch Match und Nummer adressierte Zeile.
Fehlgeschlagene KI-Versuche führen ihren Diagnosecode im Fehlerdatensatz.
Ereignisblobs beziehen ihre ID aus der Tabellenzeile. Öffentliche
Ereignisblobs beziehen daraus auch StateVersions und StateHash.

Das Match-Schema 6 erfordert einen passenden Matchdatenpfad. Ein konfigurierter
separater Accountpfad kann die Konto-Tabellen einer Datenbank mit Schema 3
weiterverwenden.

Der Service verwendet den Aktionspfad, wenn der Adapter beide Fähigkeiten
anbietet und eine verifizierte Baseline liefert. Adapter ohne diese Fähigkeit
und vollständige Lifecycle-, Undo- und Replaypfade verwenden den vollständigen
Load-/Save-Vertrag. Das beschreibt die bestehende explizite Adaptergrenze;
ein Delta-Konflikt wird dadurch nicht abgefangen oder still wiederholt.

## Transaktion und Sicherheit

- `withMatchLock` serialisiert die Verarbeitung pro Match. Die Rules Engine
  validiert weiterhin Seite, StateVersion, Timing, Kosten, Ziele und Choices.
- Der Delta-Save prüft erwartete Match-/StateVersion und die gespeicherten
  Event-, Receipt- und Trace-Zähler innerhalb derselben SQLite-Transaktion.
  Fehlende Baseline und Versions- oder Präfixdrift erzeugen einen strukturierten
  Storagefehler; vorhandene Historie wird nicht still überschrieben.
- Persistiert werden aktueller Kernzustand und neue History-Segmente. Undo
  bleibt ein gesonderter vollständiger Truncate-Pfad.
- Erfolg und Persistence Observer folgen erst nach erfolgreichem Commit.
  Ein Persistenzfehler erzeugt keinen erfolgreichen Aktionsresponse.
- Öffentliche Tails bleiben side-sicher. Delta-Metadaten, Logs und Fehler
  dürfen keine zusätzlichen verdeckten Kartendaten enthalten.
- Reopen bewahrt Replay, StateHash und Idempotenz. Tests verwenden isolierte
  Datenbanken, niemals die aktive Runtime-Datenbank.

## Nachweis

Die Storage-/Service-Regressionen in `apps/server/src/multiplayer.test.ts`
prüfen begrenztes Laden, Delta-Persistenz, Konflikte und Wiederöffnung.
Der frühere DAP-Paketprozess ist keine zusätzliche aktuelle Steuerungsquelle.
