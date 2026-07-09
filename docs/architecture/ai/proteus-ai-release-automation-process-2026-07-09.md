# Proteus-KI-Release-Reconciliation: automatischer Paketprozess

Status: `in_progress`

Quelle: `docs/architecture/ai/proteus-ai-release-reconciliation-plan-2026-07-09.md`

Arbeitsbranch: `codex/proteus-ai-release-reconciliation`

Arbeits-Worktree: `C:\Projekte\NETGRID_PROTEUS_AI_RELEASE_RECONCILIATION`

## Zielprüfung

Die Vorgabe ist für direkte automatische Abarbeitung ausreichend präzise. Gesamtziel, Reihenfolge, Sicherheitsgrenzen, Kernartefakte und Abnahmekriterien sind aus Plan, Repository-Stand und Paketregeln ableitbar. Der Nutzer hat direkte Umsetzung ausdrücklich gewählt.

## Gesamtziel

Proteus-KI-Support wird von der heutigen technischen Deckzulassung zu einem widerspruchsfreien, familienbezogen verifizierten und bewusst freigegebenen KI-Kartenpool ausgebaut. Der Prozess trennt Hint-Verfügbarkeit, Selected-Deck-Playtest und Default-/Random-Pool-Readiness, schließt die relevanten semantischen Entscheidungsmodelle, liefert konkrete Real-Engine-Evidence, promotet geeignete Proteus-Decks in den versionierten KI-Deckpool und zeigt den Status im Matchstart korrekt an.

## Annahmen

- `ai_supported` bleibt aus Kompatibilitätsgründen die technische KI-Deckzulassung; die feineren Stufen werden separat modelliert.
- Vorhandene ActionSemanticCandidate-, TargetChoiceShadow-, Risk-/Cost-/Timing-, Access-, Run- und Runtime-Komponenten werden erweitert. Es entsteht keine parallele Proteus-Sonder-KI.
- Karten-ID-Zweige in Planner oder Runtime bleiben verboten. Kartenspezifische Daten gehören in Hints, Inventar und Szenarien; Code bildet generische Mechanikfamilien ab.
- Die vier vorhandenen Proteus-Snapshots bilden den Pilot- und späteren Poolkandidatenbestand.
- Die bereits im Hauptworkspace untracked vorhandenen Dateien `docs/reviews/ai/current-plan-model-*` gehören nicht zu diesem Prozess und werden weder gestaged noch verändert.
- Ohne explizite Release-ID erfolgt keine sichtbare Produktversionsanhebung.

## Nicht-Ziele

- Keine neue Engine-Regelautorität und keine Ableitung von Regeln aus Kartentext.
- Keine neuen Proteus-Kartenimplementierungen; 154/154 sind bereits implementiert.
- Keine Hidden-Info-Allowlist-Erweiterung.
- Kein Entfernen des Legacy-Fallbacks für andere KI-Scopes.
- Kein Push, Pull Request oder Remote-Merge.
- Keine Classic-only- oder gemischte Classic-&-Proteus-Freigabe ohne eigenes kombiniertes Gate.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- KI wählt ausschließlich aktuelle `LegalActions` aus side-sicherem PlayerView-/PublicEvent-Kontext.
- `applyAction` bleibt finale Revalidierung.
- Keine Proteus-ID-Abfragen in produktivem AI-, Server- oder Engine-Code zur Entscheidungslogik.
- Jede neue Supportstufe ist maschinenlesbar, getestet und in UI/Dokumentation gleich benannt.
- Jedes abgeschlossene Paket erhält Checks, `git diff --check`, Ergebnisnotiz und eigenen Commit.
- Folgebefunde erweitern ein Paket nicht still. Sie werden als Fix im aktuellen Scope, konservative Annahme, Removal Condition oder späteres Follow-up klassifiziert.

## Automatische Fehlerbehandlung

1. Roten Test reproduzieren und auf den kleinsten relevanten Test reduzieren.
2. Prozessänderung gegen Paket-Scope und Invarianten prüfen.
3. Eng beheben und gezielten Test erneut ausführen.
4. Danach Paketgate vollständig wiederholen.
5. Erst bei erfülltem Done-Gate committen und fortfahren.

Nicht reproduzierbare Flakes werden einmal isoliert wiederholt und danach mit Befehl, Ausgabe und Removal Condition im Prozessbericht dokumentiert. Sie rechtfertigen keine stille Gate-Absenkung.

## Sicherheitsblocker

