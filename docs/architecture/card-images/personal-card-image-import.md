# Persönlicher Kartenbildimport

Stand: 2026-08-19

## Laufzeitvertrag

Persönliche Kartenbilder werden ausschließlich in einer lokalen Installations-
oder Vorbereitungsphase importiert. Dabei werden die Quellbilder geprüft,
normalisiert und in den persistenten inhaltsadressierten Kartenbildspeicher
übernommen. Spielruntime, Webclient und Multiplayer-Server verwenden danach nur
die bereits lokal gespeicherten Varianten.

Der frühere direkte Laufzeitzugriff auf den lokalen ONR-Quellordner ist nicht
mehr Bestandteil der Bildauflösung. Bestehende private Quelldateien werden
einmalig zu vollständigen IMG07-Paketen gebaut und anschließend über denselben
Paketimport wie auf einer übertragenen Installation in die persönliche
Collection übernommen.

Remote-URLs, lokale Quellpfade und Paketpfade werden weder in PlayerViews noch
in Browserpayloads, Replays, Events oder StateHash übernommen. Kartenbilder
bleiben reine Anzeigeinhalte und verändern keine Spielregeln oder
Kartenlegalität.

## Lokale Zuordnung

Eine aktuelle Zuordnungstabelle wird aus dem Katalog erzeugt:

```powershell
corepack pnpm --filter @netgrid/card-images cli template --output C:\Pfad\mapping.csv
```

Aktivierte Zeilen verwenden `printingId` als kanonischen Schlüssel. `quelle`
enthält einen lokalen absoluten oder relativ zur CSV aufgelösten Pfad;
`sha256` kann den erwarteten Hash der unveränderten Quelldatei enthalten.
Erzeugte Vorlagen beginnen mit einer deutschsprachigen Kurzanleitung. Zeilen,
deren erstes Feld nach optionalem Leerraum mit `#` beginnt, sind Kommentare
und werden vom Importer ignoriert. Dadurch dürfen zusätzliche Hinweise auch
innerhalb der Zuordnungstabelle stehen, ohne als Kartenzeilen verarbeitet zu
werden.

Der lokale Import führt keinerlei Netzwerkzugriff aus:

```powershell
corepack pnpm --filter @netgrid/card-images cli import --file C:\Pfad\mapping.csv --dry-run
corepack pnpm --filter @netgrid/card-images cli import --file C:\Pfad\mapping.csv --on-existing replace
```

## Expliziter HTTPS-Import

Direkte HTTPS-Bild-URLs werden nur über den eigenen Vorbereitungspfad
akzeptiert. Der Aufruf verlangt eine ausdrückliche Bestätigung, dass der
Anwender die Quelle verwenden darf:

```powershell
corepack pnpm --filter @netgrid/card-images cli import-https --file C:\Pfad\mapping.csv --confirm-rights --dry-run
corepack pnpm --filter @netgrid/card-images cli import-https --file C:\Pfad\mapping.csv --confirm-rights --on-existing replace
```

Der Downloader erzwingt HTTPS auf Port 443, verbietet URL-Zugangsdaten, pinnt
Requests auf vorher vollständig geprüfte öffentliche DNS-Ergebnisse und prüft
die tatsächlich verbundene Gegenstelle. Jeder Redirect durchläuft dieselben
Prüfungen erneut. Lokale, private, Link-Local-, Metadata-, Dokumentations-,
Multicast- und sonstige reservierte Ziele sind unzulässig.

Zusätzlich gelten feste Verbindungs-, Gesamtzeit-, Redirect- und Bytegrenzen.
Nur direkte Antworten mit PNG, JPEG oder WebP werden akzeptiert. Header,
gestreamte Bytezahl, optionaler Quell-SHA-256 und tatsächliche Dekodierung
werden unabhängig geprüft. HTML-Seiten, Archive und Scrapingpfade werden nicht
unterstützt.

Re:Factor kann manuell mit einer direkten Bild-URL als Realnetz-Smoke dienen.
NETGRID enthält aber keine Re:Factor- oder sonstige Drittanbieter-Liste und
automatisierte Tests hängen nicht von einer fremden Website ab.

## Private Bildpakete

IMG07 definiert drei feste Profile:

| Profil        | Katalogset       | Bilder | Paket-ID                             |
| ------------- | ---------------- | -----: | ------------------------------------ |
| `originalset` | `originalset-v1` |    374 | `netgrid-private-originalset-images` |
| `proteus`     | `proteus`        |    154 | `netgrid-private-proteus-images`     |
| `classic`     | `classic`        |     54 | `netgrid-private-classic-images`     |

Ein Paket ist zunächst ein übertragbares Verzeichnis. Es enthält:

- `netgrid-card-image-pack.json` mit Schema-, Profil-, Set-, Kartenanzahl-,
  Katalogfingerabdruck- und Mindest-Importer-Version;
- `mapping.csv` mit allen aktivierten Setzuordnungen und Quellhashes;
- `images/` mit exakt einer indexierten Quelldatei je `printingId`.

Der spätere Windows-Add-on-Installer darf dieses Format verpacken und den
gleichen Importkern aufrufen; er benötigt kein zweites Paket- oder
Bildspeicherformat.

### Paket vorbereiten

Für jedes Profil wird die vollständige Vorlage in einem ignorierten lokalen
Quellverzeichnis erzeugt:

```powershell
corepack pnpm --filter @netgrid/card-images cli pack-template --profile originalset
corepack pnpm --filter @netgrid/card-images cli pack-template --profile proteus
corepack pnpm --filter @netgrid/card-images cli pack-template --profile classic
```

