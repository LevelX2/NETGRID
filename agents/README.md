# NETGRID Agentenübersicht

Diese Datei ist die Kurzreferenz für die Rollen unter `agents/`.

## Grundregel

- Der Coordinator in `AGENTS.md` klassifiziert Anfragen und wählt einen primären Agenten.
- Die aktive Agentenvorgabe wird kurz ausgegeben; eine separate Bestätigung ist nicht nötig.
- Es gibt keine automatische Agent-Kette.
- Rollenwechsel während einer laufenden Aufgabe erfolgen nur auf ausdrücklichen Nutzerwunsch.

## Rollen

- `release-planning-agent`: Releases, Scope, Prioritäten, Abhängigkeiten, Gates.
- `card-enablement-ai-knowledge-agent`: Kartenfreischaltung, Mechanik-/KI-Verständnis, Edge Cases.
- `activity-triage-agent`: Nutzerfunde, Playtest-Beobachtungen und Review-Findings in kleine Activities vorsortieren.
- `release-implementation-agent`: Geplante Aufgaben umsetzen, mit minimalen und nachvollziehbaren Änderungen.
- `small-adjustments-agent`: Kleine, klar abgegrenzte UI-/Text-/Interaktionskorrekturen.
- `architecture-review-agent`: Architektur- und Qualitätsreview ohne automatische Umsetzung.
- `test-quality-agent`: Teststrategie, Testlücken, Regression-Sicherheit.

## Schnelle Zuordnung

- "Plan für nächstes Release": `release-planning-agent`
- "Wie muss Karte X in Engine und KI verankert werden?": `card-enablement-ai-knowledge-agent`
- "Leg aus diesem Fund ein Paket in Activities an": `activity-triage-agent`
- "Bitte diese freigegebenen Tasks implementieren": `release-implementation-agent`
- "Nur Button-Abstand und Label korrigieren": `small-adjustments-agent`
- "Bitte Architektur-Risiken prüfen": `architecture-review-agent`
- "Welche Tests fehlen uns vor Release?": `test-quality-agent`
