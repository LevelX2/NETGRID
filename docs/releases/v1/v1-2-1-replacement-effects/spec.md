# Replacement Effects 1.2.1 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.2.1-Vertrag für Replacement Effects. Replacement ersetzt ein Originalevent durch ein Replacementevent. Es ist nicht Prevention, nicht Avoid und nicht Interrupt.

## Grundsatz

Ein Replacement muss für Replay, StateHash und Review immer zwei Dinge nachvollziehbar machen:

1. Welches Originalevent wäre eingetreten?
2. Welches Replacementevent ist stattdessen eingetreten?

## Pipeline

1. Engine hat ein `OriginalEvent` als imminent event.
2. Engine prüft Replacement-Kandidaten getrennt von Prevention/Avoid/Interrupt.
3. Engine erzeugt ein `ReplacementWindow`.
4. Engine sortiert Kandidaten deterministisch.
5. Bei optionalem Kandidaten entsteht PendingChoice.
6. Controller wählt Apply oder Pass über LegalAction.
7. `applyAction` revalidiert Window-ID, Originalevent-ID und Candidate-ID.
8. Bei Apply wird das Originalevent als replaced markiert.
9. Engine erzeugt genau ein Replacementevent.
10. Engine löst das Replacementevent nach freigegebenen Folgefenstern auf.
11. EventLog und Replay enthalten Originalevent, Replacemententscheidung und Replacementevent.

## Abgrenzung zu V1.2.0

| Mechanik | Wirkung | V1.2.0 | V1.2.1 |
| --- | --- | --- | --- |
| Prevention | reduziert/verhindert Wirkung ohne Ersatzevent | ja | nicht erweitert |
| Avoid | vermeidet Ereignis | ja | nicht erweitert |
| Interrupt | greift vor Auflösung ein | ja, eng | nicht erweitert |
| Replacement | ersetzt Originalevent durch anderes Event | nein | ja |

## EventLog-Vertrag

| Kategorie | Inhalt | Sichtbarkeit |
| --- | --- | --- |
| `replacement_window_opened` | Window-ID, Originalevent-Referenz, redigierte Kandidateninformationen | side-sicher |
| `replacement_passed` | Pass für optionales Replacement | je Fenster sichtbar |
| `replacement_applied` | Candidate-ID, redigierte Quelle, Originalevent-ID, Replacementevent-ID | nach Visibility-Klasse |
| `original_event_replaced` | Originalevent wurde nicht angewandt | replayfähig, public redigiert |
| `replacement_event_created` | Ersatzeventtyp und redigierte Payload | nach Eventtyp |
| `replacement_conflict_blocked` | Konflikt blockiert | public oder side-private ohne Hidden Info |

Replay darf interne IDs nutzen. PublicEvents müssen verdeckte Quellen und Payloads redigieren.

## Einmal-pro-Fenster

Regeln:

- Jeder `ReplacementCandidate` kann pro `ReplacementWindow` höchstens einmal angewandt werden.
- Ein Replacementevent eröffnet nicht automatisch dasselbe ReplacementWindow erneut.
- Rekursive Replacement-Ketten sind in V1.2.1 gesperrt, außer ein Testfall gibt eine eindeutige endliche Kette frei.
- Die Engine speichert verbrauchte Candidate-IDs im Window oder EventLog.

## Reihenfolge und Konflikte

Deterministische Sortierung:

1. explizite `priority`,
2. `controller` in engine-definierter stabiler Reihenfolge,
3. `sourceRef.instanceId`,
4. `candidateId`.

Konfliktblocker:

- gleiche Priorität mit sich widersprechenden Outcomes,
- Kandidaten unterschiedlicher Seiten, deren Reihenfolge fachlich nicht spezifiziert ist,
- Replacementevent würde eine nicht freigegebene Mechanikfamilie starten,
- Candidate würde Hidden Info der Gegenseite für die Entscheidung benötigen,
- Candidate wurde im selben Fenster bereits verbraucht.

Konflikte werden sichtbar blockiert. Die Engine darf nicht still einen Kandidaten raten.

## Pilotfamilien

### Damage Replacement

Bevorzugter Pilot. Das Originalevent ist ein Damage-Event. Das Replacementevent ist ein klar anderes, bereits engine-seitig unterstütztes oder test-only definiertes Event, z. B. ein Tag-Event.

Pflichten:

- Original-Damage erzeugt keine RandomDrawRecords, wenn ersetzt.
- Replacementevent erzeugt eigene EventLog- und StateHash-Spur.
- Flatline-Prüfung des Original-Damage läuft nicht, wenn Damage ersetzt wurde.

### Access Replacement

Für V1.2.1 geprüft, aber nicht Primärpilot.

Blocker:

- Access-Queue und Hidden-Info-Barrieren sind hochsensibel.
- Replacement darf keine künftigen HQ/R&D/Archives-Informationen leaken.
- Access-Replacement braucht eigene Pilotfreigabe vor Kartenstatusänderung.

### Trash Replacement

Für V1.2.1 geprüft, aber nicht Primärpilot.

Blocker:

- Zielzone und ursprünglicher Controller müssen exakt sein.
- Host-/Trash-Kaskaden und Archives/Heap müssen side-sicher bleiben.
- Trash-Replacement darf keine Special-Zone-Arbeit miterledigen.

### Steal Replacement

Für V1.2.1 geprüft, aber nicht Primärpilot.

Blocker:

- Agenda-Punkte, Score Area und Game-End können betroffen sein.
- Replacement darf keine Agenda-Identität vor erlaubtem Access leaken.
- Steal-Replacement braucht eigene Szenarien und Game-End-Regression.

## Visibility-Vertrag

- Originalevent ist nur so sichtbar, wie es ohne Replacement sichtbar wäre.
- Replacementoptionen sind nur für berechtigte Seite sichtbar.
- Replacementevent ist nach seiner eigenen Sichtbarkeitsklasse sichtbar.
- PublicEvents dürfen nicht verraten, dass eine verdeckte Karte eine Replacementoption hatte, solange diese Information nicht legal sichtbar ist.

## Undo-Vertrag

| Situation | Undo-Verhalten |
| --- | --- |
| Vor ReplacementWindow | Bestehende Undo-Regeln. |
| Offenes ReplacementWindow | Keine konkurrierende Undo-Bewegung über das offene Fenster. |
| Pass ohne Hidden Info | Undo nach bestehenden Regeln möglich. |
| Apply mit privater Quelle | Hidden-Info-Barriere. |
| Replacementevent mit Randomness oder Reveal | Undo blockiert nach bestehender Hidden-Info-/Randomness-Regel. |

## KI-Vertrag

KI darf:

- LegalAction wählen,
- Pass/Fallback nutzen,
- `AiDecisionDebug` mit side-sicherer Original-/Replacement-Zusammenfassung schreiben.

KI darf nicht:

- nicht sichtbare Replacement-Kandidaten kennen,
- Replacement strategisch bewerten, wenn Mechanik oder Karte nicht `ai_supported` ist,
- FullState, Debug-Dumps oder gegnerische Hidden Cards nutzen.

## No-Scope-Prüfung

Ein V1.2.1-Implementation Review muss ausdrücklich bestätigen:

- keine neue Runtime-Karte,
- keine KI-Deckfreigabe,
- keine Prevention/Avoid-Ausweitung,
- keine Special-Zone-/Control-Arbeit,
- keine öffentlichen Plattformfunktionen,
- keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.
