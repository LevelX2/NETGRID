# AGENTS.md

Bitte den Benutzer im Chat mit `Du` oder `Meister` ansprechen.

## Projekt

Private Netrunner-Webapplikation. MVP 0.1 ist Human Runner gegen einfache Corp-KI mit festen Demo-Decks. MVP 0.2 ist privates Human-vs-Human-Multiplayer über dieselbe Engine.

## Projektbezogene Wissensbasis

Für dieses Projekt existiert eine projektbezogene KI-Wissensbasis im Ordner:

`KI-Wissen-Netrunner/`

Falls lokal vorhanden, zusätzlich `AGENTS.local.md` lesen. Diese Datei enthält private systemlokale Pfade und ist nicht Teil des versionierten Projektwissens.

Bei neuen Threads, neuen Aufgaben und Projektfragen ist diese Wissensbasis primär zu verwenden.

## Pflicht-Einstieg für neue Threads

Zu Beginn projektbezogener Arbeit zuerst diese Dateien lesen:

1. `KI-Wissen-Netrunner/00 Projektstart.md`
2. `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
3. `KI-Wissen-Netrunner/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
4. `KI-Wissen-Netrunner/00 Steuerung/Regeldatei KI-Wissenspflege.md`
5. `docs/codex/CODEX_STATUS.md`
6. `docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md`

Für Anschlussplanung nach V1.1.2 ist zusätzlich `docs/derived/POST_V1_1_2_MECHANICS_AI_CARD_ROADMAP.md` verbindlich, sobald `docs/codex/CODEX_STATUS.md` auf diesen Stand verweist.

## Quellenpriorität

1. `docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` für MVP 0.1.
2. `docs/source/Netrunner_MVP_0.2_Plan.md` für MVP 0.2 nach bestandenem MVP-0.1-Gate.
3. `docs/source/Erstes Testdeck.txt` für Demo-Karten und Demo-Decks.
4. `docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf` als Regelreferenz, nicht als Scope-Erweiterung.
5. `docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md` für Codex-Workflow.
6. Ergänzende Spezifikations-, Test-, Betriebs- und Planungsdokumente unter `docs/Netrunner_Dokumentenpaket_MVP_0_1_0_2/` und `docs/Netrunner_Detailliertes_Testkonzept_MVP_0_1_0_2.md`.

Aktuelle Releaseplanung hat Vorrang vor älteren Langfristskizzen: `docs/codex/CODEX_STATUS.md` nennt jeweils den aktuellen Gate-Stand und die gültigen Planungsartefakte. Für die Anschlussplanung nach V1.1.2 gilt `docs/derived/POST_V1_1_2_MECHANICS_AI_CARD_ROADMAP.md`. Sie hält V1.1.2 unverändert und ersetzt die ältere Idee eines isolierten späten `V1.7 AI v2` durch eine laufende Mechanik-/Karten-/KI-Spur ab V1.1.3.

Alte Konzeptdateien, Zwischenstände oder frühere Prompts dürfen nicht als gleichrangige Spezifikation verwendet werden.

## Arbeitsmodus

- Arbeite `wiki-first`.
- Beantworte Projektfragen zuerst aus dem vorhandenen Wissensbestand.
- Ziehe Rohquellen, Workspace-Dateien oder Webquellen nur dann nach, wenn die Wissensbasis Lücken hat, veraltet ist oder verifiziert werden muss.
- Wenn neue belastbare Erkenntnisse entstehen, die später wiederverwendbar oder entscheidungsrelevant sind, führe sie in die Wissensbasis zurück.
- Konkretes Ausführungswissen für wiederkehrende Abläufe gehört in passende Runbooks oder Prozessseiten.
- Vor weitreichender Wissenspflege die Einordnung im Chat transparent machen, sofern sie nicht offensichtlich oder ausdrücklich beauftragt ist.

## Sprachregeln

- Sichtbare UI-Texte und normale deutsche Wissensseiten verwenden echtes Deutsch mit Umlauten und `ß`.
- Der Benutzer wird im Chat und in direkt formulierten Anwendungstexten grundsätzlich mit `Du` angesprochen.
- Technische Dateinamen, Pfade, Code-Symbole, IDs, Markdown-Links und originale Quellzitate bleiben in ihrer technischen oder originalen Schreibweise.

