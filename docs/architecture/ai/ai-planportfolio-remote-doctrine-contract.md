# AI-Planportfolio und Remote-Doktrin – Architekturvertrag

Status: Zielvertrag für den Prozess
`ai-planportfolio-remote-doctrine-process-2026-07-12.md`

## Zweck

Dieser Vertrag trennt vier heute vermischte Fragen:

1. Welche langfristige Spielweise unterstützt das eigene Deck?
2. Welche Vorhaben bleiben über mehrere Entscheidungen und Züge bestehen?
3. Welcher kurzfristige Plan ist gerade im Vordergrund?
4. Welche vorhandene LegalAction leistet welchen Beitrag zu diesen Plänen?

Die Planebene erzeugt keine LegalActions und verändert keine Engine-Regeln.
Sie ordnet nur side-sichere Ziele, Fortschritt und vorhandene Aktionen.

## Ebenenmodell

```text
Deckstrategie und eigene Deckfähigkeiten
                  |
          StrategicIntentState
                  |
      RemoteDoctrineProfile und Planportfolio
        /              |               \
  Interrupt       Vordergrund      Hintergrund
        \              |               /
          Beiträge vorhandener LegalActions
                  |
              applyAction
```

### Deckstrategie

Die Deckstrategie ist ein stabiler Prior. Sie beschreibt mögliche Linien,
Rollen, Unterstützung und Confidence, aber keine aktuelle LegalAction.

### Strategischer Intent

Der strategische Intent wählt aus der Deckstrategie eine momentan führende
Linie und darf mit Hysterese zwischen Linien wechseln. Er entscheidet nicht
allein, welches konkrete Remote Zielserver wird.

### Planportfolio

Das Portfolio hält unterschiedliche Planformen parallel:

- genau null oder einen reaktiven Interrupt;
- genau null oder einen Vordergrundplan;
- null bis zwei Hintergrundprojekte.

### LegalAction-Beiträge

Eine LegalAction darf mehrere Pläne gleichzeitig voranbringen. Die finale
Auswahl bleibt eine einzige vorhandene LegalAction.

## Ausführungsklassen

```ts
type PlanExecutionClass =
  | "reactive_interrupt"
  | "bounded_sequence"
  | "recurring_cycle"
  | "development_project";
```

### `reactive_interrupt`

- zeitkritisches aktuelles Fenster;
- darf Vordergrund und Hintergrund suspendieren;
- endet mit Auflösung oder Wegfall des Fensters;
- darf keine langfristige Portfolioentscheidung löschen.

### `bounded_sequence`

- besitzt einen klaren Abschlusszustand;
- läuft typischerweise innerhalb eines Zugs oder weniger Züge;
- kann aus mehreren rekonstruierbaren Schritten bestehen;
- ist normalerweise Vordergrundplan.

### `recurring_cycle`

- wiederholt eine wertsteigernde Aktion;
- besitzt Cadence, Zielschwelle und Auszahlungs- oder Nutzungsfenster;
- bleibt als Hintergrundprojekt bestehen;
- einzelne Zyklusaktionen sind kurzfristige Kindpläne.

### `development_project`

- besitzt eine feste Zielbindung und mehrere Meilensteine;
- darf `dormant`, `suspended` oder `ready` sein, ohne beendet zu sein;
- wird durch passende Gelegenheiten fortgesetzt;
- kann kurzfristige Konversionspläne erzeugen.

## Klassifikation der aktuellen TacticalPlan-Typen

