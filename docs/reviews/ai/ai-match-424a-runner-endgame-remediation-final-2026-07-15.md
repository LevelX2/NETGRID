# Match 424A: Runner-Endgame-Remediation Final Review

## Ergebnis

Die freigegebenen Runner-Findings aus `match_424abdd1c7ac054d` sind auf dem
aktuellen KI-Stand generisch geschlossen. Die Analyse umfasste alle 155
persistierten Runner-Entscheidungen. Sie führte zu sieben spielgleichen
Match-Checkpoints, textgenauen Hint-Verträgen und mehreren Gegenproben für
normale Installations-, Bank-, Run- und Choice-Situationen.

Vor den jeweiligen Produktionsänderungen waren sechs ursprüngliche
Match-Zielverträge und der nachträglich ergänzte Fall-Guy-Vertrag ausschließlich
als `behavior_regression` rot. Der MRAM-Zielpunkt war auf aktuellem Code bereits
grün und blieb deshalb eine Gegenprobe statt eines künstlich erzeugten Fixes.
Nach der Umsetzung sind alle Match-424A-Verträge unverändert grün.

Nachtrag vom 19.07.2026: Der spätere Doppelbedrohungs-Reservevertrag ersetzt
bei D154 ausschließlich die damalige Aktionskontrolle `draw_card`. Hinter dem
Remote liegen zwei öffentliche Advancement-Counter, die Corp steht bei sechs
Agenda-Punkten und der Runner kann mit seinem letzten Click sechs gespeicherte
Broker-Credits für den nächsten Zug mobilisieren. Diese Auszahlung ist die
konkretere Vorbereitung des 20-Credit-Remote-Pfads. Der eigentliche
F06-Vertrag – Krash-Coverage vorhanden, Pfad aber `blocked_unpayable` mit Kosten
14 – bleibt unverändert geprüft.

## Spielgleiche Verträge

| Finding  | Zustand      | Roter Ausgang                                   | Finaler Vertrag                                                                                            |
| -------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 424A-F01 | D111 / sv202 | negatives zweites Force Shield verdrängt Krash  | negative Backup-Installation darf einen sichtbaren Coverage-Gewinn nicht planbedingt blockieren            |
| 424A-F02 | D134 / sv245 | Inside Job auf bekannt wertlose Archives        | Run-Events übernehmen Ausschlüsse und sichtbaren Zielkontext ihres projizierten Runs                       |
| 424A-F03 | D143 / sv265 | auf aktuellem Code bereits kein zweites MRAM    | Handgrößen-Hardware wird nicht über Titelheuristik als MU-Support behandelt                                |
| 424A-F04 | D146 / sv273 | Broker-Aufbau vor Matchpoint-Remote-Information | SeeYa und vergleichbare Werkzeuge erhalten nur bei sichtbarer terminaler Remote-Gefahr ihren Kontextnutzen |
| 424A-F05 | D151 / sv283 | Ziehen statt Pfadöffnung oder Funding           | verbesserbarer Matchpoint-Pfad erzeugt eine kurze sichtbare Vorbereitungssequenz                           |
| 424A-F06 | D154 / sv286 | installierter Krash als fehlende Wall-Coverage  | vorhandene Coverage plus zu geringe Gesamtkasse ergibt `blocked_unpayable` mit vollständiger Pfadquote     |
| 424A-F10 | D69 / sv122  | `pass` trotz legalem Fall Guy                   | sichtbare Tag-Vermeidung wird im exakten Event-Modification-Fenster gegenüber `pass` gewählt               |

Die Capture-Rebases ab D146 und bei D69 sind in der Red-Evidence dokumentiert.
Sie behalten Engine-State, PlayerView, LegalActions und öffentliches Eventpräfix
des historischen Entscheidungspunkts bei und ersetzen keine fachliche
Expectation.

## Generische Korrekturen

1. Force Shield besitzt keine Economy-Recovery-Planrolle mehr. Core Command
   verlangt einen erfolgreichen HQ-Run; Broker wird als Hosted-Credit-Bank und
   nicht als Trash-Rekursion beschrieben. Aktive, kompilierte und abgeleitete
   Hint-Artefakte wurden gemeinsam aktualisiert.
2. Run-Events verwenden ihre konkrete `RunnerRunTargetEvaluation`. Archives-
   und Remote-Ausschlüsse greifen damit auch für Ereignisse; erreichbare
   projizierte HQ-/R&D-Runs erhalten Ziel- und Zentraldruck nur bei einer
   eigenen `run_now`-Empfehlung. Ein unzahlbarer Disgruntled-Ice-Technician-
   Pfad verdrängt dadurch keinen zahlbaren normalen Run.
