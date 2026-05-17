# Regeldatei KI-Wissenspflege

## Zweck

Diese Wissensbasis dient der dauerhaften, strukturierten und verlinkten Dokumentation des Projekts `NETGRID`.

## Projektgrenze

- Diese Wissensbasis behandelt nur dieses Projekt: NETGRID als Anwendung und das NETGRID-Regelspiel als fachliche Grundlage.
- Führende globale Projektanlage- und Codex-Standards bleiben im persönlichen Haupt-Vault `mein-wissen`.
- Dieses lokale KI-Wissen hält projektspezifische Entscheidungen, Quellenlage, Anforderungen, Risiken, Runbooks, Status und Betriebswissen.
- MVP 0.1 und MVP 0.2 bleiben getrennte Phasen. MVP 0.2 darf erst nach dokumentiertem MVP-0.1-Gate begonnen werden.

## Arbeitssprache

- Wissensseiten werden in klarem Deutsch gepflegt.
- Normale deutsche Texte verwenden echte Umlaute und `ß`.
- Technische Dateinamen, Pfade, Code-Symbole, IDs, bestehende Links und originale Quellbezeichnungen bleiben unverändert.

## Primäre Quellen

Quellenpriorität:

1. `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
2. `docs/source/NETGRID_MVP_0.2_Plan.md`, erst nach MVP-0.1-Gate als aktive Umsetzungsquelle
3. `docs/source/Erstes Testdeck.txt`
4. `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` als Regelreferenz, nicht als Scope-Erweiterung
5. `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`
6. ergänzende Dokumente unter `docs/NETGRID_Dokumentenpaket_MVP_0_1_0_2/` und `docs/NETGRID_Detailliertes_Testkonzept_MVP_0_1_0_2.md`

Bei Abweichungen zwischen älterer Dokumentation und aktuellem Workspace-Stand wird der Konflikt sichtbar gemacht statt stillschweigend geglättet.

## Antwortregeln

- Antworten zum Projekt basieren primär auf dieser Wissensbasis.
- Dafür zuerst [[../02 Wissen/00 Uebersichten/Index]] lesen, dann relevante Wissensseiten, danach nur bei Bedarf Rohquellen oder Workspace-Dateien hinzuziehen.
- Wenn Aussagen nur geplant oder skizziert, aber noch nicht umgesetzt sind, wird das offengelegt.
- Wenn der aktuelle Workspace eine abweichende Lage zeigt, wird diese als eigener Stand markiert.

## Wissenspflege

- Neue Erkenntnisse werden nur aufgenommen, wenn sie belastbar, wiederverwendbar und für spätere Threads oder Entscheidungen relevant sind.
- Wiederkehrende Abläufe mit klarer Schrittfolge sollen als Prozessseite oder Runbook dokumentiert werden.
- Bei weitreichenden oder unklar zuzuordnenden Änderungen wird die Einordnung vorab im Chat transparent gemacht.
- Statuswissen und Chronik bleiben getrennt:
  - `Aktueller Projektstatus` zeigt den verdichteten Ist-Stand.
  - `Log.md` bleibt der kurze Einstieg und Index für die monatlichen Logarchive.
  - Monatliche Logarchive unter `03 Betrieb/` enthalten die vollständige zeitliche Chronik in umgekehrt chronologischer Reihenfolge: neueste Einträge stehen oben, ältere Einträge folgen darunter.

## Logregel

Das Projektlog dokumentiert:

- wesentliche Entwicklungs- und Strukturveränderungen,
- Architektur-, Workflow- und Projektentscheidungen,
- relevante Entwicklungsumgebungs-Änderungen,
- größere Verifikationen,
- Risiken,
- Abschlussstände.

Routine-Schritte, einzelne Toolaufrufe und reine Zwischenstände bleiben normalerweise draußen.

Neue Logeinträge werden im Archiv des jeweiligen Kalendermonats oberhalb aller älteren Einträge dieses Monats einsortiert; bei gleichem Datum stehen neuere Einträge oberhalb der vorherigen Einträge dieses Datums. Ältere Einträge dürfen zur Einhaltung dieser Reihenfolge nach unten verschoben werden, inhaltlich aber nicht stillschweigend verändert werden. `Log.md` wird nur gepflegt, wenn neue Monatsarchive hinzukommen oder sich die Archivstruktur ändert.

## Projektbesonderheiten

- `data/cards`, `data/decks`, `data/manifests` und `data/scenarios` sind versionierte Projektartefakte.
- Lokale Datenbanken, Runtime-Daten, temporäre Dateien, Build-Artefakte und Secrets werden nicht versioniert.
- Hidden-Info-Sicherheit ist ein Gate, kein UI-Komfortthema.
- Offizielle Assets, Logos, Card Frames, Card Backs und externe Kartendatenbank-Abhängigkeiten sind für MVP 0.1 und 0.2 ausgeschlossen.
