# Counterbank-Fortschrittsschutz: Zehn-Seed-Abschlussreview

Datum: 2026-08-02

Kandidatenstand: `28b765831`

## Ergebnis zuerst

Der Fix wirkt eng und fachlich richtig. Neun der zehn identischen
Seed-Konfigurationen bleiben bis zum finalen StateHash unverändert. Genau der
eine Seed mit einer positiven Same-Root-Counterbank-Vernichtung divergiert:
Blink-Seed 05 behält Vapor Ops, installiert Hostile Takeover in einen neuen
Remote, transferiert alle drei Counter und scoret die Agenda unmittelbar.

Die Zielmetrik fällt von einer auf null positive Same-Root-Replacements. Der
produktive Owner bleibt in der gesamten korrigierten Route
`corp.score_agenda`; nur die durch den Plan gewählte Installations-LegalAction
ändert sich. Die Transfer-Choice bleibt im automatischen Engine-Fenster und
ändert weder Server noch Strategie.

## Identische Konfiguration

- Corp: `standard_corp_neon_escrow`, `fnv1a:f84df6c9`;
- Rent-I-Con: `standard_runner_rent_i_con_shellspiel_2026_07_17`,
  `fnv1a:518ccd75`;
- Blink: `standard_runner_blink_pressure_rig`, `fnv1a:39d02d0b`;
- beide Seiten `hard` und `current_candidate`;
- maximal 480 Aktionen;
- Seeds `neon-escrow-counterbank-{rent|blink}-01` bis `-05`;
- Vorher- und Nachhertraces lokal unter `data/local/`, nicht versioniert.

## Ergebnisvergleich

| Gegner     | Seed | Vorher                              | Nachher                     | Finaler Hash         |
| ---------- | ---- | ----------------------------------- | --------------------------- | -------------------- |
| Rent-I-Con | 01   | Corp, Agenda-Punkte, 300 Aktionen   | identisch                   | identisch `e04c84af` |
| Rent-I-Con | 02   | bekannter Runner-Runtimefehler, 277 | identisch                   | identisch `e57b8720` |
| Rent-I-Con | 03   | Corp, Agenda-Punkte, 253            | identisch                   | identisch `78291632` |
| Rent-I-Con | 04   | bekannter Runner-Runtimefehler, 50  | identisch                   | identisch `54bba8d3` |
| Rent-I-Con | 05   | Corp, Agenda-Punkte, 364            | identisch                   | identisch `844accb8` |
| Blink      | 01   | Corp, Flatline, 179                 | identisch                   | identisch `56663fd9` |
| Blink      | 02   | Runner, Corp-Deck leer, 390         | identisch                   | identisch `992fba5d` |
| Blink      | 03   | Corp, Agenda-Punkte, 368            | identisch                   | identisch `f55be2ee` |
| Blink      | 04   | Corp, Flatline, 242                 | identisch                   | identisch `c3a4ed76` |
| Blink      | 05   | Corp, Agenda-Punkte, 383            | Runner, Corp-Deck leer, 396 | gezielt divergent    |

Siege sind hier Kontext und kein isolierter Stärkenachweis. Die abweichende
Partie spielt nach dem korrigierten Score eine längere, andere Folgepartie;
deren späteres Ergebnis bewertet nicht den lokalen Fix.

## Action-genauer Fixnachweis in Blink 05

Vorher:

- Action 91: Hostile Takeover ersetzt Vapor Ops mit drei Countern in
  `remote_1`;
- Actions 92 und 93: zwei Basic Advances;
- Action 94: `corp.complete_turn`, kein Score;
- der Runner contestet den fortgeschrittenen Remote.

Nachher:

- Action 91: Hostile Takeover wird über dieselbe Planroute in `new_remote`
  installiert;
- Action 92: `corp.score_agenda` aktiviert die gebundene Vapor-Ops-
  Transferaktion;
