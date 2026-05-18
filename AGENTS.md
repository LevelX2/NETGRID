# AGENTS.md

## Projekt und Wissensbasis

Private NETGRID-Webapplikation für regelgeführtes NETGRID-Spiel.

Bei neuen Threads, neuen Aufgaben und Projektfragen zuerst wiki-first arbeiten. Die projektbezogene Wissensbasis liegt unter `KI-Wissen-NETGRID/`; falls lokal vorhanden, zusätzlich `AGENTS.local.md` lesen.

Pflicht-Einstieg für projektbezogene Arbeit:

1. `KI-Wissen-NETGRID/00 Projektstart.md`
2. `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
3. `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
4. `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`

Die Wissensbasis nennt den jeweils gültigen Status, die verbindliche Roadmap und die relevanten Quellen. Bei Konflikten gilt das dort als aktuell führend markierte Artefakt.

## Arbeitsmodus und Sprache

- Beantworte Projektfragen zuerst aus Wissensbasis, Status und aktiven Planungsartefakten.
- Ziehe Rohquellen, Workspace-Dateien oder Webquellen nur hinzu, wenn die Wissensbasis Lücken hat, veraltet ist oder verifiziert werden muss.
- Führe neue belastbare, wiederverwendbare oder entscheidungsrelevante Erkenntnisse in Wissensbasis, Runbooks oder Prozessseiten zurück.
- Dokumentiere relevante Prozess-, Architektur-, Gate- und Abschlussentscheidungen nach der Logregel der Wissensbasis.
- Sichtbare UI-Texte und normale deutsche Wissensseiten verwenden echtes Deutsch mit Umlauten und `ß`.
- Technische Dateinamen, Pfade, Code-Symbole, IDs, Markdown-Links und originale Quellzitate bleiben in ihrer technischen oder originalen Schreibweise.

## Coordinator und Rollenrouting

Bei jeder neuen projektbezogenen Anfrage klassifiziert der Coordinator die Anfrage, wählt genau einen primären Agenten aus und gibt die aktive Agentenvorgabe kurz aus:

```text
Aktiver Agent: <agent> (agents/<agent>.md)
```

Danach arbeitet Codex direkt nach dieser Agentendatei. Es ist keine separate Bestätigung nötig.

Wenn die Intention unklar ist oder mehrere Rollen mit nicht offensichtlichen Folgen passen, stellt der Coordinator genau eine kurze Klärungsfrage. Bei gemischten Anfragen wird ein primärer Agent gewählt; optionale Folgeagenten werden nur empfohlen.

Es gibt keine automatische Agent-Kette, keine implizite Übergabe an Folgeagenten und keine automatische Rollenumstellung während einer laufenden Aufgabe. Der Nutzer kann jederzeit einen anderen Agenten nennen oder zu `AGENTS.md` als Coordinator zurückwechseln.

## Agentenrouting

- Release-Zuschnitt, Prioritäten, Abhängigkeiten, Gates: `release-planning-agent` (`agents/release-planning-agent.md`).
- Kartenfreischaltung, Mechanikfolgen, KI-Verhalten: `card-enablement-ai-knowledge-agent` (`agents/card-enablement-ai-knowledge-agent.md`).
- Nutzerfunde, Playtest-Beobachtungen, Review-Findings und Ideen in kleine `docs/activities/`-Pakete vorsortieren: `activity-triage-agent` (`agents/activity-triage-agent.md`).
- Geplante Umsetzung in Code und Artefakten: `release-implementation-agent` (`agents/release-implementation-agent.md`).
- Kleine UI-/Text-/Interaktions-Korrekturen ohne Redesign: `small-adjustments-agent` (`agents/small-adjustments-agent.md`).
- Strukturqualität, technische Schulden, Schichtgrenzen: `architecture-review-agent` (`agents/architecture-review-agent.md`).
- Testlücken, Regression-Schutz, Teststrategie: `test-quality-agent` (`agents/test-quality-agent.md`).

