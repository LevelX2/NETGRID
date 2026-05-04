# Card Image Import 0.91 Spec

Status: Requirements Freeze mit privater lokaler Nutzungsentscheidung
Stand: 2026-05-03

## Zweck

Diese Spezifikation beschreibt den späteren Bildmetadaten- und Bildcache-Import nach bestandenem Asset-Gate. In diesem V0.91-Freeze wird kein Importcode geschrieben, kein Bild heruntergeladen und keine offizielle Asset-Datei genutzt.

Freigegeben ist nur der spätere private lokale Import von Original-Netrunner-1996-Frontbildern. Bevorzugte Quelle sind eigene Scans aus der physischen Sammlung des Projektverantwortlichen; Community-Archive dürfen nur als private lokale Referenz oder Gap-Fill genutzt werden.

## Grundsatz

Der Bildimport ist ein Anzeige-Import. Er erzeugt keine Regeln, keine Resolver, keine Decklegalität, keine Matchstart-Freigabe und keine KI-Rollen.

Verbotene Verbraucher:

- Engine,
- KI,
- Deckvalidierung,
- Matchstart-Revalidierung,
- LegalActions,
- PlayerActions,
- GameState,
- PublicEvents,
- Replays,
- StateHash.

## Importzustände

| Status | Bedeutung | Erlaubt in V0.91 |
|---|---|---|
| `blocked_pending_permission` | Quelle technisch bekannt, Nutzung nicht freigegeben. | Ja, aktueller Zustand. |
| `metadata_allowed` | Lokale Mapping-Metadaten dürfen versioniert werden. | Ja, ohne Remote-Bild-URLs. |
| `cache_allowed` | Bildimport in nicht versionierten lokalen Cache erlaubt. | Ja, nur O:NR-1996-Frontbilder. |
| `display_allowed` | Lokale Anzeige gecachter Bilder erlaubt. | Ja, nur privat/familiär lokal und side-sicher. |
| `asset_blocked` | Einzelne Karte, Quelle oder Größe bleibt ausgeschlossen. | Ja. |

## Quelle und Mapping

Spätere Zuordnung erfolgt ausschließlich zwischen lokalem Katalog und freigegebener Quelle:

- lokaler `catalogCardId`,
- lokaler `sourceCardId` oder `engineCardId`,
- O:NR-Set, Kartennummer und lokale Scan-ID nur als Anzeige-Mapping,
- Quelle und API-Version,
- erlaubte Bildgrößen,
- Sprache,
- Set-/Cycle-/Printing-Kontext,
- Policy-Version.

Die Zuordnung darf niemals bestimmen, ob eine Karte spielbar, implementiert oder decklegal ist.

## Metadatenmanifest

Ein späteres versioniertes Manifest ist nur erlaubt, wenn die Policy `image_url_versioning_allowed: true` setzt. Dann gelten Pflichtfelder:

- `schemaVersion`,
- `policyId`,
- `sourceId`,
- `generatedAt`,
- `sourceCheckedAt`,
- `entries`,
- pro Eintrag `catalogCardId`, `printingId`, `language`, `allowedSizes`, `status`, `blockReasons`,
- keine Remote-Bild-URL-Felder,
- deterministische Sortierung nach `catalogCardId`, `printingId`, `language`.

Solange `image_url_versioning_allowed: false` gilt, enthält ein Manifest nur lokale Asset-IDs, Hashes, Set-/Kartennummern und Dateinamen innerhalb des lokalen Cache-Konzepts.

## Lokaler Cache

Ein späterer Cache ist für Original-Netrunner-1996-Frontbilder erlaubt, wenn die Policy `local_cache_allowed: true` setzt.

Pflichtregeln:

- Cache-Pfad: `data/local-assets/card-images/onr-1996/` oder gleichwertiger ignorierter Ordner.
- Cache-Dateien sind nicht versioniert.
- Cache-Dateinamen nutzen neutrale, stabile IDs und keine Hidden-Card-Kontexte.
- Der Cache enthält keine Tokens, keine lokalen Benutzernamen, keine absoluten privaten Quellpfade.
- Cache-Reports liegen ebenfalls nicht versioniert, sofern sie lokale Pfade oder Dateihashes enthalten.
- Import/Cache läuft nie beim Matchstart und nie aus der Engine heraus.
- Card Backs, standalone Frames, standalone Logos und öffentlich weiterzuverteilende Bildpakete bleiben ausgeschlossen.
- Rechtshinweise oder Copyright-Zeilen auf Scans werden nicht entfernt oder weggecropt.

## Import-Validierung

Nach positiver Freigabe muss jeder Import prüfen:

- erlaubte Quelle,
- erlaubte Größe,
- bei Download: HTTP-Status und Content-Type,
- Maximalgröße,
- Mindestdimension,
- Hash,
- optional ETag/Last-Modified,
- Bilddekodierbarkeit,
- keine HTML-/Fehlerseite als Bilddatei.

Fehlerhafte Dateien werden gelöscht oder als `asset_blocked` markiert.

## Berichte

Ein späterer Importbericht enthält:

- Policy-ID,
- Quelle,
- Anzahl geprüfter, freigegebener, blockierter, fehlender und fehlerhafter Einträge,
- verwendete Bildgrößen,
- Cache-Status,
- Warnungen,
- verbotene Datenprüfung,
- keine lokalen Secrets,
- keine Runtime-Tokens,
- keine Match- oder Hidden-Info-Daten.

## Update-Regeln

Ein späteres Update ist nur zulässig, wenn:

- die Source Registry die Quelle erlaubt,
- die Asset-Policy die konkrete Nutzung erlaubt,
- der Import deterministisch ist,
- Cache-Änderungen nicht versioniert werden,
- Metadaten-Änderungen reviewbar sind,
- bestehende V0.1- bis V0.9-Tests grün bleiben,
- Hidden-Info-Tests um Bild-URL-/DOM-/Ladezustandsprüfungen erweitert sind.

## Aktueller Freeze

Der aktuelle Freeze plant den Importpfad und gibt die private lokale O:NR-1996-Frontbildnutzung als späteren Implementierungskorridor frei:

- kein Bilddownload,
- kein lokaler Bildcache,
- kein Remote-URL-Manifest,
- kein öffentliches Bilddisplay,
- nur Source-Registry und Policy als strukturierte Requirements-Artefakte.
