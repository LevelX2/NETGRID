# Match-3bb14-Corp-Draw-Near-Tie-Prozess (2026-07-19)

Status: P4 abgeschlossen, P5 aktiv

## Quelle und Zielprüfung

Quelle ist die freigegebene Nacharbeit zu D9-D11 des beendeten Matches
`match_3bb14a8fd2102c9a`. Dort lagen Corp-HQ bei 4/5 Karten, R&D war
ungeschützt und `gain_credit` gewann dreimal nur durch den historischen
Action-Typ-Tiebreaker mit einem Punkt gegenüber `draw_card`.

Der Endzustand ist hinreichend bestimmt:

1. Draw-Kapazität richtet sich nach der aktuellen maximalen Handgröße statt
   nach der festen Schwelle vier.
2. Eine sichtbare zentrale Schutzlücke ohne konkret installierbares
   Verteidigungs-ICE darf Draw side-safe aufwerten.
3. Strategisch nahezu gleichwertige, weiterhin zulässige Aktionen dürfen
   replay-stabil aus dem vorhandenen AI-Seed-Kontext variiert werden.
4. Harte Ausschlüsse, Plan-Controller und klar bessere Aktionen behalten
   Vorrang.

- Arbeitsbranch: `codex/corp-draw-seeded-near-tie`
- Worktree: `C:\Projekte\NETGRID_CORP_DRAW_SEEDED_NEAR_TIE`
- Ausgangs-`main`: `52ac68d1917c5c6f918c0335d29dde65ae0ae182`
- KI-Profil des Quellmatches: Corp `hard`

## Annahmen und Nicht-Ziele

- Ein einzelner Basic-Draw benötigt genau einen freien Handplatz. Für
  mehrkartige Actions wird nur ihr öffentlich projizierbarer Draw-Umfang
  berücksichtigt.
- Die Variation ist deterministische AI-Policy-Variation aus `seed`,
  `decisionId`, `actionNumber`, `stateVersion` und der stabil sortierten
  Kandidatenmenge. Sie ist kein Engine-Zufallszug und verändert weder
  `RandomCounter` noch `RandomDrawRecords`.
- Die neue Schutzlückenbewertung verwendet nur Corp-PlayerView,
  LegalActions, öffentliche Historie und erlaubte eigene Deckmetadaten.
- Punkt 4 der ursprünglichen Matchanalyse, der deckweite
  `compiled_effect_overlap`-Audit, bleibt vollständig ausgeschlossen.
- Keine Karten-, Match-, Decision- oder Seed-Sonderregel gelangt in den
  Produktivcode.
- Keine Engine-, PlayerView- oder LegalAction-Erweiterung ist geplant. Falls
  sie doch notwendig wird, ist das ein Sicherheitsblocker statt Anlass für
  einen AI-seitigen FullState-Workaround.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Variation greift erst nach fachlichem Scoring und nur innerhalb einer
  explizit begrenzten Near-Tie-Menge derselben Viability-Stufe: positive
  Kandidaten, falls vorhanden, sonst die nicht ausgeschlossenen Fallbacks.
- Ausschlüsse, akute Score-/Schutz-Controller und TacticalPlan-Mapping dürfen
  durch Variation nicht umgangen werden.
- Derselbe AI-Entscheidungskontext erzeugt dieselbe Auswahl und dieselbe
  Debug-Evidence.
