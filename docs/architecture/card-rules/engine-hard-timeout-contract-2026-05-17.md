# Engine-Vertrag für harte Timeout-Auflösungen

Stand: 2026-05-17
Status: Planungsvertrag, keine Implementierungsfreigabe
Quelle:
- `docs/architecture/live-match/visible-match-timer-system-concept-2026-05-17.md`
- `docs/architecture/live-match/timer-server-sync-contract-2026-05-17.md`

## Zweck

Dieser Vertrag schneidet harte Timeout-Auflösungen als späteren Engine-/Server-/Test-Slice. Er gibt keine direkte Umsetzung frei.

Harte Timeouts sind Regelwirkungen. Deshalb darf der Server bei Fristablauf keine Spielzustände direkt verändern und keine normale Client- oder KI-Aktion vortäuschen. Der Server darf nur eine explizite Timeout-Auflösung einreichen, die aus einem von der Engine erzeugten Timeout-Deskriptor stammt und von der Engine erneut validiert wird.

## Architekturentscheidung

- Die Rules Engine bleibt die einzige Regelautorität.
- UI-only- und Server-Sync-Timer bleiben Transport- und Anzeigemetadaten ohne Replay- oder StateHash-Wirkung.
- Harte Timeout-Folgen dürfen nur in Fenstern existieren, für die die Engine eine konkrete `timeoutPolicy` veröffentlicht.
- Die Engine validiert bei Timeout erneut `side`, `stateVersion`, `deadlineId`, Timingpunkt, offene Entscheidung, erlaubte Policy, Kostenfreiheit und Ziel-/Choice-Grenzen.
- Der Server beobachtet Fristen, erzeugt aber nur `ServerTimeoutResolution` auf Basis des aktuellen Engine-Deskriptors.
- Replay speichert die angewandte Timeout-Auflösung als deterministischen Schritt; die verstrichene Echtzeit selbst ist nicht replayrelevant.
- Der StateHash ändert sich nur durch die angewandte Engine-Auflösung, nicht durch Timer-Ticks oder Wall-Clock-Zeit.

## Timeoutfähige Entscheidungsfenster

Für den ersten harten Timeout-Slice sind nur eng begrenzte, engine-deklarierte Fenster zulässig:

| Fensterklasse | Erste Entscheidung | Zulässige Policy | Begründung |
| --- | --- | --- | --- |
| Optionale Reaktionsfenster ohne Kosten, Zielauswahl oder private Choice | zulässig | `auto_decline` | Sicherster Einstieg: Die Engine kann eine explizite Ablehnung anwenden, ohne private Daten oder Spielerpräferenz zu erraten. |
| Explizite Pass-/Prioritätsfenster mit genau einer enginebekannten Pass-Fallbackaktion | zulässig | `auto_pass` | Nur wenn die Engine selbst den Pass als gültige, kostenfreie Fallbackaktion deklariert. |
| Run- oder Encounter-Fenster mit öffentlichem Continue/Pass-Fallback | später zulässig | `auto_pass` oder enger Spezialvertrag | Nur nach eigener Run-spezifischer Testabdeckung, weil Jack-out, Rez, Encounter und Access Timingfolgen haben. |
| Normale Zugaktionsfenster | nicht im ersten Slice | später eventuell `end_turn` | Ein globales Auto-End-Turn ist zu grob und kann offene Pflichtentscheidungen überfahren. |
| Mandatory Choices mit verdeckten Karten, mehreren privaten Optionen oder Zielauswahl | nicht zulässig | keine | Die Engine darf keine verdeckte Spielerentscheidung raten. |
| Setup, Mulligan, Discard, Handlimit, Access-Auswahl, Hidden-Zone Search/Reorder | nicht im ersten Slice | keine | Diese Fenster enthalten private Auswahl, Fairness- oder Sichtbarkeitsrisiken. |
| Disconnect, Chat, Lobby, globale Partiezeit | nicht Engine-Scope | keine Engine-Policy | Keine Spielregelwirkung aus Transport- oder UGC-Zeit. |
| Kompetitiver Spielverlust | nicht Default | später eventuell `forfeit` | Nur in explizitem Modus mit Produkt-, Fairness-, Reconnect- und Missbrauchsgate. |

