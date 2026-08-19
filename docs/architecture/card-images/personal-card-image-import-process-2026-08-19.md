# Persönlicher Kartenbildimport IMG01–IMG05

Status: `in_progress`
Stand: 2026-08-19
Primärer Agent: `release-implementation-agent`
Arbeitsbranch: `codex/img01-img05-card-image-import`
Aktueller Zustand: `IMG03_done`

## Quelle und Zielprüfung

Der Projektbetreiber hat die direkte Umsetzung der Pakete IMG01 bis IMG05 im
gleichen Chat beauftragt. Die zuvor abgestimmte Architektur ist ausreichend
präzise: Kartenbilder werden ausschließlich in einer Installations- oder
Vorbereitungsphase importiert, danach persistent lokal gespeichert und in der
Spielruntime nie aus externen Quellen geladen.

## Gesamtziel

NETGRID erhält einen eigenständig lauffähigen lokalen Kartenbildimport mit:

- zentral konfigurierbarem, persistentem Daten- und Bild-Root;
- inhaltsadressiertem Asset-Speicher und sammlungsbezogenen Bindungen über
  `printingId`;
- kataloggenerierter CSV-Vorlage;
- atomarem Import lokaler Bilddateien mit Dry-Run und den Konfliktmodi
  `fail`, `skip` und `replace`;
- sicherer Normalisierung und den Varianten `master`, `thumb`, `preview` und
  `full` ohne Kartenbeschnitt oder unnötiges Hochskalieren;
- Runtime-Auflösung persönlicher Overrides vor den bestehenden lokalen
  Bildquellen.

Nach IMG05 ist der Bildimport im normalen Entwicklungs- und lokalen
Anwendungsbetrieb vollständig nutzbar. Produktionsbuild, Windows-Launcher,
Installer, HTTPS-Import und private Bildpaket-Installer gehören nicht zu
diesem Prozess.

## Annahmen

- Der kanonische Zuordnungsschlüssel ist `printingId`; Titel, Set und
  Sammlernummer dienen nur der Orientierung und Validierung.
- Der persistente Root wird über `NETGRID_DATA_ROOT` konfigurierbar. Ohne
  Konfiguration bleiben bestehende Repository-Defaults erhalten.
- Persönliche Bildimporte liegen in einer benannten Sammlung, standardmäßig
  `personal`.
- IMG01–IMG05 akzeptiert lokale PNG-, JPEG- und WebP-Quellen. URLs und weitere
  Containerformate bleiben ausgeschlossen.
- Die Bildverarbeitung muss ohne Beschnitt erfolgen und EXIF-Ausrichtung sowie
  Metadatenbereinigung berücksichtigen.

## Nicht-Ziele

- Kein HTTPS- oder sonstiger Remoteimport.
- Keine normale Spieler- oder LAN-API für lokale Pfade oder Importjobs.
- Keine Änderung an Engine, KI, LegalActions, GameState, Replay oder
  StateHash.
- Kein Windows-Installer, Autostart, Dienst oder Firewallmanagement.
- Keine öffentliche oder versionierte Verteilung privater Kartenbilder.
- Keine stillen Teilimporte oder Kompatibilitäts-Fallbacks.

## Controller-Invarianten

- Genau ein Paket ist aktiv; Pakete werden nicht übersprungen.
- Jeder Import wird vollständig vorgeprüft und in einem Stagingbereich
  vorbereitet, bevor Bindungen atomar aktiviert werden.
- Die Runtime liest nur lokale, bereits validierte Assets.
- Verdeckte Karten erzeugen weder Bild-URLs noch unterscheidbare Bildzustände.
- Absolute lokale Pfade erscheinen weder in Browserantworten noch in
  PlayerViews, Events, Logs oder Clientfehlern.
- Bestehende freigegebene Projektbilder bleiben unverändert und dienen als
  Rückfall, wenn keine persönliche Bindung existiert.
- Der Katalog bleibt reine TypeScript-Logik ohne Dateisystemabhängigkeit.

## Automatische Fehlerbehandlung

- Ungültige Kartenkennungen, unsichere Pfade, unbekannte Formate,
  Dekodierungsfehler, unplausible Abmessungen, Hashkonflikte und bestehende
  Bindungen im Modus `fail` brechen den Import strukturiert ab.
- `skip` überspringt ausschließlich ausdrücklich erkannte bestehende
  Bindungen und weist sie im Bericht aus.
- `replace` ersetzt nur die aktive Bindung; unveränderliche Blobs werden nicht
  destruktiv überschrieben.
- Bei einem Paketfehler bleibt das Paket aktiv. Scope-fremde Follow-ups werden
  dokumentiert, aber nicht still aufgenommen.

## Sicherheitsblocker

