# Proteus-KI-Freigabe: Reconciliation- und Rollout-Plan

Status: `implemented`

Datum: 2026-07-09

Primärer Agent: `card-enablement-ai-knowledge-agent`

Handoff: `release-implementation-agent`

## Kurzentscheidung

Proteus ist technisch und als qualifizierter Standard-KI-Pool freigegeben:

- 154/154 Karten stehen im aktiven Manifest auf `ai_supported: true` und besitzen aktive sowie kompilierte AI-Hints.
- Explizit ausgewählte Proteus-KI-Decks werden von Deckvalidierung und Server akzeptiert; Selected-/Multiplayer-Smokes sind grün.
- Vier qualifizierte Proteus-Snapshots stehen im versionierten `data/ai/ai-deck-pool-1.1.0.json`. `fixed` und `seeded_random` wählen poolbewusst; Originalset-, Classic-, Proteus- und kombinierter Pool sind getestet.
- Elf Familien-Szenarien decken alle 114 Pilotdeck-Karten ab. Der feste 16-Spiel-Pilot meldet 0 IllegalActions, 0 Replay-/Redaction-Fehler und 0 % Fallback; vier Originalset-Kontrollen sind grün.

`ai_supported` bleibt technische Karten-/Deckzulassung; die zusätzliche Default-/Random-Pool-Freigabe wird separat durch `default_pool_ready` und den qualifizierten Deckpool 1.1.0 belegt.

## Zielzustand

1. Kartenstatus, Hint-Coverage, Deckzulassung und Play-Strength-Readiness sind getrennt und maschinenprüfbar.
2. Die UI sagt eindeutig, ob Proteus nur explizit auswählbar, für einen Pilotpool freigegeben oder Standard-/Random-pool-ready ist.
3. Proteus gelangt erst nach familienbezogenen Real-Engine-Smokes, Hidden-Info-Gates und Spielstärke-Kalibrierung in `fixed` oder `seeded_random`.
4. Engine und `LegalActions` bleiben die einzige Regelautorität; die KI bewertet nur side-sichere PlayerViews und angebotene LegalActions.

## Arbeitspakete

### PAI-0: Statusvertrag und Driftbereinigung

- Einen eindeutigen Supportvertrag einführen, der mindestens `hint_ready`, `selected_ai_playtest_ready` und `default_pool_ready` unterscheidet. Der bestehende boolesche Wert `ai_supported` bleibt nur dann bestehen, wenn seine Bedeutung ausdrücklich auf technische KI-Deckzulassung begrenzt wird.
- `docs/codex/CODEX_STATUS.md`, Proteus-README, Formatprofil-`nonGoals`, Deckpaket-Metadaten und spätere Readiness-Reports auf denselben Vertrag bringen.
- Einen Drift-Test ergänzen, der widersprüchliche Aussagen wie `ai_supported: true` plus `proteus_ai_supported: false` ohne qualifizierende Supportstufe blockiert.

Abnahme: Eine einzige aktuelle Statusquelle erklärt technische Zulassung, Pilotstatus und Default-Pool-Status widerspruchsfrei.

### PAI-1: Maschinenlesbares Kartenfamilien-Inventar

- Alle 154 Karten genau einer primären KI-Risikofamilie zuordnen: Baseline, Random Outcome, Bad Publicity, Hidden Resource, Virus/Antibody, X-Kosten, temporäre Aktionen, Access/Ambush, Run Modification, Target Choice oder komplexe Multi-Ability.
- Pro Karte vorhandene Hint-Qualität, Strategy Coverage, Benchmark Coverage, Szenarioabdeckung und offene Removal Conditions erfassen.
- Die 8 noch nicht human-reviewten, 99 nicht strategy-covered und 148 nicht benchmark-covered Hints nicht pauschal als gleich kritisch behandeln; fehlende Abdeckung nach tatsächlicher Runtime-Relevanz und Deckvorkommen priorisieren.

Abnahme: 154/154 Karten inventarisiert, keine unklassifizierte Karte, keine pauschale Sammel-Szenario-Referenz als alleiniger Play-Strength-Nachweis.

### PAI-2: Fehlende semantische Modelle schließen

In dieser Reihenfolge generische, kartenunabhängige Modelle oder bestehende Modelle erweitern:

1. `target_choice_model` und side-safe Choice-Binding,
2. `run_modification_model` und `access_ambush_model`,
3. `x_cost_model` und `temporary_action_model`,
4. `bad_publicity_model` und `random_outcome_model`,
5. `hidden_resource_model` und `virus_counter_model`.

Jedes Modell darf nur aktuelle LegalAction-Optionen, PlayerView-Daten und sichtbare PublicEvents verwenden. Keine Proteus-ID-Zweige im Planner und keine Hidden-Info-Allowlist-Erweiterung.