## Verbindliche Netrunner-Prinzipien

- Engine-Korrektheit zuerst.
- Die Rules Engine ist die einzige Regelautorität.
- UI, Server, menschliche Spieler und KI dürfen nur `PlayerActions` einreichen, die aus `LegalActions` abgeleitet wurden.
- `applyAction` validiert Seite, actionId, stateVersion, Timingpunkt, Kosten, Ziele und Choices erneut.
- Keine verdeckten Kartendaten dürfen in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs oder Client-Fehlern leaken.
- Deterministisches Replay und StateHash sind Pflicht.
- Zufall läuft über Seed, RandomCounter und RandomDrawRecords.
- Kartenpool und offizielle Mechaniken werden nicht über den erklärten MVP-Scope hinaus erweitert.
- Keine offiziellen Artworks, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten in MVP 0.1 oder 0.2.
- Keine öffentlichen Plattformfunktionen, kein Matchmaking, keine Rankings, kein Deckbuilder, kein Accountsystem, keine Turnierfunktionen und kein breiter Kartenpool in MVP 0.1 oder 0.2.

## Stack-Defaults

- Node 24 LTS.
- pnpm Workspaces.
- TypeScript strict.
- Vitest.
- Next.js und React für die Web-UI, sobald die Umsetzung beginnt.
- Reines TypeScript-Engine-Paket ohne React-, Netzwerk-, Datenbank- oder KI-Abhängigkeiten.
- JSON oder SQLite für frühe MVPs; SQLite ist für MVP 0.2 bevorzugt.

## Workflow

- Erst Anforderungen, Daten, Szenarien und Testmatrix ableiten, dann implementieren.
- Subagents nur verwenden, wenn der Nutzer das ausdrücklich verlangt.
- Der Root-Agent besitzt finale Schreibrechte, sofern keine Worktrees oder klar getrennten Dateibereiche vereinbart wurden.
- Nicht von MVP 0.1 zu MVP 0.2 wechseln, bevor die MVP-0.1-Gates bestanden sind oder Blocker ausdrücklich dokumentiert wurden.
- In diesem Setup-Schritt keine Engine-, UI-, Server-, KI- oder Testimplementierung schreiben.

## Befehle

Die Repository-Skripte werden im Verlauf der Implementierung konkretisiert:

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Git-Modell

- Dieses Repository nutzt lokales Git ohne konfigurierten Remote.
- `main` ist der lokale Integrationsbranch.
- Laufende Arbeit erfolgt nach dem Initialstand auf Arbeitsbranches mit Präfix `codex/`.
- Kein Push und kein Pull Request, solange kein Remote eindeutig projektkonform konfiguriert ist.

## Daten und lokale Artefakte

- `data/rules`, `data/cards`, `data/decks`, `data/manifests`, `data/deviations` und `data/scenarios` sind versionierte Projektartefakte.
- Lokale Laufzeitdaten, SQLite-Dateien, temporäre Daten, Build-Artefakte, Caches und Secrets werden nicht versioniert.

## Abschlusskommandos

Wenn der Nutzer `Finito`, `Ende`, `Finale` oder `Endfinale` schreibt, gelten die globalen Abschlusskommandos aus dem Skill `abschlusskommandos`.

Lokaler Minimalkontrakt:

- `Finito` oder `Ende`: lokaler Abschluss ohne automatischen Merge und ohne automatischen Push; offene Änderungen prüfen, abgeschlossene Änderungen committen und offene Punkte kompakt benennen.
- `Finale`: zuerst lokaler Abschluss; wenn nichts Relevantes offen ist, lokal nach `main` integrieren.
- `Endfinale`: zuerst erweiterten Verify-Lauf ausführen; nur bei Erfolg `Finale` ausführen; danach Wissenspflege-, Status- und Restpunkteprüfung nachziehen.

## Done bedeutet

- Erforderliche abgeleitete Dokumente existieren.
- Jede Must-Anforderung hat Test- oder Szenarioabdeckung.
- Jede `playable_mvp` Karte hat Unit- und Szenarioabdeckung.
- Visibility-, Replay-, StateHash-, stale-action- und illegal-action-Tests bestehen.
- Build- und Testbefehle bestehen.
- Bekannte Abweichungen und offene Fragen sind dokumentiert.
