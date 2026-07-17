# Final Review: letzte zwei Corp-KI-Spiele vom 17.07.2026

## Ergebnis

Die beiden zuletzt abgeschlossenen Spiele `match_a7593a9bf8632052` und
`match_8107a9dffe8cd234` sind vollständig zugweise ausgewertet. Vier
reproduzierbare KI-Fehler, ein Aktionstyp-Vertragsfehler und zwölf
blockierende Effektkern-Überlappungen in den beiden Corp-Decks sind behoben.
Regelkonforme Entscheidungen ohne belastbare Gegenevidence blieben
unverändert.

## Behobene KI-Fehler

- Eine finanzierte und ausreichend geschützte Scoreline darf einen rein
  spekulativen Punish-Plan unterbrechen, wenn der Runner kreditarm ist und
  der Agenda-Stau im HQ konkret wird.
- Der Scoreline-Support-Controller belegt die einzige geschützte Score-Remote
  nicht mehr mit einem Nicht-Agenda-Root, wenn eine bessere zentrale
  Installation legal ist.
- Bei sonst gleichem Zielrisiko trägt eine contestable Agenda-Installation
  jetzt den tatsächlich gefährdeten Agenda-Punktwert.
- Eine konkrete, ausreichend geschützte Matchpoint-Linie wird nicht länger
  pauschal durch allgemeine Exposure-, Triage- und Plan-Penalties blockiert.

Die historischen Anker Match A D45/D55 und Match B D27/D110 sowie vier enge
Gegenproben sind grün. Die Fixes verändern weder LegalActions noch Hidden-
Info-, Side-Safety- oder Determinismusverträge.

## Rez- und Hint-Verträge

Nicht-ICE-Karten verwenden jetzt konsistent `rez_card` in LegalAction,
`applyAction`, AI-Input, Replay und PublicEvent. Nur ICE verwendet
`rez_ice`. Die AI behandelt beide als Rez-Aktion, unterscheidet aber weiterhin
ICE-Verteidigung von Root-Timing, Economy- und Tag-Engine-Aktivierung.

Die zehn im Match-Deck-Audit betroffenen Karten sind als geprüfte
Effekt-Normalisierungen im Hint-Compiler verankert. Beide vollständigen
Deck-Audits melden danach `status=ok`, null Blocker und null Warnungen; ihre
Primärstrategien bleiben unverändert.

## Verifikation

- vier historische Remediation-Checkpoints und vier Gegenproben: grün;
- 121 angrenzende Scoreline-, Plan- und Runtime-Tests: grün;
- vollständige AI-Suite: 378 Dateien, 2.624 Tests, grün;
- vollständige Engine-Suite: 188 von 189 Dateien und 1.731 von 1.732 Tests
  grün;
- direkte Typechecks für Shared, Engine und AI: grün;
- beide Deck-Hint-/Consumer-Audits: `status=ok`, 0 Blocker, 0 Warnungen;
- `git diff --check`: grün.

Der einzige rote Engine-Test ist kein Regressionsbefund dieser Änderung:
`turn-runtime-resolvers.ts` besitzt 3.280 Zeilen bei einem Gate von 3.200.
Der identische Fehler wurde auf dem unveränderten lokalen `main` reproduziert.

## Grenzen

Verdeckte Choices aus Match A D4/D7/D23/D29/D35 und Match B D13 wurden nicht
passend gestimmt. Der bereits separat behobene `Rent-I-Con`-/Shell-Traders-
Befund gehört nicht zu diesem Fix. Runtime-SQLite und historische Replays
wurden ausschließlich als read-only Evidence verwendet und nicht migriert.

Führende Detailartefakte sind
`docs/reviews/ai/latest-two-corp-match-remediation-evidence-2026-07-17.md`
und
`docs/architecture/ai/latest-two-corp-match-remediation-process-2026-07-17.md`.
