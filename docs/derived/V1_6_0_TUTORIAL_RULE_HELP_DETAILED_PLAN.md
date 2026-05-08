# V1.6.0 Detailed Plan - Tutorial und Regelhilfe

Stand: 2026-05-08
Status: detailgeplant

## Ziel

V1.6.0 ist der erste konkrete Slice der V1.6.x-Familie. Er macht Kernabläufe lernbarer, ohne Tutorial, Hilfe, KI oder LLM zur Regelautorität zu machen.

## Reihenfolge im Release

1. V1.5.0-Final Review lesen.
2. Tutorial-Szenarioformat definieren.
3. erste Kernablauf-Szenarien auswählen.
4. Regelhilfe-Glossar aus projektinternen Begriffen ableiten.
5. Kontext-Hilfe für LegalActions planen.
6. Tutorialmodus von normalen Matches trennen.
7. Tutorial-Replays mit StateHash prüfen.
8. KI-Sparring im Tutorial nur über bestehende LegalAction-KI anbinden.
9. Hidden-Info- und Content-Redaction testen.
10. Implementation Review und Final Review erstellen.

## Produkt- und Feature-Ziele

- Neue oder eingerostete Spieler können Kernabläufe üben.
- UI erklärt die nächste legale Entscheidung, ohne Spielzüge zu erfinden.
- Tutorials sind deterministisch und replaybar.
- Fachbegriffe bleiben deutsch und projektkonform.

## Tutorial-Scope V1.6.0

Erste Lektionen:

- Spielstart und Mulligan.
- Klicks, Credits und Karten ziehen.
- Run auf zentralen Server.
- Encounter, Rez, Breaker und End the Run.
- Access, Steal und Score.
- Damage/Flatline als geführter Sonderfall.
- Tags und Resource-Trash nur mit bereits freigegebenen Szenarien.

Nicht in V1.6.0:

- vollständige Regelschule.
- alle Mechaniken.
- alle Karten.
- Public Onboarding.
- Account-Tutorialfortschritt.
- breite Accessibility-Vollabdeckung.

## Mechanik-, Karten- und Effektgrenzen

Tutorials verwenden nur bereits freigegebene Karten, Mechaniken und Szenarien. Keine Tutorialkarte darf nur für Lernzwecke heimlich spielbar werden.

## KI-Arbeit

Zulässig:

- einfache KI als Sparringsgegner.
- KI-Erklärungen aus sichtbaren DecisionDebug-Gründen.
- absichtlich einfache Linien über Difficulty-Profil, solange LegalActions genutzt werden.

Nicht zulässig:

- KI mit Hidden-Info-Vorteil.
- LLM als Action-Erzeuger.
- Hilfe, die illegale Aktionen empfiehlt.

## Erwartete Artefakte nach Umsetzung

- Tutorial-Szenarioformat.
- erste Tutorial-Szenarien.
- Regelhilfe-/Glossar-Artefakt.
- Tutorial-Replay-/StateHash-Nachweis.
- `docs/derived/V1_6_0_IMPLEMENTATION_REVIEW.md`.
- `docs/derived/V1_6_0_FINAL_REVIEW.md`.

## Done

- Erste Kernabläufe sind spielbar lernbar.
- Tutorials sind replaybar und StateHash-geprüft.
- Hilfe nutzt nur LegalActions und erlaubte Projektionen.
- Keine Hidden Info wird in Lernhinweisen geleakt.
