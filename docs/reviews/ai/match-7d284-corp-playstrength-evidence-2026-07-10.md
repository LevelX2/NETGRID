# Match 7d284 Corp Play-Strength Evidence

## Match

- ID: `match_7d284874cdf8a712`
- Speicher: `data/runtime/multiplayer/netgrid.sqlite`, read-only ausgewertet
- Modus: `human_runner_vs_corp_ai`, Schwierigkeit Hard
- Abschluss: Runner gewinnt 7:4 über Agenda-Punkte
- Umfang: 423 Events, 423 Snapshots, 155 detaillierte KI-Traces
- Runtime-Gesundheit: 0 Fallbacks, 0 Timeouts, 0 Debug-/Action-Abweichungen

## Befunde

1. StateVersion 4: `Cortical Scrub` wird vor ein leeres neues Remote gelegt,
   während R&D offen bleibt. Der anschließende R&D-Zugriff kostet die Corp zwei
   Agenda-Punkte.
2. Nur 29 von 94 freiwilligen Entscheidungen sind plangebunden. Der
   Setup-Punish-Plan mappt in StateVersion 186 und 195 zusätzlich die
   Marine-Arcology-Geldfähigkeit; konkrete Rez-Pläne mappen teilweise andere
   Rez-Quellen.
3. StateVersion 393: `Project Zurich`, `Systematic Layoffs`, 9 Credits und drei
   Klicks ergeben einen vollständigen Same-Turn-Scorepfad. Der Planer erzeugt
   ihn nicht und der Runner stiehlt anschließend genau `Project Zurich`.
4. `Corporate Retreat` verbleibt ab Corp-Zug 17 dreizehn Corp-Züge in HQ,
   obwohl `corp.fast_advance` und später akuter Scoreline-Zwang aktiv sind.
5. StateVersion 309 bis 311: `Project Babylon` wird installiert und nur einmal
   advanced, obwohl der eigene Trace `window_kind:unsafe` und sicheren
   Runner-Zugriff bei einem sichtbaren Break-Credit meldet. Die Agenda wird im
   folgenden Runner-Zug gestohlen.
6. StateVersion 332: `Systematic Layoffs` wird neben `Corporate Retreat` und
   zwei Kopien `BBS Whispering Campaign` abgeworfen. Der Trace meldet
   `own_hand_future_play_plan_model:not_modelled`.
7. Mindestens eine BBS-Kopie liegt seit der Starthand, später liegen zwei in HQ;
   keine wird in 29 Zügen installiert. Marine Arcology wird vierzehnmal für
   drei Credits aus zwei Klicks verwendet.
8. StateVersion 375: ein sechstes `Data Wall` vor R&D kostet fünf Credits und
   erzeugt nur einen sichtbaren Break-Credit. StateVersion 384: ein weiteres
   `Filter` mit sichtbaren Breakkosten null wird trotz `hold_for_later`
   installiert.
9. StateVersion 49 und 399: äußeres ICE wird gerezzt, obwohl die Ausgabe das
   Budget unter die Rez-Kosten eines inneren ICE drückt. Der vorhandene
   Reserveschutz wirkt nur mit `-30` Punkten.
10. Root-Karten werden beim ersten Rez-Fenster aufgedeckt. `Setup!` wird in
    StateVersion 221 gerezzt, obwohl sein Zugriffseffekt auch verdeckt auslöst;
    andere Root-Effekte werden nicht bis zum letzten notwendigen Fenster
    zurückgehalten.

## Ursachen

- Action-spezifische Pläne verwenden zu breite semantische Step-Mappings.
- Der Score-Conversion-Planer konsumiert nur aktuell legale
  Advancement-Fähigkeiten und projiziert keine nach Installation legal werdende
  Operation.
- Die Scoring-Horizon-Berechnung zählt fälschlich einen Klick für das Scoren.
- Unsichere Scoring-Window-Evidence wirkt bei normalen Agenda-Risiken nicht als
  Ausschluss; die Prepared-Remote-Wertung nutzt rohe ICE-Anzahl zu stark.
- Corp-Discard bewertet Einzelkarten, nicht gemeinsam ausführbare Scorepfade.
- Ein persistenter Plan für wiederholbare installierte Economy fehlt.
- ICE-Grenznutzen und Restpfad-Rezbudget sind gegenüber pauschalen
  Schutzkomponenten zu schwach gewichtet.
- Non-ICE-Rez wird wie eine allgemeine sofortige Schutzaktion behandelt und
  kennt keinen spätesten notwendigen Timingpunkt.

## Behebung

1. Eine frühe Central-Baseline priorisiert konkreten R&D-/HQ-Schutz vor dem
   ersten leeren Remote-Aufbau.
2. Action-spezifische Score-, Advance-, Punish- und Rez-Schritte tragen
   konkrete `actionCandidateIds`; Root-Rez wird nicht länger als ICE-Defense
   geplant.
3. Der Score-Conversion-Plan projiziert geprüfte sichtbare Advancement-
   Operationen über die Agenda-Installation hinweg. Scoring kostet korrekt
   keinen Klick.
4. Sichtbare Agendas erzeugen auch ohne semantischen Candidate-Hinweis einen
   Mehrzug-Scoreline-Plan mit drei Zügen Horizont.
5. Verzögerte, vor dem Score sicher erreichbare Agenda-Linien erhalten einen
   harten Unsafe-Abzug; ausdrücklich ermittelte Deckout-Notlinien bleiben
   möglich.
6. Geprüfte Advancement-Bursts erhalten beim Discard einen starken Keep-Wert,
   solange eine sichtbare Agenda sie verwerten kann.
7. Endliche Action-Economy erhält `corp.develop_finite_economy`: BBS wird
   installiert, gerezzt und vor der nächsten Kopie vollständig geleert.
8. Dritte und spätere ICE-Layer berücksichtigen Installationskosten und
   sichtbare reale Breakkosten als Grenznutzen.
9. Das Budget für innere ICE wird nicht mehr auf einen wirkungslosen
   zweistelligen Normalisierungsscore reduziert, sondern wirkt als direkter
   Pfadmalus.
10. Access-Ambushes wie Setup bleiben verdeckt; runrelevante Root-Karten
    werden erst beim letzten relevanten ICE-/Zugriffsfenster positiv bewertet.

## Verifikation

- fokussierte Plan-, Scoreline-, Discard-, Economy-, Placement-, Triage- und
  Rez-Timing-Regressionen: grün;
- `@netgrid/ai` Typecheck: grün;
- AI-Shard 1: 95 Dateien, 570 Tests;
- AI-Shard 2: 94 Dateien, 651 Tests;
- AI-Shard 3: 94 Dateien, 608 Tests;
- `check:ai`: grün, vorhandene nicht blockierende Hint-Warnungen unverändert;
- `check:package-boundaries`: grün;
- keine Engine-, LegalAction-, Replay-, StateHash-, Randomness- oder
  Hidden-Info-Vertragsänderung.
