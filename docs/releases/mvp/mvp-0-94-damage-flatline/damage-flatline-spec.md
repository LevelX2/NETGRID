# Damage/Flatline 0.94 Spec

Status: eingefroren
Stand: 2026-05-04

## Zweck

Diese Spezifikation beschreibt den engen V0.94-Mechanikvertrag für Damage und Flatline. Sie erweitert V0.93 additiv und startet keinen vollen Setup-/Mulligan-, Trace-, Resource- oder Prevention-Scope.

## CR-Abgleich und lokale Entscheidung

Aus der CR-v26.03-Regelreferenz für den V0.94-Startscope:

- Meat- und Net-Damage werden gleich abgewickelt.
- Pro Damage-Punkt wird eine zufällig gewählte Karte aus dem Runner-Grip getrasht.
- Mehrere Damage-Punkte trashen die gewählten Karten gleichzeitig.
- Wenn der Runner mehr Damage nimmt, als Karten im Grip liegen, flatlined der Runner.

Lokale V0.94-Entscheidung:

- V0.94 implementiert nur `net` und `meat`.
- `core` bleibt nicht spielbar und wird höchstens als zukünftiger Typ vorbereitet.
- Wenn `amount > grip.length`, wird Flatline vor einer zufälligen Auswahl festgestellt. Dadurch entsteht kein unnötiger zusätzlicher Grip-Leak nach bereits beendetem Spiel.
- Wenn `amount <= grip.length`, wählt die Engine einen Batch ohne Replacement und bewegt alle gewählten Karten gemeinsam in den Heap.

## Typ- und State-Erweiterungen

Empfohlene additive Shared-Typen:

```ts
type DamageType = "net" | "meat" | "core";

type GameEndReason =
  | "agenda_points"
  | "corp_deck_empty"
  | "flatline"
  | "unknown";

type DamageRequest = {
  damageId: string;
  source: EffectSource;
  controller: Side;
  damageType: DamageType;
  amount: number;
  timingPoint: TimingPointId;
};
```

V0.94 muss `core` ablehnen, solange keine Core-Damage-Counter- und Handlimit-Regeln umgesetzt sind.

`GameState` sollte einen optionalen oder direkten `gameEndReason` bekommen. Existing Result Summaries, PlayerViews und WebSocket-Payloads dürfen den Grund nur als enumartige Information weitergeben, nicht mit privaten Zusatzdaten.

## Damage-Auflösung

Mindestablauf:

1. Eine legale Engine-Aktion oder ein Resolver erzeugt eine validierte Damage-Anforderung.
2. `applyAction` revalidiert Action, Side, StateVersion, Timing, Kosten, Ziele, Quelle und freigegebenen Damage-Typ.
3. Die Engine lehnt nicht-positive Amounts für spielbaren Damage ab oder behandelt sie als keinen Effekt; der gewählte Pfad muss getestet und dokumentiert sein.
4. Bei `amount > runner.grip.length` setzt die Engine `winner: "corp"`, `phase: "game_over"` und `gameEndReason: "flatline"`.
5. Bei überlebtem Damage erzeugt die Engine eine Batch-Auswahl aus Runner-Grip ohne Replacement.
6. Die Auswahl nutzt Seed, RandomCounter und RandomDrawRecords. Keine Auswahl darf außerhalb dieser Infrastruktur entstehen.
7. Alle ausgewählten Karten wechseln fachlich gleichzeitig in den Runner-Heap.
8. Die Engine schreibt ein Damage-Event mit `visibilityClass: "hidden_info_barrier"`.
9. `checkWinConditions` oder der Game-End-Checkpoint bewahrt den Flatline-Grund deterministisch.

## RandomDrawRecords

V0.94 darf einen Batch-Record oder einen Record pro gewählter Karte verwenden. Der gewählte Ansatz muss stabil sein und in Replay reproduziert werden.

Empfohlener Batch-Zweckstring:

```txt
damage:<damageId>:<damageType>:<sourceKind>:<amount>:selection:<index>
```

Der Zweckstring darf keine Kartentitel, DefinitionIds oder verdeckte Zone-Reihenfolgen enthalten.

## Sichtbarkeit

Öffentliche Damage-Zusammenfassung darf enthalten:

- Damage-Typ,
- Damage-Menge,
- abstrakte Quelle, soweit diese öffentlich bekannt ist,
- ob Flatline eingetreten ist,
- Anzahl getrashter Karten nach überlebtem Damage.

Nicht öffentlich vor oder während der Auswahl:

- vollständige Runner-Grip-Liste,
- nicht ausgewählte Grip-Karten,
- interne Randomwerte als Informationskanal,
- private Resolver-Targets,
- gegnerische Optionslisten.

Nach überlebtem Damage gelten getrashte Karten im Runner-Heap nach dem bestehenden PlayerView-Vertrag als sichtbar. Das ist keine zusätzliche Vor-Damage-Leakage, sondern die sichtbare Folge der Zone-Bewegung.

## Event- und Undo-Vertrag

Damage-Events:

- tragen `visibilityClass: "hidden_info_barrier"`,
- blockieren Undo über das Event hinweg,
- verwenden redigierte PublicPayloads,
- dürfen im privaten lokalen Replay notwendige vollständige Details enthalten, solange diese nicht in PublicEvents, PlayerViews, WebSocket, Reconnect, Undo-Previews, Logs, Fehler oder AI-Inputs gelangen.

Flatline-Events:

- setzen `winner: "corp"`,
- setzen `gameEndReason: "flatline"`,
- senden side-sichere Match- und Result-Payloads,
- enthalten keine vor-Flatline-Grip-Zusammensetzung.

## Testfixture und spielbare Karten

V0.94 darf für Tests eine lokale/fiktive Damage-Quelle ergänzen, bevorzugt eng:

- eine ICE-Subroutine `do_damage` oder eine lokale Operation mit klarer LegalAction,
- keine offizielle Karte,
- kein Trace- oder Prevention-Text,
- keine Ressource oder Identity-Fähigkeit.

Eine solche Karte wird erst spielbar, wenn Manifest, Resolver, Unit-Test, Szenario, Visibility, Replay/StateHash, AI-Smoke und Multiplayer-Smoke vorhanden sind.

## No-Scope Guards

Die Implementierung muss aktiv prüfen, dass keine dieser Action- oder Mechanikfamilien sichtbar wird:

- `prevent_damage`,
- Avoid/Interrupt/Replacement,
- Trace-/Bid-Choices,
- Resource-Install oder Resource-Trash,
- Mulligan-Choice,
- Multiaccess-/Breach-Queue,
- Identity-Setup- oder Triggerfähigkeit,
- Hosting, Virus, Purge oder neue Counterfamilien.
