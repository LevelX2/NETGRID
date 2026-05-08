# Event Modification 1.2.0 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.2.0-Vertrag für Event Modification. Sie beschreibt die erlaubte Pipeline für `would`, `prevent`, `avoid` und eng geführte `interrupt`-Fenster.

Replacement Effects gehören nicht zu dieser Spezifikation.

## Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Imminent Event | Ein Ereignis, das die Engine anwenden würde, aber noch nicht final aufgelöst hat. |
| Would Window | Zeitpunkt, an dem die Engine ein imminent event bekannt genug gemacht hat, um Modifikationen zu prüfen. |
| Prevention | Verhindert einen Teil oder den gesamten Effekt, ohne ein neues Ersatzereignis zu erzeugen. |
| Avoid | Vermeidet ein Ereignis vollständig oder verhindert, dass es eintritt. |
| Interrupt | Enges Vorauflösungsfenster, das vor dem Event eingreift, aber nicht ersetzt. |
| Replacement | Ersetzt ein Ereignis durch ein anderes; ausdrücklich V1.2.1. |

## Pipeline

1. Engine erzeugt ein `ImminentEvent`.
2. Engine klassifiziert `eventType`, Quelle, betroffene Seite, Payload und Visibility.
3. Engine sammelt Kandidaten nur aus freigegebenen V1.2.0-Mechaniken.
4. Gibt es keine Kandidaten, löst die Engine das Event unverändert auf.
5. Gibt es genau einen optionalen oder deterministisch geordneten Kandidaten, öffnet die Engine ein PendingChoice-Fenster.
6. Der berechtigte Controller wählt `apply` oder `pass` über LegalActions.
7. `applyAction` revalidiert Event-ID, Kandidat, Kosten, Ziele, Choices und StateVersion.
8. Engine schreibt EventLog-Einträge für Window, Entscheidung und Ergebnis.
9. Engine löst das endgültige Event auf oder markiert es als prevented/avoided/interrupted.
10. Replay rekonstruiert dieselbe Sequenz aus EventLog und PlayerActions.

## Event-Typen für V1.2.0

| Eventfamilie | V1.2.0-Status | Pilotstatus |
| --- | --- | --- |
| Damage | freigegeben für Prevention-Pilot | bevorzugt |
| Tag | freigegeben als Avoid-Alternativpilot | nur bei Damage-Blocker |
| Run | nur als enger Avoid-/Interrupt-Alternativpilot | hohe Vorsicht |
| Access | nicht freigegeben für V1.2.0 | V1.2.1+ |
| Trash/Steal | nicht freigegeben für V1.2.0 | V1.2.1+ |
| Replacement aller Typen | nicht freigegeben | V1.2.1 |

## Candidate-Vertrag

Ein Event-Modification-Kandidat braucht:

- eindeutige `candidateId`,
- `eventId`,
- `kind: "prevent" | "avoid" | "interrupt"`,
- berechtigte Seite,
- sichtbare Kosten/Choices für die berechtigte Seite,
- `sourceRef` mit Redaction-Regeln,
- deterministische Sortierung,
- eindeutigen Outcome.

Konflikte:

- Mehrere Kandidaten ohne klare Reihenfolge blockieren sichtbar.
- Mehrere private Kandidaten unterschiedlicher Seiten sind in V1.2.0 nicht unterstützt.
- Pflichtentscheidungen ohne Pass-Option sind nur erlaubt, wenn ihre Pflicht aus dem freigegebenen Mechanikvertrag kommt.

## EventLog-Vertrag

V1.2.0 plant diese logischen EventLog-Kategorien:

| Kategorie | Inhalt | Sichtbarkeit |
| --- | --- | --- |
| `event_would` | Eventtyp, öffentliche Quelle, redigierte Payload | side-sicher/public nach Eventtyp |
| `event_modification_window_opened` | Window-ID, berechtigte Seite, redigierte Kandidatenanzahl | public oder side-private |
| `event_modification_passed` | Pass/No-op gewählt | public, wenn das Fenster public ist; sonst side-private |
| `event_modification_applied` | Kandidat angewandt, redigierte Kosten und Outcome | nach Visibility-Klasse |
| `event_prevented` | verhinderter Betrag/Anteil | public oder hidden barrier je Event |
| `event_avoided` | vermiedenes Event | public oder side-private je Event |
| `event_interrupted` | Interrupt-Ergebnis | public oder side-private je Event |
| `event_resolved` | endgültiges Event | bestehende Event-Visibility |

