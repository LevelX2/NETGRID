---
activityId: act-2026-07-26-ai-preview-session-redaction-hardening
status: inbox
kind: fix
area: server
priority: hotfix
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-07-26
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# KI-Preview gegen Hidden-Info-Leaks in Spieler-Sessions härten

## Ziel

Der sessiongebundene KI-Preview-Pfad darf einer Spieler- oder
Beobachtersession keine privaten Informationen der anderen Seite liefern.
Vollständige lokale KI-Analyse bleibt, falls weiter benötigt, ausschließlich
an den bestehenden Maintenance-/Diagnosevertrag gebunden.

## Kontext und Quellen

- Workspace-Prüfung vom 2026-07-26 zur Nutzeridee eines KI-Vorschlags für die
  menschliche Seite.
- `apps/server/src/multiplayer.ts`: `previewAi` authentifiziert eine
  Matchsession, wählt derzeit über `aiControllableSide` die aktive KI-Seite
  und ergänzt das Ergebnis mit `withAiPrivateHandPreview`.
- `apps/server/src/multiplayer.test.ts`: Der bestehende Preview-Test erwartet
  für eine menschliche Runner-Session ausdrücklich
  `detail.aiPrivateHandPreview` der Korp-KI einschließlich Kartentiteln,
  Definition-IDs und Regeltext.
- `apps/server/src/http-server.ts`: `/api/matches/:matchId/ai-preview` ist eine
  normale sessiongebundene Matchroute und keine Maintenance-authentifizierte
  Diagnosefläche.
- `apps/web/features/debug/AiDecisionDebugOverlay.tsx`: Das
  KI-Bewertungsfenster kann die Preview inklusive Aktionsalternativen anzeigen
  und exportieren.
- `docs/architecture/ai/ai-decision-trace-contract-2026-05-22.md` klassifiziert
  vollständige KI-Diagnosedaten als lokale private Maintenance-Datenklasse,
  nicht als normale Spieleransicht.
- `docs/architecture/ai/coaching-boundary-spec-2026-05-17.md` erlaubt
  Coaching-/Preview-Daten nur aus der Perspektive der anfragenden Seite.
- Follow-up zu
  `docs/activities/done/act-2026-06-04-ai-decision-debug-overlay.md`.

## Scope

- Den Preview-Vertrag explizit in `requesterSide` und `targetSide` trennen.
- Auf der normalen Matchroute nur eine Vorschau für die authentifizierte
  eigene Seite zulassen:
  - `targetSide === requesterSide`;
  - die Zielseite besitzt im aktuellen Zustand die maßgeblichen
    `LegalActions`;
  - `knownStateVersion` und `knownMatchVersion` werden weiter geprüft.
- `aiPrivateHandPreview`, private Hand-/Deckinhalte und Aktionsalternativen,
  die verdeckte Karten der Gegenseite identifizieren, aus jeder
  gegnerperspektivischen Spieler-/Beobachterantwort entfernen.
- Falls eine vollständige Vorschau der aktiven KI-Seite für lokale Analyse
  erhalten bleiben soll, sie nur hinter den bestehenden lokalen
  Maintenance-/Diagnosezugriff verschieben und nicht über eine normale
  Matchsession freigeben.
- Die Webansicht an den gehärteten Vertrag anpassen. Eine nicht berechtigte
  Gegner-KI-Vorschau darf weder automatisch geladen noch als exportierbarer
  Inhalt angeboten werden.
- Bestehende Redaction-Prüfung auf semantische Hidden-Info-Fälle erweitern;
  ein reiner Schlüsselwortscan reicht für erlaubte Feldnamen mit unerlaubten
  Kartendaten nicht aus.

## Nicht im Scope

- Keine Änderung an KI-Scoring, Planwahl, Deckstrategie oder
  Difficulty-Profilen.
- Keine Änderung an `LegalActions`, `applyAction`, Engine-Regeln, Replay,
  StateHash, Seed, `RandomCounter` oder `RandomDrawRecords`.
- Keine allgemeine Freigabe von KI-Debugdaten für Public-, Spectator-,
  Replay-, Moderations- oder Accountflächen.
- Keine Umsetzung des menschlichen KI-Vorschlags aus
  `act-2026-07-26-human-side-ai-decision-probe`.

## Akzeptanzkriterien

- [ ] Eine menschliche Runner-Session erhält aus dem Match-Preview-Pfad weder
      Korp-HQ-Kartentitel noch andere private Korp-Daten.
- [ ] Eine menschliche Korp-Session erhält weder Runner-Grip-/Stack-Kartentitel
      noch andere private Runner-Daten.
- [ ] Eine KI-vs-KI-Beobachtersession erhält über die normale Matchroute keine
      private Hand, Deckliste oder verdeckte Aktionsquelle einer KI-Seite.
- [ ] Fremdseitige `targetSide`-Anfragen scheitern fail-closed mit einer
      side-sicheren Fehlermeldung.
- [ ] Eigenseitige Preview-Antworten enthalten nur Daten, die aus der
      authentifizierten `PlayerView`, ihren `LegalActions`, erlaubten
      `PublicEvents` und side-sicherem `DecisionDebug` ableitbar sind.
- [ ] Sentinel-Tests mit eindeutig benannten verdeckten Karten beweisen, dass
      deren Titel, Definition-IDs und Instanz-IDs nicht in JSON-Antwort oder
      DOM der Gegenperspektive erscheinen.
- [ ] Preview-Aufrufe verändern weder Eventlog noch `stateVersion`,
      `matchVersion`, StateHash, Zufallszähler oder KI-Memory.
- [ ] Server-, Web- und Hidden-Info-Checks sowie `git diff --check` sind grün.

## Umsetzungshinweise

- Den Spielerpfad lieber vollständig requester-relativ projizieren, statt
  einzelne bekannte Felder aus einem gegnerseitigen Debugobjekt
  herauszufiltern.
- Auch `actionAlternatives`, `sourceTitle`, Labels, Choices und Planbezüge
  können verdeckte Karten verraten; nicht nur `aiPrivateHandPreview` prüfen.
- Maintenance-Zugriff und Matchsession bleiben getrennte Autoritätsklassen.
- Dieses Paket ist wegen des belegten Hidden-Info-Risikos `hotfix` und soll vor
  der Erweiterung des Preview-Pfads bearbeitet werden.

## Ergebnisnotiz

Noch offen.
