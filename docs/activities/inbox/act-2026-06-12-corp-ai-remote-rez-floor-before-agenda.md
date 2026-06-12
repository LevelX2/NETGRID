---
activityId: act-2026-06-12-corp-ai-remote-rez-floor-before-agenda
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-12
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Korp-KI: Remote-Agenda nur mit belastbarem Rez-Floor entwickeln

## Ziel

Die Korp-KI soll eine echte Agenda nicht in ein scheinbar geschütztes Remote legen und mehrfach ausbauen, wenn die Korp nach Installations- und Advancement-Kosten keinen belastbaren Credit-Floor mehr hat, um das ICE vor diesem Remote beim Runner-Run zu rezzen. Vor einer solchen Score-Line soll sie bevorzugt Credits, Draw oder belastbare Schutz-/Rez-Reserve aufbauen.

## Kontext und Quellen

- Playtest-Beobachtung vom 2026-06-12: In Zug 11 installiert die Korp-KI eine verdeckte Karte in `remote_1`, vor dem ein unrezzed ICE liegt. Danach baut sie die Karte zweimal aus und beendet den Zug mit 0 Credits. Beim Runner-Run auf dieses Remote wird das ICE nicht gerezzt, vermutlich wegen fehlender Credits. Der Runner greift auf die Agenda zu und stiehlt sie.
- Der Runner hatte laut Beobachtung keine ICEbreaker im Rig. Gerade deshalb ist die Linie fachlich besonders schwach: Ein bezahlbares gerezztes oder rezbares ICE hätte wahrscheinlich gereicht, aber die Korp hat die eigene Rez-Fähigkeit durch Install+Advance selbst aufgegeben.
- Verwandte erledigte Activities:
  - `docs/activities/done/act-2026-05-17-corp-remote-rez-reserve-plan.md`
  - `docs/activities/done/act-2026-05-19-corp-ai-unprotected-advanced-agenda-repeat.md`
  - `docs/activities/done/act-2026-06-04-corp-semantic-naked-remote-agenda-guard.md`
- Relevante Plan-/Diagnosemechanismen:
  - AI Play-Strength Decision Spine: `docs/architecture/ai/ai-play-strength-decision-spine-automation-process-2026-06-11.md`
  - Fehlerklassen und Snapshot-Achsen wie `bad_rez_spend`, `missed_score_window`, `corp_low_rez_reserve`.
  - DecisionFrame, Threat-/Opportunity-Projektion, ActionGoalFit, SemanticShadowDecision und Decision-Snapshot-Suite unter `packages/ai/src/decision/**` und `packages/ai/src/evaluation/**`.

## Scope

- Den beobachteten Fall als fokussierten AI-Test oder Decision-Snapshot modellieren:
  - Korp ist am Zug mit niedrigen Credits.
  - Ein Remote enthält mindestens ein unrezzed ICE und eine eigene verdeckte Root-Karte, die für die Korp als Agenda bekannt ist.
  - Runner hat keine sichtbaren Breaker oder nur geringen Remote-Zugriffsdruck.
  - Korp hat legale Alternativen wie `gain_credit`, `draw_card`, eventuell ICE-/Economy-Installationen oder konservatives End-Turn.
  - Install/Advance/Advance oder ein weiterer Advance würde die Korp unter die benötigte Remote-Rez-Reserve drücken.
- Die Korp-Bewertung so ergänzen, dass Remote-Agenda-Entwicklung vor dem Runner-Zug einen `remote_rez_floor` berücksichtigt:
  - kalkulierte oder konservativ geschätzte Rez-Kosten für relevante unrezzed ICE vor dem Zielremote,
  - Credits nach der geplanten Aktion,
  - bereits gerezzte Schutzqualität,
  - Runner-Contest-Signal durch sichtbaren Boardzustand,
  - Score-Nähe und Same-Turn-Score-Ausnahme.
