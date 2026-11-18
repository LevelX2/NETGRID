# Aktionspersistenz in SQLite

Stand: 2026-11-18
Status: aktueller Implementierungsvertrag

## Zuständigkeit und Ladepfad

`apps/server/src/multiplayer.ts` definiert `loadForAction`, `saveActionDelta`
und `actionPersistenceBaseline`. `apps/server/src/storage-sqlite.ts`
implementiert den begrenzten Aktionsload und den atomaren Delta-Save.
Normale Aktionen benötigen keine vollständige Hydration aller öffentlichen
Events, KI-Traces, Receipts und Snapshots. Der aktuelle Kernzustand ist vollständig. Öffentliche Aktionsloads lesen höchstens
80 Ereignisse direkt in SQL. In reinen Human-Partien gilt dieselbe Grenze für
Engine-Ereignisse; KI-Partien behalten die vollständige side-sichere Chronologie
für ihre bestehenden Beobachtungs- und Belief-Verträge.

Der aktuelle Spielzustand steht in `game_states`. Die JSON-Metadaten in
`matches.record_json` enthalten keinen Spielzustand. Zustände und Snapshots
speichern Zufallsaufzeichnungen als Tripel aus Zähler, Zwecktuple und
Zufallswert. Das Zwecktuple enthält den festen numerischen Code und die
typisierten Argumente aus `packages/shared/src/random-purpose.ts`.
Engine- und KI-Planungszufall haben getrennte Zähler. Der Codec prüft
Zweckdomäne, Argumentform, fortlaufende Datensätze und den zugehörigen
Zähler beim Schreiben und Lesen. Der Leseweg stellt die Engine-Datensätze
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

Das Match-Schema 11 speichert die typisierten RNG-Tuples und numerische Run-IDs
und erfordert einen passenden Matchdatenpfad. Ein konfigurierter
separater Accountpfad kann die Konto-Tabellen einer Datenbank mit Schema 3
weiterverwenden.

Der Service verwendet den Aktionspfad, wenn der Adapter beide Fähigkeiten
anbietet und eine verifizierte Baseline liefert. Adapter ohne diese Fähigkeit
und vollständige Lifecycle-, Undo- und Replaypfade verwenden den vollständigen
Load-/Save-Vertrag. Das beschreibt die bestehende explizite Adaptergrenze;
ein Delta-Konflikt wird dadurch nicht abgefangen oder still wiederholt.

Jede öffentliche Ereigniszeile speichert ihren Chronikkontext und die kleine
Präfixzusammenfassung vor diesem Ereignis. Sie umfasst den fortsetzbaren
Zugcursor einschließlich noch offener End-of-Turn-Ablage sowie kumulierte
Aktions-, erfolgreiche Run-, Steal- und Scorezähler. Ein begrenzter Load beginnt
mit genau diesem Präfix. Neue Ereignisse führen es fort; Ergebnisstatistik und
KI-Traceturns müssen frühere Ereignisblobs nicht erneut laden. Gesamte und
bereits geladene History-Zähler sind getrennt an die Delta-Baseline gebunden.
Undo, Replay und explizite vollständige Loads behalten den vollständigen Verlauf.
Ein Full Save eines begrenzten Records wird abgelehnt. Die Speicherübersicht
zählt den Chronikkontext in `history_json` zur Nutzlast der Ereignistabelle.

Die PlayerView-Projektion kann ihre öffentliche Historie an der Quelle auslassen.
Der Live-Server verwendet diese Projektion und setzt nur sein seitensicheres
Chroniktail ein; die vollständige aktuelle Board-/Choice-Projektion bleibt erhalten.
KI-Belief-, Central-Defense- und Random-Break-Risk-Consumer teilen eine pro
Entscheidung deduplizierte Chronologie. Ältere erlaubte Beobachtungen bleiben
enthalten; eine neue Entscheidung baut die Chronologie erneut auf.

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
- Öffentliche Replay-Zufallsnachweise enthalten Domäne, Zähler, numerischen
  Zweckcode und den Hash des Zufallswerts. Die Argumente bleiben im
  autoritativen Zustand und in den privilegierten Maintenance-Diagnosen.
- Öffentliche Tails bleiben side-sicher. Delta-Metadaten, Logs und Fehler
  dürfen keine zusätzlichen verdeckten Kartendaten enthalten.
- Reopen bewahrt Replay, StateHash und Idempotenz. Tests verwenden isolierte
  Datenbanken, niemals die aktive Runtime-Datenbank.

## Nachweis

Die Storage-/Service-Regressionen in `apps/server/src/multiplayer.test.ts`
prüfen begrenztes Laden, Delta-Persistenz, Konflikte und Wiederöffnung.
Der frühere DAP-Paketprozess ist keine zusätzliche aktuelle Steuerungsquelle.