EventLog darf für Replay vollständige interne IDs enthalten, solange PublicEvents, PlayerViews, WebSocket, Reconnect, Undo-Preview, Logs und KI-Inputs redigiert bleiben.

## Damage-Prevention-Pilot

### Eingang

Ein Damage-Event wird imminent, bevor RandomDrawRecords oder konkrete Handkarten-Trash-Auswahl erzeugt werden.

### Prevention

Ein freigegebener Prevention-Kandidat darf:

- Damage-Betrag auf 0 oder einen niedrigeren Wert reduzieren,
- nur den freigegebenen Damage-Typ betreffen,
- Kosten oder Choices verlangen, wenn diese engine-seitig revalidiert werden,
- keine konkrete zufällige Karte kennen, bevor Damage final ausgeführt wird.

### Ergebnis

- Bei vollständiger Prevention entstehen keine RandomDrawRecords für verhinderten Damage.
- Bei teilweiser Prevention entstehen RandomDrawRecords nur für den Restbetrag.
- Flatline-Prüfung läuft erst nach finalem Damage-Ergebnis.

## Avoid-Alternativpilot

Tag-Avoid ist der bevorzugte Alternativpilot. Ein Tag-Avoid-Kandidat darf ein imminent `add_tag`-Event vermeiden, wenn:

- das Event öffentlich oder für die betroffene Seite sichtbar ist,
- Kosten/Choices aus LegalActions kommen,
- EventLog `would`, `avoid` und endgültiges Ergebnis abbildet,
- KI legal passen kann.

Run-Avoid ist nur test-only zulässig und darf keinen Access, kein Breach-Replacement und keine neuen Run-Timingfamilien einführen.

## Visibility-Vertrag

- Die berechtigte Seite sieht ihre verfügbaren Modifikationsoptionen.
- Die Gegenseite sieht nur, was nach Eventtyp öffentlich sein darf.
- Nicht sichtbare Quellen werden als generische Modifikationsquelle redigiert.
- PendingChoice in PlayerView ist die einzige UI-Quelle für Optionen.
- PublicEvents dürfen keine verdeckten Kartentitel, DefinitionIds, Instanz-IDs oder nicht sichtbaren Kostenoptionen enthalten.

## Undo-Vertrag

| Situation | Undo-Verhalten |
| --- | --- |
| Vor dem Would-Fenster | Bestehende Undo-Regeln. |
| Während PendingChoice | Kein Undo über konkurrierende offene Entscheidung; Action erst resolve/pass. |
| Nach öffentlichem Pass ohne Hidden Info | Undo nach bestehenden Regeln möglich. |
| Nach privater Modifikation oder Information | Hidden-Info-Barriere blockiert Undo. |
| Nach Damage-Randomness | Undo blockiert wie bestehender Damage-Pfad. |

## KI-Vertrag

KI muss:

- LegalActions verwenden,
- Choice-Kind erkennen,
- bei unbekanntem Kandidaten legal passen,
- `AiDecisionDebug` redigiert ausgeben,
- bei Zeitbudgetüberschreitung eine legale Fallback-Action wählen.

KI darf nicht:

- private gegnerische Kandidaten kennen,
- Event Modification selbst vorschlagen,
- nicht `ai_supported` Karten strategisch nutzen,
- aus FullState oder Logs lesen.

## No-Scope-Prüfung

Ein V1.2.0-Implementation Review muss ausdrücklich bestätigen:

- keine Replacement Effects,
- keine neuen Runtime-Karten,
- keine KI-Deckfreigabe,
- keine Special Zones oder Control,
- keine öffentlichen Plattformfunktionen,
- keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.
