# Private Kartenbildpakete als Verzeichnis oder ZIP

Status: In Umsetzung
Stand: 2026-08-20
Quelle: Nutzerfreigabe im Kartenbild-Maintenance-Dialog

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung präzise genug. Das vorhandene
IMG07-Verzeichnispaket bleibt der einzige fachliche Paketinhalt. ZIP wird nur
als optionale lokale Transporthülle ergänzt. Bau und Import müssen wahlweise
Verzeichnisse oder ZIP-Dateien unterstützen und nach dem Öffnen denselben
Manifest-, Mapping-, Hash-, Katalog- und Bindungspfad verwenden.

## Gesamtziel

NETGRID kann private Kartenbildpakete wahlweise als kontrollierbares
Verzeichnis oder als einzelne ZIP-Datei bauen, übertragen, in der lokalen
Maintenance-Oberfläche auswählen, vollständig prüfen und atomar importieren.
ZIP-Verarbeitung puffert große Komplettpakete nicht vollständig im Speicher
und erweitert weder Spielruntime noch HTTPS-Import um Netzwerkzugriffe.

## Annahmen

- ZIP-Dateien enthalten `netgrid-card-image-pack.json`, `mapping.csv` und
  `images/` direkt auf Archivebene; ein zusätzlicher beliebiger Wurzelordner
  ist unzulässig.
- Verzeichnis und ZIP dürfen nebeneinander als lokale Buildausgabe existieren.
- „Vorhandene Ausgabe ersetzen“ betrifft nur das gewählte Ausgabeformat.
- Der ZIP-Builder akzeptiert wie der Verzeichnis-Builder ausschließlich lokale
  Bildquellen.
- Bereits vorhandene Verzeichnispakete bleiben unverändert importierbar.
- ZIP-Import wird nur über die lokale, authentifizierte Maintenance-Fläche
  angeboten.

## Nicht-Ziele

- kein Download fertiger ZIP-Dateien aus dem Internet;
- kein ZIP-Import in Spiel-, Match- oder normale LAN-Flächen;
- keine Änderung an GameState, Replay, StateHash, Engine, KI oder Kartenpool;
- keine Verschlüsselung, Signaturinfrastruktur, selbstentpackende EXE oder
  Integration in den Windows-Hauptinstaller;
- keine Unterstützung beliebiger ZIP-Verzeichnisstrukturen.

## Controller-Invarianten

- Genau ein Kartenbildjob ist aktiv.
- ZIP ist nur eine Hülle; nach sicherem Entpacken gilt ausschließlich der
  bestehende Verzeichnispaketvertrag.
- Jeder Pfad wird relativ, normalisiert und innerhalb eines expliziten Roots
  validiert; absolute Pfade, Laufwerkspräfixe, `..`, Backslashes, leere oder
  doppelte Pfade und Symlinks werden abgewiesen.
- Entpacken erfolgt eintragsweise in ein isoliertes Staging-Verzeichnis.
- Höchstens 1.000 Einträge, 512 MiB Archivgröße, 1 GiB deklarierte und
  tatsächlich gelesene Gesamtgröße sowie 50 MiB je Datei.
- Nur ZIP-Methoden „stored“ und „deflate“, keine verschlüsselten Einträge.
- Tatsächliche entpackte Bytes, deklarierte Größen und CRC-Prüfung müssen
  übereinstimmen; Teil- und Fehlerstände werden im `finally` entfernt.
- Doppelte normalisierte Eintragspfade sind unzulässig.
- Ein ZIP enthält nur Manifest, Mapping, `images/` und die vom Paketformat
  erwarteten Bilddateien.
- Aktivierung bleibt durch den bestehenden atomaren Importkern fail-closed.
- Private Bilder, Archive und Buildausgaben bleiben ignorierte lokale Daten.

## Automatische Fehlerbehandlung

- Ungültige Archive scheitern vor dem Paketimport mit strukturiertem,
  pfadfreiem Fehlercode.
- Staging wird bei Erfolg und Fehler entfernt.
- Eine vorhandene Ausgabe wird ohne gesetztes `replace` nicht verändert.
- Ein fehlgeschlagener ZIP-Build hinterlässt keine teilweise Zieldatei.
- Relevante Tests werden paketweise eng ausgeführt; fachfremde Baselinefehler
  werden getrennt ausgewiesen.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn die gewählte ZIP-Bibliothek keine eintragsweise
Verarbeitung, keine Größenvalidierung oder keine sichere Dateinamenprüfung
erlaubt. Removal Condition ist eine getestete Streaming-Alternative ohne
vollständige Archivpufferung.

## State Machine

```text
idle
  -> build_directory -> directory_ready
  -> build_zip -> directory_staging -> zip_ready -> staging_removed
  -> import_directory -> existing_pack_validation -> atomic_import
  -> upload_zip -> zip_inbox_ready
  -> import_zip -> zip_validation -> isolated_extract
                -> existing_pack_validation -> atomic_import
                -> staging_removed
  -> failed -> staging_removed -> idle
```

## Paketfolge

### ZIP01 – Vertrag und Prozesssteuerung

- Ziel: Dieses führende Prozess- und Sicherheitsartefakt anlegen.
- Eingang: Nutzerfreigabe und bestehender IMG07-/IMG08-Stand.
- Arbeit: Scope, Grenzen, State Machine, Pakete und Tests festlegen.
- Kernartefakt: diese Datei.
- Checks: `git diff --check`.
- Done-Gate: ZIP bleibt eindeutig eine Hülle des bestehenden Paketformats.
- Commit: `docs(card-images): plan secure zip package transport`

### ZIP02 – Streaming-ZIP-Kern

- Ziel: Verzeichnisinhalt sicher als ZIP bauen und ZIP sicher in Staging
  öffnen.
