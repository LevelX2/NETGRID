# KI-Selbstspiel-Evidenzregistrierung

Stand: 2026-08-20

## Zweck

Die zentrale Evidenzregistrierung ersetzt fortlaufende Paarungsreviews,
Markdown-Matrixänderungen und Reporting-State-Commits als operativen
Selbstspiel-Datenspeicher. Große Match-, Trace- und Debugdaten bleiben je
Worktree in einer isolierten Blockdatenbank und werden nach dem erfolgreichen
Berichtscheckpoint gelöscht. Die kompakte Evidenzdatenbank bleibt lokal
erhalten und wird nicht versioniert.

Standardpfad im primären Checkout:

`data/local/ai-selfplay-evidence.sqlite`

Alle Worktrees ermitteln über das gemeinsame Git-Verzeichnis denselben
Standardpfad. `NETGRID_SELFPLAY_EVIDENCE_DB` oder `--db` darf ihn für Tests
überschreiben. Die Datei liegt unter dem bestehenden `data/local/`-Ignore.

## Parallelvertrag

- Jeder Selbstspiel-Job behält eine eigene große Laufzeitdatenbank, eigene
  Ports, einen eigenen Worktree und einen eigenen Branch.
- Die zentrale Evidenzdatenbank enthält nur kompakte abgeschlossene Ergebnisse
  und kurze Reservierungen. Sie verwendet WAL, einen Busy-Timeout und kurze
  `BEGIN IMMEDIATE`-Transaktionen.
- Vor der Deckauswahl registriert sich ein Job und reserviert Paarungs- und bei
  Bedarf Fall-IDs atomar. Nicht verwendete IDs dürfen Lücken hinterlassen.
- Nach einer abgeschlossenen Paarung schreibt der Job genau ein idempotentes
  JSON-Bundle. Eine Paarung ohne Fix erzeugt keinen Git-Commit.
- Ein Fix wird mit Regressionstest und gegebenenfalls veränderter
  KI-Vertragsdokumentation im eigenen Worktree committed. Die lokale
  `main`-Integration bleibt serialisiert und erfolgt nicht über SQLite.

## Kommandos

```powershell
corepack pnpm selfplay:evidence -- init
corepack pnpm selfplay:evidence -- status --json
corepack pnpm selfplay:evidence -- register-job --job-id <job-id> --worktree <pfad> --branch <branch>
corepack pnpm selfplay:evidence -- allocate --kind pairing --job-id <job-id>
corepack pnpm selfplay:evidence -- allocate --kind case --job-id <job-id>
corepack pnpm selfplay:evidence -- upsert --input <pairing-bundle.json>
corepack pnpm selfplay:evidence -- export --pairings 031,032 --output <report-input.json>
corepack pnpm selfplay:evidence -- record-report --input <report-state.json>
corepack pnpm selfplay:evidence -- backup --output <backup.sqlite>
```

Der Legacy-Import ist idempotent und kann nach Abschluss eines noch nach altem
Muster laufenden Jobs erneut ausgeführt werden:

```powershell
corepack pnpm selfplay:evidence -- import-legacy `
  --reviews-dir docs/reviews/ai `
  --matrix docs/reviews/ai/ai-selfplay-evidence-matrix.md `
  --reporting-state docs/reviews/ai/ai-selfplay-reporting-state.json `
  --reports-dir docs/reviews/ai
```

## Paarungs-Bundle V1

`upsert` erwartet ein JSON-Objekt mit `schemaVersion: 1`, `pairing`, `games`
und optional `clusters`, `cases` und `fixes`. Pflichtfelder sind
`pairing.id` und `pairing.title`. Das Pairing enthält insbesondere Job,
Auswahlseed, Source-Commit, Regel-/KI-Profil und beide Decknamen,
Snapshot-IDs/-Hashes. Jedes Spiel erhält einen stabilen `key` sowie Seed,
Match-ID, StateHash, Gewinner, Match-/Agendapunkte, Terminalgrund,
Entscheidungszahl, `flagsCount` und die menschenverständliche Gewinner- und
Verlierereinordnung entweder spielbezogen in `metadata` oder aggregiert im
Pairing.

Ein Fall enthält stabile Fall-/Cluster-IDs, Evidenzgrad, Seite,
menschenverständliches Symptom, zuständigen Pfad, Match-/Entscheidungskontext
und alle bekannten Paarungsreferenzen. Ein Fix enthält Fallreferenz, Titel,
Beschreibung, Commit, Owner, Tests und gegebenenfalls Vorher-/Nachherdaten.

## Bericht und Sicherung

Der Bericht wird aus `export` und der festen HTML-Vorlage erzeugt. Vor dem
Versand wird er mit `record-report` als `pending`, nach eindeutigem Gmail-Send
als `sent` gespeichert. `htmlBody` enthält exakt die versendete Fassung; ein
optionaler lokaler Exportpfad ist nur eine Ansicht und kann aus der Datenbank
rekonstruiert werden.

Nach einem abgeschlossenen Berichtsblock wird eine SQLite-Online-Sicherung der
kompakten Registry erstellt. Erst danach werden ausschließlich die großen
blockeigenen Matchdatenbanken samt WAL-/SHM-Dateien gelöscht. Die Registry und
ihre Sicherung gehören nie zu diesem Cleanup.

## Legacy-Übergang

Die vorhandenen Reviews, Matrix und HTML-Berichte bleiben bis zum Abschluss
des noch laufenden Altjobs als eingefrorene Migrationsquelle im Repository.
Nach dessen erneutem idempotentem Import und einer Bestandsprüfung können die
historischen Selbstspiel-Metadatendateien in einem getrennten Cleanup entfernt
werden. Neue Jobs schreiben keine neuen Paarungsreviews oder Matrixstände nach
Git.
