# Match 66d7685ec050af48 – unabhängige KI-Remediation

Status: **fokussiert umgesetzt und verifiziert**  
Stand: 2026-08-09  
Match: `match_66d7685ec050af48`

## Scope

Dieser Fix schließt ausschließlich zwei von einer künftigen internen
Zugsimulation unabhängige Ursachen aus der Spielanalyse:

1. falsche Admission inkrementeller Coverage-Finanzierung;
2. definitionsweite Zusammenfassung mehrerer sichtbarer Broker-/Bankkopien.

Nicht enthalten sind eine neue TurnPlanner-Suche, Spielzustandskopien,
Mehrzug-Rollouts oder eine neue Endzustandsbewertung.

## Ursachen und Korrekturen

### Harte Coverage-Finanzierung

`runner.rig_and_coverage` reserviert den Installationsklick und verlangt eine
im aktuellen Zug vollständig finanzierbare Zielkarte. Der bisherige Aufruf
reduzierte dieses harte Ziel bei `allowIncrementalProgress` jedoch auf
`currentCredits + 1`. Dadurch erschien ein einzelner Basic Credit als
garantierte P4-Finanzierungsroute, obwohl die eigentliche Installation danach
weiterhin unbezahlbar blieb.

Der Coverage-Pfad übergibt jetzt unverändert die vollständigen Zielkosten an
die bestehende Funding-Suche. Eine Route entsteht nur bei garantiertem
Same-Turn-Abschluss mit `projectedGap = 0`. Inkrementeller allgemeiner
Reservefortschritt bleibt davon getrennt.

### Broker-/Bankinstanzen

`DeckCapabilityProfile` fasste sichtbare Karten gleicher Definition bisher zu
einem Bankwerkzeug zusammen. Bestand, Cashout, Build-Actions und Planidentität
konnten dadurch zwischen zwei Broker-Kopien vermischt werden. Zusätzlich
sperrte eine Ereignisprüfung nach `sourceDefinitionId` alle Geschwisterkopien,
sobald irgendein Broker im Zug geladen worden war.

Bankwerkzeuge werden jetzt pro sichtbarer `sourceCardInstanceId` erzeugt. Jede
Instanz bindet ausschließlich ihre eigenen aktuellen LegalActions, ihren
eigenen Bestand und ihren eigenen `runner.credit_bank`-Dedupe-Key. Die
definitionsweite Ereignissperre ist entfernt: Ob die konkrete Fähigkeit noch
verfügbar ist, bestimmt allein die aktuelle Engine-LegalAction.

Der bereits produktive frühe Broker-Installationspfad bleibt beim Owner
`runner.credit_bank` und ist mit seiner exakten Installationsaction
regressionsgeschützt.

## Ownership und Sicherheitsgrenzen

- Coverage-Ziel und Installationsbedarf: `runner.rig_and_coverage`;
- Finanzierung: exakt gebundener `runner.economy`-Support;
- Bankinstallation, Laden und Cashout: `runner.credit_bank` innerhalb des
  Runner-Economy-Moduls;
- Legalität und Quellenverfügbarkeit: aktuelle Engine-`LegalActions`.

Es entstand kein zweiter Chooser, Resolver-Shortcut oder Hidden-Info-Pfad.
Planinstanz, Step, Route und aktuelle Action-ID bleiben gebunden.

## Verifikation

- `deck-capabilities.test.ts`: zwei Broker werden mit getrennten Beständen und
  getrennten Build-/Cashout-Actions projiziert;
- `plan-first-live-runtime.test.ts`: frühe Broker-Installation bleibt beim
  Bankowner; nach Laden der ersten Kopie bleibt die zweite legale Kopie als
  eigener Executor nutzbar; ein einzelner Credit gilt nicht als vollständige
  Snowball-Finanzierung;
- fokussierter Lauf: `6/6` grün;
- `@netgrid/ai`-Typecheck: grün;
- AI-Source-Structure und Reachability: grün, keine Runtime- oder Typzyklen.

Der vollständige angrenzende Runtime-Testlauf besitzt auf dem Ausgangsstand
sechs bekannte rote Tests. Fünf davon verwenden bekannte gerezzte ICE ohne
den inzwischen verpflichtenden Engine-Quote; der sechste war die veraltete
Broker-Erwartung „Credit statt früher Installation“ und wurde in diesem Scope
an den bereits produktiven gewünschten Ownervertrag angepasst. Die fünf
unabhängigen Quote-Fixture-Lücken bleiben außerhalb dieses Fixes sichtbar.
