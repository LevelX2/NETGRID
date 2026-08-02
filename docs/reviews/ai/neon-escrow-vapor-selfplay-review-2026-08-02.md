# Neon Escrow – Vapor-Ops-Selfplay-Review

Stand: 2026-08-02

Ergebnis: Standard-Deck freigegeben; technische Gates grün; produktive
Vapor-Ops-Counterbank in der integrierten Spielprobe noch nicht durchgehend
kohärent

## Deck- und Prüfkonfiguration

- Corp: `Neon Escrow`,
  `standard_corp_neon_escrow`, Deck-Hash `fnv1a:f84df6c9`
- Runner: `Rent-I-Con: Das Shellspiel`,
  `standard_runner_rent_i_con_shellspiel_2026_07_17`, Deck-Hash
  `fnv1a:518ccd75`
- beide Seiten: `current_candidate`, Schwierigkeit `hard`
- Aktionsgrenze: 480
- Seeds: `neon-escrow-vapor-01` und `neon-escrow-vapor-02`
- vollständige privilegierte lokale Audits:
  `data/local/neon-escrow-vapor-selfplay-2026-08-02.json` und
  `data/local/neon-escrow-vapor-selfplay-2026-08-02-seed02.json`

Die großen privilegierten Traces bleiben gemäß Retention lokal und werden
nicht versioniert.

## DeckDoctrine

Die Kartenkomposition wird nicht neutral oder semantisch unbekannt
eingestuft. Produktive Primärstrategien sind `corp.ice_tax_glacier`,
`corp.fast_advance` und `corp.remote_scoring`. Als Sekundärstrategien werden
`corp.overadvance_value`, `corp.central_stabilize`, `corp.ambush_bluff`,
`corp.rush_score` und `corp.asset_economy` erkannt.

Damit sind Vapor-/Advancement-Unterstützung, Remote-Scoring, Experimental-AI-
Bluff und Overadvance-Payoff in der DeckDoctrine sichtbar. Die folgenden
Abweichungen entstehen erst in der konkreten Planausführung.

## Seed 01

- reguläres Spielende nach 409 Aktionen und 52 Zügen;
- Runner gewinnt durch leeres Corp-R&D bei 5:6 Agendapunkten;
- Replay, Redaction und Runtime sind sauber;
- null Illegal Actions, Fallbacks, Timeouts und Runtimefehler;
- Doctrine-Diagnostik: ein Remote-Overbuild, 29 Economy-Stalls.

Vapor Ops wird als `score_decoy` installiert und einmal advanced. Der Runner
contestet den Remote unmittelbar und entfernt die Karte. Eine produktive
Dreier-Counterbank entsteht in diesem Seed nicht.

## Seed 02

- reguläres Spielende nach 246 Aktionen und 34 Zügen;
- Corp gewinnt durch Agendapunkte mit 7:2;
- Replay, Redaction und Runtime sind sauber;
- null Illegal Actions, Fallbacks, Timeouts und Runtimefehler;
- Doctrine-Diagnostik: kein Remote-Overbuild, elf Economy-Stalls.

### Positiver Nachweis

- `Experimental AI` wird vom zuständigen `corp.ambush_and_bluff`-Plan
  installiert und advanced. Der Runner contestet und entfernt den Bluff.
- `Systematic Layoffs` wird vom Scoreplan als exakte
  Advancement-Konversion verwendet.
- Der alte Vapor-Decoy-Plan lädt die Karte nach Rez und Liquidation nicht
  erneut auf. Der Fix aus Serie 82b2 hält; die späteren Advances gehören
  ausdrücklich zu `corp.score_agenda`.
- Fünf Agenden werden unter `corp.score_agenda` gescort; es gibt kein
  verpasstes legales Scorefenster.

### Reproduzierbarer Vapor-Restbefund

Die Sequenz der ersten Vapor-Instanz lautet:

1. Aktion 125: `corp.ambush_and_bluff` installiert Vapor Ops in Remote 1.
2. Aktion 126: derselbe Decoy-Plan legt einen Advancement-Counter.
3. Aktionen 127–128: `corp.score_agenda` rezzt und liquidiert den einzelnen
   Counter einmalig.
4. Aktionen 150 und 153: `corp.score_agenda` baut dieselbe Instanz erneut als
   Counterbank auf zwei Counter auf.
5. Aktion 161: `corp.score_agenda` installiert `Project Zurich` mit
   `rootReplacement: asset_to_agenda` und ersetzt dabei genau diese
   Vapor-Instanz, statt die Bank auf die Zielschwelle zu bringen und ihre
   Counter zu übertragen.

Damit ist die alte planübergreifende Re-Advance-Schleife behoben, aber der
produktive Scoreowner kann eine von ihm selbst erneut aufgebaute Bank noch
vor der Übergabe als Root ersetzen. Zwei bezahlte Advancement-Counter gehen
ohne Score-, Economy-, Schutz- oder Bluffwert verloren. Das widerspricht dem
bestehenden Counterbank-Vertrag, nach dem eine gebundene Bank nicht durch den
Agenda-Install ersetzt werden darf.

### Nebenideen

- `Experimental AI` funktioniert in dieser Probe als echter
  Advancement-Bluff.
- `Bizarre Encryption Scheme` erreicht seinen vorgesehenen Scoring-Remote
  nicht: eine Kopie wird verworfen, eine weitere nur als HQ-Overflow auf HQ
  installiert.
- `Chicago Branch` wird installiert, aber nicht aktiviert und später durch
  `Project Babylon` ersetzt.
- `Project Babylon` und `Project Zurich` werden ausschließlich mit ihrem
  Grundwert gescort; kein Overadvance-Bonus wird realisiert.

## Bewertung

`Neon Escrow` ist als legales, KI-unterstütztes und strategisch erkanntes
Standard-Deck spielbar. Die zwei Proben zeigen außerdem, dass es als
Diagnosedeck die beabsichtigten Score-, Bluff- und Counterbank-Owner erreicht.

Eine vollständige Freigabe der Aussage „Vapor Ops wird in diesem Deck
sinnvoll als Counterbank eingesetzt“ ist jedoch noch nicht möglich. Der
Root-Replacement-Fall benötigt einen eigenen Plan-first-Checkpoint und eine
gezielte Remediation im bestehenden Owner `corp.score_agenda`. Die
Nebenideen Bizarre Encryption und Chicago Branch bleiben nach diesen zwei
Seeds zusätzliche Play-Strength-Evidence, aber noch kein isoliert bewiesener
Fehlervertrag.
