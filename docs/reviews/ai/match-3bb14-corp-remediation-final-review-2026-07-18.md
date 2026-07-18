# Match 3bb14: Abschlussreview der Corp-KI-Remediation

Abgeschlossen: 2026-07-19  
Match: `match_3bb14a8fd2102c9a`  
Profil: Corp `hard`

## Ergebnis

Die freigegebenen Punkte 1 bis 3 der Spielanalyse sind generisch umgesetzt.
Die Hard-Corp-KI behandelt eine ungescorte scored-only-Agenda nicht mehr als
aktive Tagmaschine, erkennt den öffentlich erreichbaren
Shell-Traders-/Rent-I-Con-Pfad und projiziert einen Score erst dann als
unmittelbar, wenn die aktuelle Aktion ihn tatsächlich abschließt.

Die exakten Entscheidungen D39/SV87 und D40/SV88 wählen nun beide eine zweite
Lage `Shock.r` vor `remote_1`. Damit schützt die Corp die gefährdete Agenda
gegen den sichtbaren Runner-Pfad, statt eine falsche Tag-Perspektive oder ein
zu frühes Advance zu bevorzugen.

## Sicherheitsreview

- Rules Engine und LegalActions bleiben die einzige Regelautorität.
- Es gibt keine Match-, Seed-, Deck- oder Kartennamen-Sonderlogik im
  produktiven Code.
- Die neue Breaker-Projektion konsumiert nur öffentliche PlayerView-Zonen und
  sichtbare delayed-install-Semantik.
- Hidden-Info-, Replay-, StateHash- und Zufallsverträge bleiben unverändert.
- Bestehende Scoreline-, Funding- und Positions-ICE-Gegenfälle sind durch den
  vollständigen AI-Lauf geschützt.

## Verifikation

- 4/4 Match-3bb14-Checkpoint- und Coverage-Verträge grün;
- 117/117 fokussierte und angrenzende Tests grün;
- 402/402 AI-Testdateien, 2.846/2.846 AI-Tests grün;
- AI-Typecheck und `git diff --check` grün.

## Nicht-Ziel

Punkt 4, der deckweite `compiled_effect_overlap`-Audit mit elf Blockern, wurde
ausdrücklich ausgeschlossen und wird in einem anderen Thread bearbeitet.
Dieses Review behauptet für diese Kartenprofile keinen Abschluss.

## Führende Artefakte

- `docs/reviews/ai/match-3bb14-corp-remediation-evidence-2026-07-18.md`
- `docs/architecture/ai/match-3bb14-corp-remediation-process-2026-07-18.md`
- `packages/ai/src/evaluation/decision-checkpoints/match-3bb14-corp-remediation-decision-checkpoints.test.ts`
- `data/scenarios/ai-decision-checkpoints/cp-3bb14-01-scored-only-tag-timing-d39.json`
- `data/scenarios/ai-decision-checkpoints/cp-3bb14-02-realistic-score-horizon-d40.json`
