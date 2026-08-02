# Disgruntled-Runfenster: Abschlussreview

Datum: 2026-08-02

## Ergebnis

Die fehlende Planmodulabdeckung für Disgruntled Ice Technician im
`run.jack_out_window` ist geschlossen. Die echte Engine-LegalAction wird mit
vollständiger Quellen-, Fähigkeits- und Zielbindung vom bestehenden Owner
`runner.convert_run_window` bewertet. Der produktive Pfad erzeugt weder eine
zweite Entscheidungsautorität noch eine Karten-ID-, Deck-, Match- oder
Seed-Sonderlogik.

Die beiden reproduzierenden Hard-vs-Hard-Seeds enden nun als vollständige,
replay-stabile Spiele ohne Runtimefehler oder Illegal Action.

## Ursache und Fix

Die Engine kannte Quellenkartendefinition, Funktionsfamilie, Ziel-ICE und
Zahlbetrag, projizierte diese Tatsachen aber nicht vollständig in die
LegalAction. Die AI-Input-Allowlist entfernte außerdem die spezielle
Zielbindung. Dadurch sah der synthetische Test den richtigen Planowner,
während die echte Selfplay-Action fail-closed als ungedeckt abbrach.

Der korrigierte Vertrag ist vollständig funktionsbasiert:

- die Engine-LegalAction trägt `sourceDefinitionId`, die generische
  `abilityId=derez_fully_broken_passed_ice_and_end_run`, Ziel-ICE,
  Zieldefinition und Zahlbetrag;
- der side-sichere AI-Input erhält ausschließlich die benötigten generischen
  Quellen-, Fähigkeits-, Ziel- und Zahlungsfelder;
- `runner.convert_run_window` bindet dieselbe aktuelle Action-ID und dasselbe
  Ziel sowohl vor dem Server als auch in der Serverposition;
- unvollständige Fähigkeitsbindung bleibt
  `missing_plan_module_coverage`, während ein höherwertiger Access-Payoff den
  Trigger weiterhin bewusst dispositionieren kann.

## Nachlauffund

Nach der reparierten Technician-Entscheidung erreichte Seed 04 erstmals einen
unabhängigen Airport-Locker-Fall. Die Engine bot die Aktivierung bei sechs
Credits an, obwohl nach fünf Aktivierungskosten kein normal bezahlbares
Programmziel übrig blieb, und lehnte die zuvor selbst angebotene Action dann
mit `ERR_INVALID_TARGET` ab.

Der enge Regelvertrag ist deshalb ebenfalls an der Engine-Autorität behoben:
Die Ziellegalität einer kostenpflichtigen Stack-Installation wird gegen die
nach Aktivierungskosten verbleibenden Credits geprüft. Ein fokussierter
Engine-Test sichert den Sechs-Credit-Gegenfall. Diese Änderung fügt dem
Technician-Plan keine Airport-Locker-Strategie hinzu.

## Reproduzierende Seeds

Gemeinsame Konfiguration:

- Corp `standard_corp_neon_escrow`, Hash `fnv1a:f84df6c9`;
- Runner `standard_runner_rent_i_con_shellspiel_2026_07_17`, Hash
  `fnv1a:518ccd75`;
- beide Seiten `hard` und `current_candidate`;
- maximal 480 Aktionen.

| Seed | Ergebnis | Aktionen | Züge | Hash |
| --- | --- | ---: | ---: | --- |
| `neon-escrow-counterbank-rent-02` | Corp, 7:0 | 327 | 42 | `fnv1a:e30663ba` |
| `neon-escrow-counterbank-rent-04` | Corp, 7:0 | 196 | 28 | `fnv1a:28708942` |

Beide Läufe haben null Runtimefehler, Illegal Actions, Fallbacks und Timeouts;
Replay und StateHash-Prüfung sind grün. Das Spielergebnis ist nur Kontext und
kein isolierter Stärkenachweis.

## Verifikation

- spielgleicher Decision Checkpoint: 1/1 grün;
- fokussierte Post-Pass-Live-Runtime: 4/4 grün;
- Disgruntled-/Disintegrator-Enginevertrag und Airport-Locker-Gegenfall grün;
- Engine-Typecheck grün;
- AI-Typecheck grün, isoliert mit 8-GB-Node-Heap nach reproduziertem
  Standardheap-OOM;
- `check:ai` und `check:ai-deck-doctrine-strategy` grün;
- drei AI-Shards: 185/1835, 185/1551 und 184/1171 grün;
- `git diff --check` grün.

## Architektururteil

`runner.convert_run_window` bleibt Root-/Leaf-Owner der Entscheidung.
Choice-Auflösung, Action-ID, Executor, Step und Zielauswahl werden nicht
umgebogen. Der Fix erweitert eine bestehende planinterne Route und die bereits
autoritative Engine-Projektion; es existiert kein neuer Resolver, Override,
Fallback oder Karten-ID-Chooser. Es bleiben keine offenen Punkte aus diesem
Fehlerpaket.