Der Prozess stoppt, wenn eine Umsetzung beliebige lokale Dateizugriffe oder
Remoteabrufe über eine normale LAN-erreichbare API ermöglichen würde, wenn
private Assets in Git geraten oder wenn Hidden-Info-Grenzen durch Bild-URLs
beziehungsweise DOM-Metadaten verletzt würden. Removal Condition ist jeweils
ein lokaler, privilegierter und fail-closed Importpfad mit side-sicherer
Runtime-Auflösung.

## State Machine

```text
prepared -> IMG01 -> IMG02 -> IMG03 -> IMG04 -> IMG05
         -> final_verify -> main_merge -> cleanup -> complete
```

Bei roten Done-Gates verbleibt der Prozess im aktuellen Zustand.

## Fortschritt

- IMG01 abgeschlossen: zentraler `NETGRID_DATA_ROOT`-Vertrag,
  Repository-Default und persistenter Kartenbild-Root sind implementiert.
- Checks: Pakettests, Paket-Typecheck, Web-Lookup-Test und Package-Boundary-
  Check grün. Der Web-Typecheck bleibt an zwei identischen, auf `main`
  reproduzierten KI-Baselinefehlern außerhalb dieses Scopes rot.
- IMG02 abgeschlossen: inhaltsadressierte Blobs, Asset-Manifeste,
  sammlungsbezogene Bindungen sowie atomare Konfliktmodi sind implementiert.
- Checks: neun Kartenbild-Pakettests, Paket-Typecheck und Package-Boundary-
  Check grün.
- IMG03 abgeschlossen: kataloggenerierte UTF-8-CSV-Vorlage, lokaler
  PNG-/JPEG-/WebP-Import, Dry-Run, Konfliktmodi und strukturierter Bericht sind
  über CLI und Package-API verfügbar.
- Checks: 14 Kartenbild-Pakettests, Paket-Typecheck und Package-Boundary-Check
  grün; CLI-Smoke erzeugte für Proteus exakt 154 Datenzeilen plus Kopfzeile.

## Paketfolge

### IMG01 – Persistenter Daten- und Bild-Root

Ziel: Ein zentraler Pfadvertrag trennt veränderliche Daten von
Programmartefakten und behält im Repository den bisherigen lokalen Default.

Arbeit:

- zentralen Root-Resolver einführen;
- `NETGRID_DATA_ROOT` und abgeleitete Kartenbildpfade definieren;
- bestehende lokale Bildsuche auf den Resolver vorbereiten;
- Pfad- und Traversaltests ergänzen;
- Betriebs- und Architekturvertrag dokumentieren.

Done-Gate:

- Root-Resolver ist absolut, deterministisch und getestet;
- ohne Umgebungsvariable bleibt das aktuelle Repositoryverhalten erhalten;
- mit Umgebungsvariable werden ausschließlich Pfade unter dem konfigurierten
  Root erzeugt;
- Web-Typecheck beziehungsweise fokussierte Tests und `git diff --check` sind
  grün.

Commit: `feat(card-images): add persistent data root contract`

### IMG02 – Blob-Speicher, Sammlungen und Bindungen

Ziel: Validierte Assets werden unveränderlich nach Inhalt gespeichert und
über `printingId` in benannten Sammlungen gebunden.

Arbeit:

- Node-seitiges Kartenbildmodul mit Store-Vertrag erstellen;
- SHA-256-basierte Blobpfade und Manifesttypen einführen;
- sichere Sammlungsnamen und `printingId`-Bindungen validieren;
- atomare Manifestaktualisierung und Rücknahme ermöglichen;
- Tests für Deduplizierung, Konflikte und Pfadsicherheit ergänzen.

Done-Gate:

- identischer Inhalt erzeugt denselben Blob;
- Bindungen referenzieren nur vorhandene, geprüfte Blobs;
- `fail`, `skip` und `replace` sind auf Store-Ebene eindeutig;
- fokussierte Tests und `git diff --check` sind grün.

Commit: `feat(card-images): add content addressed image store`

### IMG03 – CSV-Vorlage und lokaler Dateiimport

Ziel: Der Anwender kann eine aus dem Katalog generierte Tabelle bearbeiten,
vorprüfen und lokale Dateien atomar importieren.

Arbeit:

- CSV-Vorlage aus dem CardSpec-basierten Runtime-Katalog generieren;
- UTF-8- und Excel-tauglichen Parser mit klarer Schema-Version erstellen;
- relative Pfade gegen den Tabellenort, absolute Pfade explizit auflösen;
- Dry-Run, Konfliktmodi und Importbericht bereitstellen;
- CLI-/Package-Skripte und Tests ergänzen.

Done-Gate:

- Vorlage enthält jede aktuelle Druckversion genau einmal;
- unbekannte oder doppelte `printingId` scheitern fail-closed;
- ein Mehrkartenimport verändert bei einem Fehler keine aktive Bindung;
- Dry-Run schreibt keine Assets oder Bindungen;
- fokussierte Tests und `git diff --check` sind grün.