| TacticalPlan-Typ | Ausführungsklasse | Standardrolle | Abschlussvertrag |
| --- | --- | --- | --- |
| `runner.obtain_breaker_coverage` | `bounded_sequence` | Vordergrund | benötigte Coverage installiert, verfügbar oder Plan verworfen |
| `runner.contest_remote` | `bounded_sequence` | Vordergrund | Run-/Access-Fenster ausgewertet |
| `runner.opportunistic_central_run` | `bounded_sequence` | Vordergrund | Probe ausgeführt oder Opportunity invalidiert |
| `runner.clear_tags_or_survive` | `reactive_interrupt` | Interrupt | akute Tags oder Überlebensgefahr beseitigt |
| `runner.convert_success_window` | `reactive_interrupt` | Interrupt | aktuelles Successful-Run-/Access-Fenster konvertiert |
| `runner.survival_defense` | `reactive_interrupt` | Interrupt | aktueller Schaden-/Flatline-Kontext aufgelöst |
| `runner.restore_hand_buffer` | `bounded_sequence` | Vordergrund | geforderter Handpuffer erreicht |
| `runner.develop_hand_card` | `bounded_sequence` | Vordergrund | Zielkarte spielbar gemacht oder Plan invalidiert |
| `runner.play_best_hand_card` | `bounded_sequence` | Vordergrund | Zielkarte gespielt oder Opportunity invalidiert |
| `runner.build_credit_base` | `bounded_sequence` | Vordergrund | konkreter Funding-Gap geschlossen |
| `runner.build_credit_bank` | `recurring_cycle` | Hintergrund | Zielschwelle erreicht oder FundingNeed aktiviert |
| `runner.cash_out_credit_bank` | `bounded_sequence` | Vordergrund/Kind | Bank ausgezahlt und FundingNeed neu bewertet |
| `corp.create_score_window` | `bounded_sequence` | Vordergrund | Agenda gescort oder Scorefenster invalidiert |
| `corp.develop_finite_economy` | `bounded_sequence` | Vordergrund | finite Economy installiert, gerezzt und sinnvoll entleert |
| `corp.activate_persistent_economy` | `recurring_cycle` | Hintergrund | Engine aktiv und aktuelle Nutzung ausgeführt |
| `corp.build_credit_bank` | `recurring_cycle` | Hintergrund | Reserve-/Bankziel erreicht oder Konversion ausgelöst |
| `corp.rez_defense` | `reactive_interrupt` | Interrupt | aktuelles Rez-Fenster aufgelöst |
| `corp.apply_punish_pressure` | `bounded_sequence` | Vordergrund | aktuelles Tag-/Damage-/Punish-Fenster konvertiert |

Neue Zieltypen:

| Plantyp | Ausführungsklasse | Standardrolle |
| --- | --- | --- |
| `corp.establish_scoring_remote` | `development_project` | Hintergrund |

## RemoteDoctrineProfile

```ts
type RemoteDependency =
  | "none"
  | "opportunistic"
  | "supporting"
  | "primary";

type RemotePurpose =
  | "none"
  | "scoreline"
  | "asset_economy"
  | "ambush_bluff"
  | "mixed";

type RemoteProtectionTarget =
  | "none"
  | "light"
  | "score_window"
  | "taxing"
  | "glacier";

type RemoteBuildTiming =
  | "on_demand"
  | "payload_first"
  | "prebuild";

type RemoteDoctrineProfile = {
  dependency: RemoteDependency;
  purposes: RemotePurpose[];
  protectionTarget: RemoteProtectionTarget;
  buildTiming: RemoteBuildTiming;
  investmentBudget: {
    maxTargetRemotes: number;
    maxIceBeforePayload: number;
    backgroundActionsPerTurn: number;
    targetRecoveryTurns: number;
  };
  confidence: "low" | "medium" | "high";
  evidence: string[];
};
```

## Strategie-Matrix

| Führende Decklinie | Dependency | Zweck | Schutz | Timing | Investitionsregel |
| --- | --- | --- | --- | --- | --- |
| Fast Advance | `none` oder `opportunistic` | `scoreline` | `none` oder `light` | `on_demand` | kein dauerhaftes Remote-Projekt; nur konkrete Konversion |
| Rush Score | `supporting` | `scoreline` | `score_window` | `payload_first` | ein günstiges Remote; nach erreichbarem Scorefenster stoppen |
| Remote Scoring | `primary` | `scoreline` | `taxing` | `prebuild` | ein Zielremote wiederverwenden und fortlaufend prüfen |
| ICE Tax/Glacier | `primary` | `scoreline` | `glacier` | `prebuild` | effektive Pfadkosten und Erholungsbelastung maximieren |
| Asset Economy | `supporting` | `asset_economy` | `light` | `payload_first` | nur werttragendes Asset schützen; kein Scoreburg-Automatismus |
| Ambush/Bluff | `supporting` oder `primary` | `ambush_bluff` | `light` | `payload_first` | Contestability erhalten; nicht generisch überhärten |
| Hybrid | `supporting` | `mixed` | `score_window` | `on_demand` oder `prebuild` | primäre Linie und aktuelle Phase bestimmen Investition |

## Ableitungsregeln

1. Ein produktiver oder ausreichend gestützter `corp.remote_scoring`-Anker
   erzeugt mindestens `supporting`; als primäre Strategie erzeugt er
   `primary`.
2. `corp.ice_tax_glacier` als primäre Linie hebt das Schutzziel auf
   `glacier` und setzt `prebuild`.
3. `corp.fast_advance` allein erzeugt höchstens `opportunistic` und kein
   dauerhaftes Remote-Projekt.
4. `corp.rush_score` erzeugt `supporting` und `score_window`, nicht automatisch
   `glacier`.
5. `corp.asset_economy` und eigene Remote-Economy-Fähigkeiten erzeugen einen
   eigenen Remote-Zweck; sie dürfen keine Scoreline-Abhängigkeit vortäuschen.
