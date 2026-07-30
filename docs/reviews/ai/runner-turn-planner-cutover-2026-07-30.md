# Runner-TurnPlanner – Cutover-Review

Stand: 2026-07-30

Paket: ZK13

Status: **angenommen**

## Ergebnis

Der Runner verwendet in der produktiven Standardkonfiguration jetzt wie die
Corp einen validierten `TurnPlan` als Ausführungsautorität. Jede produktive
Runner-Aktion wird vor ihrer Ausführung:

- als konkreter Planning Head aus einer aktuellen `LegalAction` gebunden;
- gegen StateVersion, Side, Aktionsmenge, Targets und routendefinierende
  Choices geprüft;
- in eine deterministisch begrenzte Restzuglinie aufgenommen;
- als `TurnPlanCommitment` plus Execution Lease gespeichert;
- unmittelbar vor der Ausführung autoritativ rematerialisiert.

Fehlende, mehrdeutige oder veraltete Bindungen brechen fail-closed ab. Der
frühere Einzelaktionspfad ist produktiv kein stiller Fallback. Er bleibt nur
über den ausdrücklich gesetzten Test- und Diagnosemodus `legacy_compare`
erreichbar.

## Runner-Vertikalschnitte

Die 13 registrierten Runner-Module besitzen einen expliziten
Horizon- und Aktionsfamilienvertrag. Die Coverage unterscheidet:

- Economy und wiederkehrende Ressourcen;
- Rig-, Breaker- und Recovery-Aufbau;
- Draw, Install und Handentwicklung;
- Central Pressure und Remote Contest;
- Run-, Breaker-, Access- und Multiaccess-Fortsetzung;
- Agenda- und Terminalpfade;
- Zugabschluss.

Kein Modul verwendet ein globales `*`-Produktivfallback. Campaign-fähige
Run-, Contest-, Terminal- und Agenda-Heads benötigen eine aktuelle
Runner-Campaign-Quote. Der bereits vorhandene `RunnerRunPlan` liefert dabei
nur revalidierten Domainkontext. Er ist keine zweite Auswahl- oder
Ausführungsautorität.

Die Fachmodule bestimmen weiterhin den validierten aktuellen Root anhand
von Priorität, Readiness und planinternem Wert. Der TurnPlanner bindet diesen
Root als erste Phase und bewertet die deterministischen Restaktionen. Damit
bleibt die über lange Decision-Checkpoint-Reihen kalibrierte
Runner-Fachentscheidung erhalten, während der Restzug nun Commitment,
Boundary, Lease und Neuplanung vollständig nutzt.

## Boundaries und Neuplanung

- Draw und andere private neue Informationen beenden die aktuelle Planung
  an einer `private_observation`-Grenze.
- Runstart endet an einem möglichen gegnerischen Reaktionsfenster.
- Run-, Breaker- und Access-Mikroschritte werden als
  `engine_continuation` revalidiert.
- Öffentlicher Zufall erzeugt eine `public_random_outcome`-Grenze.
- Ohne neue Information bleibt die gebundene Restzuglinie bestehen.
- Nach einer Grenze wird aus den neuen aktuellen `LegalActions` neu geplant;
  zukünftige Action-IDs werden nicht gespeichert.

## Gefundener Eigentümerkonflikt

Der erste vollständige Baselinelauf fand einen echten Fehler in einer durch
das geänderte Runner-Spiel neu erreichten Corp-Stellung. Night Shift war als
eigenständige Economy-Konversion ausführbar, wurde aber zugleich vom
Defense-Plan als unsichere Draw-Projektion abgelehnt. Die modulinterne
Defense-Ablehnung wurde fälschlich als globale Aktionsdisposition behandelt.
Der Scheduler erkannte die konkurrierende Ownership korrekt und brach mit
`missing_plan_module_coverage` ab.

Die Korrektur lässt eine abgelehnte Draw-Nutzung nicht mehr eine unabhängig
validierte Economy- oder andere exakte Planroute sperren. Die Entscheidung
bleibt damit lokal beim jeweiligen Fachplan. Der exakte Slot/Seed läuft
danach nach 164 Entscheidungen regulär aus; ein eigener Regressionstest
bindet den Zustand und die Corp-Economy-Ausführung.

Runtimefehler speichern zusätzlich die bereits side-sicher normalisierte
`removalCondition`. Dadurch ist ein künftiger Ownership-Konflikt aus der
Baseline direkt diagnostizierbar, ohne die private Buganzeige einzuschränken.

## Behavior Baseline

Der wiederholte Standardlauf umfasst sechs Slots, zehn Seeds und 60 Spiele:

- 13.641 KI-Entscheidungen;
- null illegale Aktionen;
- null Runtime-, Replay-, Fallback-, Timeout-, Hidden-Info- oder
  No-LegalAction-Fehler;
- genau ein klassifiziertes Action-Limit;
- `redactionSafe: yes`;
- Plan-Conversion 0,667 gegenüber 0,646 im Corp-Cutover-Referenzlauf;
- strategische No-Progress-Wiederholungen 3,827 statt 4,379 je 100
  Entscheidungen;
- keine klar dominierten Planentscheidungen.

Das einzige Action-Limit betrifft unverändert
`strategy_panel_fast_advance_chrome_rush` /
`ai-behavior-baseline-v1-02` und gehört zur bereits dokumentierten
Runner-Spätspielklasse `runner_late_gain_credit_real_reserve`. Mit
`maxActions=650` endet dasselbe Spiel nach 501 Aktionen regulär durch
Corp-Agenda-Punkte und ohne technischen Fehler.

Maschinenbericht:
`docs/reviews/ai/ai-behavior-baseline-v1-runner-turn-planner-cutover-2026-07-30.md`.
Die vollständigen Rohdaten bleiben unversioniert unter `data/local/`.

## Verifikation

- vollständige AI-Suite während des Runner-Cutovers: 530 Testdateien und
  4.337 Tests grün;
- post-fix Runner-Modul-, Runtime-, Coverage-, Vertical-Slice- und
  Baseline-Regressionen: 276/276 grün;
- AI-, Shared- und Web-Typecheck: grün;
- `check:ai` und Source-Structure:
  `production=748`, null Runtime- und Typzyklen;
- Proteus-Readiness: 154/154 Karten;
- Deck-Doctrine-Strategie-Gate: grün;
- private Debugexport-Prüfung: 1/1 grün;
- Formatprüfung und `git diff --check`: grün.

## Private Buganzeige

Die interne Betreiber-Buganzeige zeigt den vollständigen Runner-TurnPlan
einschließlich Heads, Linie, Phasen, Commitment, Lease, Boundary, Coverage,
Suche, Kampagnenquote und Vergleichsdaten. Sie zeigt außerdem weiterhin
bewusst sämtliche Karten und Hände beider Seiten. Für dieses privilegierte
Diagnosewerkzeug gilt keine seitensichere Informationsreduktion. Öffentliche
PlayerViews, Events, Replays und normale Logs bleiben davon getrennt.
