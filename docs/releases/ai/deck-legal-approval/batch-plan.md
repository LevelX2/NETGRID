# Deck-Legal AI Approval Batch Plan

Stand: 2026-05-08
Status: Batch A umgesetzt; Batch B bis G geplant, nicht requirements-gefroren

## Ziel

Dieser Plan beschreibt, wie die verbleibenden deckbau-erlaubten Karten kontrolliert von `hinted_only` auf `ai_supported` gebracht werden koennen.

Das Ziel ist nicht, alle importierten oder katalogbereiten Karten fuer die KI freizugeben. Betrachtet werden nur Karten, die aktuell bereits `deck_legal` sind. `ai_supported` wird erst gesetzt, wenn Enginepfad, AI-Hints, Planverwendung, Negativszenarien und Hidden-Info-/DecisionDebug-Safety gemeinsam bestanden sind.

## Ausgangslage

Runtime-Inventar am 2026-05-08:

- Deckbau-erlaubte Karten: 96
- Karten mit AI-Hints: 96
- Bereits `ai_supported`: 50
- Noch nicht `ai_supported`: 46
- Neues Supplemental-Hint-Artefakt: `data/ai/ai-card-hints-runtime-supplement.json`

Das Supplemental-Artefakt enthaelt nur deckbau-erlaubte Karten ohne vorherigen Hint. Es darf keine KI-Freigabe ausloesen; es beschreibt nur Rollen, Planbezug, Mechaniken, Werte und Risiken.

## Nicht-Ziele

- Keine Freigabe nicht deckbau-erlaubter Import-/Preview-Karten.
- Keine pauschale O:NR-v1-KI-Freigabe.
- Keine Freigabe lokaler Korp-Decks durch Kartenfreigabe allein.
- Keine neuen Mechaniken ohne eigenes Mechanik-Gate.
- Kein Kartentextparser.
- Kein Belief State und keine FullState-Simulation.
- Keine offiziellen Assets oder Public-Plattformfunktionen.

## Kandidaten nach Risiko

### Batch A: Runner Rig Low Risk

Status: umgesetzt und lokal verifiziert in `docs/releases/ai/deck-legal-approval/batch-a-implementation-review.md`.

Ziel: Runner-KI kann weitere bereits decklegale Breaker und Memory-Hardware sinnvoll installieren und fuer sichere Probe-Runs einordnen.

Karten:

- `onr_v1_014_codecracker` - Codecracker
- `onr_v1_015_codeslinger` - Codeslinger
- `onr_v1_021_dwarf` - Dwarf
- `onr_v1_039_krash` - Krash
- `onr_v1_066_snowball` - Snowball
- `onr_v1_074_worm` - Worm
- `onr_v1_144_tycho-mem-chip` - Tycho Mem Chip
- `onr_v1_146_zetatech-mem-chip` - Zetatech Mem Chip

Gate-Bedarf:

- Runner-KI installiert fehlende Breakerrollen und Memory nur aus LegalActions.
- Runner-KI respektiert MU, Installationskosten und Creditreserve.
- Runner-KI bevorzugt Economy/Draw statt zu teurer Installation, wenn sie sonst handlungsunfaehig wird.
- Negative Runs gegen sichtbare Stopper bleiben blockiert oder werden als `safe_probe_run` mit Unsicherheit behandelt.
- DecisionDebug nennt nur sichtbare Rollen und Kosten, keine verdeckten Korp-Karten.

Empfehlung: Als erster Umsetzungsbatch.

### Batch B: Runner Run Events und Reset

Ziel: Runner-KI nutzt decklegale Run-/Multiaccess-/Reset-Events kontrolliert.

Karten:

- `onr_v1_081_custodial-position` - Custodial Position
- `onr_v1_085_executive-wiretaps` - Executive Wiretaps
- `onr_v1_101_mit-west-tier` - MIT West Tier

Gate-Bedarf:

- Multiaccess-Events erzeugen nur LegalAction-basierte Runs auf passende Server.
- HQ-/R&D-Value bleibt Unsicherheit, keine verdeckten Kartentitel.
- MIT West Tier braucht gesonderte Hidden-Zone-/Shuffle-/Removed-from-Game-Pruefung.
- Negative Szenarien: kein Event in sichtbare unpassierbare Serverlage; kein Reset, wenn ein klar besserer legaler Plan sichtbar ist.

Empfehlung: Nach Batch A, weil die Runner-KI dann mehr Rig-Coverage hat.

