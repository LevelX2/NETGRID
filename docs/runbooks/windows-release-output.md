# Windows-Releaseoutput erzeugen und prüfen

Stand: 2026-09-03

## Zweck

Dieses Runbook erzeugt den installerneutralen NETGRID-Produktoutput. Es baut
keinen MSI-/MSIX-Installer und verändert keine Windows-Dienste,
Firewallregeln oder lokalen Hauptinstanzen.

## Voraussetzungen

- Windows x64 mit der im Workspace verwendeten Node-24-Laufzeit;
- installierte Workspace-Abhängigkeiten;
- sauber klassifizierte Produktdaten gemäß
  `docs/architecture/windows/windows-release-boundary.md`.

## Schnelle Vertragsprüfung

```powershell
corepack pnpm check:release-boundary:selftest
corepack pnpm check:release-boundary
corepack pnpm check:release-card-index
corepack pnpm check:windows-release-output:selftest
```

## Output bauen

```powershell
corepack pnpm build:windows-release-output
```

Der Befehl erzeugt und auditiert `output/windows-release`. Das Verzeichnis ist
ein wegwerfbares Buildartefakt und wird nicht versioniert. Ein nachträglich
verändertes Artefakt erneut prüfen mit:

```powershell
corepack pnpm check:windows-release-output
```

Ein grüner Audit bestätigt positive Pfade, Manifestvollständigkeit, Hashes,
Windows-Sharp-Runtime und das Fehlen verbotener Daten. Er ist noch kein
Codesigning- oder Installer-Nachweis.

## Isolierten Frischstart prüfen

```powershell
corepack pnpm smoke:windows-release-output
```

Der Smoke verwendet automatisch zwei freie Nichtstandardports und einen
frischen temporären `NETGRID_DATA_ROOT`. Er baut ein separates Artefakt,
startet ausschließlich dessen Prozesse und prüft:

- SQLite-Health und Anlage der Datenbank außerhalb des Produktbaums;
- Start der Weboberfläche;
- Kartenkatalog ohne `testset`;
- Deckendpunkte ohne Demo-Snapshots;
- nicht verfügbare Tutorial-Testfläche;
- eine produktive KI-vs-KI-Simulation mit StateHash.

Eigene Prozesse, temporärer Output und Datenroot werden anschließend
entfernt. Die Standardports `3100` und `8787` sowie die Daten der
Hauptinstanz bleiben unangetastet.

## Übergabe an einen späteren Installer

Der Installer erhält ausschließlich den erfolgreich auditierten Ordner
`output/windows-release`. Er liest `product-layout.json`, verifiziert vor dem
Paketieren `product-manifest.json` und erzeugt aus
`config/runtime.env.example` eine reale, geschützte Konfiguration. Der
Platzhalter `NETGRID_TOKEN_SALT` darf nie unverändert übernommen werden.

Der vorgesehene Datenroot ist `C:\ProgramData\NETGRID`. Das
Installationsverzeichnis und der Datenroot dürfen nicht identisch sein. Eine
bestehende Entwicklungsdatenbank wird nicht importiert. Falls später eine
Produktdatenmigration erforderlich wird, braucht sie einen eigenen
versionierten Vertrag und einen expliziten Upgrade-Test.

## Fehlerdiagnose

- `RELEASE_PRODUCT_BOUNDARY_*`: Klassifikation oder verbotener
  Repositoryinhalt korrigieren.
- `WINDOWS_RELEASE_AUDIT_*`: Output nicht verteilen; Manifest- oder
  Positivgrenze ursächlich reparieren.
- `release_next_dependency_*`: fehlende Web-Laufzeitabhängigkeit im
  Materialisierungsschritt ergänzen, nicht den Workspace mitkopieren.
- `deck_snapshot_*` im Release: Produktdefault oder Standarddeck-Katalog
  prüfen; keine Demo-Snapshots als Fallback ausliefern.
- fehlender externer Datenroot: absoluten `NETGRID_DATA_ROOT` setzen; keinen
  relativen Repositorypfad verwenden.