Der Prozess stoppt ohne Runtime-Promotion, wenn einer dieser Befunde nicht eng behebbar ist:

- IllegalAction oder Umgehung aktueller LegalActions;
- Hidden-Info-Abhängigkeit oder abweichende Entscheidung bei identischer erlaubter Sicht;
- Replay-/StateHash- oder Seed-Determinismusfehler;
- erforderliche Ziel-/Choice-Bewertung ohne side-sichere LegalAction-Optionen;
- semantischer Konflikt zwischen Engine-Vertrag und KI-Modell;
- Default-/Random-Pool ohne reproduzierbare Pilot-Evidence.

Ein Blockerbericht nennt Paket, reproduzierbaren Fall, Risiko, bereits geprüfte Alternativen und Removal Condition.

## State Machine

```text
prepared
  -> worktree_ready
  -> pai0_status_contract_done
  -> pai1_inventory_done
  -> pai2a_target_choice_done
  -> pai2b_run_access_done
  -> pai2c_cost_timing_done
  -> pai2d_random_bad_publicity_done
  -> pai2e_hidden_virus_done
  -> pai3_scenarios_done
  -> pai4_pilot_done
  -> pai5_pool_done
  -> pai6_ui_docs_done
  -> integration_preflight
  -> merged_to_main
  -> complete
```

Jeder Zustand kann bei einem Sicherheitsbefund nach `blocked` wechseln. Normale Testfehler bleiben im aktuellen Zustand, bis sie behoben sind.

## Fortschritt

| Paket | Status | Ergebnis |
| --- | --- | --- |
| PAI-0 | `done` | Zentraler Readiness-Vertrag trennt Hint-, Selected-Playtest- und Default-Pool-Stufe; Driftcheck und Server-Stage-Guard sind grün. |
| PAI-1 | `done` | Deterministisches Inventar klassifiziert 154/154 Karten in elf Familien und bindet 114 Pilotdeck-Karten an Evidence und Removal Conditions. |
| PAI-2A | `done` | TargetChoiceShadow klassifiziert Karten-, ICE-, Programm-, Hardware-, Server-, Side-, Counter-, Decline- und Pass-Optionen aus LegalAction-/side-safe Candidate-Evidence und liefert WhyNot-Gründe. |
| PAI-2B | `done` | ActionSemanticCandidate trägt ein side-sicheres Run-/Access-Modell für Bypass, Zusatzsubroutinen, Redirect, Replacement, Post-run, Ambush-, Damage-, Tag-, Disruption-, Tax- und Payoff-Achsen. |
| PAI-2C | `done` | Cost-/Timing-Profile binden X-Min/Max/Choice, gewählten Wert, explizite Restreserve sowie Action-, Encounter-, Run-, Turn- und Action-Debt-Dauer ausschließlich aus LegalAction-Payloads. |
| PAI-2D | `done` | ActionSemanticCandidate bildet Zufall ausschließlich als noch nicht gezogenen Engine-RandomDrawRecord ab und bewertet sichtbare Bad-Publicity-Deltas, Akteursrelevanz und die Verlustschwelle ohne Ergebnisvorwegnahme. |
| PAI-2E | `done` | Side-sicheres Modell trennt eigene Hidden-Resource-Constraints von abstraktem gegnerischem Risiko, redigiert gegnerische Mengen/Identitäten und hält Runner-Virus-, Corp-Antibody-, Purge- und Payout-Signale strikt auseinander. |
| PAI-3 | `done` | Deterministischer Szenariobuilder bindet alle 114 Pilotdeck-Karten genau einmal an elf Familienpakete mit positiven/negativen Entscheidungsassertions, KI-Modelltests, realer Engine-Evidence sowie Hidden-Info-/Replay-/StateHash-Gates. |
| PAI-4 | `next` | Reproduzierbarer Selected-Deck-Pilot mit fester Seed-Matrix und maschinenlesbarem Qualifikationsbericht. |
| PAI-5 bis PAI-6 | `pending` | Noch nicht begonnen. |

## Paketfolge

