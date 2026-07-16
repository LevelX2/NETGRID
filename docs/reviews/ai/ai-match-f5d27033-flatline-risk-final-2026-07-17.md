# Match F5D27033: Flatline-Risiko-Finalreview

Status: fachlich abgeschlossen

## Entscheidung

Die drei freigegebenen Runner-Findings aus `match_f5d27033a083d6b8` sind
umgesetzt und durch spielgleiche Strict-Checkpoints geschlossen:

1. Der Runner steigt vor einem sichtbaren, gerezzten und allein verbleibenden
   Access-Damage-Ambush aus.
2. Ein marginaler kumulativer Kapazitätsinstall darf einen klar besseren
   Basis-Draw oder Basiscredit nicht durch absolute Planbindung verdrängen.
3. Bestätigter Damage-Druck mit durch Core Damage gesperrtem Handpuffer
   bevorzugt auf dem letzten Klick eine liquide Reaktionsreserve vor einem
   opportunistischen Run ohne sichtbaren Sofortertrag.

## Schutzgrenzen

- Keine verdeckte Korp-Karte wird gelesen oder aus dem späteren Flatline-Ablauf
  erraten.
- Die Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash und
  Zufall bleiben unverändert.
- Frühe Check-Runs, sichere Remote-Continues, unmittelbare Breaker-Installation
  und Runs mit sichtbarem Payoff bleiben erlaubt.
- Die vorhandene replay-stabile Probevariation bleibt für echte Grenzfälle
  zuständig; die neuen Regeln greifen nur bei klar sichtbarer Evidence.

## Nachweis

Führende Detail-Evidence ist
`docs/reviews/ai/ai-match-f5d27033-flatline-risk-evidence-2026-07-17.md`.
Sechs neue Checkpoints laufen ohne Warmup-Drift. 108 fokussierte Tests,
AI-Typecheck, `check:ai:full` und Diff-Check sind grün. Die vollständige
AI-Suite hat 2445/2460 grüne Tests; alle 15 roten Altfehler sind identisch auf
`main` reproduziert und kein Delta dieses Slices.