Abnahme je Modell: Unit-Test, Real-Engine-Fixture, Hidden-State-Invariance, deterministisches Replay/StateHash und erklärbare Score-/WhyNot-Evidence.

### PAI-3: Familienbezogene AI-Smokes und Decision-Gates

- Den einen globalen Szenarioeintrag durch kleine, konkrete Szenariopakete pro Mechanikfamilie ergänzen.
- Nicht nur Legalität prüfen, sondern mindestens: sinnvolle Aktivierungs-/Nichtaktivierungsentscheidung, Zielwahl, Kostenreserve, Timing, Run-Fortsetzung, Access-Folge und gegnerische Antwort.
- Für Hidden Resources, Ambush und Central-Memory kontrastive Zustände mit identischer erlaubter Sicht, aber unterschiedlichem Hidden State ausführen; die KI-Entscheidung muss invariant bleiben.
- Jede in den vier Proteus-Decks vorkommende Karte braucht direkte oder eindeutig familienbezogene Evidence.

Abnahme: 0 IllegalActions, 0 Replay-/StateHash-Fehler, 0 Hidden-Info-Verstöße und keine ungedeckte kritische Choice-/Timing-Familie.

### PAI-4: Begrenzter Selected-Deck-Pilot

- Proteus zunächst nur für `aiDeckPolicy: selected` als sichtbaren Playteststatus führen.
- Die vier bestehenden Proteus-Snapshots in einer festen Seed-Matrix Human-vs-KI und KI-vs-KI gegen Originalset- sowie Proteus-Gegner laufen lassen.
- Auswerten: Abschlussrate, Action-Limit-Rate, Fallbackrate, No-Progress-Loops, Score-/Steal-Verteilung, ungenutzte Kartenfähigkeiten und bekannte Guardrails.
- Fehler als generische Mechanik-/Entscheidungslücken beheben, nicht als Karten-ID-Sonderlogik.

Abnahme: definierte Seed-Matrix grün, keine Safety-Regression und dokumentierte Play-Strength-Schwellen erfüllt.

### PAI-5: Deckpool-Promotion

- Erst nach PAI-4 die freigegebenen Proteus-Snapshots in einen eigenen versionierten Pilotpool aufnehmen.
- `seeded_random` muss nach Kartenpool filtern und bei `originalset_proteus` nachweisbar Proteus-Kandidaten ziehen können.
- Für `fixed` explizite Proteus-Defaultdecks definieren; nicht still auf die Originalset-Defaults zurückfallen.
- Gemischten Classic-&-Proteus-Pool separat prüfen; keine automatische Ableitung aus zwei Einzelgates.

Abnahme: deterministische Auswahltests für beide Seiten und alle vier Kartenpooloptionen, korrekte Fallbackmeldung bei leerem Pool und keine verdeckte Decklistenpreisgabe.

### PAI-6: UI, Dokumentation und Abschlussgate

- Matchstart zeigt pro KI-Deckpolicy den tatsächlichen Status: `expliziter Playtest`, `Pilotpool` oder `Standardpool`.
- Veraltete Hinweise in Proteus-Deckdaten, Formatprofilen, Wissensbasis und Reviews bereinigen oder als historisch markieren.
- Full Gate: Catalog, Decks, AI, Server, Web, Engine-Proteus-Coverage, Browser-Matchstart-Smoke und `git diff --check`.

Abnahme: Nutzer kann vor Matchstart erkennen, ob und wie die KI Proteus wirklich verwendet; alle aktuellen Statusartefakte stimmen mit Runtime und Deckpool überein.

## Empfohlene Reihenfolge und Schnitt

PAI-0 und PAI-1 sind ein gemeinsames kleines Foundation-Paket. Danach werden PAI-2 und PAI-3 pro Mechanikfamilie sequenziell umgesetzt. PAI-4 ist ein gesondertes Pilotgate. PAI-5 und PAI-6 bilden erst nach bestandenem Pilot den eigentlichen Default-/Random-Pool-Release.

Die Implementierung sollte nicht alle 154 Karten erneut einzeln anfassen. Der kritische Pfad sind die fehlenden generischen Entscheidungsmodelle und die familienbezogene Evidence; einfache Baseline-Karten können nach Inventar und Smoke gebündelt freigegeben werden.

## Verifikation dieses Planungsbefunds

Am 2026-07-09 grün ausgeführt:

- `corepack pnpm --filter @netgrid/decks exec vitest run src/index.test.ts -t "validates Proteus playtest snapshots through deck legality and AI support"`
- `corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "enforces the selected match card pool for Proteus playtest snapshots"`
- `corepack pnpm --filter @netgrid/web exec vitest run app/deck-match-filters.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/compiled-hints-runtime.test.ts -t "Proteus"`

Diese Checks belegen technische Zulassung und Matchstartpfad, nicht die noch ausstehende Default-Pool-Spielstärke.