- Eingang: ZIP01 abgeschlossen.
- Arbeit: eng begrenzte Streaming-Abhängigkeiten, Build-/Import-API,
  Größen-/Pfad-/Symlink-/Duplikat-/Methodenprüfungen, Cleanup und Core-Tests.
- Kernartefakte: `packages/card-images/`, Paketabhängigkeiten und Lockfile.
- Checks: fokussierte ZIP-/Pack-Tests, Paket-Typecheck, `git diff --check`.
- Done-Gate: reales ZIP round-tript durch denselben Verzeichnisimport; Angriffe
  und Teilstände scheitern fail-closed.
- Commit: `feat(card-images): add secure zip package transport`

### ZIP03 – Maintenance-Server und Inbox

- Ziel: Lokale ZIP-Auswahl, Streaming-Upload, Inventar und Jobs anbieten.
- Eingang: ZIP02 abgeschlossen.
- Arbeit: relative Archiveinträge, begrenzter Upload, explizite Paketart und
  Buildausgabe im Maintenance-Vertrag; keine absoluten Pfade im Payload.
- Kernartefakte: `apps/server/` und Maintenance-Funktionen in
  `packages/card-images/`.
- Checks: fokussierte Maintenance-HTTP-Tests und betroffene Typechecks.
- Done-Gate: authentifizierter Loopback-Client kann ZIP hochladen, prüfen,
  importieren und bauen; Remote- und Grenzfälle bleiben gesperrt.
- Commit: `feat(server): expose zip card image package jobs`

### ZIP04 – Maintenance-Oberfläche

- Ziel: Verzeichnis und ZIP eindeutig auswählbar und baubar machen.
- Eingang: ZIP03 abgeschlossen.
- Arbeit: getrennte Datei-/Ordnerauswahl, gemeinsame Paketliste,
  Ausgabeformatwahl, verständliche Status- und Fehlermeldungen.
- Kernartefakte: `apps/web/app/maintenance/card-images/`.
- Checks: fokussierte UI-Tests und Web-Typecheck soweit der bekannte
  Baselinestand dies zulässt.
- Done-Gate: Die Oberfläche bezeichnet Format und Wirkung eindeutig; Bau
  aktiviert keine Bilder automatisch.
- Commit: `feat(web): support zip card image packages`

### ZIP05 – Current State und Abschlussintegration

- Ziel: Dauerhafte Dokumentation, End-to-End-Evidence und lokalen Merge
  abschließen.
- Eingang: ZIP01 bis ZIP04 committed.
- Arbeit: Architektur/Runbook/Status aktualisieren, reale synthetische
  Verzeichnis- und ZIP-Roundtrips prüfen, aktuelles `main` integrieren, final
  testen, lokal nach `main` mergen und Worktree/Branch entfernen.
- Kernartefakte: führende Kartenbildarchitektur, Maintenance-Runbook,
  Projektstatus und dieses Artefakt.
- Checks: thematische Tests, betroffene Typechecks, `git diff --check`, sauberer
  Branch- und Worktree-Status.
- Done-Gate: beide Transportformen funktionieren; `main` enthält alle
  Paketcommits; Worktree und Arbeitsbranch sind nachweislich entfernt.
- Commit: `docs(card-images): document zip package workflow`

## Verifikationsregeln

- Keine Produktbilder in Fixtures oder Git.
- ZIP-Tests erzeugen ausschließlich synthetische temporäre Bilder und Archive.
- Negative Tests umfassen Traversal, absolute/Backslash-Pfade, Duplikate,
  Symlink, zu viele/zu große Einträge, falsche Größen, unerlaubte Methode,
  beschädigtes Archiv und Cleanup nach Fehler.
- Bestehende Verzeichnispakettests bleiben grün.
- UI-/HTTP-Tests prüfen zusätzlich, dass keine absoluten lokalen Pfade
  zurückgeliefert werden.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_ZIP_CARD_IMAGE_PACKS`
- Branch: `codex/zip-card-image-packs`
- Integration: lokales `main`, kein Push und kein Pull Request.
- Genau ein Paket ist aktiv; jedes Paket erhält Checks, `git diff --check` und
  einen eigenen Commit.
- Neue `main`-Änderungen werden vor dem finalen Merge defensiv in den
  Arbeitsbranch integriert.
- Nach erfolgreichem Merge werden Worktree und vollständig gemergter Branch
  entfernt und in Git sowie Dateisystem verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Private Kartenbildpakete als Verzeichnis oder ZIP“
vollständig und sequenziell von ZIP01 bis ZIP05 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die bereichsspezifischen AGENTS.md und dieses Artefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ZIP_CARD_IMAGE_PACKS
auf Branch codex/zip-card-image-packs. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe die Paketchecks aus,
committe jedes abgeschlossene Paket und setze den Prozess danach automatisch
fort. Bei einem Sicherheitsblocker stoppe fail-closed mit Removal Condition.
Nach ZIP05: aktuelles main integrieren, final verifizieren, lokal nach main
mergen, main prüfen, den sauberen Arbeits-Worktree verifiziert entfernen, den
gemergten Arbeitsbranch löschen und das Goal erst danach als complete markieren.
```

## Abschlusskriterien

- Verzeichnis- und ZIP-Ausgabe sind wählbar.
- Ordner- und ZIP-Import verwenden denselben Paketkern.
- ZIP-Grenzen und Staging-Cleanup sind durch Tests belegt.
- Maintenance-API und Oberfläche unterstützen beide Formen eindeutig.
- Current-State-Dokumentation ist konsistent.
- Alle fünf Paketcommits sind lokal in `main` integriert.
- Worktree und Branch sind entfernt und die Entfernung ist doppelt verifiziert.
