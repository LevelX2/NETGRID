# AI Score-Choice-Continuation-Identity – Umsetzungsprozess

Status: **geplant; noch nicht implementiert**

Stand: 2026-07-26

## 1. Anlass und Ziel

Der abgeschlossene Plan-first-Cutover bindet Corp-Score-Fortsetzungen bereits
fail-closed an den residenten Score-Plan. Zwei Resolver lesen jedoch weiterhin
semantische Daten aus `ChoiceRequest.source`: die Advancement-Counter-Auswahl
und die HQ-Agenda-Shuffle-Auswahl nach dem Scoren. Das ist keine zusätzliche
Handlungsautorität, aber ein fragiler Stringvertrag zwischen Rules Engine und
KI.

Dieses Paket ersetzt den Stringvertrag ausschließlich für diese beiden
Score-Familien durch eine strukturierte, side-sichere
Continuation-Identität. `LegalAction.actionId` bleibt die Identität der
auslösenden Aktion; die darauf folgende `ChoiceRequest` referenziert sie als
`originActionId`. Ihre für die Auswahl notwendigen, bereits für Corp sichtbaren
Fakten werden als typisierte Continuation-Nutzlast übertragen.

## 2. Bewusst enger Scope

Im Scope sind nur:

- `corp_advancement_counter` nach einer Corp-Advance-Fortsetzung;
- `corp_scored_agenda_on_score` für die HQ-Agenda-Shuffle-Credits;
- der gemeinsame Shared-/Engine-/AI-Vertrag, die beiden Producer, die beiden
  AI-Resolver und ihre fokussierten Tests.

Nicht im Scope sind alle anderen Choice-Familien, ein Umbau von
`ChoiceRequest.source` als Diagnose-/Provenienztext oder eine generische
Massenmigration. Der aktuelle Bestand umfasst 123
`pendingChoice`-/`choiceId`-Erzeugungs- oder Teststellen in `packages/engine`
und 42 fachliche `choice.source`-Auswertungen in `packages/ai`; daraus folgt
kein sicherer Big-Bang-Schnitt.

## 3. Zielvertrag

`ChoiceRequest` erhält optional eine explizite, diskriminierte
`continuation`-Nutzlast. Für die beiden Score-Familien ist sie vollständig und
enthält mindestens:

- `originActionId`: die exakte auslösende `LegalAction.actionId`;
- `family`: `corp_advancement_counter` oder
  `corp_scored_agenda_hq_shuffle`;
- die Ziel-Agenda als `agendaInstanceId`;
- den erzeugenden `stateVersion`;
- ausschließlich für den Shuffle die geprüfte Credit-pro-Agenda-Punkt-Rate.

`source` bleibt unverändert als bestehende Engine-Provenienz und für
Diagnostik/Replays erhalten. Die beiden neuen KI-Resolver dürfen für ihre
Autorisierung und Auswahl keine Felder mehr aus `source` parsen. Sie müssen
stattdessen die Continuation gegen den residenten `corp.score_agenda`-Executor,
seine gespeicherte auslösende `actionId`, Ziel-Agenda, Seite, Timing und
unmittelbare `stateVersion` prüfen. Fehlende, fremde, stale oder unvollständige
Nutzlast scheitert weiterhin fail-closed.

Die Structured-Payload darf weder neue Runner-Informationen enthalten noch in
PublicEvents, fremde PlayerViews oder Debugausgaben gelangen, die sie bisher
nicht erhalten hätten. Die sichtbare Choice-Projektion bleibt side-sicher.

## 4. Umsetzungsreihenfolge

1. Shared-Typ als enge diskriminierte Union ergänzen; `continuation` bleibt
   optional, damit alle nicht migrierten Choice-Familien unverändert bleiben.
2. Die beiden Engine-Producer mit der vollständigen, aktuellen Nutzlast
   versehen. Die Werte müssen aus dem gerade validierten Score-/Advance-Pfad
   stammen, nicht aus einer nachträglichen KI-Schätzung.
3. Die Plan-State-Aufzeichnung der ausgewählten LegalAction an dieselbe
   `originActionId` binden; bei jeder Abweichung keine Choice-Ausführung.
4. Beide AI-Resolver auf strukturierte Felder umstellen und die bisherigen
   `choice.source.split`-/Prefix-Abhängigkeiten aus diesen Resolvern entfernen.
5. Fokus-Tests für positive Fortsetzung sowie fehlende, falsche, stale und
   fremde Origin-/Agenda-/Rate-Werte ergänzen.
6. Erst danach Scope, Parser-Inventar und offene übrige Choice-Familien erneut
   messen. Eine zweite Family wird nur als eigenes Paket zugeschnitten.

## 5. Abnahmekriterien und Gates

- Beide Fortsetzungen verwenden exakt die ausgewählte `originActionId` und
  die zugehörige Agenda; ein anderer Plan, eine andere Action oder ein anderer
  State darf nicht konvertieren.
- Die AI liest in beiden migrierten Resolvern keine semantischen Fakten mehr
  aus `choice.source`.
- Die Engine akzeptiert weiterhin nur aktuelle `LegalAction`s; `applyAction`,
  Replay, RNG, StateHash und Hidden-Info-Verträge bleiben unverändert.
- Fokustests in Shared, Engine und AI bestehen, einschließlich einer
  PlayerView-/Redaction-Prüfung für die Continuation.
- Vor Abschluss mindestens Shared-/Engine-/AI-Typecheck, relevante Vitest-
  Dateien, `check:ai`, Paketgrenzen und `git diff --check` ausführen.

## 6. Risiken und bewusste Folgearbeit

Der optionale Vertrag ist ein gezielter Kompatibilitätsschnitt, keine
Generalisierung. Insbesondere Such-, Trace-, Install-, Damage- und
Hidden-Zone-Choices behalten ihre etablierten `source`-Provenienzformate,
bis ein eigener Producer-/Consumer- und Visibility-Audit vorliegt. Eine
versteckte Fallback-Lektüre von `source` in den beiden migrierten Resolvern
wäre kein Abschluss dieses Pakets.

Führender Ausgangspunkt ist
`docs/reviews/ai/ai-plan-first-runtime-cutover-final-review-2026-07-25.md`.