### Batch C: Corp Simple ICE

Ziel: Corp-KI kann weitere decklegale einfache ICE zum Schutz von HQ/R&D/Remote planen.

Karten:

- `onr_v1_230_cortical-scanner`
- `onr_v1_232_crystal-wall`
- `onr_v1_237_data-wall`
- `onr_v1_238_data-wall-2-0`
- `onr_v1_239_endless-corridor`
- `onr_v1_244_filter`
- `onr_v1_245_fire-wall`
- `onr_v1_252_keeper`
- `onr_v1_256_mazer`
- `onr_v1_259_in-the-face`
- `onr_v1_261_quandary`
- `onr_v1_263_reinforced-wall`
- `onr_v1_265_rock-is-strong`
- `onr_v1_266_scramble`
- `onr_v1_270_sleeper`
- `onr_v1_279_wall-of-static`

Gate-Bedarf:

- Corp-KI installiert ICE nur auf legale Serverpositionen.
- Corp-KI bewertet Rez-Kosten, Credits und Serverwert.
- Rez-Fenster/Pacing bleibt in Human-vs-Runner-KI und Human-vs-Corp-KI stabil.
- PublicEvents und DecisionDebug zeigen keine verdeckten unrezzed ICE-Titel fuer die falsche Seite.

Empfehlung: Als erster Corp-Batch, getrennt von Damage-ICE.

### Batch D: Corp Damage ICE

Ziel: Corp-KI kann decklegale Damage-ICE defensiv einordnen, ohne Runner-Hidden-Info oder Damage-Handling zu verletzen.

Karten:

- `onr_v1_253_laser-wire`
- `onr_v1_257_nerve-labyrinth`
- `onr_v1_262_razor-wire`
- `onr_v1_269_shotgun-wire`
- `onr_v1_278_wall-of-ice`

Gate-Bedarf:

- Damage-Pfade muessen mit bestehenden Damage-/Flatline-/Hidden-Info-Barrieren abgedeckt sein.
- Corp-KI darf Damage nicht als garantierten Treffer behaupten, wenn Runner-Breaker/Jack-out/Unsicherheit relevant sind.
- Runner-KI-Regression: keine Leaks durch DecisionDebug oder PublicEvents.

Empfehlung: Nach Batch C.

### Batch E: Corp Economy, Draw und Click Operations

Ziel: Corp-KI nutzt einfache Wirtschaft, Draw und Aktionsgewinn sinnvoll.

Karten:

- `onr_v1_281_accounts-receivable`
- `onr_v1_282_annual-reviews`
- `onr_v1_288_day-shift`
- `onr_v1_290_efficiency-experts`
- `onr_v1_295_night-shift`
- `onr_v1_297_overtime-incentives`

Gate-Bedarf:

- Operationen werden nur aus LegalActions gespielt.
- KI priorisiert Economy/Draw bei niedrigen Credits/Handdruck.
- Overtime Incentives braucht eigene Aktionsanzahl-/Replay-/StateHash-Regression.

Empfehlung: Parallel zu oder nach Batch C moeglich.

### Batch F: Corp Agendas

Ziel: Corp-KI bewertet decklegale O:NR-Agenden fuer Scoring-Pläne.

Karten:

- `onr_v1_203_hostile-takeover`
- `onr_v1_220_tycho-extension`

Gate-Bedarf:

- Agenda-Install/Advance/Score bleibt side-sicher.
- Hostile Takeover-On-Score-Effekt muss in ScoringWindow/Economy-Bewertung sichtbar korrekt abgebildet sein.
- Tycho Extension braucht gesonderte Langzeit-/Remote-Protect-Bewertung wegen hoher Agenda-Punktzahl.

Empfehlung: Nach Simple-ICE-Batch, weil Scoring-KI Schutz braucht.

### Batch G: Corp Tag-/Damage-Punishment

Ziel: Corp-KI nutzt tagabhaengige Operationen nur in legalen und sinnvollen Situationen.

Karten:

- `onr_v1_285_closed-accounts`
- `onr_v1_287_datapool-by-zetatech`
- `onr_v1_293_netwatch-credit-voucher`
- `onr_v1_301_punitive-counterstrike`
- `onr_v1_302_scorched-earth`
- `onr_v1_307_urban-renewal`

Gate-Bedarf:

