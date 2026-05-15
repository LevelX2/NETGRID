# AI Deck Doctrine Requirements

Stand: 2026-05-15  
Status: requirements freeze für den ersten Corp-MVP

## Scope

Der erste Umsetzungsschnitt führt eine eigene Deck-Doktrin-Projektion für KI-Spieler ein. Der MVP ist Corp-fokussiert und darf Runner-Datenmodell und Generatorlogik nur so weit vorbereiten, wie sie für gemeinsame Typen, Tests und spätere Erweiterung nötig sind.

## Must

| ID | Anforderung | Akzeptanzkriterium |
| --- | --- | --- |
| AIDD-MUST-001 | Eigene Deckdoktrin | Die KI kann aus dem eigenen validierten Decksnapshot und AI-Hints ein deterministisches `AiDeckDoctrineProfile` berechnen. |
| AIDD-MUST-002 | Side-Safety | Das Profil darf nur für das eigene Deck in den KI-Input gelangen. Gegnerische private Decklisten, Deckreihenfolgen und Hidden-State-Felder bleiben ausgeschlossen. |
| AIDD-MUST-003 | Corp-Archetypen | Corp-Profile unterscheiden mindestens `rush`, `glacier`, `tag_pressure`, `asset_remote`, `operation_economy` und `central_defense`. |
| AIDD-MUST-004 | Plan-Gewichtung | Die Corp-Planbewertung nutzt Doktrin-Gewichte, ohne harte Agenda-Schutzregeln zu übersteuern. |
| AIDD-MUST-005 | Agenda-Schutz | Agenda-Installationen in neue nackte Außenserver bleiben deutlich negativ, auch wenn die Deckdoktrin `rush` ist. |
| AIDD-MUST-006 | Corp-Mulligan | Setup-Mulligan-Choices der Corp nutzen Starthandscore aus ICE, Economy, Agenda-Last, Remote-Plan und Doktrin-Passung. |
| AIDD-MUST-007 | Debug-Redaction | `DecisionDebug` darf Doktrin-Tags, Confidence und aggregierte Evidenz nennen, aber keine Deckliste, Deckreihenfolge oder gegnerischen privaten Karten. |
| AIDD-MUST-008 | Determinismus | Gleiches Deck, gleicher State und gleicher Seed erzeugen dieselbe Doktrin und dieselbe KI-Entscheidung. |
| AIDD-MUST-009 | Fallback | Fehlt ein Decksnapshot, spielt die KI mit neutraler Doktrin weiter und bleibt legal. |
| AIDD-MUST-010 | Regression | Bestehende Corp-Remote-Scoring-Regressionen bleiben grün und werden um Doktrinfälle ergänzt. |

## Should

| ID | Anforderung | Akzeptanzkriterium |
| --- | --- | --- |
| AIDD-SHOULD-001 | Runner-Vorbereitung | Der Generator kann Runner-Profile erzeugen, ohne sie im ersten MVP bereits tief in die Runner-Planbewertung einzubauen. |
| AIDD-SHOULD-002 | Confidence | Profile erhalten `confidence` und `riskFlags`, wenn AI-Hints fehlen oder nicht `ai_supported` Karten enthalten sind. |
| AIDD-SHOULD-003 | Selfplay-Metriken | Nackte Agenda-Installationen, verpasste Score-Fenster und Economy-Stalls werden als spätere Metrik-Kandidaten dokumentiert. |

## Out of Scope

- keine neuen Kartenfreigaben.
- keine neue Engine-Regel.
- keine Gegnerdeckanalyse aus privaten Daten.
- keine Deckreihenfolge als KI-Input.
- kein FullState-Lookahead.
- keine automatische Gewichtungsoptimierung ohne Review.

## Done-Gate

- Requirements und Testmatrix sind versioniert.
- `@netgrid/ai` Tests sind grün.
- `@netgrid/ai` Typecheck ist grün.
- Workspace-Typecheck ist grün.
- Hidden-Info-Leak-Strings bleiben in KI-Input/Debug verboten.
