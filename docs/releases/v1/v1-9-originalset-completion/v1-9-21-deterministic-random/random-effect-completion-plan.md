# V1.9.21 Random Effect Completion Plan

Status: planned
Stand: 2026-05-13

## Zweck

Dieser Plan beschreibt die Nacharbeit am bereits freigegebenen V1.9.21-Slice `Deterministischer Zufall und Würfelkarten`.

Der Befund aus der Kartenprüfung: Die sechs V1.9.21-Karten sind formal `human_playable`, `deck_legal` und `ai_supported`, aber mehrere Engine-Pfade bilden nur deterministische Zufallsproben ab. Besonders deutlich ist das bei `Playful AI`: Die Karte wird gespielt, erzeugt genau einen W6-Wurf und bewegt die Eventkarte in den Heap, aber die gedruckte Würfel-/Set-aside-Schleife mit Runner-Entscheidung ist noch nicht umgesetzt.

Dieser Plan ist ein Reparatur- und Completion-Plan. Er ersetzt nicht das V1.9.21-Final-Review, sondern ergänzt es um eine präzise Umsetzungsspur für vollständige Random-Effect-Resolver.

## Führende Quellen

- Lokaler bestätigter Text: `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- Bestätigte Mechaniklesung: `data/local/card-import/onr-v1-limited/text-review-galleries/confirmed-texts-normalized-mechanics.local.md`
- V1.9.0 Würfelgrundlage: `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/requirements.md`
- V1.9.1 Multiroll-/Choice-Beispiel: `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/implementation-review.md`
- V1.9.21 Abschlussstand: `docs/releases/v1/v1-9-originalset-completion/v1-9-21-deterministic-random/implementation-review.md`

## Betroffene Karten und Varianten

### A. Vollständige Würfelresolver aus früheren Releases

Diese Karten dienen als Muster und Regression, nicht als Hauptziel der Nacharbeit:

| Karte | Variante | Erwarteter Status |
| --- | --- | --- |
| `onr_v1_005_bartmoss-memorial-icebreaker` | Post-Encounter-Wurf, bei 1 Selbsttrash | V1.9.0 konkret umgesetzt |
| `onr_v1_007_blink` | Paid Break-Wurf, bei 4-6 Break, sonst Net Damage | V1.9.0 konkret umgesetzt |
| `onr_v1_115_terrorist-reprisal` | Random-HQ-Discard ohne Würfel | V1.9.0 konkret umgesetzt |
| `onr_v1_275_vacuum-link` | ICE-Subroutine-Wurf mit Run-Rewind/Jack-out | V1.9.0 konkret umgesetzt |
| `onr_v1_013_cockroach` | Random-HQ-Discard ab Virus-Counter-Schwelle | V1.9.1 konkret umgesetzt |
| `onr_v1_034_incubator` | Start-of-turn Multiroll plus Counter-Choice | V1.9.1 konkret umgesetzt |

Diese Pfade dürfen durch die Nacharbeit nicht regressieren. Besonders relevant sind `rollDeterministicDie`, versionierte Random-Purpose-Namespaces, PendingChoice-Verarbeitung und Replay/StateHash-Abdeckung.

### B. V1.9.21-Karten mit derzeit nur probeartiger Abdeckung

| Karte | Gedruckte Kernlogik | Aktueller Befund | Ziel |
| --- | --- | --- | --- |
| `onr_v1_002_ai-boon` | Zu Run-Beginn würfeln, Stärke für diesen Run setzen | Installierte Program-Aktion würfelt probeartig | echter Start-of-run-Trigger, run-lokaler Strength-State |
| `onr_v1_008_boardwalk` | HQ-Run-Counter; zu Runner-Zugstart pro 2 Counter zufällige HQ-Karte zeigen | Installierte Program-Aktion würfelt probeartig | Counter-Trigger, zufällige HQ-Reveals, Hidden-Info-sichere Anzeige |
| `onr_v1_104_playful-ai` | Event: W6, bei 1-3 Credits nehmen und/oder entsprechende Anzahl Würfel beiseitelegen; wiederholen bis keine beiseitegelegten Würfel offen sind | `play_event` würfelt genau einmal, keine Credits, keine Schleife, keine Choices | vollständige Würfelpool-/Set-aside-Schleife |
| `onr_v1_172_quest-for-cattekin` | Zu Runner-Zugstart würfeln; 6: Resource trashen und dauerhafter Extra-Action-Zustand; 1: Brain Damage; 2: unpreventable Net Damage | Installierte Resource-Aktion würfelt probeartig | echter Start-of-turn-Trigger, unpreventable Damage, persistenter Extra-Action-State |
| `onr_v1_339_schlaghund` | Corp-Action: Würfeln; wenn Wurf <= Runner-Tags, 10 Meat Damage und Selbsttrash | Rezzed Asset-Aktion würfelt probeartig | Tag-Vergleich, Damage, Selbsttrash, Side-/State-Revalidation |
| `onr_v1_367_rio-de-janeiro-city-grid` | Bei jedem Passieren rezzter ICE auf diesem Fort würfeln; bei 1 Run beenden | Rezzed Upgrade-Aktion würfelt probeartig | servergebundener after-pass-ice Trigger mit ETR-Folge |

## Zielarchitektur

### 1. Gemeinsamer Random-Effect-Kern

Die Engine soll nicht sechs isolierte Spezialproben behalten. Stattdessen soll ein kleiner gemeinsamer Kern entstehen:

- `rollDeterministicDie(state, purpose)` bleibt der zentrale W6-Helper.
- Jeder neue Wurf erzeugt genau einen `RandomDrawRecord`.
- Purpose-Strings bleiben versioniert und kartenbezogen, z. B. `v1921.die.<cardId>.<window>.<context>`.
- PublicEvents enthalten Ergebnis, öffentliche Quelle und RandomCounter, aber keine verdeckten Kartenidentitäten.
- Hidden-Zone-Folgen nutzen vorhandene Reveal-/Access-/Choice-Barrieren statt private Kartenlisten im PublicPayload.

Empfohlene interne Modellierung:

```ts
type CardRandomWindow =
  | "play_event"
  | "start_of_run"
  | "start_of_turn"
  | "after_pass_ice"
  | "paid_ability"
  | "subroutine";

