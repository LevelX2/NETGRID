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

