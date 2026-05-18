# Proteus Purge-/Action-Debt-Vertrag

Stand: 2026-05-17
Status: planning contract, no runtime implementation

## Zweck und Scope

Dieses Artefakt schneidet den Proteus-spezifischen Virus-Purge als eigenen Timing- und Action-Debt-Vertrag aus dem allgemeinen Counter-/Virus-Cluster. Es ist Planungsinput fuer spaetere Engine-Arbeit und erzeugt keine Runtime-Implementierung, keine Proteus-Kartenpromotion, keine Decklegalitaet und keine AI-Hints.

Der Vertrag gilt fuer Proteus-Runner-Virus-Counter aus dem Cluster `virus_antibody_counter_family`, insbesondere `doom`, `crumble`, `garbage`, `highlighter`, `scaldan`, `tax`, `vienna`, `socket_*` und `pipe`.

Lokale Quellen:

- `docs/releases/proteus/virus-antibody-counter-contract.md`
- `docs/releases/mvp/mvp-0-99-hosting-virus-counters/virus-purge-spec.md`
- `docs/source/Proteusspoiler.txt`
- `docs/source/Netrunner Errata 1.70.md`
- `data/rules/proteus-mechanics-coverage-2026-05-17.json`

## Abgrenzung zu V0.99-Purge

Proteus-Purge darf nicht als Alias fuer die vorhandene V0.99-Corp-Basic-Action modelliert werden.

| Feld | V0.99-Purge | Proteus-Purge |
| --- | --- | --- |
| Timing | `corp_action.main` | Spezialeffekt-/Rez-aehnliche Fenster, inklusive Run- und Start-of-turn-Zwischenfenster |
| Kosten | sofort genau 3 Korp-Aktionen/Clicks | sofortige Purge-Erklaerung plus `forgo next three actions` als zukuenftige Aktionsschuld |
| LegalAction-Art | normale Main-Action `purge_virus_counters` | eigener Interrupt-/Special-Effect-Action-Typ, nicht als Main-Action-Clickzahlung |
| Zielmenge | vorhandene purgefaehige Virus-Counter auf Karten | alle purgefaehigen Runner-Virus-Counter in Registry-Scope `corp`, `server`, `card` oder `effect` |
| StateHash | entfernte Counter und Clickkosten | entfernte Counter plus strukturierte, kumulierbare Aktionsschuld |
| No-Scope | keine Proteus-Spezialfenster | keine Antibody-Folgezähler, keine Advancement-Counter, keine AI-/Promotion-Aussage |

## Timingfenster

Proteus-Purge ist eine Korp-Entscheidung in Fenstern, in denen Spezialeffekte oder Rez-Entscheidungen erlaubt sind. Der Vertrag benoetigt deshalb eine eigene Timingprojektion statt einer einfachen Main-Window-LegalAction.

Minimaler Timingvertrag fuer spaetere Implementierung:

1. Die Korp darf Proteus-Purge nur ueber eine von `getLegalActions` erzeugte LegalAction waehlen; `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timingfenster, aktuellen Resolver-Frame und vorhandene purgefaehige Counter.
2. Waerend eines Runs darf die LegalAction nur in explizit modellierten Spezialeffektfenstern erscheinen, nicht waehrend atomarer Subroutine-, Damage-, Access- oder Choice-Aufloesung.
3. Am Korp-Start-of-turn darf die Korp vor einem eigenen Start-of-turn-Effekt purgen, sofern ein Spezialeffektfenster offen ist. Danach wird die Start-of-turn-Reihenfolge mit dem aktualisierten Counter- und Debt-State fortgesetzt.
4. Bei mehreren getrennten Scaldan-Start-of-turn-Wuerfen entsteht zwischen den einzelnen Wuerfen ein erlaubtes Zwischenfenster. Ein Purge nach einem Wurf entfernt die uebrigen Scaldan-Counter, sodass keine weiteren Scaldan-Wuerfe fuer entfernte Counter erzeugt werden.
5. Bei Viral Pipeline darf die Korp vor dem Pipe-Start-of-turn-Action-Debt purgen und dadurch Pipe-Counter entfernen. Wenn die Runner-Seite in einem vorherigen Spezialeffektfenster aus Socket-Countern einen Pipe-Counter erzeugen darf, muss diese Runner-Prioritaet vor der Korp-Purge-Projektion respektiert werden.
6. Die Korp-Mandatory-Draw bleibt kein Action-Fenster und wird nicht durch Action-Debt uebersprungen.

Dieser Vertrag beschreibt nur die erlaubten Fenster. Die konkrete UI-Fuehrung, Hotkey-Reihenfolge und Resolver-Queue gehoeren in ein spaeteres Runtime-Paket.

## Action-Debt-Modell

Die Purge-Erklaerung entfernt sofort alle purgefaehigen Proteus-Runner-Virus-Counter und legt danach eine StateHash-relevante Aktionsschuld an.

Empfohlene abstrakte Struktur:

```ts
corpActionDebt: {
  forgoActionsPending: number;
  entries: Array<{
    reason: "proteus_virus_purge" | "pipe_counter" | string;
    remaining: number;
    createdAtStateVersion: number;
    source: "proteus_purge" | "start_of_turn_effect" | string;
  }>;
}
```

Vertragliche Anforderungen:

- Eine Proteus-Purge-Erklaerung addiert exakt `3` auf die Korp-Aktionsschuld.
- Action-Debt ist kein sofortiger Clickabzug und darf auch dann angelegt werden, wenn die Korp im aktuellen Zug weniger als drei verbleibende Aktionen hat.
- Debt wird bei den naechsten tatsaechlich verfuegbaren Korp-Aktionen abgetragen. Zweckgebundene Zusatzaktionen duerfen Debt erfuellen, wenn sie ansonsten als ausgebbare Aktion zaehlen.
- Debt ist kumulierbar. Zwei Purges vor vollstaendigem Abtrag ergeben sechs zu forgone Aktionen, nicht zwei getrennte konkurrierende Zustaende mit unklarer Reihenfolge.
- Debt-Abtrag darf keine verdeckten Daten beruehren und keinen Zufall ziehen.
- `stateVersion`, Replay und StateHash muessen Debt-Anlage, Debt-Kumulation und Debt-Abtrag deterministisch abbilden.

## Counter-Zielmenge

Proteus-Purge entfernt nur purgefaehige Runner-Virus-Counter:

- `doom` von Armageddon
- `crumble`
- `garbage`
- `highlighter`
- `scaldan`
- `tax`
- `vienna`
- `socket_archives`, `socket_hq`, `socket_rd`
- `pipe`
- spaetere Runner-Virus-Counter nur nach ausdruecklichem Contract-Register-Eintrag

Nicht purgefaehig:

- `doppelganger_antibody`
- `pattel_antibody`
- Advancement-Counter auf `Viral Breeding Ground`
- Power-, agenda-, recurring-, mark-, bad-publicity- oder sonstige nicht als Proteus-Runner-Virus registrierte Counter

Die Registry muss den Counter-Scope explizit speichern. Der Subtype `virus` auf einer Karte reicht nicht aus, um alle Counter dieser Karte oder alle von ihr erzeugten Folgezustaende purgefaehig zu machen.

## Start-of-turn-Reihenfolge

Start-of-turn braucht eine deterministische Reihenfolge mit klaren Interaktionspunkten:

1. Korp-Mandatory-Draw wird abgehandelt und bleibt auch bei bestehendem Action-Debt erhalten.
2. Danach wird eine geordnete Liste offener Korp-Start-of-turn-Effekte aus dem State erzeugt.
3. Vor jedem einzeln aufloesbaren Effekt wird ein Spezialeffektfenster angeboten, falls die Timingregeln dies erlauben und purgefaehige Counter vorhanden sind.
4. Scaldan-Counter werden als einzelne Effekte oder als Liste einzelner Random-Frames projiziert. Jeder Wurf nutzt Seed, `randomCounter` und `RandomDrawRecords`; entfernte Scaldan-Counter erzeugen keine spaeteren Wuerfe.
5. Pipe-Counter erzeugen je Counter einen Start-of-turn-Effect `forgo 1 action`. Vor dessen Abtrag kann die Korp purgen und den Pipe-Counter entfernen; bereits abgehandelte Pipe-Effekte bleiben abgehandelt.
6. Proteus-Purge-Debt wird erst bei naechsten tatsaechlichen Korp-Aktionen abgetragen, nicht beim Mandatory-Draw und nicht beim reinen Auflisten von Start-of-turn-Effekten.

Wenn mehrere Start-of-turn-Familien gleichzeitig existieren, muss die gewaehlte Reihenfolge im EventLog oder in einem replayfaehigen Resolver-Frame nachvollziehbar sein. Eine implizite Array-Reihenfolge aus Objektiteration ist nicht ausreichend.

## Pipe- und Scaldan-Interaktion

Scaldan:

- Jeder Scaldan-Counter ist ein eigener Random-Frame.
- Zwischen Scaldan-Frames darf die Korp Proteus-Purge waehlen.
- Ein Purge entfernt alle uebrigen Scaldan-Counter und verhindert weitere Wuerfe aus diesen entfernten Countern.
- Bereits erzeugte Bad-Publicity-Erhoehungen bleiben bestehen und laufen danach durch das separate Bad-Publicity-Loss-Gate.

Viral Pipeline:

- Socket-Counter bleiben purgefaehige Proteus-Runner-Virus-Counter.
- Wenn ein legales Runner-Spezialeffektfenster die Umwandlung von `socket_archives`, `socket_hq` und `socket_rd` in `pipe` erlaubt, muss diese Umwandlung vor der Korp-Purge-Prioritaet in diesem Fenster stattfinden.
- Pipe-Counter selbst sind purgefaehig.
- Ein Pipe-Counter, der am Korp-Start-of-turn nicht gepurged wurde, erzeugt einen eigenen `forgo 1 action`-Start-of-turn-Effekt.
- Pipe-Debt und Proteus-Purge-Debt muessen gemeinsam kumulierbar sein. Beispiel: ein nicht gepurgter Pipe-Counter plus anschliessender Proteus-Purge ergibt insgesamt vier forgone Aktionen, sofern beide Debt-Quellen wirksam werden.

## PublicPayload- und Visibility-Vertrag

Proteus-Purge ist oeffentlich, darf aber keine Hidden-Info aus HQ, R&D, Stack, Grip, Archives-facedown, Reconnect-Payloads oder KI-Inputs leaken.

Erlaubte PublicPayload-Felder:

- `eventType: "proteus_virus_purge_declared"`
- `side: "corp"`
- `purgedCounterSummary`: aggregierte Liste aus `counterType`, `scope`, `countRemoved`
- `actionDebtAdded: 3`
- `corpActionDebtTotalAfter`
- `timingWindowId` oder abstrakte Timingfamilie wie `run_special_effect`, `corp_start_of_turn_between_effects`
- `randomRecordIdsConsumed: []`

Nur bei ohnehin oeffentlichen Zielen erlaubt:

- `sourceCardDefinitionId`
- `publicCardInstanceId`
- `serverId`

Verboten:

- verdeckte Kartentitel oder DefinitionIds
- R&D-/HQ-Reihenfolge
- private Access-Queue-Positionen
- FullState-Auszüge
- private Choice-Alternativen
- Seed, RNG-Interna oder KI-Bewertungen
- Counter-Kandidaten, die der jeweilige Spieler nicht legal kennen darf

Reconnect, Undo-Preview, Public Replay, Logs und AIInput duerfen dieselbe oeffentliche Zusammenfassung nutzen, aber keine reicheren Debugdaten transportieren.

## Replay- und StateHash-Anforderungen

Spaetere Tests muessen mindestens diese Invarianten pruefen:

- Gleicher InitialState plus gleiche PlayerActions erzeugt identischen finalen StateHash.
- Proteus-Purge entfernt alle und nur purgefaehige Proteus-Runner-Virus-Counter.
- Die Aktionsschuld wird beim Purge sofort StateHash-relevant und bleibt ueber Zugwechsel erhalten, bis sie deterministisch abgetragen ist.
- Mehrfacher Purge vor Debt-Abtrag kumuliert.
- Mandatory-Draw findet trotz Debt statt.
- Scaldan-Wuerfe nutzen `RandomDrawRecords`; Purge zwischen Wuerfen entfernt die uebrigen Scaldan-Frames ohne zusaetzlichen RNG-Verbrauch.
- Pipe-Purge-Reihenfolge ist replaystabil und erlaubt der Korp, Pipe-Debt durch vorherigen Purge zu vermeiden, wenn das Timingfenster legal ist.
- PublicPayloads bleiben fuer Corp und Runner konsistent redigiert und enthalten keine verdeckten Karteninformationen.

## Testskizze fuer spaetere Harnesses

| Test-ID | Schwerpunkt | Erwartung |
| --- | --- | --- |
| P-PAD-T001 | V0.99-Abgrenzung | Proteus-Purge erscheint nicht als `corp_action.main`-Drei-Click-Action und beeinflusst den V0.99-Purge nicht. |
| P-PAD-T002 | Timing-Revalidation | Wrong-Side, stale `stateVersion`, falsches Timingfenster und erfundene Action werden abgelehnt. |
| P-PAD-T003 | Debt-StateHash | Purge addiert `3` Debt; Replay reproduziert Debt und StateHash. |
| P-PAD-T004 | Debt-Kumulation | Zwei Purges vor Abtrag ergeben sechs forgone Aktionen. |
| P-PAD-T005 | Mandatory-Draw | Korp zieht zu Zugbeginn trotz offener Aktionsschuld. |
| P-PAD-T006 | Counter-Taxonomie | Antibody-Folgezähler und Advancement-Counter bleiben nach Proteus-Purge bestehen. |
| P-PAD-T007 | Scaldan-Zwischenfenster | Purge zwischen zwei Scaldan-Wuerfen verhindert weitere Wuerfe und verbraucht keinen zusaetzlichen Zufall. |
| P-PAD-T008 | Pipe-Reihenfolge | Korp kann vor Pipe-Debt purgen; Runner-Socket-zu-Pipe-Prioritaet wird vorher respektiert. |
| P-PAD-T009 | PublicPayload | PublicEvent, WebSocket, Reconnect, Undo-Preview, Public Replay, Logs und AIInput enthalten nur aggregierte Counter- und Debt-Daten. |

## Handoff

Naechster sauberer Runtime-Schritt waere ein nicht promotender Engine-Harness fuer `corpActionDebt` und die Proteus-Purge-Timingfenster. Erst danach sollten Proteus-Runner-Virusprogramme Runtime-Fixtures bekommen. Dieses Artefakt gibt keine AI-Hints, keine Catalog-Promotion und keine Decklegalitaet frei.