6. `corp.ambush_bluff` erzeugt `ambush_bluff`; das Schutzband bleibt
   absichtlich niedrig, solange kein unabhängiger Scoreline-Anker stärker ist.
7. Mehrere produktive Linien erzeugen `mixed`. Die aktive primäre Strategie,
   Phase und Confidence entscheiden die konkrete Schutzstufe.
8. Niedrige Confidence begrenzt das Profil konservativ auf höchstens
   `supporting`, `score_window`, ein Zielremote und eine Hintergrundaktion pro
   Zug.
9. Ein einzelner sichtbarer Agenda- oder ICE-Zustand darf die Deckdoktrin nicht
   dauerhaft von Fast Advance auf Glacier umschreiben.

## Planportfolio-Vertrag

```ts
type PlanPortfolioRole =
  | "reactive_interrupt"
  | "foreground"
  | "background";

type PlanPortfolioLifecycle =
  | "active"
  | "dormant"
  | "blocked"
  | "suspended"
  | "ready"
  | "completed"
  | "abandoned";

type PlanPortfolioEntry = {
  portfolioEntryId: string;
  planType: string;
  role: PlanPortfolioRole;
  lifecycle: PlanPortfolioLifecycle;
  target?: { kind: string; id: string };
  parentEntryId?: string;
  supportsEntryIds: string[];
  milestone: string;
  progress: number;
  cadence: {
    maxActionsPerTurn: number;
    actionsUsedThisTurn: number;
    lastProgressTurn?: number;
  };
  resourceReservation: {
    credits: number;
    clicks: number;
  };
  updatedAtStateVersion: number;
  evidence: string[];
};
```

### Slotregeln

- Ein neuer Interrupt ersetzt keinen Hintergrundplan, sondern suspendiert
  Vordergrund und Hintergrund.
- Ein garantierter Closeout darf den Vordergrund ersetzen; der vorherige
  Vordergrund wird mit explizitem Grund abgeschlossen, suspendiert oder
  verworfen.
- Hintergrundprojekte werden nach strategischer Relevanz, Fortschritt und
  Stabilität sortiert; bei mehr als zwei Kandidaten wird der schwächste
  Kandidat nicht still gelöscht, sondern als nicht aufgenommen diagnostiziert.
- Derselbe Plantyp mit demselben Ziel darf nur einmal im Portfolio liegen.
- Zielverlust, Strategieabbruch oder dauerhaft fehlende Fähigkeit sind
  explizite Abbruchgründe.

## Aktionsbeiträge

```ts
type PlanActionContribution = {
  actionId: string;
  portfolioEntryId: string;
  contributionKind:
    | "progress"
    | "enable"
    | "fund"
    | "protect"
    | "convert"
    | "complete";
  value: number;
  milestoneAfter?: string;
  evidence: string[];
};
```

Der Gesamtbeitrag einer LegalAction ist additiv, aber begrenzt:

```text
Sofortwert
+ höchster Vordergrundbeitrag
+ begrenzter Hintergrundbeitrag
+ echter Mehrplannutzen
- Ressourcenverletzung
- Cadence-Verletzung
- Unterbrechungskosten
```

Mehrere kleine Hintergrundbeiträge dürfen keinen garantierten Score,
Überlebens-Interrupt oder notwendigen Rez-Entscheid überstimmen.

## Broker-/Bank-Vertrag

- Das Bankprojekt ist `recurring_cycle` und Hintergrund.
- Ein Load ist Fortschritt, nicht Abschluss des Gesamtprojekts.
- Standard-Cadence: höchstens eine Aufbauaktion pro Zug.
- Cashout ist ein kurzfristiger Kindplan und nur bei FundingNeed,
  kritischer Reserve oder erreichter Wertschwelle aktiv.
- Run-, Survival- und Access-Interrupts suspendieren das Bankprojekt.
- Nach einem fremden Vordergrundplan bleibt Ziel und Bankfortschritt erhalten.
- Load/Cashout-Pingpong bleibt durch bestehende und neue Hysterese gesperrt.

## Corp-Remote-Projektvertrag

### Erzeugung

`corp.establish_scoring_remote` wird nur erzeugt, wenn:

- `RemoteDoctrineProfile.dependency` mindestens `supporting` ist;
- der Zweck `scoreline` oder `mixed` enthält;
- die aktive strategische Linie nicht ausdrücklich ein reines
  Fast-Advance-Fenster priorisiert;
- ein legales oder perspektivisch nutzbares Remote-Ziel side-sicher bestimmt
  werden kann.

### Meilensteine

1. `select_target`
2. `establish_first_stop`
3. `fund_rez_reserve`
4. `harden_to_protection_target`
5. `payload_ready`
6. `convert_score_window`
7. `maintain_or_reopen`

### Zielbindung

