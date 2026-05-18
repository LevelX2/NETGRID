# V1.5.0 Detailed Plan - Private Replay, Analyse und Lernhilfe

Stand: 2026-05-08
Status: detailgeplant

## Ziel

V1.5.0 ist der erste konkrete Slice der V1.5.x-Familie. Er stellt private lokale Replays mit StateHash-Verifikation, side-sicheren Perspektiven und begrenzter Analyse bereit.

## Reihenfolge im Release

1. V1.4.3-Final Review und Report-Artefakte lesen.
2. Replay-Index und Replay-Metadaten definieren.
3. Replay-Timeline mit StateHash-Prüfung spezifizieren.
4. side-sichere Runner-, Corp- und lokale Analyseperspektiven trennen.
5. DecisionDebug-Kontextualisierung aus V1.4.x einbinden.
6. lokalen Replay-Export ohne Tokens, Sessions, private Pfade und nicht erlaubte Hidden Info definieren.
7. Exploit-Export als Testfallkandidat planen.
8. UI-Ansichten für Replay-Liste und Timeline bauen.
9. Redaction-, StateHash-, Browser- und Export-Gates prüfen.
10. Implementation Review und Final Review erstellen.

## Produkt- und Feature-Ziele

- Private Partien werden nachvollziehbar.
- StateHash ist pro Replay-Schritt prüfbar.
- Analyse bleibt Beratung und Diagnose, nicht Regelautorität.
- KI-DecisionDebug kann nachträglich verstanden werden.

## Mechanik-, Karten- und Effektgrenzen

V1.5.0 zeigt bestehende Events; es erweitert keine Engine-Regel.

Zulässig:

- Replay-Timeline für bestehende Eventfamilien.
- Perspektivwechsel mit side-sicherer Redaction.
- lokale Analyse über sichtbare Daten.
- Export lokaler Replays ohne Secrets.

Nicht zulässig:

- Public Replay.
- Spectator.
- Cloud Sync.
- neue Karten-/Mechanikfreigabe.
- Live-Coaching.
- LLM-Spielzugerzeugung.

## KI-Arbeit

Aufnehmen:

- DecisionDebug im Replay anzeigen.
- Planwahl, Scores, Fallbacks und Timeouts kontextualisieren.
- Exploit-Kandidaten aus Replays markieren.

Nicht aufnehmen:

- automatische KI-Tuning-Änderung aus Replay-Analyse.
- Coaching mit verdeckten Informationen.
- LLM als Live-Akteur.

## Erwartete Artefakte nach Umsetzung

- Replay-Index-/Metadatenformat.
- Replay-Timeline-UI oder gleichwertige Oberfläche.
- Replay-Exportformat.
- Replay-Analyse-/DecisionDebug-Report.
- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/implementation-review.md`.
- `docs/releases/v1/v1-5-0-private-replay-analysis-learning/final-review.md`.

## Done

- Private Replays sind lokal nutzbar.
- StateHash ist nachvollziehbar.
- Runner-/Corp-Perspektiven leaken nicht.
- Export enthält keine Tokens, Sessions, lokalen Pfade oder unzulässige Hidden Info.
