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