- Ein vorhandenes vorbereitetes Remote wird vor einem neuen Remote bevorzugt.
- Das Ziel bleibt über Economy-, Draw-, Punish- und zentrale Interrupts
  erhalten.
- Ein Zielwechsel verlangt explizite Invalidierung, nicht nur einen höheren
  Einzelaktionsscore eines anderen Remotes.

### Schutzbewertung

Das Schutzband berücksichtigt side-sicher:

- sichtbare vollständige Pfadkosten;
- sichtbare Runner-Credits und zulässige sichtbare Run-Creditpools;
- Credits nach einem hypothetischen bezahlbaren Run;
- relevante Access-/Trash-Reserve;
- Corp-Rez-Reserve für den Zielpfad;
- konservative Wiederaufbauaktionen und daraus abgeleitete Erholungszüge.

Ein Schutzband ist erreicht, wenn der Runner den Pfad aktuell nicht bezahlen
kann oder die deckstrategisch verlangte wirtschaftliche Belastung erreicht.
Es wird erneut geöffnet, wenn sichtbare Runner-Rig- oder Economy-Änderungen das
Band unterschreiten.

## Zentralserver-Schutzböden

- HQ und F&E besitzen dynamische Mindestschutzwerte statt pauschaler
  ICE-Zielzahlen.
- Agenda-Flood, sichtbarer Multiaccess-Druck, Matchpoint und aktuelle Runs
  erhöhen den Schutzboden.
- Sobald der Schutzboden erfüllt ist, wird weiteres marginales ICE gegen ein
  unfertiges Zielremote abgewogen.
- Ein zentraler Notfall ist ein Interrupt und darf das Remote-Projekt
  suspendieren.
- Nach Wegfall des Notfalls wird das Remote-Projekt wieder aufgenommen.
- ICE-Anzahl allein beweist weder Über- noch Unterverteidigung.

## Strategiebezogene Must-Szenarien

### Fast Advance

- Same-Turn-Konversion bleibt vor Remote-Aufbau.
- Kein dauerhaftes Hintergrundprojekt ohne unabhängigen Remote-Anker.
- Ein kurzfristig benötigtes Remote endet mit der Konversion.

### Rush

- Ein leichtes, schnell nutzbares Remote ist erlaubt.
- Nach erreichtem Scorefenster wird nicht weiter bis Glacier überbaut.

### Remote Scoring

- Ein Zielremote bleibt über mindestens eine Unterbrechung erhalten.
- Passendes ICE und Rez-Reserve erhöhen den Projektfortschritt.
- Ein vorbereitetes Remote wird wiederverwendet.

### Glacier

- Das Projekt verfolgt effektive Laufkosten und Erholungsbelastung.
- Sichtbare Runner-Verbesserung kann erneute Härtung auslösen.

### Asset Economy

- Ein Economy-Remote wird rollenbezogen geschützt.
- Es erzeugt nicht allein ein Scoring-Remote-Projekt.

### Ambush

- Das Remote bleibt ausreichend attraktiv und contestable.
- Schutzbonus aus fremder Scoreline-Logik greift nicht ohne unabhängigen
  Scoreline-Anker.

### Hybrid

- Aktive Strategiephase entscheidet zwischen Remote-Aufbau und Same-Turn-
  Konversion.
- Unterbrechung und Wiederaufnahme sind explizit diagnostizierbar.

## Safety- und Determinismusvertrag

- Alle Eingaben bleiben auf aktuelle PlayerView, erlaubte PublicEvents,
  eigene Deckstrategie/-fähigkeiten und LegalActions begrenzt.
- Keine gegnerische Hidden-Zone wird gespeichert oder abgeleitet.
- Portfolio-Memory ist nach Match-/Decision-Kontext, Seite und Profil
  isoliert.
- Stale StateVersion kann keinen alten Aktionsbeitrag erzwingen.
- Sortierung und Slotverdrängung besitzen deterministische Tie-Breaks.
- Portfolio und Beiträge sind AI-intern; öffentliche Payloads erhalten nur
  redigierte Evidence.

## Abnahme-Gates

1. Vollständige Klassifikation aller aktuellen TacticalPlan-Typen.
2. Strategie-Matrix mit sieben Must-Szenarien.
3. Side-safe `RemoteDoctrineProfile` mit Redactiontest.
4. Portfolio-Slot-, Wiederaufnahme-, Cadence- und Determinismustests.
5. Broker-Unterbrechung und spätere Wiederaufnahme.
6. Zielgebundenes Corp-Remote über mehrere Züge.
7. Fast-Advance- und Ambush-Gegenfälle.
8. Zentrale Notfallunterbrechung ohne Projektverlust.
9. Nur vorhandene LegalActions und grüne AI-Safety-Gates.
10. Baseline-Vergleich trennt technische Sicherheit von Play Strength.