- Der Draw-Bonus darf weder Handüberlauf noch Agenda-Flood oder bereits
  vorhandene konkrete Verteidigung belohnen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` gilt bei historischen Checkpoints als rote
  Verhaltens-Evidence. Fixture-, Redaction-, Engine- oder Runtime-Drift wird
  zuerst als Infrastrukturproblem behandelt.
- Ist eine historische Erwartung bereits grün, wird sie nicht künstlich rot
  gemacht; kontrollierte Unit-Gegenproben sichern dann den neuen Vertrag.
- Scheitern Side-Safety, Replay-Stabilität, Engine-Korrektheit oder ein
  angrenzender harter Controller, stoppt der Prozess ohne Gewichtungs-Workaround.
- Genau ein Paket ist aktiv; jedes Done-Gate wird vor dem Paketcommit erfüllt.

## State Machine und Paketfolge

`P0 Prozessvertrag -> P1 rote Evidence -> P2 Draw-Kontext ->`
`P3 Near-Tie-Variation -> P4 Verifikation/Review -> P5 Integration/Cleanup`

### P0 - Preflight und Prozessvertrag

- Worktree, Branch, Scope, Nicht-Ziele und Invarianten festhalten.
- Checks: sauberer Worktree, `git diff --check`.
- Done-Gate: Prozessartefakt versioniert.
- Commit: `docs(ai): plan corp draw near-tie refinement`

### P1 - Historische und kontrollierte rote Evidence

- D9-D11 side-safe capturen oder, falls der Strict-Capture auf aktuellem Code
  keine belastbare rote Checkpoint-Evidence ergibt, den Drift ausdrücklich
  dokumentieren.
- Kontrollierte Tests für 4/5-Handkapazität, fehlende konkrete zentrale
  Verteidigung, Near-Tie-Seed-Reproduzierbarkeit und harte Nicht-Variation
  zunächst rot sichern.
- Gegenproben: volle Hand, maximale Handgröße zwei, vorhandenes geeignetes
  ICE, klarer Scoreabstand und plan-erzwungene Aktion.
- Done-Gate: Red-Evidence und bereits grüne Gegenproben separat committed.
- Commit: `test(ai): capture corp draw near-tie regressions`

### P2 - Dynamischer Draw- und Verteidigungskontext

- Sichere Draw-Kapazität aus `maxHandSize` und projiziertem Draw-Umfang
  ableiten; kleine Kapazitäts- und stärkere Low-Hand-Komponente trennen.
- Generische zentrale Schutzlücke nur dann als Draw-Bedarf werten, wenn kein
  konkretes legales Verteidigungs-ICE aus HQ installierbar ist und der eigene
  sichtbare Deckkontext weitere ICE plausibel macht.
- Debug-Evidence nennt Handkapazität, Schutzserver und Abwehrlage.
- Done-Gate: Zieltests und Gegenproben grün; angrenzende Corp-Scoretests grün.
- Commit: `fix(ai): model dynamic corp defensive draw need`

### P3 - Begrenzte replay-stabile Near-Tie-Variation

- Nach der fachlichen Rangfolge eine stabile, seedabhängige Auswahl nur aus
  nicht ausgeschlossenen Kandidaten derselben Viability-Stufe und innerhalb
  der engen Toleranz einführen.
- Action-Typ-Tiebreaker bleibt Ordnungsmetadatum, darf die Near-Tie-Menge aber
  nicht künstlich strategisch trennen.
- Debug-Evidence dokumentiert Eligibility, Toleranz, Kandidaten und Bucket.
- Done-Gate: gleicher Kontext reproduzierbar, mehrere Seeds zeigen Variation,
  klare Sieger und Controller bleiben unverändert.
- Commit: `fix(ai): vary replay-stable corp near ties`

### P4 - Breite Verifikation und Review

- Historische Checkpoints, Gegenproben und angrenzende Runtime-Tests ausführen.
- AI-Typecheck, vollständige AI-Suite, Behavior-Baseline und
  `git diff --check` ausführen.
- Evidence, Final-Review, Prozessstatus und Wissenslog aktualisieren.
- Done-Gate: alle verpflichtenden Checks grün und Punkt 4 weiterhin als
  Nicht-Ziel dokumentiert.
- Commit: `docs(ai): close corp draw near-tie refinement`

### P5 - Lokale Integration und Cleanup

- Aktuelles `main` defensiv in den Arbeitsbranch integrieren und relevante
  Checks erneut ausführen.
- Hauptworkspace prüfen und bevorzugt per Fast-Forward lokal nach `main`
  mergen.
- Arbeits-Worktree und gemergten Branch nur bei sauberem Stand entfernen und
  Entfernung in Git sowie Dateisystem verifizieren.
- Kein Push und kein Pull Request.

## Mindestverifikation

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/runtime/corp-economy/corp-defensive-draw.test.ts `
  src/runtime/corp-economy/corp-basic-economy-near-tie.test.ts `
  src/evaluation/decision-checkpoints/match-3bb14-corp-draw-near-tie-decision-checkpoints.test.ts `
  src/evaluation/decision-checkpoints/latest-two-corp-match-remediation-decision-checkpoints.test.ts `
  src/runtime/choice-ranking/semantic-choice-ranking-mapping.test.ts `
  --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:ai:full
corepack pnpm check:package-boundaries
git diff --check
```

## /Goal

Arbeite P0 bis P5 ausschließlich im genannten Worktree sequenziell ab und
committe jedes abgeschlossene Paket. Verwende nur side-safe AI-Eingaben und
LegalActions. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Nutze den Hauptworkspace nur für den finalen lokalen
Merge. Markiere das Ziel erst nach erfolgreicher Main-Verifikation sowie
verifiziertem Worktree- und Branch-Cleanup als abgeschlossen.

## Paketstatus

- P0: `ad7cdaa06` (`docs(ai): plan corp draw near-tie refinement`)
- P1: drei Strict-Captures ohne Warmup-Drift; drei rote
  `behavior_regression`-Zieltests und zwei grüne Gegenproben.
- P2: dynamische Draw-Kapazität aus aktueller maximaler Handgröße und
  projiziertem Draw-Umfang; side-safe Verteidigungs-Draw für eine leere
  zentrale ICE-Lage ohne konkrete Installationsalternative bei positivem
  Deck-ICE-Schätzwert. D9-D11 und Gegenproben sind grün; fokussiert 66/66
  Tests und AI-Typecheck grün.
- P3: replay-stabile Corp-Variation innerhalb eines strategischen
  100-Punkte-Fensters, begrenzt auf Basic Credit/Draw derselben Scope und
  Viability-Stufe. Seed, Decision-ID, Action-Nummer, StateVersion, Profil und
  stabil sortierte Kandidaten bilden den Hashkontext. Full-Hand, Ausschlüsse,
  klare Sieger und D9-D11 bleiben unverändert; produktiver Chooser und
  Raw-Score-Debug sind kontrolliert verifiziert. Fokussiert 108/108 Tests und
  AI-Typecheck grün.
- P4: nach dem defensiven `main`-Abgleich sind alle drei AI-Testshards grün
  (137/999, 136/985 und 136/827; zusammen 409 Dateien und 2.811 Tests). Der
  finale kompatible Behavior-Baseline-Lauf auf `c605cafe7` umfasst sechs
  Slots, zehn Seeds und 60 Spiele. Er bleibt mit unverändert drei
  Action-Limit-Spielen `attention_required`; alle übrigen technischen Gates
  sind null und Redaction ist sicher. Near-Tie-Variation wurde 19-mal in
  12.272 Entscheidungen beobachtet. Der anfängliche Vollsuite-Befund an einer
  bereits geschützten Score-Remote ist durch einen generischen Existing-
  Remote-Guard samt Gegenprobe geschlossen.
- Strukturhygiene: die neuen Produktionsmodule liegen unter
  `runtime/corp-economy/`. Nach Integration der aktuellen
  Source-Structure-Schnitte sind `check:ai:full`, Source-Structure mit 679
  Produktionsdateien, null Importzyklen und 289 Runtime-Root-Dateien,
  Package-Boundaries sowie AI-Typecheck grün.
