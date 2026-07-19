# Zentrale Credit-Gain-Pipeline – Final Review 2026-07-19

Status: vollständig umgesetzt und auf aktuellem `main`-Kombinationsstand final verifiziert

## Ergebnis

Alle produktiven Regelpfade, die Credits in den normalen Pool von Runner oder
Korp einbringen, verwenden jetzt `applyCreditGain` direkt oder den vollständig
delegierenden `credits`-Host. Die Engine besitzt damit genau eine normale
Gain-Mutationsgrenze. Setup-Anpassung, Setzen eines Creditstands, Bezahlen,
Creditverlust und Rückgabe ungenutzter temporärer Credits bleiben getrennte
Semantiken.

Der bestätigte Playtest-Fall ist behoben: Hat der Runner vor Finders Keepers
genau 7 Credits und Elena Laskova installiert, werden nach der Zahlung die
drei Würfel addiert und Elenas zusätzlicher Credit in derselben Gain-Auflösung
berücksichtigt. Eine Würfelsumme von 10 führt daher zu 11 Credits.

## Architekturvertrag

`CreditGainRequest` trägt Empfänger, Grundbetrag, Quellklasse und Grund. Für
Karteneffekte kommen Definition, optionale Instanz und stabiler Gain-Ordinal
hinzu. `CreditGainResult` trennt:

- Grundbetrag und Modifierbonus;
- angeforderten Gesamtbetrag;
- abgefangenen Betrag, etwa durch Korp-Forfeit-Debt;
- tatsächlich gutgeschriebenen Betrag und Kontostand danach;
- öffentliche Modifier-Quellen.

Elena ist ein generisch aus installierten CardImplementation-Daten gelesener
Modifier für den ersten positiven Creditgewinn eines Runner-Events. Der Bonus
ist Teil derselben Auflösung und erzeugt keinen rekursiven zweiten Gain. Der
Gain-Ordinal bleibt auch über CardEffect- und mehrstufige Würfel-Choice-
Fortsetzungen erhalten.

## Abgedeckte Pfade

- deklarative Credit-Effekte, temporäre Pool-Gutschriften und
  `EffectCommand.gain_credits`;
- gehostete Creditentnahme;
- Runner-Events und Korp-Operationsresolver;
- Access-, Damage-Replacement-, Rez-, Run-, Trace- und Subroutinepfade;
- installierte, Scored-Area-, Start-of-turn-, End-of-turn-, Virus- und
  Counter-Economy.

Der frühere separate Elena-Follow-up ist entfernt. Öffentliche Payloads tragen
bei Modifiern Grundbetrag, Bonus und öffentliche SourceDefinitionIds; keine
CardInstanceIds oder Hidden-Zone-Informationen werden neu veröffentlicht.

## Verifikation

| Gate                                        | Ergebnis                         |
| ------------------------------------------- | -------------------------------- |
| Exakter Elena-/Finders-Fall                 | grün, einschließlich Replay/Hash |
| Zentrale Kern-Unit-Tests                    | grün                             |
| Engine-Typecheck                            | grün                             |
| Engine-Gesamttests                          | 202 Dateien, 1.752/1.752 grün    |
| Shared-/Root-Contracttests                  | 4 Dateien, 20/20 grün            |
| Credit-Gain-Architekturguard                | grün                             |
| Produktive direkte `credits +=`-Fundstellen | nur zentraler Kern und Setup     |
| Format und `git diff --check`               | grün                             |
| Testdiscovery, Package-/Source-Boundaries   | grün, 0 relative Importzyklen    |

Der Arbeitsbranch ist mit dem aktuellen lokalen `main` synchronisiert und auf
dem kombinierten Stand final verifiziert. Nach dem lokalen Merge werden
Worktree und Arbeitsbranch entfernt. Eine Remote-Integration ist nicht Teil
dieses Prozesses.

## Führende Artefakte

- `docs/architecture/ability-engine/central-credit-gain-pipeline-process-2026-07-19.md`
- `docs/architecture/ability-engine/central-credit-gain-audit-2026-07-19.md`
- `packages/engine/src/game/economy/credit-gain.ts`
- `scripts/check-engine-credit-gain-boundary.mjs`