- Vorhandene Decision-Spine-Mechanismen verwenden, statt eine neue Sonderlogik außerhalb des Planungs-/Scoringpfads zu bauen:
  - `SemanticDecisionFrame` soll side-safe Evidence wie `remote_rez_floor`, `credits_after_action`, `agenda_development_risk` oder `low_rez_reserve` tragen können.
  - `ThreatProjection` soll die Lage als `corp_low_rez_reserve` oder `corp_remote_vulnerable` erkennbar machen.
  - `ActionGoalFit` oder der aktive Semantic-Corp-Scoringpfad soll `gain_credit`/`draw_card` gegenüber riskantem `advance_card` bevorzugen, solange der Score nicht sofort möglich ist.
  - Die Snapshot-Suite soll den Fehler als `bad_rez_spend` beziehungsweise `agenda_developed_below_rez_floor` reproduzierbar machen.
- Prüfen, ob der Fix im aktuellen Livepfad (`chooseCorpAction` / Semantic Runtime / Corp Score Window Pilot) oder zunächst als enger Pilot-/Shadow-Slice umgesetzt werden soll.

## Nicht im Scope

- Kein generelles Verbot von Bluffing, Bait-Remotes oder risky rush scoring.
- Keine pauschale Regel, jedes ICE immer zu rezzen.
- Keine Änderung an Engine-Regeln, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung für Runner-Inputs, PublicEvents, Debug-Ausgaben oder Reconnect-Payloads.
- Keine Nutzung verdeckter Runner-Informationen. Sichtbare Runner-Rig-/Credit-/Boarddaten sind erlaubt; Runner-Hand, Stack und verdeckte Inhalte bleiben tabu.
- Kein vollständiger neuer Korp-Spieler und keine breite Doctrine-Neugewichtung außerhalb dieses Remote-Rez-Floor-Musters.

## Akzeptanzkriterien

- [ ] Ein fokussierter Test oder Snapshot reproduziert den beschriebenen Zug-11-Fall: Korp entwickelt eine Remote-Agenda hinter unrezzed ICE, fällt auf 0 Credits und kann das ICE beim nächsten Runner-Run nicht rezzen.
- [ ] Die Korp-KI bevorzugt in diesem Fall vor weiterem Advance oder vor Agenda-Install `gain_credit`, `draw_card` oder eine andere nachweisbar bessere Reserve-/Schutzaktion, wenn diese legal ist.
- [ ] Eine Agenda-Linie bleibt erlaubt, wenn der Score im selben Zug möglich ist oder die Korp nach der Aktion die relevante Remote-Rez-Reserve noch bezahlen kann.
- [ ] Eine bereits belastbar geschützte Remote-Line wird nicht durch übermäßige Passivität blockiert.
- [ ] Die Entscheidung ist im Trace side-safe erklärbar, mindestens mit Evidence zu `remote_rez_floor`, `credits_after_action`, `low_rez_reserve` oder vergleichbaren bestehenden Begriffen.
- [ ] Bestehende Guards aus den erledigten Remote-/Naked-Agenda-Paketen bleiben grün.
- [ ] Verifikation umfasst mindestens fokussierte AI-Tests für den neuen Fall, `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check`; bei Änderung am aktiven Runtimepfad zusätzlich die relevanten `semantic-ai-runtime-cutover`-/Decision-Spine-Tests.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil der Befund Korp-KI, Agenda-Scoring, Remote-Schutz und Decision-Spine-Evidence verbindet.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts`
  - `packages/ai/src/decision/semantic-decision-frame.ts`
  - `packages/ai/src/decision/threat-projection.ts`
  - `packages/ai/src/decision/action-goal-fit.ts`
  - `packages/ai/src/evaluation/decision-snapshot-suite.ts`
  - vorhandene Tests zu `corp_low_rez_reserve`, `bad_rez_spend`, `corp_score_window` und `semantic-ai-runtime-cutover`.
- Strategischer Kern: Nicht nur "ist ein ICE vor dem Remote", sondern "kann die Korp nach dieser Aktion das relevante ICE auch noch rezzen?" bewerten. Eine unrezzed Schutzkarte mit 0 Credits ist im nächsten Runner-Zug praktisch kein Schutz.
- Credit-Aufbau soll nicht blind dominieren. Er soll nur dann gewinnen, wenn er konkret eine Remote-Rez-Reserve oder einen nahen Score-Plan ermöglicht. Sonst droht die ältere Passivitätsregression.
- Die Korp darf ihre eigenen verdeckten Root-Karten kennen; Runner-facing Projektionen und Debugdaten dürfen daraus keine verdeckte Agenda-Information ableiten.

## Ergebnisnotiz

Noch offen.
