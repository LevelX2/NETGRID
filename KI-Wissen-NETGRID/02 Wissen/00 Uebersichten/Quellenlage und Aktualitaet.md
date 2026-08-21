# Quellenlage und Aktualität

Stand: 2026-08-12

## Versionierte Primärquellen

- `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
- `docs/source/NETGRID_MVP_0.2_Plan.md`
- `docs/source/Erstes Testdeck.txt`
- `docs/source/Erstes Testdeck.md`
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`
- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`
- `docs/source/Proteusspoiler.txt`
- Classic-Spoilerdateien unter `docs/source/`

Die frühere ergänzende MVP-0.1/0.2-Dokumentpaket- und Testkonzept-Sammlung unter `docs/archive/` ist kein aktueller Quellenbereich mehr. Historische Fassungen bleiben über Git erreichbar.

## Strukturierte Projektquellen

Aktuell relevante strukturierte Quellen liegen insbesondere unter:

- `data/cards/`
- `data/decks/`
- `data/manifests/`
- `data/scenarios/`
- `data/ai/`

Welche davon für einen konkreten Scope führend sind, ergibt sich aus aktuellem Projektstatus, Roadmap, Format-/Releasevertrag und den jeweiligen Gates.

## Lokale nicht versionierte Quellen und Artefakte

Private lokale Importe, Kartenbilder, Runtime-Daten und Analyseausgaben unter `data/local*` oder anderen ignorierten Local-Bereichen sind keine versionierte Primärquelle. Sie dürfen nur dann zu einem dauerhaften Projektvertrag werden, wenn Scope, Datenquelle und Gate ausdrücklich versioniert werden.

## Quellenhierarchie

- Primärkonzeption und Regelreferenz liefern fachliche Ausgangsverträge.
- Die Engine bleibt Regelautorität für die Anwendung.
- Aktueller Produkt-, Architektur- und Gate-Stand wird aus Wissensbasis, `docs/codex/CODEX_STATUS.md`, aktuellen Architektur-/Releaseartefakten, Code und Tests bestimmt.
- Historische Dokumente oder Logs dürfen einen aktuellen Vertrag nicht überschreiben.

## Aktualitätsregel

Wenn neue Quellen oder aktualisierte Fassungen hinzukommen:

1. Quellenlage und Scope prüfen.
2. Widersprüche sichtbar machen.
3. Betroffene Wissensseiten und aktuelle Verträge aktualisieren.
4. `docs/codex/CODEX_STATUS.md` nur nachziehen, wenn sich aktueller Phasen-, Gate- oder Implementierungsstand ändert.