| Paket | Titel | Hauptziel | Commit-Vorschlag |
| --- | --- | --- | --- |
| PAI-0 | Supportstufen und Driftvertrag | Technische Zulassung, Selected-Pilot und Pool-Readiness trennen | `feat(ai): define Proteus support readiness stages` |
| PAI-1 | Kartenfamilien-Inventar | 154/154 Karten maschinenlesbar klassifizieren | `data(ai): inventory Proteus readiness families` |
| PAI-2A | Target-/Choice-Modell | side-safe Ziel- und Choice-Evidence konsumierbar machen | `feat(ai): model Proteus target choice readiness` |
| PAI-2B | Run-/Access-Modell | Run-Modifikationen und Access-/Ambush-Folgen bewerten | `feat(ai): model Proteus run and access decisions` |
| PAI-2C | X-Kosten und Timing | variable Kosten, Reserve, Dauer und Ablauf modellieren | `feat(ai): model Proteus cost and timing decisions` |
| PAI-2D | Zufall und Bad Publicity | sichtbare Outcome-/Schwellenbewertung ergänzen | `feat(ai): model Proteus random and bad publicity decisions` |
| PAI-2E | Hidden Resources und Virus | side-safe Hidden-/Counter-/Purge-Bewertung ergänzen | `feat(ai): model Proteus hidden resource and virus decisions` |
| PAI-3 | Familienbezogene Szenarien | konkrete AI-Smokes und Invariance-Gates liefern | `test(ai): add Proteus family decision scenarios` |
| PAI-4 | Selected-Deck-Pilot | feste Seed-Matrix und Readiness-Auswertung | `test(ai): qualify Proteus selected deck pilot` |
| PAI-5 | Versionierter KI-Deckpool | Proteus für Fixed/Seeded Random bewusst promoten | `feat(ai): promote Proteus pilot deck pool` |
| PAI-6 | UI, Wissen und Abschluss | Status sichtbar machen und Vollgate schließen | `feat(web): expose Proteus AI readiness status` |

## Paketdetails

### PAI-0: Supportstufen und Driftvertrag

Ziel: Ein zentraler, versionierter Vertrag unterscheidet mindestens `hint_ready`, `selected_ai_playtest_ready` und `default_pool_ready` je Set/Deckpool.

Eingang: Planungscommit `92f8d5bed`; vorhandene Manifest-, Hint-, Profil- und Deckpooldaten.

Arbeit:

- Supportstufen in einem reinen Daten-/Typvertrag definieren.
- Catalog-/Deck-/Server-Consumer auf eindeutige Semantik ausrichten, ohne bestehende `ai_supported`-Zulassung zu brechen.
- Widersprüchliche Proteus-Metadaten und aktuelle Readiness-Aussagen qualifizieren.
- Drift-Test gegen unqualifiziertes `ai_supported: true`/`proteus_ai_supported: false` und Pool-/Statuswidersprüche ergänzen.

Kernartefakte: `data/ai/`, `packages/catalog/`, `packages/decks/`, `apps/server/src/deck-setup.ts`, relevante Tests.

Checks: gezielte Catalog-, Deck- und Servertests; `git diff --check`.

Done-Gate: Der Statusvertrag ist zentral, maschinenlesbar und alle bisherigen Proteus-Selected-Deck-Tests bleiben grün.

### PAI-1: Kartenfamilien-Inventar

Ziel: Alle 154 Karten erhalten genau eine primäre Readiness-Familie, Evidence-Status und Removal Conditions.

Arbeit:

- Inventar aus Manifest, Active/Compiled Hints, CardImplementations und den vier Pilotdecks deterministisch erzeugen oder pflegen.
- Familien: `baseline`, `target_choice`, `run_modification`, `access_ambush`, `x_cost`, `temporary_action`, `random_outcome`, `bad_publicity`, `hidden_resource`, `virus_counter`, `complex_multi_ability`.
- Coverage-Zählung und 154/154-Parität testen.

Kernartefakte: neues versioniertes Inventar unter `data/ai/`, Generator/Check unter `scripts/`, AI-Test.

Checks: Inventarcheck, AI-Test, `git diff --check`.

Done-Gate: 154 eindeutige Karten, keine unbekannte Familie, Deckvorkommen und Evidence-Zahlen reproduzierbar.

### PAI-2A: Target-/Choice-Modell

Ziel: Vorhandene TargetChoiceShadow-/TargetProfile-Strukturen können Proteus-Fälle anhand angebotener Optionen klassifizieren und bewerten.

Arbeit: generische Choice-Arten für Karten, Server, ICE, Programme, Hardware, Counters und Decline/Pass; harte Blockade ohne LegalAction-Ziele; side-safe Score-/WhyNot-Evidence.

Checks: TargetChoiceShadow-Tests, ActionSemanticCandidate-Tests, AI-Typecheck, Hidden-Path-Scan.

Done-Gate: repräsentative Proteus-Fixtures für Single-, Multi- und Decline-Choice grün; keine ID-Sonderlogik.

