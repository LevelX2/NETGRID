# Match 9b60842f – Turn-Coherence Red Evidence

Status: **ZK01-Evidence abgeschlossen; historische D4/D5 bereits grün,
generischer Draw-Admission-Vertrag rot**

Stand: 2026-07-29

## Quelle und Abdeckung

- Match: `match_9b60842fe75c0b39`
- Modus: `human_runner_vs_corp_ai`
- Status beim Capture: `active`
- Seed: `match-ms5win5d-0syl1j`
- Endstand der gespeicherten Folge: StateVersion 8,
  StateHash `fnv1a:2286c214`
- SQLite:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- AI-Trace-Modus: `detailed`
- Events: 9
- State-Snapshots: 9
- AI-Decision-Traces: 7
- Decision-Coverage: 7 erwartete KI-Fenster, 7 zugeordnete Traces,
  0 fehlende, 0 verwaiste, 0 doppelte und 0 Action-Type-Mismatches.

Der Zugriff erfolgte nach positivem Server-Healthcheck kurzlebig und
read-only. Es wurden keine rohen `game_state_json`- oder `trace_json`-Inhalte
in dieses Artefakt übernommen.

## Vollständige Decision-Klassifikation

| Decision | StateVersion | Auswahl | stärkste sichtbare Alternative | Status | Begründung |
| --- | ---: | --- | --- | --- | --- |
| D1 | 1 | Setup-Choice | keine | plausibel | einziges Enginefenster; Plan-first-Engine-Lane |
| D2 | 2 | Corp Mandatory Draw | keine | plausibel | verpflichtendes Enginefenster |
| D3 | 3 | Basic Credit | ICE auf HQ/R&D oder weitere Entwicklung | plausibel als Einzelschritt, Sequenzanker | `corp.economy` finanzierte ausdrücklich den Defense-Parent `corp.defend_servers` für HQ |
| D4 | 4 | Pattel Antibody in neuem Remote | ICE auf HQ/R&D, Credit oder Draw | historisches Finding; auf aktuellem Code nicht reproduzierbar | historisch übernahm `corp.ambush_and_bluff` ohne typisierten Abbruchgrund; der aktuelle Chooser wählt im identischen Zustand `Credit Blocks` vor R&D über `corp.defend_servers` |
| D5 | 5 | Draw bei voller HQ-Hand | Credit oder ICE auf HQ/R&D | historisches Finding; auf aktuellem Code nicht reproduzierbar | historisch behandelte `corp.hand_and_agenda_management` einen Scorematerial-Draw als P4; aktuell gewinnt im identischen Zustand die R&D-Defense-Installation |
| D6 | 6 | End Turn | keine weitere normale Action | plausibel als Folge | nach Verbrauch aller drei Klicks ist `corp.complete_turn` korrekt |
| D7 | 7 | Discard-Choice | andere bekannte HQ-Karte | Folgefenster, nicht Primärursache | der Pflichtdiscard entsteht erst durch D5; die Choice selbst ist nicht die Ursache des verlorenen Zugtempos |

Damit ist der vollständige Denominator geschlossen. D1/D2 sowie D6/D7 bilden
jeweils abgeschlossene Engine- beziehungsweise Parent-Child-Fenster. D3 bis
D5 bilden die kausale Plansequenz.

## Kausalkette D3 bis D5

1. D3 erkannte einen konkreten Zentralverteidigungsbedarf und erzeugte einen
   Economy-Supportschritt für genau diesen Parent.
2. Historisch verlor dieser Parent bei D4 gegen einen neuen P5-Ambush-Root.
   Diese Abweichung ist inzwischen durch den aktuellen Defense-Stand
   geschlossen und wird als grüner Checkpoint konserviert.
3. Im historischen D5-State ist HQ voll, nur ein Klick verbleibt und der
   Scorematerial-Draw besitzt keine exakte Same-Turn-Verbrauchsroute. Der
   aktuelle Chooser zieht dennoch und läuft dadurch sicher in Cleanup.
4. D7 ist die regelkonforme Folge dieses Draws. Ein Discard-Tuning würde die
   Ursache nicht beseitigen.

## Checkpoints

### D4 – grüner aktueller Gegenbeleg

`cp-9b60842f-01-continue-central-defense-d4`

- historischer Zustand vor D4;
- Strict-Warmup D1 bis D3;
- `warmupDriftCount = 0`;
- aktueller Chooser: `Credit Blocks` vor R&D;
- Plan: `corp.defend_servers`;
- Status: grün, daher kein neuer D4-Produktionsfix in ZK02.

