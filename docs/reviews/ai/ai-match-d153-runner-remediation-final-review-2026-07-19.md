# Match D153: Runner-Remediation Final Review (2026-07-19)

## Ergebnis

Das zuletzt beendete Spiel `match_d1532f829371a95f` ist vollständig über 190
gespeicherte KI-Entscheidungen analysiert. Der Corp-Sieg war nicht durch einen
Engine- oder LegalAction-Fehler verursacht. Entscheidend waren strategische
Runner-Fehler: überalterter HQ-Druck, ein zu lange verfolgter Remote,
unwirtschaftliche Run-Fortsetzung, verspätete Broker-Liquidität und eine
fehlende Kreditreserve für die Doppelbedrohung aus R&D-Druck und Remote-Contest.

Zwölf unveränderte spielgleiche Checkpoints bilden acht Fehlerklassen und eine
positive Kontrolle ab. Alle bestehen auf dem finalen Stand.

## Zugurteil

### Sinnvoll oder richtig

- **D7:** Der frühe unbekannte Remote war ein legitimer Informations- und
  Access-Run. Einen Credit zu zahlen, um den Zugriff zu erhalten, war besser
  als die Subroutine das Runende auslösen zu lassen.
- **D61:** Der erstmalig mit ICE versehene HQ-Server war ein neues öffentliches
  Informationssignal. Dieser HQ-Facecheck bleibt ausdrücklich erlaubt.

### Nicht sinnvoll

- **D24, D32 und D50:** Wiederholte agenda-freie HQ-Zugriffe bei dauerhaft null
  HQ-ICE, während die Corp andere Server schützte, waren ein starkes
  öffentliches Gegenindiz. Weitere HQ-Runs und der daran gebundene Plan
  verschwendeten Clicks.
- **D124:** Die generische Bank-Planbindung konnte eine Junkyard-BBS-Fähigkeit
  als Cash-out mappen. Das war semantisch falsch, obwohl die Aktion legal war.
- **D131:** Der Remote-Plan blieb an einem klar negativen, nicht mehr sinnvoll
  erreichbaren Ziel hängen und blockierte bessere Alternativen.
- **D134:** `continue_run` hätte vier End-the-run-Subroutinen ausgelöst. Eine
  vorhandene und bezahlbare Pump-/Break-Sequenz musste zuerst beginnen.
- **D161:** Der weitere Archives-Check war gegenüber dem Spielstand zu klein.
  Im Remote lag bereits eine fünfmal avancierte verdeckte Karte hinter einem
  geschätzten 24-Credit-Pfad. Der Runner hätte die tiefe Contest-Reserve weiter
  aufbauen müssen.
- **D167:** Ein sofortiger R&D-Run hätte den Kreditpolster unter die
  Remote-Contest-Schwelle gedrückt. Bei einer sechsmal avancierten verdeckten
  Remote-Karte und einem geschätzten 33-Credit-Pfad war Broker-Cash-out die
  richtige Vorbereitung für den Remote-Run im Folgezug.
- **D179 und D185:** Broker-Guthaben war zwar gespeichert, wurde aber nicht als
  unmittelbar konvertierbare Finanzierung des sonst unbezahlbaren R&D-Pfads
  erkannt. Damit fehlte genau die vom Spielstand verlangte dauerhafte
  R&D-Drucklinie.

## Ursachen und Korrekturen

### HQ-Sättigung als side-safe Evidenz

Die neue Sensorik zählt nur öffentlich sichtbare agenda-freie HQ-Zugriffe und
vergleicht die ICE-Verteilung. Ab drei solchen Zugriffen, null HQ-ICE und
mindestens zwei ICE auf anderen Servern entsteht ein begrenzter Malus. Er
behauptet keine verdeckte Kartenposition.

Der vollständige Testlauf führte zu wichtigen Grenzen:

- bekannte HQ-Agenda hebt den Malus auf;
- bei höchstens zwei fehlenden Agenda-Punkten bleibt HQ eine echte
  Closeout-Chance;
- neu installiertes HQ-ICE setzt das Negativindiz aus;
- ein günstiges, konkret nutzbares HQ-Erfolgsfenster bleibt wertvoll;
- ein bekanntermaßen teurer R&D-Pfad gewinnt nicht allein durch den HQ-Malus.

### Plan- und Encounter-Disziplin

Ein stark negativer Remote-Run darf einen Plan nicht gegen eine deutlich
bessere Alternative festhalten. TacticalGoal-Schutz bleibt jedoch für einen
positiven, tatsächlich bereiten R&D-Pfad bestehen. Pumpen gilt nur dann als
access-erhaltender Fortschritt, wenn die aktuelle Run-Pfadquote genau diese
Pump-Aktion als ersten Schritt einer vollständigen Sequenz ausweist. Dadurch
bleibt das korrekte Aufgeben eines aussichtslosen Reinforced-Wall-Runs erhalten.

### Broker als konvertierbare Finanzierung