Ergebnis: Der erste Implementierungsschnitt darf nur `auto_decline` und enges `auto_pass` unterstützen. `end_turn` und `forfeit` bleiben Deferred Scope.

## Policy-Modell

Die Engine veröffentlicht Timeoutfähigkeit als Teil des aktuellen Entscheidungsdeskriptors, nicht als frei interpretierbares Serverfeld.

```ts
export type TimeoutPolicyKind =
  | "none"
  | "auto_decline"
  | "auto_pass"
  | "end_turn"
  | "forfeit";

export type EngineTimeoutPolicy = {
  policyId: string;
  deadlineId: string;
  kind: TimeoutPolicyKind;
  side: Side;
  stateVersion: number;
  timingPoint: TimingPointId;
  fallbackActionId?: string;
  fallbackLabel: string;
  hardLimitMs: number;
  graceLimitMs?: number;
  requiresConnectedClient?: boolean;
  hiddenInfoClass: "public_safe" | "owner_private";
  replayEventType: "timeout_resolution";
};
```

Pflichtregeln:

- `policyId` und `deadlineId` sind pro geöffnetem Entscheidungsfenster stabil, aber bei jedem relevanten State-/Timing-/Choice-Wechsel neu.
- `kind: "none"` ist der Default für alle Fenster.
- `fallbackActionId` darf nur auf eine aktuell legale, von der Engine erzeugte Fallbackaktion zeigen.
- `auto_decline` und `auto_pass` müssen kostenfrei sein und dürfen keine Ziel- oder Choiceauswahl benötigen.
- `end_turn` und `forfeit` sind im ersten Slice nicht erlaubt, auch wenn der Typ bereits vorbereitet wird.
- `hiddenInfoClass: "owner_private"` erlaubt nur side-private Detailprojektion für die betroffene Seite; die Gegenseite erhält höchstens einen generischen Timeoutstatus.

## Servergenerierte Timeout-Auflösung

Der Server reicht bei Fristablauf keine `PlayerAction` eines Menschen ein. Er reicht eine eigene servergenerierte Engine-Eingabe ein:

```ts
export type ServerTimeoutResolution = {
  type: "server_timeout_resolution";
  matchId: string;
  side: Side;
  stateVersion: number;
  deadlineId: string;
  policyId: string;
  observedAtMs: number;
  serverMonotonicSeq: number;
};
```

`observedAtMs` und `serverMonotonicSeq` dienen nur Audit, Ordnung und Redaction-fähiger Diagnose. Sie dürfen nicht selbst Teil des Engine-StateHash werden. Für Replay zählt die angewandte Timeout-Auflösung mit `deadlineId`, `policyId`, `side`, `kind` und resultierender Engine-Wirkung.

## Engine-Validierung

`applyAction` oder ein äquivalenter Engine-Einstieg muss Timeout-Auflösungen mit derselben Strenge validieren wie Spieleraktionen:

1. Match und GameState existieren und sind nicht terminal.
2. `stateVersion` entspricht dem aktuellen State.
3. `deadlineId` und `policyId` existieren im aktuellen offenen Entscheidungsfenster.
4. `side` ist die Seite, der das Fenster gehört.
5. Der Timingpunkt entspricht dem aktuellen Engine-Timing.
6. Die Policy ist nicht verbraucht, nicht abgelaufen durch Statewechsel und nicht durch Undo/Rewind invalidiert.
7. Die Fallbackaktion ist aktuell legal oder wird engineintern aus derselben LegalAction-Quelle neu abgeleitet.
8. Die Fallbackwirkung ist kostenfrei und benötigt keine zusätzliche Ziel-, Karten- oder Choiceauswahl.
9. Hidden-Info-Projektionen werden nach der Policy-Klasse erzeugt.
10. Nach Anwendung entstehen normale StateVersion-, Event- und StateHash-Folgen.

Stale Spieleraktionen, die nach einer Timeout-Auflösung eintreffen, werden wie andere stale actions über `stateVersion`, `actionId` und offene Entscheidung abgelehnt.