### D5 – grüner aktueller Gegenbeleg

`cp-9b60842f-02-no-overcapacity-draw-d5`

- historischer Zustand vor D5;
- strikter Capture ab D5, weil aktueller D4 bereits fachlich korrekt vom
  historischen Remotewechsel abweicht;
- kein Rebase und kein erfundener Runtimezustand;
- aktueller Chooser: `draw_card`;
- Erwartung: Credit oder Central-ICE-Installation; Draw verboten;
- Ergebnis: grün mit einer R&D-ICE-Installation über
  `corp.defend_servers`.

Der strikte Warmup ab D1 endet erwartungsgemäß bei D4, weil der aktuelle
Chooser dort bereits fachlich besser als die historische Folge entscheidet.
Der D5-Capture startet deshalb streng am unveränderten historischen
D5-Zustand. Es wurde kein Rebase verwendet.

### Generischer Draw-Admission-Vertrag – rote Ziel-Evidence

`corp-draw-admission-red-contract.test.ts`

- fünf Karten bei maximal fünf Handkarten;
- genau ein verbleibender Klick;
- ein normaler Scorematerial-Draw mit bekanntem Handdelta `+1`;
- keine Same-Turn-Verbrauchsroute und keine dringende Defense-Antwortsuche;
- gewünschtes Ergebnis: `blocked_end_turn_overflow`;
- aktueller Stand: der Vertrag ist als `it.fails` reproduzierbar rot, weil
  `assessCorpDrawAdmission` die Route noch `admitted`.

## Positive und negative Gegenproben

- `corp-draw-admission.test.ts` belegt bereits den sinnvollen Draw bei freier
  Handkapazität sowie die zulässige dringende
  Score-Defense-Ersatzkartensuche.
- `match-f809-corp-defense-decision-checkpoints.test.ts` belegt mit D45, dass
  ein nicht sofort rezfähiges ICE sinnvoll gestaged werden darf, wenn
  Installation und verzögerte Finanzierung denselben Rez-Horizont erreichen.
- Dieselbe F809-Suite enthält Gegenproben ohne aktuellen Zentraldruck und bei
  bereits geschützten Centrals. Damit wird kein pauschaler
  ICE-Installationszwang eingeführt.

## Hint-, Consumer- und Arbitration-Kette

Für D5 ist kein falscher Kartenhint ursächlich:

1. `draw_card` stammt als Basic Action aus den LegalActions.
2. Die Action-Projektion weist den bekannten Handzuwachs aus.
3. `CorpHandInventoryFacts` berechnet den vollen Handstatus bereits, besitzt
   aber `authority:diagnostic_only` und `selectionInfluence:none`.
4. `assessCorpDrawAdmission` lässt für `score_material_search` aktuell einen
   einzelnen Endturn-Overflow trotz fehlender Same-Turn-Verbrauchsroute zu.
5. `corp.hand_and_agenda_management` materialisiert den Draw für den
   `corp.score_agenda:general`-Parent.
6. Die lexikografische P4-Arbitration schlägt Credit und P5-Entwicklung.

Die Semantik geht somit nicht im Hintcompiler verloren. Die klare generische
Restursache liegt in Draw-Admission und der noch nicht planwirksamen
Hand-/Cleanup-Projektion. Sie ist im historischen D5-State wegen der
inzwischen höher priorisierten Defense-Route nicht mehr auswahlwirksam,
bleibt aber in Stellungen ohne diese Route erreichbar.

## ZK02-Vertrag

ZK02 darf ausschließlich den reproduzierten generischen
Draw-Admission-Restvertrag schließen:

- voller Handstatus vor nicht dringendem Draw ist bindend;
- ein Draw mit sicherem zusätzlichem Cleanup-Overflow benötigt eine konkrete
  Same-Turn-Verbrauchs- oder höherpriorisierte Antwortsuchroute;
- sinnvolle Draws mit freiem Slot bleiben möglich;
- begründete dringende Defense-Suche bleibt möglich;
- D4 und die F809-Staging-Gegenproben dürfen nicht verschlechtert werden.

## Verifikation der Ausgangsbaseline

- fokussierte Match-, Draw- und F809-Suite:
  20 Tests grün, 1 erwarteter roter Draw-Admission-Vertrag;
- `corepack pnpm --filter @netgrid/ai typecheck`: grün;
- `corepack pnpm check:ai`: grün;
- `corepack pnpm test:ai:shards`:
  520 Testdateien grün, 4250 Tests grün und genau der eine erwartete
  ZK01-Red-Vertrag.
