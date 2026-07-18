# Match 74e2369: Abschluss der Corp-KI-Regressionsbehebung

Datum: 2026-07-18  
Match: `match_74e236955b3208a1`  
Profil: `corp-ai-v0.9-hard`

## Ergebnis

Die 21 bestätigten schwachen Entscheidungen des Spiels ließen sich auf vier
gemeinsame Verhaltensursachen und eine fehlende Consumer-Schicht zurückführen.
Alle fünf spielgleichen Checkpoints sind nach der generischen Behebung grün:

- `Project Consultants` bevorzugt bei gleicher sofortiger Konvertierbarkeit
  die Agenda mit dem höheren Punktwert;
- kritische R&D-Verteidigung bleibt vor einer schwächeren strategischen
  Basic-Credit-Ersetzung erhalten;
- `Night Shift` bleibt als stärker bewertete Burst-Economy-Aktion vor dem
  normalen Credit-Klick erhalten;
- eine zweite Tycho-Kopie wird nur dann als redundant behandelt, wenn die
  verbleibende Kopie bereits den Sieg ermöglicht;
- der `Corporate War`-Score erklärt und bewertet seinen sichtbaren
  Credit-Schwellen-Tradeoff, ohne dringende Low-Credit-Scores zu verbieten.

Die vier vorher als uneindeutig klassifizierten Entscheidungen D101, D104,
D117 und D120 wurden nicht eigenständig umgestimmt. Engine, LegalActions,
PlayerViews, Replay, StateHash, Zufall und Hidden-Info-Verträge wurden nicht
geändert.

## Regressionsursache

Night Shift und R&D-ICE funktionierten in älteren isolierten Zuständen weiter.
Die Regression lag in der neueren produktiven Plan-Komposition: Wenn der
gemappte Corp-Schritt keinen strategischen Fit hatte, durfte eine schwächere
strategische Aktion einen bereits ermittelten stärkeren Board-Triage- oder
Burst-Economy-Override ersetzen. Der Runner-Pfad besaß bereits einen
vergleichbaren Schutz, der Corp-Pfad nicht. Die Reparatur schützt nur diese
beiden belegten positiven Corp-Overrides; starke Tag-Punish-Unterbrechungen
bleiben als Gegenprobe zulässig.

Die Agenda-Zielwahl verlor ihren tatsächlichen Punktwert in der
Score-Conversion-Priorität. Die Discard-Logik behandelte Agenda-Duplikate
pauschal ohne den sichtbaren Siegstand. Beide Lücken sind nun zustandsbezogen
geschlossen.

## Bedeutung des 22-Karten-Audits

Der frühere Status `failed` bedeutete: Alle 22 unterschiedlichen Karten des
47-Karten-Decks wurden geprüft, davon hatten genau drei einen Blocker. Die
aktiven, manuell überarbeiteten Hints waren korrekt; erst die Kompilierung
fügte alte abgeleitete Effekte mit demselben fachlichen Kern zusätzlich ein:

- `Corporate War`: Economy +12 doppelt;
- `Ball and Chain`: Run Tax 2 doppelt;
- `Wall of Ice`: korrekter Gesamtschaden 4 plus Einzel-Subroutinenwert 2.

Die Zusammenführung erhält für diese überprüften Kerne jetzt den Active Hint
und ergänzt weiterhin eigenständige Wirkungen wie Counter-Economy,
Future-Encounter und ETR. Der erneute vollständige Audit meldet 22/22
unterschiedliche Karten, 47/47 Karten insgesamt, `status=ok`, null Blocker und
null Warnungen. Night Shift war von diesem Hint-Fehler nicht betroffen.

## Verifikation

- fünf exakte historische Checkpoints: grün;
- 43 zuvor vorhandene angrenzende Gegenverträge: grün;
- fokussierter Abschlusslauf: 85/85 Tests grün;
- vollständige AI-Suite: 400/400 Testdateien und 2.833/2.833 Tests grün;
- AI-Typecheck: grün;
- Compiled-Hint-, Derived-Facts-, Inspector-, Overlay-, Signal-, Metadata- und
  Normalization-Gates: grün;
- vollständiger Deck-Hint-/Consumer-Audit: grün;
- Source-Structure-Gate: unverändert nur wegen der vier bereits auf dem
  Ausgangsstand vorhandenen Dateigrößenüberschreitungen rot; keine neue oder
  vergrößerte Überschreitung aus dieser Behebung.

Die neuen Matchtests erfinden keine besondere Spielfeldlogik. Sie speisen die
bereits vorhandene Decision-Checkpoint-Infrastruktur mit den exakten
historischen GameStates, öffentlichen Eventpräfixen, PlayerViews und
LegalActions. Damit fixieren sie nur das bereits im echten Spiel beobachtete
Soll und schützen gegen denselben Rückschritt.

## Führende Artefakte

- `docs/reviews/ai/match-74e2369-corp-regression-evidence-2026-07-18.md`
- `docs/architecture/ai/match-74e2369-corp-regression-remediation-process-2026-07-18.md`
- `packages/ai/src/evaluation/decision-checkpoints/match-74e2369-corp-regression-decision-checkpoints.test.ts`
- `packages/ai/src/match-74e2369-card-hint-contract.test.ts`