type DieEffectResult =
  | { kind: "gain_credits"; amount: number }
  | { kind: "set_strength_for_run"; amount: number }
  | { kind: "net_damage"; amount: number; preventable: boolean }
  | { kind: "brain_damage"; amount: number; preventable: boolean }
  | { kind: "meat_damage"; amount: number; preventable: boolean }
  | { kind: "trash_source" }
  | { kind: "end_run" }
  | { kind: "reveal_random_hq_cards"; amount: number }
  | { kind: "queue_choice"; choiceId: string };
```

Diese Typen müssen nicht exakt so exportiert werden. Wichtig ist, dass die Umsetzung nicht erneut bei jeder Karte ad hoc RandomPayloads baut.

### 2. PendingChoice für Playful AI

`Playful AI` braucht eine kleine Effektmaschine, keine normale einmalige Eventauflösung.

Vorgeschlagener Ablauf:

1. Runner spielt `Playful AI` als normales `play_event`.
2. Kosten werden gezahlt, Karte geht nach Heap, ein öffentlicher `play_event`-Eintrag entsteht.
3. Engine startet einen Playful-AI-Effektzustand, z. B. in `pendingChoice` oder in einem eng typisierten transienten Special-State.
4. Es wird ein W6 geworfen.
5. Bei `4`, `5` oder `6`: keine Credits, keine neuen Würfel, Effekt endet, wenn keine pending dice mehr offen sind.
6. Bei `1`, `2` oder `3`: Runner bekommt eine Choice:
   - `gainCredits`: 0 bis Wurfergebnis
   - `setAsideDice`: Wurfergebnis minus `gainCredits`
7. Credits werden sofort gutgeschrieben.
8. Die beiseitegelegten Würfel werden als abstrakter Zähler gespeichert, nicht als echte Special-Zone-Karten.
9. Solange der Zähler größer 0 ist, wird der nächste beiseitegelegte Würfel deterministisch geworfen und Schritt 5 bis 8 wiederholt.
10. Der Effekt endet, wenn kein beiseitegelegter Würfel mehr offen ist und kein neuer Choice-Schritt ansteht.

Warum kein `specialZones.setAside`: Die gedruckten Würfel sind keine Karten. Die bestehende Set-aside-Zone modelliert Kartenzonen und Sichtbarkeit. Für Playful AI ist ein numerischer Effektzustand sauberer.

Empfohlener State:

```ts
type PendingPlayfulAiEffect = {
  kind: "playful_ai_dice_loop";
  sourceCardId: CardInstanceId;
  remainingDice: number;
  rollIndex: number;
  lastRoll?: number;
};
```

Wenn der aktuelle Engine-Stil keinen neuen Top-Level-PendingEffect nahelegt, kann die Schleife vollständig über `pendingChoice` mit `privatePayload`/Payload-Metadaten geführt werden. Entscheidend ist: applyAction revalidiert source card, side, stateVersion, pending choice, roll result and selected split.

### 3. Triggerfenster für die anderen V1.9.21-Karten

- `AI Boon`: beim Start jedes Runs, wenn installiert, genau einmal würfeln und run-lokale Stärke setzen. Der Zustand muss beim Run-Ende verschwinden.
- `Boardwalk`: nach erfolgreichem HQ-Run Counter vergeben; zu Runner-Zugstart pro 2 Counter einen deterministischen Random-HQ-Reveal verarbeiten. Reveal darf nur die gezeigten Karten offenlegen.
- `Quest for Cattekin`: Runner-Zugstart-Trigger. Bei `6` Resource trashen und dauerhaften Extra-Action-Zustand setzen. Bei `1`/`2` unpreventable Damage auslösen. Andere Ergebnisse sind No-Op mit öffentlichem Wurf.
- `Schlaghund`: LegalAction nur für rezzed installed Asset, Corp-Seite, richtige Timing-/Click-Kosten. Nach Wurf Vergleich mit Runner-Tags, bei Erfolg 10 Meat Damage und Source-Trash.
- `Rio de Janeiro City Grid`: Trigger nur bei Runs auf den Server, in dem das rezzed Upgrade liegt. Nach passierter rezzed ICE würfeln; bei `1` Run enden. Keine manuelle `gain_credit`-Probe.

## Umsetzungsschritte

### Schritt 1: Audit-Schutztests schreiben

Vor funktionalen Änderungen Tests ergänzen, die den aktuellen Fehlstand reproduzieren:

- `Playful AI` bei Seed mit erstem Ergebnis `1`, `2` oder `3` öffnet eine Runner-Choice statt sofort zu enden.
- Choice `gain all` gibt Credits und beendet bei keinem Set-aside.
- Choice `set aside all` führt weitere Würfe aus.
- Mischfall `gain N, set aside M` verändert Credits und pending dice korrekt.
- Replay reproduziert alle `RandomDrawRecords`, Choices und finalen StateHash.

Zusätzlich Sentinel-Tests für die V1.9.0/V1.9.1-Karten beibehalten oder erweitern, damit der gemeinsame Helper keine Regression erzeugt.

### Schritt 2: Gemeinsame Random-Helfer konsolidieren

- Bestehenden `rollDeterministicDie` wiederverwenden.
- Doppelte V1.9.21-Spezialpayloads (`v1921RunnerEventAbility`, `v1921RunnerProgramAbility`, usw.) in kleine Helper kapseln.
- PublicEvent-Kontext zentral aus der tatsächlichen Auflösung bauen.
- Action-ID-Bildung prüfen, damit gleiche Actiontypen mit unterschiedlichen Fähigkeiten kollisionsfrei bleiben.

### Schritt 3: Playful AI vollständig implementieren

Dateischwerpunkt:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- bei Bedarf Typen in `packages/shared/src/index.ts`

Akzeptanz für Playful AI:

- Karte ist nur als Runner spielbar.
- Kosten und Click werden bezahlt.
- Karte landet im Heap.
- Jeder Wurf erzeugt einen RandomDrawRecord.
- Wurf `1..3` erzeugt eine Runner-Choice für Aufteilung Credits vs. neue Würfel.
- Wurf `4..6` erzeugt keinen Choice-Schritt.
- Mehrere Set-aside-Würfel werden nacheinander abgearbeitet.
- Credits werden exakt nach Runner-Choice erhöht.
- Wrong-side, stale stateVersion und ungültige Choice-Werte werden abgelehnt.
- PublicPayload enthält keine privaten Zonen.
- Replay und StateHash sind stabil.
- KI nutzt nur LegalActions und trifft eine einfache erwartungswertbasierte oder konservative Choice.

### Schritt 4: V1.9.21-Probe-Karten zu echten Effekten hochziehen

Empfohlene Reihenfolge:

1. `Schlaghund`: kleinster aktiver Pfad, klare Kosten, klarer Schaden.
2. `Quest for Cattekin`: Start-of-turn plus Damage/Persistent-State.
3. `AI Boon`: Start-of-run und run-lokale Strength.
4. `Rio de Janeiro City Grid`: after-pass-ice servergebundener Trigger.
5. `Boardwalk`: Counter plus Hidden-Zone-Random-Reveal.

Nach jeder Karte:

- Engine-Test für Erfolg, No-Op/Failure-Ergebnis, Wrong-Side oder falsches Timing.
- Visibility-Test gegen private Payloads.
- Replay/StateHash-Test.
- AI-Hint/Smoke aktualisieren, wenn die Entscheidung nicht mehr nur `random_probe` ist.

### Schritt 5: Daten- und Statusartefakte korrigieren

Nach Umsetzung müssen die V1.9.21-Artefakte die echte Abdeckung beschreiben, nicht nur `random_probe`:

- `data/manifests/card-implementation-manifest-1.9.21.json`
- `data/rules/mechanics-coverage-1.9.21.json`
- `data/scenarios/v1921-deterministic-random-release-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1921.json`
- `data/scenarios/ai-deck-legal-v1921-smokes.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-21-deterministic-random/implementation-review.md`
- optional neues Review: `docs/releases/v1/v1-9-originalset-completion/v1-9-21-deterministic-random/random-effect-completion-review.md`

Das bestehende Final Review sollte nicht stillschweigend umgeschrieben werden. Besser ist ein ergänzendes Completion Review, das den Korrekturstand erklärt.

## Testmatrix

| Bereich | Pflichtnachweis |
| --- | --- |
| Random | Jeder Wurf erzeugt einen `RandomDrawRecord`; gleiche Seeds erzeugen gleiche Ergebnisse |
| Choices | Playful-AI-Aufteilungen werden validiert, falsche Summen abgelehnt |
| Timing | Start-of-run, start-of-turn, after-pass-ice und paid/action windows triggern nur legal |
| Visibility | PublicEvents zeigen nur öffentliche Random- und Ergebnisdaten |
| Hidden Zone | Boardwalk/Terrorist/Cockroach leaken keine vollständigen HQ-Inhalte |
| Damage | Quest/Schlaghund nutzen bestehende Damage-Pfade und respektieren Unpreventable-Regeln |
| Replay | Eventlog-Replay reproduziert RandomRecords und StateHash |
| AI | KI wählt nur LegalActions und kennt keine zukünftigen Würfelergebnisse |
| Web | UI kann PendingChoices für Playful AI bedienen und zeigt Random-Cues verständlich |

## No-Scope

- Keine neuen Karten außerhalb der hier genannten Random-/Würfelkarten.
- Kein Parser für Kartentexte.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.
- Keine Änderung an der Regelautorität: UI und KI reichen weiterhin nur LegalActions ein.
- Keine Umstellung der vorhandenen V1.9.0/V1.9.1-Resolver, außer eine kleine Helper-Konsolidierung ist nötig und regressionsgeschützt.

## Abschlusskriterien

Die Nacharbeit gilt erst als abgeschlossen, wenn:

1. `Playful AI` die vollständige Würfel-/Set-aside-Schleife mit Choices und Credits abbildet.
2. Alle V1.9.21-Karten echte kartenspezifische Effekte statt bloßer Zufallsproben haben oder explizit begründet deferred bleiben.
3. V1.9.0- und V1.9.1-Random-Regressionen grün bleiben.
4. Engine-, AI-, Server-, Web-, Typecheck-, Test-, Lint- und Build-Gates grün sind.
5. Manifest, Mechanics-Coverage, AI-Hints, Szenarien und Completion Review den tatsächlichen Stand beschreiben.