Commit: `feat(card-images): add catalog csv import workflow`

### IMG04 – Normalisierung und Derivate

Ziel: Unterschiedliche lokale Rasterbilder werden sicher geprüft und als
Master sowie laufzeitgerechte Varianten gespeichert.

Arbeit:

- PNG, JPEG und WebP anhand dekodierter Bilddaten prüfen;
- EXIF-Ausrichtung, sRGB und Metadatenbereinigung anwenden;
- plausible Kartenmaße und Hochformat prüfen;
- `master`, `thumb`, `preview` und `full` ohne Crop und ohne unnötiges
  Hochskalieren erzeugen;
- Varianten, Maße, MIME-Typen und Hashes im Store manifestieren;
- Tests mit kleinen synthetischen Fixtures ergänzen.

Done-Gate:

- alle Varianten sind dekodierbar und referenziert;
- kein Derivat überschreitet seine Zielgröße oder schneidet Bildinhalt ab;
- falsche beziehungsweise beschädigte Eingaben scheitern vor Aktivierung;
- fokussierte Tests, Paket-Typecheck und `git diff --check` sind grün.

Commit: `feat(card-images): normalize imported image variants`

### IMG05 – Runtime-Auflösung persönlicher Overrides

Ziel: Die bestehende Bildroute nutzt persönliche Bindungen zuerst und fällt
ansonsten unverändert auf bestehende lokale beziehungsweise generierte Bilder
zurück.

Arbeit:

- Lookup-Service um den persistenten Store erweitern;
- Variantenparameter sicher auflösen und cachebare Hash-URLs verwenden;
- persönliche Bindung vor bestehender Bildquelle priorisieren;
- fehlende oder ungültige Bindungen strukturiert diagnostizieren, ohne
  lokale Pfade an Clients auszugeben;
- Sichtbarkeits-, Route-, Fallback- und Neustarttests ergänzen.

Done-Gate:

- persönliches Bild erscheint nach Import und nach Prozessneustart;
- entfernte Bindung stellt den bisherigen Fallback wieder her;
- Runtime führt keine Remotezugriffe aus;
- verdeckte Karten erhalten keine neuen Bildinformationen;
- Webtests, Web-Typecheck, thematische Checks und `git diff --check` sind
  grün.

Commit: `feat(card-images): resolve personal runtime overrides`

## Verifikationsregeln

- Während eines Pakets nur den engsten belastbaren Test ausführen.
- Nach Typoberflächen- oder Paketänderungen den betroffenen Typecheck
  ausführen.
- Nach IMG05 die thematische Kartenbild-/Webtestsuite und den Workspace-
  Typecheck ausführen.
- Vor jedem Paketcommit `git diff --check` ausführen.
- Vor dem Main-Merge final mindestens die betroffenen Tests, Typechecks und
  einen Build ausführen; bekannte unabhängige Baselinefehler getrennt
  ausweisen.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich im Worktree
  `C:\Projekte\NETGRID_IMG01_IMG05_CARD_IMAGE_IMPORT` auf Branch
  `codex/img01-img05-card-image-import` arbeiten.
- Hauptcheckout ausschließlich für den finalen lokalen Merge verwenden.
- Nach jedem Paket nur paketzugehörige Änderungen committen.
- Vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls es
  weitergelaufen ist, und Konflikte intentionswahrend lösen.
- Nach erfolgreichem Merge Worktree und gemergten Branch sicher entfernen und
  beide Entfernungen verifizieren.
- Kein Push und keine Remoteintegration.

## Controller-Prompt-Kern

```text
/Goal Arbeite den persönlichen Kartenbildimport vollständig und sequenziell
von IMG01 bis IMG05 ab und merge den abgeschlossenen Arbeitsbranch lokal nach
main. Lies zuerst AGENTS.md, paketlokale Agentenvorgaben und dieses
Prozessartefakt. Arbeite ausschließlich im festgelegten Worktree. Bearbeite
immer nur das aktuelle Paket, führe dessen Checks aus und committe es vor dem
nächsten Paket. Bei Sicherheitsblockern stoppe fail-closed. Integriere danach
aktuelles main, verifiziere final, merge lokal nach main und entferne
Worktree sowie Branch erst nach nachgewiesen sauberer Integration.
```

## Abschlusskriterien

- IMG01 bis IMG05 besitzen jeweils einen sauberen Paketcommit.
- Der Bildimport ist lokal vollständig nutzbar und getestet.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- `main` ist geprüft und sauber.
- Arbeits-Worktree und gemergter Arbeitsbranch sind verifiziert entfernt.
- Offene Punkte sind ausschließlich klar abgegrenzte Nachfolgepakete wie
  HTTPS-Import, private Paket-Builder oder Windows-Distribution.