Broker-Cash-out wird jetzt als konkreter FundingNeed erkannt, wenn mindestens
zwei Clicks verbleiben, der Run aktuell unbezahlbar ist, gespeichertes Guthaben
ihn aber finanzierbar macht und das Ziel ein Score-Threat, hoher Payoff oder
unbekanntes R&D ist. Ein bereits bezahlbarer wertvoller Run hat Vorrang vor
Cash-out.

Build- und Cash-out-Schritte tragen exakte ActionCandidate-IDs aus dem
Capability-Consumer. Dadurch kann Junkyard BBS nicht mehr als Bankaktion
einspringen und zwei Broker-Instanzen bleiben korrekt getrennt.

### Kreditpolster für die Doppelbedrohung

Die Runner-Ökonomie unterscheidet nun zwischen dem Kreditkern für einen tiefen
Remote-Contest und der darüberliegenden R&D-Ausgabeschicht. Für ein Remote mit
mindestens zwei ICE wird die Reserve aus sichtbaren Pfadkosten, einem begrenzten
Risikoaufschlag für unrezztes ICE und einem Restpolster nach dem Run berechnet.
Ein R&D-Run ist erst freigegeben, wenn

1. der gesamte verfügbare Pool die Remote-Reserve plus die Kosten eines
   weiteren R&D-Runs deckt und
2. nach dem aktuellen R&D-Run noch mindestens die Remote-Reserve übrig bleibt.

Zum verfügbaren Pool zählen liquide Credits und über strukturierte, aktuell
legale Broker-Payout-Aktionen mobilisierbare Credits. Broker-Einzahlungen gelten
dagegen nicht als neues Einkommen: Sie verschieben nur Liquidität. Eine bereits
avancierte unbekannte Remote-Karte aktiviert die Reserve sofort. Ohne akute
Remote-Bedrohung darf terminaler Zentraldruck die Reserve übersteuern, damit die
KI eine reale letzte Siegchance nicht durch endloses Sparen verpasst.

Die Reserve ist bewusst begrenzt: maximal 36 Credits für den Remote-Kern, 20
Credits für die R&D-Schicht und 56 Credits für die gesamte Runway. Damit entsteht
glaubwürdiger Remote-Druck, ohne dass die KI grundsätzlich nur noch hortet.

## Hint- und Consumer-Audit

Der wiederhergestellte Audit
`scripts/audit-ai-deck-hint-consumers.ts` arbeitet auf der aktuellen
Single-Source-Architektur. Er prüft für jede Deckkarte:

1. Hint gegen Seite, Kartentyp und Reviewstatus;
2. strukturierte Engine-Effekte gegen die behauptete Hint-Semantik;
3. jedes befüllte Hint-Feld gegen einen benannten Consumer-Vertrag;
4. Capability- und Strategieprofile;
5. source-gebundene ActionSemanticCandidates;
6. exakte LegalAction-Bindings und die tatsächlich ausgewählte Entscheidung.

Die Audits der D185- und D167-Checkpoints umfassen jeweils 19 eindeutige Karten
mit 45 Kopien und melden `status: ok`, null Blocker und null Warnungen. Bei Broker stimmen
Engine-Effekte `add_hosted_credits:3` und `take_hosted_credits:all`, Hint,
Capability, beide Build-Aktionen, die eine Cash-out-Aktion und der finale
`runner_bank_cashout_gate` überein. Junkyard ist in keiner Bankbindung.

Der Audit fand außerdem eine falsche Consumer-Aussage: Aus „Put 3“ wurde
`maxKnownCapacity: 3` abgeleitet. Broker besitzt kein Kapazitätslimit; 3 ist
der Einzahlungsbetrag pro Aktion. Das tote und fachlich falsche Feld wurde
entfernt.

Maschinenlesbare Evidence:
`docs/reviews/ai/ai-match-d153-hint-consumer-audit-2026-07-19.json`.

## Verifikation

| Check                                  | Ergebnis                           |
| -------------------------------------- | ---------------------------------- |
| D153-Entscheidungscheckpoints          | 12/12 grün                         |
| fokussierte Taktik-/Entscheidungstests | 211/211 grün                       |
| AI-Shard 1                             | 137 Dateien, 994 Tests grün        |
| AI-Shard 2                             | 137 Dateien, 993 Tests grün        |
| AI-Shard 3                             | 136 Dateien, 826 Tests grün        |
| AI-Gesamtabdeckung über Shards         | 410 Dateien, 2.813 Tests grün      |
| AI-Typecheck                           | grün                               |
| `check:ai`                             | grün, null Harderrors/Zyklen       |
| Package-Boundaries und Test-Discovery  | grün                               |
| D167 Hint-/Consumer-Audit v2           | 19 Karten, 45 Kopien, 0/0 Findings |
| `git diff --check`                     | grün                               |

Engine-Regeln, Hidden-Info-Redaktion, Replay, StateHash, Randomness und
Kartenpool wurden nicht verändert. Es gibt keine Match-ID-, Karten-ID- oder
Instanz-Sonderregel.