Standardpfade im Repository:

```text
data/local-assets/card-image-packs/source/<profil>/mapping.csv
data/local-assets/card-image-packs/build/<profil>/
```

Bei gesetztem `NETGRID_DATA_ROOT` liegen die Verzeichnisse entsprechend unter
`<NETGRID_DATA_ROOT>/card-image-packs/`. Der öffentliche Builder akzeptiert
keinen frei wählbaren Ausgaberoot.

Nach Eintragen und Aktivieren aller lokalen Bildquellen wird gebaut:

```powershell
corepack pnpm --filter @netgrid/card-images cli pack-build --profile originalset --file C:\Pfad\mapping.csv
```

Eine bestehende erzeugte Ausgabe wird nur mit dem ausdrücklichen Schalter
`--replace` ersetzt. URLs sind im Paket-Builder unzulässig; Remotequellen
werden vorher bewusst mit IMG06 heruntergeladen und lokal bereitgestellt.

### Paket übertragen und importieren

Das vollständige Paketverzeichnis kann auf ein anderes System kopiert und dort
vor dem Spiel importiert werden:

```powershell
corepack pnpm --filter @netgrid/card-images cli pack-import --directory D:\NETGRID-Pakete\originalset --dry-run
corepack pnpm --filter @netgrid/card-images cli pack-import --directory D:\NETGRID-Pakete\originalset --on-existing replace
```

Vor jeder Bindungsänderung prüft der Importer Profil, Mindestversion,
Katalogfingerabdruck, vollständige `printingId`-Menge, sichere relative Pfade,
reguläre lokale Dateien, Größen und sämtliche SHA-256-Werte. Die gebündelte CSV
wird gegen das Manifest gegengeprüft und danach über den vorhandenen atomaren
Normalisierungs- und Storepfad importiert.

## Lokale Maintenance-Oberfläche

Unter `/maintenance/card-images` stehen dieselben Import- und Paketverträge
ohne CLI zur Verfügung. Die Seite ist Teil der Maintenance-Control-Plane und
bleibt im Profil `local` auf direkte Loopback-Verbindungen beschränkt. Sie
verlangt eine Maintenance-Anmeldung sowie bei Mutationen eine gültige
CSRF-/Origin-Prüfung. Kartenbildimport, Paketimport und Paketbuild verlangen
innerhalb dieser Sitzung keine zusätzliche Passworteingabe; die frische
Reauthentifizierung bleibt destruktiven Storage-Maintenance-Aktionen
vorbehalten.

Lokale Zuordnungstabellen, Quellbilder und übertragene Paketverzeichnisse
werden unter `data/local-assets/card-image-import/inbox/` bereitgestellt. Bei
gesetztem `NETGRID_DATA_ROOT` liegt die Inbox entsprechend unter dem dortigen
`card-image-import/inbox/`. Der Browser arbeitet außerhalb ausdrücklich
ausgewählter lokaler Dateien ausschließlich mit relativen Inbox-Einträgen. Eine
ausgewählte CSV oder ein vollständiger IMG07-Paketordner darf über die
authentifizierte Loopback-Maintenance-Verbindung in einen verwalteten
Inbox-Bereich geladen werden. Paketdateien werden einzeln begrenzt und das
Manifest zuletzt geschrieben, damit ein abgebrochener Upload nicht als Paket
angeboten wird. Absolute Serverpfade werden nicht übertragen oder
zurückgeliefert; Quell-URLs bleiben ausschließlich Inhalt der nicht
zurückgelieferten Zuordnungsdatei.

Die Oberfläche bietet:

- Bestandszahlen für Originalset, Proteus und Classic;
- CSV-Vorlagen für den Gesamtkatalog oder ein einzelnes Profil;
- direkte Auswahl und sichere Bereitstellung einer lokalen CSV-Datei in der
  Import-Inbox;
- direkte Auswahl und begrenzte Bereitstellung eines vollständigen
  IMG07-Paketordners;
- Prüflauf und Import für lokale beziehungsweise ausdrücklich bestätigte
  HTTPS-Zuordnungen;
- Paketprüfung und -import für erkannte IMG07-Verzeichnispakete;
- lokalen Paketbuild aus einer vollständigen Inbox-Zuordnung;
- serialisierte Jobs mit Fortschritt und strukturiertem Abschlussbericht.

Ein Prüflauf reserviert keine spätere Schreibentscheidung. Beim eigentlichen
Import werden Quellen, Rechtebestätigung, Konfliktmodus, Hashes und Bindungen
erneut geprüft. Während des Spiels erfolgt weiterhin kein Remotezugriff.

Die Normalisierung skaliert Quellbilder niemals hoch. Sie erzeugt WebP-Varianten
mit den Obergrenzen 2400 × 3360 (`master`, verlustfrei), 1200 × 1680 (`full`),
480 × 674 (`preview`) und 256 × 358 (`thumb`). Kleinere Quellen behalten in
`master` und `full` ihre vorhandenen Abmessungen; `preview` und `thumb` werden
nur bei Bedarf proportional verkleinert. Der Prüf- und Importbericht zeigt das
Quellformat mit Quellabmessungen sowie das erzeugte Masterformat mit
Masterabmessungen als Vorher-Nachher-Angabe.

## Private-Asset-Grenze

`data/local-assets/card-image-packs/` ist vollständig ignoriert. Private
Quellbilder, Manifeste mit privaten Beständen und erzeugte Pakete gehören weder
in Git noch in CI, den Hauptinstaller oder öffentliche Releaseartefakte. Tests
verwenden ausschließlich zur Laufzeit erzeugte synthetische Bilder.
