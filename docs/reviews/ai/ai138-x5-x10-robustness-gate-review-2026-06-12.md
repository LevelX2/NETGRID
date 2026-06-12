# AI138 x5/x10 Robustness Gate Review

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI138 trennt das x5-Abnahmegate vom x10-Residual-Watch. Der bisherige Fehler wäre, x10-Streuung wie ein enges x5-Releasegate zu behandeln und dadurch zufalls- oder setupabhängige Einzelheuristiken zu erzwingen.

## Ausgangslage

- x5 bleibt das schnelle Regressionsgate.
- x10 bleibt ein Residual-/Robustness-Watch mit höherer Varianz.
- AI131-AI136 zeigen: viele Action-Limit-Endfenster enthalten reale Progress- oder Reserve-Signale; nur ein Teil ist stale No-Progress.
- AI137 hat keinen sicheren Runtime-Cutover gefunden, weil same-state LegalAction-Alternativen nicht belegt sind.

## Gate-Modell

### x5 Release Gate

Dieses Gate blockiert direkte Regressionen:

| Signal | harte Schwelle |
| --- | ---: |
| Illegal Actions | 0 |
| Replay Failures | 0 |
| Redaction-safe | 1 |
| `scoreWindowMissed` | keine Verschlechterung |
| `unsafeScoreChosen` | keine Verschlechterung |
| Action-Limit | keine Verschlechterung gegen letzte grüne x5-Basis |

### x10 Residual Watch

Dieses Gate ist kein harter Release-Blocker, solange Safety grün bleibt:

| Signal | Watch-Bewertung |
| --- | --- |
| Action-Limit-Fälle | Trend gegen letzte x10-Basis, nicht einzelner Absolutwert |
| dominante Subcluster | Drift beobachten; keine pauschalen Mali |
| stale No-Progress-Anteil | mit Progress-Delta-Labeler verfolgen |
| Runner-Coverage-/Corp-Tempo-Ziele | nur shadow-only, bis same-state Alternative belegt ist |
| Redaction/Illegal/Replay | harte Nulltoleranz |

## Cutover-Kriterien

Ein produktiver AI-Cutover darf nur erfolgen, wenn alle Punkte erfüllt sind:

- mindestens zwei x10-Fälle gleicher Ursache oder ein extrem klarer Einzel-Fall
- same-state LegalAction-Alternative belegt
- side-safe und redaction-safe
- besseres Progress-Delta im AI132-Sinn
- keine Hidden-Info, keine neue LegalAction-Erzeugung
- x5 nicht schlechter
- x10 nicht schlechter in Safety und nicht schlechter im dominanten Residual-Cluster
- kein generischer Credit-, Draw-, Run- oder Corp-Economy-Malus
- keine Wiederholung des AI121/B005-Draw-Malus

## Removal Conditions

Ein Blocker für Runtime-Cutover ist entfernt, wenn ein Folgelauf pro Kandidat folgendes liefert:

1. konkrete same-state Alternative-Snapshots mit progress-aware Feldern
2. mindestens zwei gleichartige Fälle oder ein klarer Fixture-Fall
3. x5-Trace vor/nach Kandidat ohne Safety-Verschlechterung
4. x10-Watch vor/nach Kandidat ohne Action-Limit- oder stale-No-Progress-Verschlechterung
5. Review-Artefakt mit explizitem No-Hidden-Info-Scan

## Schluss

AI138 setzt die nächsten Optimierungen auf robuste Shadow-Evidence statt auf enges Heuristik-Tuning. x5 bleibt das harte Regressionstor; x10 wird als Residual-Beobachtung geführt, bis ein belegt gleicher Entscheidungspunkt einen sicheren Cutover trägt.

## Verifikation

- AI131 Corpus geprüft
- AI132 Progress-Delta-Labels geprüft
- AI136 Challenger-Report geprüft
- AI137 Cutover-No-Go geprüft
- `git diff --check`
