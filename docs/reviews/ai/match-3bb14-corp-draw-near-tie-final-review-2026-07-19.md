# Match 3bb14 Corp-Draw/Near-Tie Final Review (2026-07-19)

Status: für die lokale Integration freigegeben; Behavior-Baseline mit
bekanntem `attention_required`-Reststand

## Ergebnis

Die Corp-KI behandelt optionales Ziehen jetzt aus generischen Zuständen statt
über eine feste Vier-Karten-Schwelle. Ein Draw ist nur kapazitätssicher, wenn
der gesamte projizierte Draw in die aktuelle `maxHandSize` passt und die
maximale Handgröße größer als zwei ist. Der stärkere Low-Hand-Bonus gilt nur,
wenn nach dem Ziehen noch mindestens ein Platz frei bleibt.

Fehlt auf HQ oder R&D konkrete ICE-Verteidigung, darf Draw zusätzlich
aufgewertet werden, wenn im side-sicheren Deckprofil weiteres ICE plausibel
ist und keine legale gleichserverige ICE-Installation vom generischen
ICE-Placement-Modul als `install_now` ohne Zero-Effect-Risiko bewertet wird.
Eine bereits vorhandene, hoch priorisierte Score-Remote sperrt den optionalen
Draw-Bonus; eine nur hypothetische `new_remote`-Planung nicht.

Replay-stabile Variation greift ausschließlich zwischen nicht
ausgeschlossenen Corp-Basic-Aktionen `gain_credit` und `draw_card` derselben
Scope und Viability-Stufe. Der strategische Abstand darf nach Herausrechnung
des reinen Action-Typ-Tiebreakers höchstens 100 Punkte betragen. Seed,
Decision-ID, Action-Nummer, StateVersion, Profil und stabil sortierte
Action-IDs bilden den Hashkontext. Engine-RNG, `RandomCounter` und
`RandomDrawRecords` bleiben unverändert.

## Historische und kontrollierte Evidence

- D9, D10 und D11 aus `match_3bb14a8fd2102c9a` wurden mit acht, neun und zehn
  Strict-Warmups ohne Drift erfasst. Alle drei Entscheidungen wählen jetzt
  `corp.draw_card` mit `corp_safe_draw_capacity` und
  `corp_missing_concrete_defense_draw`; `corp_low_hand` und Near-Tie-Variation
  greifen dort nicht.
- Volle Hand, maximale Handgröße zwei und ein Draw, dessen gesamter Umfang
  nicht passt, erhalten keinen Kapazitätsbonus.
- Konkret geeignetes Blocking-ICE bleibt vor spekulativem Draw.
- Strategische Abstände über 100, Ausschlüsse und Plan-Blocker werden nicht
  variiert; derselbe Entscheidungskontext wiederholt Auswahl und Evidence.
- Der Vollsuite-Fund an einer bestehenden geschützten Score-Remote ist durch
  den generischen Existing-Remote-Guard und eine `new_remote`-Gegenprobe
  geschlossen.

## Verifikation des Integrationskandidaten

- Fokussiert: 5 Dateien, 30 Tests grün.
- AI-Vollsuite: Shard 1 mit 137/999, Shard 2 mit 136/985 und Shard 3 mit
  136/827 grün; insgesamt 409 Testdateien und 2.811 Tests.
- `@netgrid/ai`-Typecheck: grün.
- `check:ai:full`: grün; Signal-Catalog, Hint-Metadata und Source-Structure
  ohne Befund.
- Source-Structure: 679 Produktionsdateien, null Laufzeit-/Typimportzyklen,
  289 Produktionsdateien direkt unter `runtime/`.
- Package-Boundaries und `git diff --check`: grün.
- Finale Behavior-Baseline auf `c605cafe7`: 60 Spiele, 12.272 Entscheidungen,
  19 Near-Tie-Entscheidungen, null Illegal-/Replay-/Fallback-/Timeout-/Runtime-
  oder Hidden-Info-Fehler und redaktionssicher. Drei Action-Limit-Spiele bleiben
  wie in der Referenz als bekannte Gate-Anzahl bestehen; der Hybrid-Fall
  wechselt von Seed 05 zu Seed 01.

## Scope und Restpunkte

Die Implementierung nutzt ausschließlich PlayerView, LegalActions,
öffentliche Historie und erlaubte eigene Deckmetadaten. Es gibt keine Match-,
Karten-, Decision- oder Seed-Sonderregel. Punkt 4 der ursprünglichen Analyse,
der deckweite `compiled_effect_overlap`-Consumer-Audit, wurde entsprechend der
Nutzervorgabe nicht bearbeitet.

Die Baseline bleibt wegen drei Action-Limit-Spielen `attention_required`.
Plan-Conversion sinkt diagnostisch um 0,027 und No-Progress steigt um 0,514
pro 100 Entscheidungen; zugleich sinken Remote-Contest-Skip, Finding-Rate und
mittlere Spiellänge. Diese Werte sind kein kalibriertes automatisches Gate und
enthalten zusätzlich Änderungen zwischen Referenz- und Paket-Ausgangs-Head.
Es erfolgt kein Push und kein Pull Request.