### PAI-2B: Run-/Access-Modell

Ziel: Bypass, Zusatzsubroutinen, Redirect, Run-Ende, Multiaccess, Replacement, Ambush und Post-run-Folgen werden getrennt sichtbar bewertet.

Arbeit: bestehende RunProjection-/Access-Intelligence-Strukturen erweitern; Kosten-/Payoff-/Risikoachsen trennen; keine Identität unrevealed Remotes voraussetzen.

Checks: Run-/Access-Unit-Tests, Real-Engine-Fixtures, Replay/StateHash-Probe, Hidden-State-Invariance.

Done-Gate: mindestens je ein positiver und negativer Fall pro kritischer Run-/Access-Familie; 0 Leaks und 0 IllegalActions.

### PAI-2C: X-Kosten und Timing

Ziel: Variable X-Auswahl sowie temporäre Aktionen, Modifier und Ablaufzeitpunkte werden aus LegalAction-/PlayerView-Evidence bewertbar.

Arbeit: min/max/selected X, Budgetreserve, Grenznutzen, Duration und Expiry in bestehende Cost-/Timing-Profile integrieren.

Checks: Action-Cost-/Timing-Tests, X-Choice-Fixtures, stale-action- und Replay/StateHash-Proben.

Done-Gate: keine X-Erfindung außerhalb Engine-Optionen; temporäre Werte laufen reproduzierbar aus.

### PAI-2D: Zufall und Bad Publicity

Ziel: Zufällige Outcomes und Bad-Publicity-Kosten/-Payoffs/-Schwellen werden getrennt, seed-sicher und side-safe bewertet.

Arbeit: Outcome-Unsicherheit statt Vorhersage; sichtbare Bad-Publicity-Schwellen und Win-/Loss-Relevanz; kein Zugriff auf zukünftige RandomDrawRecords.

Checks: Random-/Bad-Publicity-Unit-Tests, Seed-Reproduktion, Schwellenfixturen, AI-Typecheck.

Done-Gate: gleiche erlaubte Sicht und Seed ergeben gleiche Entscheidung; keine Zufallsausgangsvorwegnahme.

### PAI-2E: Hidden Resources und Virus

Ziel: Eigene Hidden Resources, gegnerische unbekannte Karten, Virus-/Antibody-Counter und Purge-Druck werden ohne Identitätsleak bewertet.

Arbeit: erlaubte eigene Hidden-Resource-Constraints, abstraktes gegnerisches Risiko, Counterwachstum/-auszahlung, Purge-Fenster und Antibody-Trennung.

Checks: kontrastive Hidden-State-Invariance, Counter-/Purge-Fixtures, AI-Input-Redaction, Replay/StateHash.

Done-Gate: 0 Hidden-Info-Verstöße; Virus- und Antibody-Counter werden nicht vermischt.

### PAI-3: Familienbezogene Szenarien

Ziel: Die globale Sammelreferenz ist nicht mehr alleiniger Nachweis.

Arbeit: versionierte Szenariopakete je Familie, Kartenabdeckung für alle in den vier Pilotdecks vorkommenden Proteus-Karten, positive/negative Entscheidungen, Ziel-/Kosten-/Timing-/Follow-up-Assertions.

Checks: Szenario-JSON, AI-/Engine-Runner, Coverage-Check, Redaction und deterministischer Replay/StateHash.

Done-Gate: jede Pilotdeck-Karte hat direkte oder eindeutig familienbezogene Evidence; kritische Familien vollständig abgedeckt.

### PAI-4: Selected-Deck-Pilot

Ziel: Vier Proteus-Snapshots werden mit fester Seed-Matrix als Selected-Deck-Pilot qualifiziert.

Arbeit: reproduzierbares Harness, Human-vs-KI-/KI-vs-KI-nahe Paarungen, Abschluss-/Action-Limit-/Fallback-/No-Progress-/Guardrail-Metriken, maschinenlesbarer Bericht.

Checks: Pilotlauf, Holdout/Regression gegen Originalset, 0 IllegalActions, 0 Replay-/Redaction-Fehler.

Done-Gate: definierte Schwellen sind im Prozessbericht festgehalten und bestanden; andernfalls keine PAI-5-Promotion.

### PAI-5: Versionierter KI-Deckpool

Ziel: `fixed` und `seeded_random` können im gewählten Proteus-Pool tatsächlich Proteus-Decks verwenden.