## Replay und StateHash

Timer-Ticks, Warnstufen und bloße Echtzeitverzögerung bleiben außerhalb von Replay und StateHash. Die Timeout-Auflösung selbst ist ein deterministischer Engine-Schritt.

Replay muss enthalten:

- `type: "timeout_resolution"`
- `side`
- `policyId`
- `deadlineId`
- `kind`
- öffentliche Fallbackwirkung, zum Beispiel `declined` oder `passed`
- `stateVersionBefore`
- `stateVersionAfter`
- `stateHashAfter`

Replay darf nicht enthalten:

- private Choiceoptionen, Optionsanzahl oder verdeckte Kartennamen
- `timerSnapshot`-Payloads
- Tokens, Decklisten, Deckhashes, FullState, `AIInput` oder `DecisionDebug`
- Wall-Clock-Rohdaten als deterministische Replayquelle

StateHash-Regel: Zwei Replays mit derselben Folge aus Spieleraktionen und Timeout-Auflösungen müssen denselben finalen StateHash erzeugen, unabhängig davon, wie viel Echtzeit zwischen den Schritten verstrichen ist.

## PublicEvents und Hidden-Info

PublicEvents zeigen nur die side-sichere Wirkung:

- `Korp Timeout: Reaktion abgelehnt`
- `Runner Timeout: gepasst`
- `Timeout: Entscheidung automatisch ohne Wirkung geschlossen`

Nicht erlaubt sind:

- private Optionsanzahl
- Kartennamen aus verdeckten Zonen
- Hidden-Zone-Ziel-IDs
- Resolvernamen, die private Karten verraten
- Undo-Preview-Daten
- `privatePayload`, `cardInstances`, FullState oder Debugdaten

Bei `hiddenInfoClass: "owner_private"` darf die betroffene Seite eine genauere lokale Erklärung erhalten, wenn diese vollständig aus ihrer PlayerView ableitbar ist. Die Gegenseite erhält nur einen groben Timeoutstatus.

## Reconnect, Disconnect und Undo

Reconnect:

- Reconnect liefert den aktuellen `timerSnapshot` und, falls vorhanden, den aktuellen Timeout-Deskriptor für die eigene Seite.
- Abgelaufene, aber noch nicht enginevalidiert angewandte Fristen dürfen nicht clientseitig angewandt werden.
- Ein reconnectender Client sieht keine historischen privaten Choices, die vor dem Reconnect durch Timeout geschlossen wurden.

Disconnect:

- Disconnect ist keine automatische Engine-Regel.
- Für private Matches ist der konservative Default: keine `forfeit`-Policy und keine harte Strafe nur wegen Verbindungsverlust.
- Ob eine Deadline während Disconnect weiterläuft, pausiert oder in Grace geht, bleibt eine Produktentscheidung des späteren Umsetzungsslices.
- Wenn `requiresConnectedClient: true` gesetzt ist, darf der Server während erkannter Nichtverbindung keine harte Auflösung auslösen.

Undo:

- Undo/Rewind invalidiert alle offenen `deadlineId`-Werte des zurückgenommenen Zustands.
- Nach Undo erzeugt die Engine neue Timeout-Deskriptoren für den neuen aktuellen State.
- Eine bereits replayte Timeout-Auflösung wird wie andere Engine-Schritte behandelt und darf nicht still aus dem Eventlog verschwinden.

## Deferred Scope

Nicht Teil des ersten harten Timeout-Slices:

- globale Partiezeit mit automatischem Spielverlust
- Zugzeit mit pauschalem Auto-End-Turn
- kompetitive Chess-Clock-Modi
- Chat-Cooldowns, Report-/Blockregeln oder Moderationsfolgen
- KI-Zeitbudgetänderungen
- Auswahl aus privaten Karten-, Ziel- oder Hidden-Zone-Optionen
- Public-Replay- oder Spectator-spezifische Timerprojektionen

## Umsetzungsschnitt

Kleiner späterer Engine-/Server-/Test-Slice:

1. Engine: `EngineTimeoutPolicy` im aktuellen Entscheidungsdeskriptor erzeugen, Default `none`.
2. Engine: `server_timeout_resolution` validieren und in bestehende Action-/Event-/StateVersion-/StateHash-Folge einhängen.
3. Server: Deadline nur aus Engine-Deskriptor beobachten und `ServerTimeoutResolution` einreichen.
4. Shared/API: harte Felder aus dem Timer-Sync-Vertrag erst aktivieren, wenn sie side-sicher mit `deadlineId` und Policy verbunden sind.
5. Tests: Replay, StateHash, stale action, illegal timeout, Hidden-Info und Reconnect abdecken.

Kein UI-Redesign, keine neuen Karten, keine KI-Freigabe und keine Plattform-/Chat-Erweiterung.

## Testmatrix

| ID | Bereich | Erwartung |
| --- | --- | --- |
| HTC-T001 | Policy Default | Alle Entscheidungsfenster ohne explizite Engine-Policy haben `kind: "none"` und keine harte Serverwirkung. |
| HTC-T002 | Auto Decline | Optionales kostenfreies Reaktionsfenster kann per `server_timeout_resolution` geschlossen werden. |
| HTC-T003 | Auto Pass | Pass-Fenster akzeptiert Timeout nur, wenn die Engine eine passende Fallbackaction deklariert. |
| HTC-T004 | Mandatory Choice Block | Private Mandatory Choice mit mehreren Optionen erzeugt keine TimeoutPolicy außer `none`. |
| HTC-T005 | StateVersion Revalidation | Timeout mit alter `stateVersion` wird abgelehnt. |
| HTC-T006 | Deadline Revalidation | Timeout mit unbekannter, verbrauchter oder durch Statewechsel invalidierter `deadlineId` wird abgelehnt. |
| HTC-T007 | Side Revalidation | Timeout für die falsche Seite wird abgelehnt. |
| HTC-T008 | Timing Revalidation | Timeout am falschen Timingpunkt wird abgelehnt. |
| HTC-T009 | Illegal Fallback | Timeout wird abgelehnt, wenn die Fallbackwirkung Kosten, Ziele oder private Choices benötigt. |
| HTC-T010 | Stale Player Action | Nach erfolgreichem Timeout wird eine verspätete Spieleraktion im alten Fenster stale abgelehnt. |
| HTC-T011 | Replay Determinismus | Replay mit derselben Timeout-Auflösungsfolge reproduziert denselben finalen StateHash. |
| HTC-T012 | Timer Tick Boundary | Timer-Ticks ohne Timeout-Auflösung verändern weder StateVersion noch StateHash. |
| HTC-T013 | PublicEvent Redaction | Öffentliche Events enthalten keine private Optionsanzahl, Kartennamen, Ziel-IDs oder Resolverdetails. |
| HTC-T014 | Reconnect Redaction | Reconnect nach Timeout zeigt keine geschlossenen privaten Choiceoptionen. |
| HTC-T015 | Undo Invalidation | Undo erzeugt neue `deadlineId`-Werte und akzeptiert alte Timeout-Auflösungen nicht mehr. |
| HTC-T016 | Disconnect Default | Disconnect löst im privaten Default keinen Forfeit und keine verdeckte Regelwirkung aus. |
| HTC-T017 | AI Boundary | `AIInput` und `DecisionDebug` enthalten keine menschlichen Deadline- oder Timeout-Deskriptoren. |
| HTC-T018 | Log Redaction | Logs und Fehlertexte redigieren Tokens, Deckdaten, Hidden Info, FullState und lokale Pfade. |

## Gate-Ergebnis

`ready_for_engine_timeout_implementation: false`

Der Vertrag ist als Planungsgrundlage abgeschlossen. Ein späterer Umsetzungsslice darf erst starten, wenn das Produkt explizit entscheidet, welche optionalen Fenster im privaten Match eine harte Frist bekommen und ob Disconnect-Grace im ersten harten Slice aktiviert wird. Bis dahin bleiben sichtbare Timer und Server-Sync ohne Regelwirkung führend.
