# Windows-Releasegrenze

Stand: 2026-09-04

## Zweck

Dieser Vertrag trennt den installierbaren NETGRID-Produktkern von
Entwicklung, Tests und lokalen Daten. Ein späterer Windows-Installer darf nur
den geprüften Output von `build:windows-release-output` konsumieren. Er darf
weder das Repository noch beliebige Unterverzeichnisse daraus paketieren.

Die Vorarbeit implementiert bewusst keinen Installer. Das beschlossene
Installer-, Launcher- und Updatezielbild steht in
`windows-installer-product-contract.md`; der sequenzielle spätere
Umsetzungsweg in `windows-installer-package-process.md`. GitHub Releases ist
der einzige Veröffentlichungs- und Updatekanal.

## Produkt- und Datengrenze

`scripts/release-product-boundary.json` ist die maschinenlesbare positive
Klassifikation:

| Klasse             | Bedeutung im Release                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| `product_runtime`  | statische, unmittelbar benötigte Produktdaten                                |
| `product_optional` | eigene redistribuierbare Anzeigeassets nach ausdrücklichem Produktentscheid  |
| `development_gate` | Tests, Benchmarks, Freigabe- und Analyseevidence; nie ausliefern             |
| `local_runtime`    | veränderliche Datenbanken, Logs und lokale Analyseevidence; nie ausliefern   |
| `private_asset`    | private Quellen, Scans und persönliche Kartenbildpakete; nie im Hauptrelease |

Normale Produktquellen beziehen statische Daten über die kleinen Subpath-
Exports von `@netgrid/runtime-data`. Evaluation, Selfplay und Reports dürfen
ihre Entwicklungsdaten weiterhin direkt verwenden. Das ist eine
Abhängigkeitsgrenze, kein zweites fachliches Datenmodell.

Insbesondere nicht Bestandteil des Hauptreleases sind:

- SQLite-Dateien, gespeicherte Matches, Nutzerkonten, Replays und lokale
  Deckbibliotheken aus Entwicklungs- oder Playtest-Instanzen;
- interne Testkarten, Demo-Deck-Snapshots, Testspiele und Tutorial-Fixtures;
- Selfplay-Registries, Benchmarks, Soaks, Mining-, League- und HTML-Reports;
- Coverage, Playwright-Ergebnisse, Buildcaches, Workspacequellen und Git;
- Secrets, `.env`-Dateien, Verbindungslogs, Backups und Maintenance-Tokens;
- private Scans, persönliche Kartenbilder und erzeugte IMG07-Pakete.

Standarddeck-Katalog, Deck-Guides, freigegebene Karten- und KI-Metadaten sowie
die normalen Spieler-Lokalisierungen sind dagegen Produktbestandteile.

## Laufzeitmodell

Der Releaseoutput ist unveränderlich; alle veränderlichen Daten liegen unter
einem absoluten externen `NETGRID_DATA_ROOT`. Der vorgesehene Windows-Default
ist `C:\ProgramData\NETGRID`. Serverpfade für Match- und Account-SQLite,
Backups, Auditlog, Maintenance-Authentifizierung und Kartenbilder werden aus
diesem Root abgeleitet. Relative Einzelpfad-Overrides sind im Releaseprofil
unzulässig.

`NETGRID_RUNTIME_PROFILE=release` ist fail-closed:

- Testkarten können auch durch einen internen Override nicht aktiviert
  werden;
- alte Demo-Deckbestände werden beim Build durch leere Releaseautoritäten
  ersetzt;
- Produktdefaults verweisen auf kuratierte Standarddecks;
- fehlende oder inkonsistente Runtimekonfiguration bricht sichtbar ab.

Der installerneutrale Output besitzt diese öffentlichen Verträge:

```text
product-layout.json
product-manifest.json
config/runtime.env.example
app/server.mjs
app/apps/web/server.js
```

`product-layout.json` nennt Produktversion, fortlaufende Buildnummer,
Commitbindung, Plattform, Node-Anforderung, Entrypoints, Defaultports,
`de`/`en`/`fr` und die externe Datenablage. Das Manifest enthält
für jede ausgelieferte Datei Pfad, Größe und SHA-256. Symlinks und nicht
positiv zugelassene Pfade werden vom Audit abgewiesen.

## Dauerhafter Pflegeaufwand

Der permanente Aufwand ist bewusst klein:

- neue statische Runtime-Daten müssen einmal positiv klassifiziert und über
  `@netgrid/runtime-data` exportiert werden;
- neue Produkt-Entrypoints oder native Abhängigkeiten müssen Build, Manifest
  und Smoke-Test erweitern;
- neue veränderliche Daten erhalten einen Pfad unter `NETGRID_DATA_ROOT`;
- neue Sprachen erweitern Produktlayout, Web-i18n-Gate und später die
  Installerressourcen gemeinsam.

Es gibt keine Dual-Read-/Dual-Write-Strecke, keine Releasekopie der
Spieldatenbank, keine permanente Migration alter V0-Entwicklungsdaten und
keine zweite Card-, Deck- oder KI-Autorität. Generierte Releaseindizes und
Substitutionen entstehen nur im Build und werden nicht als paralleler
versionierter Bestand gepflegt.

## Grenze des späteren Installerprojekts

Der Installer konsumiert ausschließlich den auditierten Releaseoutput. Seine
beschlossenen Produkt-, Daten-, Netzwerk-, Konto-, Update-, Support-,
Lokalisierungs- und Brandingverträge sowie die zurückgestellten Punkte stehen
vollständig in `windows-installer-product-contract.md`. Der Paketprozess
WIN-I01 bis WIN-I08 ist der umsetzungsreife Handoff; er ersetzt keine Gates
dieser Releasegrenze.

## Veröffentlichungs- und Updatekanal

GitHub Releases ist in der aktuellen Phase der einzige Distributionskanal.
Eine neue Version wird dort bewusst als Release mit Installer, Versionsangabe,
Änderungshinweisen und Prüfsumme veröffentlicht. Der beschlossene spätere
Launcher prüft einmal beim Start, bietet stabile Releases standardmäßig und
GitHub-Pre-Releases nach Opt-in an und lädt beziehungsweise installiert erst
nach ausdrücklicher Zustimmung. Bis WIN-I06 umgesetzt ist, bleibt der reale
Produktstand beim manuellen Download ohne Updateprüfung. Es gibt keinen
zusätzlichen Paketfeed, Store-Kanal oder eigenen Updateserver.

## Führende Gates

- `corepack pnpm check:release-boundary:selftest`
- `corepack pnpm check:release-boundary`
- `corepack pnpm check:release-card-index`
- `corepack pnpm check:windows-release-output:selftest`
- `corepack pnpm build:windows-release-output`
- `corepack pnpm smoke:windows-release-output`

Der Build und der Smoke sind Integrationsgates der Releasegrenze, nicht Teil
jedes normalen Entwicklungszyklus.
