# Counterbank-Fortschrittsschutz: Red Evidence und Vorherpanel

Datum: 2026-08-02

Status: P1 abgeschlossen, produktiver Fix noch nicht enthalten

Git-Basis: `b7bdbbfdc`

## Ergebnis zuerst

Der Fehler liegt im bestehenden Owner `corp.score_agenda`: Der
Same-Turn-Conversion-Solver erzeugt eine Agenda-Installationsroute, deren
`rootReplacement: asset_to_agenda` die für einen späteren
`move_advancement`-Schritt reservierte Counterquelle selbst zerstört. Der
Plan wählt diese mechanisch nicht ausführbare Route trotzdem als
`sameTurnGuaranteed`.

Der Fehler ist weder eine Engine- noch eine Choice-Resolver-Frage. Die Engine
liefert getrennte, aktuelle LegalActions für die Installation in einem neuen
Remote und für das Replacement im Bank-Remote. Der Scoreplan muss die
unzulässige planinterne Route verwerfen.

## Spielgleiche Reproduktion

Die privilegierte Roh-Evidence
`data/local/neon-escrow-vapor-selfplay-2026-08-02-seed02.json` zeigt an
Action 161:

- eine gerezzte Vapor-Ops-Bank mit zwei Advancement-Countern in `remote_1`;
- Project Zurich in HQ;
- eine gültige Installation in `new_remote`;
- eine gültige Same-Root-Installation mit
  `rootReplacement: asset_to_agenda` in `remote_1`;
- eine gültige Transferaktion von Vapor Ops;
- drei vom Solver als `sameTurnGuaranteed` markierte Pfade.

Sowohl der Cross-Remote- als auch der Same-Root-Pfad reservieren zwei Counter
derselben Vapor-Ops-Instanz. Der Same-Root-Pfad beginnt aber mit der
Zerstörung dieser Instanz. Der produktive Chooser wählt dennoch die
Same-Root-Installation über `corp.score_agenda` und
`corp_same_turn_score_conversion:install_score_target`.

## Rote Tests

Zwei Ebenen sichern denselben Fehler:

1. `tactical-plan-corp-score-conversion.test.ts` erwartet ausschließlich den
   Cross-Remote-Pfad. Unverändert liefert der Solver zusätzlich den
   Same-Root-Pfad mit derselben Reservation `{ vapor: 2 }`.
2. `plan-first-live-runtime.test.ts` erwartet die aktuelle LegalAction
   `install-zurich-new-remote`. Unverändert wählt der produktive Chooser
   `replace-vapor-with-zurich` bei identischem Owner
   `plan_first.corp.score_agenda`.

Ausgeführte fokussierte Befehle:

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/plans/tactical-plan-corp-score-conversion.test.ts -t "rejects a same-root install" --reporter=verbose
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/plan-first-live-runtime.test.ts -t "preserves a reserved counter bank" --reporter=verbose
```

Beide Tests sind ausschließlich an der erwarteten Cross-Remote-Aktion rot;
Planowner und Fallback-Vertrag bleiben dabei bereits korrekt.

## Zehn-Seed-Vorherpanel

Gemeinsame Konfiguration:

- Corp: `standard_corp_neon_escrow`, `fnv1a:f84df6c9`;
- fünf Seeds gegen
  `standard_runner_rent_i_con_shellspiel_2026_07_17`,
  `fnv1a:518ccd75`;
- fünf Seeds gegen `standard_runner_blink_pressure_rig`,
  `fnv1a:39d02d0b`;
- beide Seiten `hard` und `current_candidate`;
- maximal 480 Aktionen;
- Seednamen `neon-escrow-counterbank-{rent|blink}-01` bis `-05`.

| Gegner     | Seed | Ende            | Sieger | Aktionen | Corp-AP | Runner-AP | Replay |
| ---------- | ---- | --------------- | ------ | -------: | ------: | --------: | ------ |
| Rent-I-Con | 01   | Agenda-Punkte   | Corp   |      300 |       7 |         0 | grün   |
| Rent-I-Con | 02   | Runtime Failure | n/a    |      277 |       2 |         3 | grün   |
| Rent-I-Con | 03   | Agenda-Punkte   | Corp   |      253 |       7 |         0 | grün   |
| Rent-I-Con | 04   | Runtime Failure | n/a    |       50 |       1 |         0 | grün   |
| Rent-I-Con | 05   | Agenda-Punkte   | Corp   |      364 |       7 |         2 | grün   |
| Blink      | 01   | Flatline        | Corp   |      179 |       0 |         3 | grün   |
| Blink      | 02   | Corp-Deck leer  | Runner |      390 |       4 |         6 | grün   |
| Blink      | 03   | Agenda-Punkte   | Corp   |      368 |       7 |         2 | grün   |
| Blink      | 04   | Flatline        | Corp   |      242 |       4 |         0 | grün   |
| Blink      | 05   | Agenda-Punkte   | Corp   |      383 |       7 |         5 | grün   |

Die beiden Rent-I-Con-Runtimefehler sind unabhängige Vorbefunde:
`runner.trigger_ability` für Disgruntled Ice Technician besitzt im
`run.jack_out_window` keine Planmodulabdeckung. Diese Fehler werden im
Nachherpanel separat verglichen und gehören nicht zum Counterbank-Scope.

## Beobachteter Counterbank-Fehler im Panel

Das Vorherpanel enthält acht Vapor-Ops-Installationen, fünfzehn Advances,
acht Cashouts und einen Transfer. Blink-Seed 05 reproduziert zusätzlich den
Fortschrittsverlust:

- Action 91 installiert Hostile Takeover in `remote_1` und ersetzt dabei
  eine Engine-zertifizierte Vapor-Ops-Bank mit drei Countern;
- Owner und Route sind `corp.score_agenda` und
  `corp_same_turn_score_conversion:install_score_target`;
- danach folgen nur zwei Basic Advances und `corp.complete_turn`, kein
  Sofortscore;
- der Runner contestet den fortgeschrittenen Remote unmittelbar.

Damit ist auch im festen Vorherpanel belegt, dass die Route nicht nur
theoretisch unmöglich ist, sondern produktiven Bankfortschritt vernichtet und
ihren behaupteten Same-Turn-Abschluss verfehlt.

## P2-Vertrag

P2 schützt eine aktuelle, gültig gequotete Counterbank mit positivem
Counterbestand im Zielroot. Eine Replacement-Installationsroute ist nur dann
zulässig, wenn keine produktive Bank zerstört wird oder eine eng belegte
terminale Ausnahme den bewussten Verzicht rechtfertigt. Der Cross-Remote-
Handoff, Bankaufbau, Cashout, Null-Counter- und gewöhnliche Asset-Routen
bleiben unverändert. Es entsteht kein zweiter Controller und keine
Resolverlogik.