- Harte LegalAction-/Tag-Pruefung: keine Tag-Punishment-Karte ohne Runner-Tag.
- Damage-Operationen brauchen Flatline-/Damage-/Hidden-Info-Regressionen.
- DecisionDebug darf keine verdeckten Runner-Handkarten oder Kill-Garantie behaupten.
- Negative Tests: KI spielt nicht blind Punishment, wenn LegalActions es nicht erlauben oder bessere Scoring/Economy-Pläne klar sind.

Empfehlung: Letzter Batch, weil hoechstes Risiko.

## Globale Freigaberegel pro Batch

Eine Karte wird nur `ai_supported`, wenn alle Punkte gelten:

1. `human_playable`, `deck_legal` und `format_legal` sind wahr.
2. Engine-/Resolverpfad und relevante Choices sind getestet.
3. AI-Hint ist vorhanden und spezifisch genug.
4. Mindestens ein SzenarioRef deckt die Kartenrolle oder konkrete Karte ab.
5. Positive KI-Smokes zeigen sinnvolle Nutzung.
6. Negative KI-Smokes verhindern offensichtliche Fehlverwendung.
7. Hidden-Info-, DecisionDebug-, PublicEvent-, Reconnect- und Payload-Safety bleiben gruen.
8. Replay/StateHash-Regressionen bleiben deterministisch.

## Testmatrix

| ID | Bereich | Erwartung |
| --- | --- | --- |
| DLAI-T001 | Inventar | Alle deckbau-erlaubten Karten haben genau einen AI-Hint aus Basis-, King-of-the-Road- oder Supplemental-Artefakt. |
| DLAI-T002 | Keine Scope-Ausweitung | Nicht deckbau-erlaubte Karten bekommen keine Supplemental-Hints und kein `ai_supported`. |
| DLAI-T003 | Statusketten | `ai_supported` setzt `human_playable`, `deck_legal`, `format_legal`, AI-Hint und SzenarioRef voraus. |
| DLAI-T004 | Runner Rig | Batch-A-Karten werden sinnvoll installiert und MU-/Credit-sicher bewertet. |
| DLAI-T005 | Runner Events | Batch-B-Karten erzeugen nur legale, sichtbarkeitskonforme Plaene. |
| DLAI-T006 | Corp ICE | Batch-C/D-ICE werden legal installiert/rezzt und side-sicher erklaert. |
| DLAI-T007 | Corp Operations | Batch-E/G-Operationen werden nur in passenden LegalAction- und Boardlagen gespielt. |
| DLAI-T008 | Corp Agendas | Batch-F-Agenden werden in Scoring-Plänen korrekt bewertet. |
| DLAI-T009 | Hidden Info | Keine verdeckten Karten, Decklisten, Tokens, lokale Pfade oder privaten Payload-Felder in KI-Inputs/Debugs/API. |
| DLAI-T010 | Matchstart | Nur vollstaendig `ai_supported` Snapshots duerfen als KI-Deck starten. |
| DLAI-T011 | Regression | King of the Road, Standard-KI-Decks und bestehende AI-Smokes bleiben gruen. |

## Umsetzungsreihenfolge

1. Requirements-Freeze fuer diesen Plan.
2. Batch A umsetzen und final reviewen.
3. Batch B umsetzen und final reviewen.
4. Batch C und E koennen getrennt oder nacheinander umgesetzt werden.
5. Batch D nach C.
6. Batch F nach C oder D.
7. Batch G zuletzt.

Jeder Batch bekommt ein eigenes Manifest, Szenarioartefakt und Implementation Review. Falls ein Batch Karten enthaelt, die doch zusaetzliche Mechanikarbeit brauchen, werden diese Karten in einen Folge-Batch verschoben und nicht halb freigegeben.

## Erwartete Artefakte je Batch

- Batch-Manifest unter `data/manifests/`.
- Szenario-Smokes unter `data/scenarios/`.
- Falls noetig spezifische AI-Hint-Ergaenzung oder Anpassung.
- Katalog-/AI-/Deck-/Server-/Visibility-Tests.
- Implementation Review unter `docs/derived/`.

## Done fuer alle 46 Karten

- Alle 46 aktuell `hinted_only` deckbau-erlaubten Karten sind entweder `ai_supported` oder bewusst mit dokumentiertem Blocker zurueckgestellt.
- Jede freigegebene Karte hat SzenarioRefs und ein Manifest-Gate.
- Es gibt keine `ai_supported`-Karte ohne AI-Hint.
- KI-Deckstart bleibt vollstaendig snapshotbasiert und lehnt unvollstaendige KI-Decks ab.
- Pflicht-Gates `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.