Arbeit: Poolversion anheben, vier qualifizierte Snapshots taggen, poolbewusste Fixed-Defaults und deterministische Random-Auswahl, expliziter Fallbackgrund, kombinierter Classic-&-Proteus-Guard.

Checks: Deck-Setup-/Multiplayer-/Simulationstests für beide Seiten und alle vier Pooloptionen; Payload-Redaction.

Done-Gate: Proteus-Pool wählt reproduzierbar Proteus-Kandidaten; Originalset-Pool bleibt frei von Proteus; kombinierter Pool ist explizit getestet.

### PAI-6: UI, Wissen und Abschluss

Ziel: Matchstart und führende Dokumente zeigen den tatsächlichen Status pro Policy.

Arbeit: kompakte Statusanzeige für Selected/Pilot/Standard, Tests, Metadaten-/Wissenssync, Final Review und Restpunktprüfung.

Checks:

- gezielte Web-Unit-Tests;
- Browser-Smoke über `scripts/start-netgrid.ps1` und den projektierten Browserpfad;
- `corepack pnpm --filter @netgrid/catalog test`;
- `corepack pnpm --filter @netgrid/decks test`;
- `corepack pnpm --filter @netgrid/ai test`;
- `corepack pnpm --filter @netgrid/server test`;
- `corepack pnpm --filter @netgrid/web test`;
- `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"`;
- relevante Typechecks, `git diff --check`.

Done-Gate: UI, Runtime, Pool und Wissen sind widerspruchsfrei; Full Gate grün; Final Review dokumentiert.

## Verifikationsregeln

- Paketchecks laufen vor jedem Commit.
- Generierte AI-Daten werden nur über bestehende oder neu versionierte deterministische Builder aktualisiert.
- JSON wird geparst und per zuständigem Test validiert.
- Nach jeder Runtime-Änderung laufen mindestens der gezielte Unit-Test und der Paket-Typecheck.
- PAI-4 und PAI-5 verlangen reale Engine-/Serverpfade, nicht nur statische Datenassertions.
- `git diff --check` ist in jedem Paket Pflicht.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/proteus-ai-release-reconciliation`.
- Worktree: `C:\Projekte\NETGRID_PROTEUS_AI_RELEASE_RECONCILIATION`.
- Hauptworkspace wird nach Worktree-Anlage nur für Statusprüfung und finalen Merge genutzt.
- Nur paketbezogene Dateien werden gestaged.
- Nach jedem Paket eigener Commit mit dem vorgeschlagenen Präfix.
- Vor Integration wird aktuelles lokales `main` in den Arbeitsbranch integriert und danach das Full Gate wiederholt.
- Finaler Merge bevorzugt Fast-Forward nach `main`; kein Push.
- Worktree wird erst nach erfolgreichem Main-Check entfernt.

## Controller-Prompt-Kern

```text
/Goal Arbeite Proteus-KI-Release-Reconciliation vollständig und sequenziell von PAI-0 bis PAI-6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden Wiki-Einstiege, alle betroffenen package-spezifischen AGENTS.md, docs/architecture/ai/proteus-ai-release-reconciliation-plan-2026-07-09.md und docs/architecture/ai/proteus-ai-release-automation-process-2026-07-09.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_PROTEUS_AI_RELEASE_RECONCILIATION auf Branch codex/proteus-ai-release-reconciliation.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Aktualisiere Prozessstatus und Paketartefakte.
Führe Paketchecks aus und committe jedes abgeschlossene Paket einzeln.
Bei Sicherheitsblocker: stoppe ohne Runtime-Promotion und schreibe einen Blockerbericht mit Removal Condition.
Nach PAI-6: integriere aktuelles main in den Arbeitsbranch, führe das Full Gate aus, merge lokal nach main, prüfe main, entferne den Worktree und markiere das Goal erst dann als complete.
```

## Abschlusskriterien

- PAI-0 bis PAI-6 jeweils mit eigenem grünen Done-Gate und Commit abgeschlossen.
- Supportstufen, Inventar, Modelle, Szenarien, Pilot, Deckpool, UI und Wissen sind integriert.
- 0 IllegalActions, 0 Hidden-Info-Verstöße und 0 Replay-/StateHash-Fehler in den neuen Gates.
- Arbeitsbranch ist mit aktuellem `main` abgeglichen und final verifiziert.
- Lokaler Merge nach `main` ist abgeschlossen; Hauptworkspace ist bis auf klassifizierte fremde Dateien sauber.
- Worktree ist entfernt; kein Push wurde ausgeführt.