- Action 93: das Engine-Fenster bewegt exakt drei Counter von Vapor Ops auf
  Hostile Takeover; Quelle danach null, Ziel danach drei;
- Action 94: `corp.score_agenda` scoret Hostile Takeover und erhält fünf
  Credits.

Damit sind Plan, Route, Actionbindung und Engine-Fortsetzung konsistent. Es
existiert weder ein globaler Override noch eine strategische Choice-Logik.

## Counterbank-Metriken

| Metrik                                | Vorher | Nachher |
| ------------------------------------- | -----: | ------: |
| Vapor-Ops-Installationen              |      8 |       9 |
| Vapor-Ops-Advances                    |     15 |      16 |
| Cashouts                              |      8 |       9 |
| Transfers                             |      1 |       2 |
| positive Same-Root-Replacements       |      1 |       0 |
| direkt nach Transfer gescorte Agenden |      1 |       2 |

Der zusätzliche Transfer ist die korrigierte Hostile-Takeover-Sequenz. Der
bereits vorher funktionierende Babylon-Handoff bleibt unverändert.

## Nebenideen-Audit

### Experimental AI

- Installationen: 13 vorher, 15 nachher;
- Advances: 5 vorher, 6 nachher;
- Runner-Contests gegen einen Remote mit sichtbarer Experimental AI: 16
  vorher, 14 nachher;
- elf Experimental-AI-Accesses und anschließende Trashes im Nachherpanel;
- ein tatsächlich belegter Programm-Trash-Effekt kam nicht zustande: `n/a`.

Das Panel belegt damit Bluff-/Contest-Nutzung, aber keinen Effektwert.

### Bizarre Encryption Scheme

- Installationen: 9 vorher, 11 nachher;
- vier Accesses im Nachherpanel mit aktivem
  `delayedAgendaAccessReplacement`-Enginevertrag;
- keine Agenda wurde in denselben Runs tatsächlich verzögert: `n/a`.

### Chicago Branch

- 14 Installationen vor und nach dem Fix;
- keine bezahlte Aktivierung im Panel: `n/a`.

### Babylon und Zurich

- fünf Project-Babylon- und acht Project-Zurich-Scores im Nachherpanel;
- keine dieser Agenden erhielt einen Overadvance-Ertrag: `n/a`.

Die nicht beobachteten Effekte werden ausdrücklich nicht als Erfolg gezählt.
Sie sind keine Regression des Counterbank-Fixes; neun identische Hashes und
die eng lokalisierte zehnte Abweichung sprechen gegen eine unbeabsichtigte
globale Verhaltensänderung.

## Harte Gates und bekannte Fremdevidence

In allen acht vollständig beendeten Spielen gelten:

- null Illegal Actions;
- null Fallbacks und Timeouts;
- null Replayfehler;
- kein Action-Limit;
- keine Hidden-Info- oder Redaction-Auffälligkeit.

Rent-I-Con 02 und 04 reproduzieren vor und nach dem Fix bytegleich denselben
bereits in P1 klassifizierten Fremdfehler:
`missing_plan_module_coverage` für die Runner-Trigger-Aktion von Disgruntled
Ice Technician im `run.jack_out_window`. Dadurch weist das Gesamtpanel formal
je zwei Runtime Failures und `illegalActions` aus. Dieser unveränderte
Runner-Ownerfehler gehört nicht zum freigegebenen Counterbank-Scope und wird
nicht als Erfolg des Fixes umgedeutet.

## Freigabeurteil

Der Counterbank-Fortschrittsschutz ist für die lokale Integration freigegeben:

- rote Solver- und Runtime-Evidence grün;
- positive Bankvernichtung im identischen Panel 1 → 0;
- echte Cross-Remote-Transfer-/Score-Sequenz belegt;
- neun unveränderte Endzustände;
- fokussierte Tests, AI-Typecheck, AI-Gates und drei AI-Shards grün;
- bekannte unabhängige Runner-Runtimefehler transparent separiert.