Eine kompakte Rollenübersicht liegt in `agents/README.md`.

## Verbindliche NETGRID-Prinzipien

- Engine-Korrektheit zuerst.
- Die Rules Engine ist die einzige Regelautorität.
- UI, Server, menschliche Spieler und KI dürfen nur `PlayerActions` einreichen, die aus `LegalActions` abgeleitet wurden.
- `applyAction` validiert Seite, actionId, stateVersion, Timingpunkt, Kosten, Ziele und Choices erneut.
- Keine verdeckten Kartendaten dürfen in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs oder Client-Fehlern leaken.
- Deterministisches Replay und StateHash sind Pflicht.
- Zufall läuft über Seed, RandomCounter und RandomDrawRecords.
- Kartenpool, Mechaniken und Produktfunktionen werden nur über den aktuell gültigen Release- und Gate-Stand erweitert.
- Keine offiziellen Artworks, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten ohne eigenes Asset-/Rechts-Gate.
- Agentendateien dürfen diese globalen NETGRID-Prinzipien konkretisieren, aber nicht abschwächen.

## Git und lokale Artefakte

- `main` ist der lokale Integrationsbranch.
- Arbeiten auf `main` ist erlaubt, wenn die Änderung klein und nicht kollisionskritisch ist.
- Bei erwarteter Parallelität auf derselben Datei oder potenziellen Kollisionen arbeitet der Thread mit einem separaten Branch mit Präfix `codex/` (z. B. für mehrere aktive Änderungsstränge).
- Andere Threads dürfen bereits eigene Commit-Stände haben; wir richten den Fokus auf Konflikte gezielt im Integrationspunkt (`main`) aus.
- Remote `origin` ist konfiguriert; Pushes, Pull Requests und Remote-Integrationen erfolgen nur auf Nutzerwunsch oder über die dafür vorgesehenen Abschluss-/GitHub-Workflows.
- Lokale Laufzeitdaten, SQLite-Dateien, temporäre Daten, Build-Artefakte, Caches und Secrets werden nicht versioniert.

## Lokaler Start- und Serverbetrieb

- Lokale NETGRID-App, Webclient und Multiplayer-Backend werden standardmäßig über `scripts/start-netgrid.ps1` gestartet.
- Agenten starten Server oder Webclient nicht direkt über rohe `pnpm`, `tsx`, `next dev` oder eigene `Start-Process`-Kommandos, wenn das Ziel der normale lokale Betrieb ist.
- Das Startscript setzt die verbindlichen LAN-/Origin-/URL-Umgebungsvariablen, insbesondere `NETGRID_PUBLIC_HOST`, `NETGRID_WEB_BASE_URL`, `NETGRID_SERVER_BASE_URL`, `NETGRID_ALLOWED_ORIGINS` und `NEXT_PUBLIC_NETGRID_SERVER_URL`.
- Direkte Prozessstarts sind nur für isolierte Tests, gezielte Diagnose oder bewusst abweichende Experimente zulässig; dann müssen sie im Chat ausdrücklich als Abweichung benannt und danach wieder auf den Script-Startpfad zurückgeführt werden.

## Abschlusskommandos

Wenn der Nutzer `Finito`, `Ende`, `Finale` oder `Endfinale` schreibt, gelten die globalen Abschlusskommandos aus dem Skill `abschlusskommandos`.

Lokaler Minimalkontrakt:

- `Finito` oder `Ende`: lokaler Abschluss ohne automatischen Merge und ohne automatischen Push; offene Änderungen prüfen, abgeschlossene Änderungen committen und offene Punkte kompakt benennen.
- `Finale`: zuerst lokaler Abschluss; wenn nichts Relevantes offen ist, lokal nach `main` integrieren.
- `Endfinale`: zuerst erweiterten Verify-Lauf ausführen; nur bei Erfolg `Finale` ausführen; danach Wissenspflege-, Status- und Restpunkteprüfung nachziehen.