3. Terminale Remote-Werkzeuge werden aus sichtbarer Matchpoint-Gefahr,
   konkretem Ziel, Pfadverbesserung und LegalAction-Semantik bewertet.
   Forged Activation Orders, SeeYa, Broker-Cashout und Burst-Economy bleiben
   unterschiedliche Schritte; ein Ability-Typ allein erfüllt keinen Bankplan.
4. Die Mehr-ICE-Pfadquote behält strukturierte Breaker-Coverage auch dann, wenn
   nach einem bezahlbaren äußeren ICE ein späteres ICE nicht mehr bezahlbar ist.
   Fehlende Coverage und fehlende Gesamtkasse bleiben getrennte Diagnosen.
5. Plan-Arbitration schützt einen gerade finanzierten, neuen Handkartenplan,
   lässt aber negative Backup-Installationen und unproduktive Run-Varianten
   weichen. Ein Bankplan ohne konkreten Fundingbedarf bleibt Hintergrund und
   darf bei sichtbarem Schadens-/Handpufferdruck vom Ziehen unterbrochen werden.
6. Die Choice-Auflösung erkennt die strukturierte Quelle
   `v120.event_modification.avoid` und wählt eine vorhandene legale
   Tag-Vermeidungsoption. Ohne solche Quelle bleibt `pass` unverändert legal.

Es gibt keine Match-ID-, Seed-, Deck-, Karteninstanz- oder Fall-Guy-Sonderregel
in der Produktionslogik. Die Regeln erzeugen weiterhin alle LegalActions; die
KI bewertet nur die vorhandenen Aktionen und Choices aus der side-sicheren
PlayerView.

## Regressionsfunde aus dem breiten Lauf

Der erste vollständige P5-Lauf deckte sechs bestehende Verträge auf, die durch
die neue Semantik berührt wurden: Checkpoint-Modulownership, der generierte
Hint-Inspector-Index, Hintergrund-Broker gegen Handpuffer, finanzierter
Cybermodem, Inside Job auf R&D und dessen Follow-up-Gegenprobe. Alle wurden
ohne Abschwächung ihrer Erwartungen geschlossen.

Ein anschließender Full-Suite-Lauf fand genau eine weitere Überdehnung:
`Disgruntled Ice Technician` erhielt R&D-Zielwert, obwohl sein eigener
projizierter Pfad `blocked_unpayable` war. Die zentrale Projektion ist deshalb
an die eigene `run_now`-Empfehlung gebunden. Der normale, durch eingeschränkte
Breaker-Credits erreichbare R&D-Run bleibt die Auswahl; Inside Job auf seinem
erreichbaren Bypasspfad bleibt ebenfalls grün.

## Verifikation

```text
Match-424A-Paket: 10/10 Tests grün
Fokussierter P5-Satz: 8 Dateien, 137/137 Tests grün
Zusätzlicher Disgruntled-Gegenlauf: 6 Dateien, 44/44 Tests grün
Vollständige @netgrid/ai-Suite: 333/333 Dateien, 2253/2253 Tests grün
@netgrid/ai Typecheck: grün
corepack pnpm check:ai: grün
AI Hint Inspector: 618 Karten, 584 mechanisch, 337 generiert, 6 Overlays
Action-Signal-Katalog: 618 aktiv, 602 abgedeckt, 34 zurückgestellt, 89 Target-Gaps
git diff --check: grün
```

Die vorhandenen `check:ai`-Warnungen bleiben nicht blockierende
Qualitätsschuld; alle fünf Teilgates melden null harte Fehler. Zusätzliche
Selfplays, Behavior-Baselines oder Simulationsspiele wurden nicht ausgeführt,
weil der freigegebene Scope die historischen, spielgleichen Zustände und ihre
Gegenproben absichert.

## Abschlussbewertung

Die KI spielt den belegten Endgame-Kontext jetzt kohärenter: Sie nutzt eine
sofort verfügbare Tag-Vermeidung, trennt Coverage von Bezahlbarkeit, bewertet
Run-Events nach ihrem wirklichen Zielpfad und kann einen blockierten
Matchpoint-Remote über sichtbare Informations-, Pfadöffnungs- und
Funding-Schritte vorbereiten. Gleichzeitig bleiben normale Bankzyklen,
finanzierte neue Entwicklung, echte Coverage-Pläne und unproduktive direkte
Runs durch Gegenverträge geschützt.
