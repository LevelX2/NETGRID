# AI219 Minimal Positive Cutover Decision

Datum: 2026-06-21

## Entscheidung

No-Go fuer Cutover.

## Begruendung

Die AI218-Vergleichslaeufe sind metrikgleich und zeigen keine aktiv angewendete Practical-Micro-Entscheidung:

- A-D x5 Baseline: 11/20 Action-Limit-Spiele.
- A-D x5 Apply: 11/20 Action-Limit-Spiele.
- Unsafe score chosen bleibt 4.
- Repeated no-progress run bleibt 35.
- Practical-micro markierte Aktionen: 0.

Der Apply-Modus bleibt deshalb experimentell und wird nicht als Default aktiviert. Der Default bleibt `practicalMicroRuntime.mode: "off"`.

## Naechster Schluss

Die Ursache liegt nicht in fehlendem Cutover-Mut, sondern darin, dass die vier eng geschnittenen Runtime-Regeln die problematischen Selfplay-Zustaende nicht treffen. Der naechste Optimierungsblock muss vor der Auswahlentscheidung die konkreten Action-Limit-Zustaende mit LegalActions, Debug-Facts und Kandidatenluecken sampeln.

