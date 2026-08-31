# KI-Selbstspiel-Evidenzregistrierung

Stand: 2026-08-30

## Zweck

Die zentrale Evidenzregistrierung ist der alleinige operative
Selbstspiel-Datenspeicher. Fortlaufende Paarungsreviews,
Markdown-Matrixänderungen und Reporting-State-Commits sind abgeschlossen und
werden nicht wieder aufgenommen. Große Match-, Trace- und Debugdaten bleiben je
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
corepack pnpm selfplay:evidence -- complete-job --job-id <job-id> --status completed
corepack pnpm selfplay:evidence -- complete-job --job-id <job-id> --status abandoned
corepack pnpm selfplay:evidence -- allocate --kind pairing --job-id <job-id>
corepack pnpm selfplay:evidence -- allocate --kind case --job-id <job-id>
corepack pnpm selfplay:evidence -- upsert --input <pairing-bundle.json>
corepack pnpm selfplay:evidence -- export --pairings 031,032 --output <report-input.json>
corepack pnpm selfplay:evidence -- record-report --input <report-state.json>
corepack pnpm selfplay:evidence -- export-report --report-id latest --output <bericht.html>
corepack pnpm selfplay:evidence -- backup --output <backup.sqlite>
corepack pnpm selfplay:evidence -- check --json
```

Jeder registrierte Job wird nach seinem tatsächlichen Ende ausdrücklich als
`completed` oder bei verworfenem beziehungsweise ersetztem Lauf als
`abandoned` geschlossen. `check` scheitert bei aktiven Jobs, offenen
Reporting-Series, ausstehenden Reports, Fremdschlüsselfehlern oder einem
fehlgeschlagenen SQLite-Integritätscheck.

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
und alle bekannten Paarungsreferenzen. Die Fall-ID `SP-nnn` ist zugleich die
dauerhafte, menschenlesbare Verdachtsnummer. Sie wird beim ersten Speichern
atomar vergeben und bleibt erhalten, wenn der Verdacht später bestätigt,
behoben oder widerlegt wird. Weitere Beobachtungen derselben Ursache ergänzen
dieselbe Nummer, statt einen Doppel-Fall anzulegen. Ein Fix enthält
Fallreferenz, Titel, Beschreibung, Commit, Owner, Tests und gegebenenfalls
Vorher-/Nachherdaten.

Eine bestehende Fall-ID darf weder still einem anderen Cluster noch einer
anderen Spielseite zugewiesen werden. Neue Paarungsbezüge ergänzen die
historischen Verknüpfungen; sie ersetzen sie nicht. Eine tatsächlich andere
Ursache erhält eine neu reservierte Fall-ID.

## Bericht und Sicherung

Der Bericht wird aus `export` und der festen HTML-Vorlage erzeugt. Jeder offene
Eintrag der Verdachtsmatrix zeigt seine `SP-nnn`-Verdachtsnummer sichtbar an.
Vor dem Versand wird er mit `record-report` als `pending`, nach eindeutigem
Gmail-Send als `sent` gespeichert. `htmlBody` enthält exakt die versendete
Fassung; ein optionaler lokaler Exportpfad ist nur eine Ansicht und kann aus
der Datenbank mit `export-report` rekonstruiert werden. Solche Exporte liegen
unter `data/local/` und werden nicht versioniert.

Nach einem abgeschlossenen Berichtsblock wird eine SQLite-Online-Sicherung der
kompakten Registry erstellt. Erst danach werden ausschließlich die großen
blockeigenen Matchdatenbanken samt WAL-/SHM-Dateien gelöscht. Die Registry und
ihre Sicherung gehören nie zu diesem Cleanup.

## Abgeschlossene Legacy-Migration

Die Migration der Cycle-Reviews 002–036, Evidence-Matrix, Reporting-State- und
HTML-Berichte wurde am 2026-08-30 nach einem erneuten idempotenten Import
abgeschlossen. Quellenparität, SQLite-Integrität, Fremdschlüssel, Jobstatus
und offene Reporting-Series wurden geprüft; anschließend entstand eine neue
lokale Registry-Sicherung. Die historischen Git-Dateien wurden nach der
Current-State-Retention entfernt.

Die importierten Paarungen, Spiele, Fälle, Fixe und exakten HTML-Fassungen
bleiben in der lokalen Registry und ihren Sicherungen erhalten. Neue Jobs
schreiben ausschließlich Registry-Bundles und lokale, daraus reproduzierbare
Berichte.
