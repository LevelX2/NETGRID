# Regeldatei KI-Wissenspflege

Stand: 2026-08-12

## Zweck

Diese Wissensbasis dient der dauerhaften, strukturierten und verlinkten Dokumentation des Projekts `NETGRID`.

## Projektgrenze

- Diese Wissensbasis behandelt NETGRID als Anwendung und das NETGRID-Regelspiel als fachliche Grundlage.
- Führende globale Projektanlage- und Codex-Standards bleiben im persönlichen Haupt-Vault `mein-wissen`.
- Das lokale KI-Wissen hält projektspezifische Entscheidungen, Quellenlage, Anforderungen, Risiken, Runbooks, Status und Betriebswissen.

## Arbeitssprache

- Wissensseiten werden in klarem Deutsch gepflegt.
- Normale deutsche Texte verwenden echte Umlaute und `ß`.
- Technische Dateinamen, Pfade, Code-Symbole, IDs, bestehende Links und originale Quellbezeichnungen bleiben technisch unverändert.

## Primäre Quellen

Quellenpriorität für die ursprüngliche NETGRID-Konzeption und Regelreferenz:

1. `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
2. `docs/source/NETGRID_MVP_0.2_Plan.md`
3. `docs/source/Erstes Testdeck.txt`
4. `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` als Regelreferenz, nicht als automatische Scope-Erweiterung

Der aktuelle Produkt-, Architektur- und Gate-Stand wird nicht aus historischen Dokumentpaketen rekonstruiert. Dafür sind Wissensbasis, `docs/codex/CODEX_STATUS.md`, aktuelle Architekturverträge, Roadmaps, Code und Tests führend.

Bei Abweichungen zwischen Primärkonzeption, Regelreferenz und aktuellem Workspace-Stand wird der Konflikt sichtbar gemacht statt stillschweigend geglättet.

## Antwortregeln

- Projektantworten basieren zuerst auf dieser Wissensbasis.
- Dafür zuerst [[../02 Wissen/00 Uebersichten/Index]] lesen, dann relevante Wissensseiten, danach nur bei Bedarf Rohquellen oder Workspace-Dateien hinzuziehen.
- Geplante, umgesetzte und historisch erledigte Zustände werden klar getrennt.
- Wenn der aktuelle Workspace eine abweichende Lage zeigt, wird diese als aktueller Stand markiert.

## Wissenspflege

- Neue Erkenntnisse werden nur aufgenommen, wenn sie belastbar, wiederverwendbar und für spätere Threads oder Entscheidungen relevant sind.
- Wiederkehrende Abläufe mit klarer Schrittfolge sollen als Prozessseite oder Runbook dokumentiert werden.
- Statuswissen und Chronik bleiben getrennt:
  - `Aktueller Projektstatus` zeigt den verdichteten Ist-Stand.
  - `Log.md` bleibt der kurze Einstieg und Index für monatliche Logarchive.
  - Monatsarchive unter `03 Betrieb/` enthalten die zeitliche Chronik.
- Historische Arbeitsartefakte werden nicht zusätzlich in `docs/archive/` konserviert. Git-Historie reicht, sofern kein aktueller Entscheidungs-, Gate- oder Vertragsnutzen besteht.

## Logregel

Das Projektlog dokumentiert wesentliche Entwicklungs- und Strukturveränderungen, Architektur-/Workflowentscheidungen, relevante Entwicklungsumgebungsänderungen, größere Verifikationen, Risiken und Abschlussstände.

Routine-Schritte, einzelne Toolaufrufe und reine Zwischenstände bleiben normalerweise draußen. Neue Logeinträge werden im Archiv des jeweiligen Kalendermonats oberhalb älterer Einträge dieses Monats einsortiert.

## Projektbesonderheiten

- `data/cards`, `data/decks`, `data/manifests` und `data/scenarios` sind versionierte Projektartefakte.
- Lokale Datenbanken, Runtime-Daten, temporäre Dateien, Build-Artefakte und Secrets werden nicht versioniert.
- Hidden-Info-Sicherheit ist ein Gate, kein UI-Komfortthema.
- Offizielle Assets, Logos, Card Frames, Card Backs und externe Kartendatenbank-Abhängigkeiten benötigen ein eigenes Asset-/Rechts-Gate.

## Ursachenorientierte Fehlerbehebung

- Fachliche oder KI-Verhaltensfehler werden an der Schicht behoben, die die fehlende oder falsche strukturierte Information erzeugt, projiziert oder bewertet. Ein Workaround in einem nachgelagerten Consumer ersetzt diese Korrektur nicht.
- Technische Kennungen, insbesondere `actionId`, werden nie als Träger fachlicher Bedeutung geparst oder durchsucht. Karte, Ziel, Server, Kosten und Fähigkeit stammen aus strukturierten, side-sicheren Engine-/PlayerView-/Action-Semantik-Feldern.
- Ein temporärer Schutz darf nur einen laufenden Fehler sichtbar und sicher begrenzen. Er ist als temporär zu markieren, fail-closed zu halten und mit dem konkreten Ursachen-Fix zu ersetzen.
- Regressionstests bilden den realen Fehlpfad mit echten oder exakt nachgebildeten `LegalActions` ab und prüfen den strukturierten Datenweg bis zum zuständigen Plan.
