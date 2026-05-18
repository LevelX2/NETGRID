---
jobId: spotcheck-2026-05-15-stealth-ap-citygrid
status: done
createdAt: 2026-05-15T15:13:00+01:00
startedAt: 2026-05-15T21:52:00+02:00
blockedAt: 2026-05-15T21:59:30+02:00
doneAt: 2026-05-15T22:24:00+02:00
resolution: "Implemented Singapore City Grid's once-per-run server-bound unrezzed-ICE/HQ-ICE concealed swap with Corp-private hidden-info-barrier choice, concealed replacement ICE and replay/state-hash coverage."
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_071_vewy-vewy-quiet
    title: Vewy Vewy Quiet
  - cardId: onr_v1_132_microtech-trode-set
    title: Microtech ’Trode Set
  - cardId: onr_v1_156_corporate-ally
    title: Corporate Ally
  - cardId: onr_v1_180_smiths-pawnshop
    title: Smith's Pawnshop
  - cardId: onr_v1_224_bolter-cluster
    title: Bolter Cluster
  - cardId: onr_v1_240_fang
    title: Fang
  - cardId: onr_v1_251_jack-attack
    title: Jack Attack
  - cardId: onr_v1_258_neural-blade
    title: Neural Blade
  - cardId: onr_v1_346_vacant-soulkiller
    title: Vacant Soulkiller
  - cardId: onr_v1_369_singapore-city-grid
    title: Singapore City Grid
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-stealth-ap-citygrid

## Auswahlprüfung

Pflichtstart erledigt: `AGENTS.md`, `AGENTS.local.md`, die vier NETGRID-Wissensbasis-Einstiegsdateien und `agents/card-enablement-ai-knowledge-agent.md` wurden gelesen. Arbeitskontext: `C:\Projekte\NETGRID`, Branch `main`, Remote `origin`; `main` ist lokal voraus, und vorhandene uncommitted Webclient-Änderungen sind nach Pipeline-Regel kein Stopgrund für diesen reinen Reportlauf.

Der Generator-Lock `.codex-runlogs/originalset_spotcheck_report_generator.lock` war `released` und wurde für diesen Lauf aktiv gesetzt. Die Queue-Verzeichnisse `inbox`, `in_progress`, `done` und `blocked` existieren. Es wurden `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json` und alle Queue-Markdown-Dateien unter `docs/derived/originalset-spotcheck-jobs/` gelesen. Ergebnis der Deduplizierung: 17 Dedupe-Quellen, 180 tabu Card IDs, 184 nicht-tabu decklegale Originalset-Kandidaten, 30 hochkomplexe Kandidaten. Die zehn Karten dieses Jobs wurden zufällig aus dem komplexen Kandidatenpool gezogen und anschließend nach Engine-/Timing-/Choice-/Hidden-Info-/Replay-Relevanz geprüft.

## Kartenbefunde

### onr_v1_071_vewy-vewy-quiet - Vewy Vewy Quiet

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Die Karte ist über V1.9.16 decklegal und AI-supported, aber der Runtime-Vertrag ist nur als generisches Stealth-/Recurring-Programm modelliert. Der bestätigte Kartentext verlangt zwei zweckgebundene Bits auf der Karte, Nutzung nur für Icebreaker während Runs, Ausschluss lauter Icebreaker und Refresh nur am nächsten Runner-Turn, wenn Bits genutzt wurden. Der aktuelle Shared-Vertrag führt `recurringCredits: 1`; damit ist die Ressourcenmenge und vermutlich auch die Refresh-Bedingung zu schwach. Die vorhandenen Stealth-Tests prüfen generisch Noisy-Ausschluss und Recurring-Refresh, aber nicht die genaue Zwei-Bit- und used-last-turn-Semantik dieser Karte.

Notwendige Umsetzung

Vewy Vewy Quiet braucht einen eigenen Runtime-Vertrag mit zwei Recurring-Credits/Bits, Source-Bindung auf Breaker-Kosten während Runs, Noisy-Breaker-Ausschluss, kontrolliertem Verbrauch und Refresh nur nach tatsächlicher Nutzung. LegalActions müssen die verwendeten Card-Counter als Kostenquelle ausweisen; `applyAction` muss Counterstand, Timingpunkt, Breaker-Ziel, Noisy-Subtype und StateVersion erneut validieren.

Akzeptanzkriterien

- Installation lädt exakt zwei öffentliche Recurring-Counter auf die Karte und ist side-/stateVersion-validiert.
- Die Credits können nur für Icebreaker-Kosten während eines Runs genutzt werden und niemals für noisy Icebreaker.
- Verbrauch und Refresh sind deterministisch, public payloads nennen nur öffentliche Counter-/Kosteninformationen, und Replay/StateHash bleibt stabil.
- Tests decken Nicht-Run, falsche Kostenart, noisy Icebreaker, Teilverbrauch, Refresh und No-Refresh ohne Verbrauch ab.

### onr_v1_132_microtech-trode-set - Microtech ’Trode Set

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Microtech ’Trode Set ist in V1.9.14 als Trace/Link-Hardware freigegeben. Die Implementierung bildet im sichtbaren Kartenvertrag vor allem `baseLink: 1` und Trace-Bidding ab. Der bestätigte Kartentext ist aber deutlich breiter: zusätzliche Kosten beim Brechen jeder ICE-Subroutine, AP-Subroutine-Ausnahmen und Prevention aller bis auf 1 Net Damage aus ungebrochenen AP-Subroutinen. Spotcheck-Tests prüfen Trace-ICE und Hidden-Info/Replay für bestimmte Trace-Schadenspfade, aber nicht die komplette Break-Cost- und AP-Prevention-Schicht.

Notwendige Umsetzung

Den Runtime-Vertrag auf drei Ebenen erweitern: globaler Break-Zusatzkostenmodifikator, AP-Subroutine-Ignore/Exception-Regeln und Damage-Reduction auf ungebrochene AP-Subroutinen. Der Resolver muss unterscheiden, ob eine AP-Subroutine gebrochen wurde, ob sie trace oder Net Damage enthält, und ob die Prevention legal greift.

Akzeptanzkriterien

- Break-LegalActions enthalten die zusätzliche 1-Credit-Kostenkomponente und `applyAction` revalidiert sie pro Subroutine.
- AP-Subroutinen ohne Trace/Net-Damage werden durch den Trode-Set-Effekt korrekt ignoriert oder als nicht schädlich behandelt.
- Ungebrochene AP-Net-Damage-Subroutinen werden auf 1 Net Damage reduziert; Hidden-Info beim zufälligen Grip-Trash bleibt geschützt.
- Replay/StateHash-Smoke deckt erfolgreichen Trace, misslungenen Trace, AP-Damage und Break-Kosten ab.

### onr_v1_156_corporate-ally - Corporate Ally

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Corporate Ally ist in V1.8.0 implementiert: LegalActions fordern einen Runner-Agenda-Punkt als Zusatzkosten, `applyAction` revalidiert exakt 1 Agenda-Punkt und legt die geforfete Agenda öffentlich in `removed_from_game`. Die Agenda-Difficulty-Erhöhung wird in Tests gegen Score-/Steal-Pfade geprüft. Die hauptsächliche Lücke liegt nicht im Kernvertrag, sondern in Härtung und Sichtbarkeit: Der Forfeit-Zielpfad muss bei mehreren Agenda-Zielen deterministisch und legal bleiben, ohne private Agenda-Details unnötig in PublicPayloads zu spiegeln.

Notwendige Umsetzung

Den bestehenden Pfad gezielt nachhärten: explizite Tests für mehrere gestohlene Agenden, stale/wrong-side Install, PublicPayload-Redaction und Replay/StateHash nach Forfeit plus späterer Score-/Steal-Revalidation. Falls die LegalAction aktuell automatisch ein Ziel wählt, sollte ein stabiler Choice-/Target-Vertrag geprüft werden, damit UI/KI nicht auf implizites privates Wissen angewiesen sind.

Akzeptanzkriterien

- Install wird ohne Runner-Agenda-Punkt nicht angeboten und in `applyAction` abgelehnt.
- Bei mehreren legalen Forfeit-Zielen ist die Auswahl deterministisch oder als legale Choice abgebildet.
- PublicEvents enthalten nur erlaubte öffentliche Forfeit-/Kosteninformationen.
- Replay/StateHash bleibt über Install, Removed-from-game und folgende Agenda-Difficulty-Berechnung stabil.

### onr_v1_180_smiths-pawnshop - Smith's Pawnshop

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Smith's Pawnshop ist in V1.7.0 implementiert: Unique-Regeln, Start-of-turn-Choice, Selbst-Trash-Verbot und Credit-Gewinn sind vorhanden. Die Choice ist `public`, was für öffentlich installierte Runner-Karten vertretbar ist. Härtungsbedarf besteht bei Reihenfolge und Replay: Der Start-of-turn-Pfad interagiert mit anderen Start-of-turn-Triggern, PendingChoice-Abbruch, zwischenzeitlich entfernten Karten und stabiler Sortierung der auswählbaren installierten Karten.

Notwendige Umsetzung

Den Start-of-turn-Choice-Pfad gezielt absichern: Replay/StateHash-Test für Annahme und Pass, stale/wrong-side `resolve_choice`, Zielkarte zwischen Choice-Erzeugung und Resolution entfernt, sowie Triggerreihenfolge mit mehreren Start-of-turn-Effekten. PublicPayloads sollen nur Definition/Instanz der öffentlich installierten getrashten Karte und Credit-Gewinn enthalten.

Akzeptanzkriterien

- `pass` und Trash-Auswahl sind jeweils replay-stabil.
- Selbst-Trash, nicht mehr installierte Zielkarte, falsche Seite und stale StateVersion werden in `applyAction` abgelehnt.
- Mehrere start-of-turn-Quellen erzeugen eine deterministische, dokumentierte Reihenfolge.
- Keine Hand-, Stack- oder private Payload-Daten erscheinen in Events oder PlayerViews.

### onr_v1_224_bolter-cluster - Bolter Cluster

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Bolter Cluster ist als V1.9.13-Damage-ICE freigegeben, aber der aktuelle Runtime-/Catalog-Override reduziert den bestätigten Kartentext stark. Der lokale Kartentext verlangt 4 Net Damage und eine Run-weite Folgebarriere: Runner kann keine Subroutinen des nächsten ICE brechen. Der sichtbare Shared-Vertrag modelliert dagegen 1 Net Damage und End the Run. Damit ist die Effektvollständigkeit klar nicht gegeben; Chronik und Tests decken generische Damage/Prevention-Events ab, nicht den Next-ICE-Unbreakable-Modifikator.

Notwendige Umsetzung

Bolter Cluster braucht einen eigenen Sentry/AP/Hellbolt-Resolver: erste Subroutine 4 Net Damage mit Prevention-Fenster, zweite Subroutine setzt einen deterministischen Run-Modifier auf das nächste encountered ICE, der Break-LegalActions für dessen Subroutinen unterdrückt oder ablehnt. Dieser Modifier muss nach genau dem nächsten ICE sauber verbraucht werden.

Akzeptanzkriterien

- Kartentext, Shared-Definition und Catalog-Override stimmen auf 4 Net Damage plus Next-ICE-Unbreakable überein.
- Prevention, Flatline, PublicPayload-Redaction und Random-Trash-Hidden-Info sind abgedeckt.
- Das nächste ICE bietet keine Break-LegalActions für Subroutinen; danach ist der Modifier entfernt.
- Replay/StateHash-Smoke deckt Schaden, Modifier-Set, Modifier-Verbrauch und Run-Ende ab.

### onr_v1_240_fang - Fang

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Fang ist in V1.9.14 als Trace-ICE freigegeben, aber die implementierte Wirkung entspricht sichtbar nicht vollständig dem bestätigten Kartentext. Der Text verlangt bei erfolgreichem Trace: Run beenden und Runner darf erst wieder laufen, nachdem er eine Aktion zum Bezahlen von 2 Credits nimmt. Die aktuelle Definition gibt bei erfolgreichem Trace einen Tag und hat eine separate ETR-Subroutine. Der Pay-to-run-Lock existiert im Code erkennbar für Fang 2.0, nicht für Fang. Das ist ein hoher Engine-Korrektheitsbefund.

Notwendige Umsetzung

Fang auf eigenen Trace-Erfolgseffekt umstellen: kein Tag-Effekt, sondern erfolgreicher Trace beendet den Run und setzt `fangRunLockCreditCost: 2` oder einen allgemeineren Run-Lock-State, der nur durch Runner-LegalAction mit genau 1 Click + 2 Credits entfernt wird. Fang 2.0 darf dabei nicht regressieren; gemeinsame Helfer sind sinnvoll, wenn die Unterschiede explizit bleiben.

Akzeptanzkriterien

- Erfolgreicher Fang-Trace endet den Run und blockiert neue Runs bis zur bezahlten Runner-Aktion.
- Misslungener Trace lässt den Run korrekt im Encounter-Fenster weiterlaufen und setzt keinen Lock.
- PublicPayload nennt Trace-Werte, Lock-Kosten und Lock-Clear, aber keine privaten Zonen.
- Tests vergleichen Fang und Fang 2.0 bewusst, inklusive wrong-side/stale und Replay/StateHash.

### onr_v1_251_jack-attack - Jack Attack

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Jack Attack ist in V1.9.3 implementiert: Die erste Subroutine setzt ein run-weites Jack-out-Lock, die zweite startet Trace 5 mit Tag bei Erfolg. Tests belegen Trace-Bid-Fenster, Jack-out-Unterdrückung und side-/stateVersion-Härtung über benachbarte Agenda-Trace-Pfade. Die Karte wirkt fachlich grundsätzlich passend; die Spotcheck-Lücke liegt bei vollständiger PublicPayload- und Replay-Härtung direkt für die Kombination aus Jack-out-Lock plus Trace-Tag.

Notwendige Umsetzung

Bestehenden Pfad nicht neu schneiden, sondern absichern: eigener Replay/StateHash-Test ab erstem Encounter, PublicPayload-Leakscan nach Lock und Trace, sowie Edge Cases für gebrochene erste Subroutine, nur zweite Subroutine, Trace-Miss und Run-Ende nach anschließendem Continue.

Akzeptanzkriterien

- Wird die Lock-Subroutine gebrochen, bleibt Jack-out legal; wird sie nicht gebrochen, fehlt `jack_out` bis zum Ende dieses Runs.
- Trace 5 nutzt die normalen Corp-/Runner-Bid-Choices und Tag wird nur bei Trace-Erfolg vergeben.
- Lock-Zustand endet sicher mit dem Run und überlebt nicht in den nächsten Run.
- Replay/StateHash und PublicPayload-Leakscan sind kartenspezifisch grün.

### onr_v1_258_neural-blade - Neural Blade

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Neural Blade ist ebenfalls in V1.9.13 freigegeben, aber der lokale Kartentext und die Runtime-Definition laufen auseinander. Der bestätigte Text verlangt 1 Net Damage und denselben Next-ICE-Unbreakable-Modifikator wie Bolter Cluster; der aktuelle Shared-/Catalog-Vertrag modelliert nur 2 Net Damage. Damit fehlen sowohl die korrekte Schadenshöhe als auch der eigentliche Run-Modifier.

Notwendige Umsetzung

Neural Blade auf eigenen Resolver umstellen: 1 Net Damage mit Prevention-Fenster und anschließender Next-ICE-Unbreakable-Modifikator. Wo möglich sollte der Modifier mit Bolter Cluster geteilt werden, aber Schadenshöhe und Subroutine-IDs bleiben kartenspezifisch.

Akzeptanzkriterien

- Kartentext und Runtime-Schaden sind exakt 1 Net Damage.
- Der Next-ICE-Unbreakable-Modifikator verhindert Break-LegalActions nur für das nächste encountered ICE und wird danach entfernt.
- Prevention, Hidden-Info beim Net Damage, PublicPayload und Replay/StateHash sind kartenspezifisch getestet.
- Regressionstest stellt sicher, dass Bolter Cluster 4 Schaden und Neural Blade 1 Schaden nutzt.

### onr_v1_346_vacant-soulkiller - Vacant Soulkiller

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Vacant Soulkiller ist in V1.9.19 als Access-Ambush mit Damage-Pfad freigegeben. Der lokale bestätigte Text sagt Brain Damage pro Advancement-Counter; die aktuelle Implementierung/Tests sprechen von Core Damage und prüfen erkennbar nur +1 Schaden beim Access. Dadurch bleiben Advancement-Skalierung, vor/nach Rez avancieren und die alte Brain-/Core-Begriffsschicht unvollständig. Immerhin sind Access-Ambush, PublicPayload und V1.9.19-Gate grundsätzlich vorhanden.

Notwendige Umsetzung

Den Resolver muss auf Advancement-Counter-Skalierung und die projektgültige Brain/Core-Abbildung geschärft werden: Advance-LegalActions vor und nach Rez, Ambush-Schaden beim Access in Höhe der Counter, Redaction des Access-Kontexts und Flatline/Handlimit-Folgen. Falls NETGRID intern Brain Damage als Core Damage führt, muss die PublicPayload diese Normalisierung konsistent dokumentieren.

Akzeptanzkriterien

- Vacant Soulkiller ist vor und nach Rez advancebar, mit `applyAction`-Revalidation für Kosten, Ziel und Timing.
- Access verursacht Schaden in Höhe der Advancement-Counter; 0 Counter verursacht keinen Schaden oder explizit den regelkonformen Minimalfall, falls so entschieden.
- PublicPayload nennt Ambush-ID, Schadensart und Schadenshöhe, ohne versteckte Server-/HQ-/R&D-Daten zu leaken.
- Replay/StateHash deckt 0, 1 und mehrere Counter sowie Flatline-/Handlimit-Folge ab.

### onr_v1_369_singapore-city-grid - Singapore City Grid

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

Singapore City Grid ist in V1.9.18 decklegal/AI-supported, aber laut Mechanik-Coverage blieb es im City-Grid-Bereich als Runtime-Definition ohne Sonderpfad dokumentiert. Der lokale Kartentext verlangt während eines Runs auf dieses Fort einmal pro Run den Swap eines unrezzed ICE auf diesem Fort mit einem ICE aus HQ; die neue Karte kommt concealed ins Spiel. Das ist ein Hidden-Zone- und Run-Timing-Schwergewicht, das durch generische Root-/Region-Install- und Trash-Pfade nicht abgedeckt ist.

Notwendige Umsetzung

Eigenen servergebundenen Upgrade-Resolver implementieren: nur rezzed Singapore City Grid, nur während eines Runs auf das Fort, nur einmal pro Run, Zielauswahl unrezzed ICE auf diesem Fort plus private HQ-ICE-Auswahl der Corp, Austausch als concealed/unrezzed ICE an gleicher Position. LegalAction/Choice muss Corp-seitig hidden-info-barrier sein; PublicEvent darf nur "ICE wurde ausgetauscht" und öffentliche Server-/Positionsinformationen enthalten, nicht die HQ-Karte vor Reveal.

Akzeptanzkriterien

- Aktion wird nur im passenden Run-Fenster und nur einmal pro Run angeboten.
- `applyAction` revalidiert Serverbindung, rezzed Zustand, unrezzed ICE-Ziel, HQ-ICE-Ziel, StateVersion und Kosten.
- Runner sieht vor Reveal nicht die aus HQ eingewechselte Card ID; Reconnect, PublicEvent und KI-Inputs bleiben redacted.
- Replay/StateHash stabilisiert den Swap inklusive ICE-Position, HQ-Entnahme und concealed neuer ICE-Instanz.

## Gesamtplan

1. Zuerst die klaren Text-/Runtime-Divergenzen korrigieren: Bolter Cluster, Fang, Neural Blade, Singapore City Grid, Vacant Soulkiller.
2. Danach die unvollständigen, aber weniger riskanten Runner-Permanents schärfen: Vewy Vewy Quiet und Microtech ’Trode Set.
3. Abschließend bestehende Pfade härten: Corporate Ally, Smith's Pawnshop und Jack Attack mit direkten Replay-/StateHash-/Payload-Tests.
4. Bei allen Karten `LegalActions` als einzige Aktionsbasis erhalten und `applyAction` als finalen Guardrail für Seite, actionId, stateVersion, Timing, Kosten, Ziele und Choices nutzen.
5. Nach der Umsetzung Register/Manifest nur im separaten Implementation-Job aktualisieren; dieser Report selbst ändert bewusst keinen Registerstand.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm --filter @netgrid/catalog test`
- `pnpm --filter @netgrid/ai test`
- `pnpm test`
- Gezielte Leak-Scans in neuen Tests: `cardInstances`, `privatePayload`, `grip`, `hq`, `rd`, verdeckte Definition-IDs aus Singapore-City-Grid-Swap.
- Replay/StateHash-Smokes für jede neu geschärfte Karte, besonders Next-ICE-Unbreakable, Fang-Run-Lock, Vacant-Soulkiller-Counter-Schaden und Singapore-City-Grid-HQ-Swap.

## Umsetzungsstand 2026-05-15

Status: `done` mit grün geprüften Fixes.

Umgesetzt:

- Vewy Vewy Quiet lädt nun exakt zwei Recurring-Counter und bleibt im bestehenden Run-Icebreaker-Creditpfad.
- Bolter Cluster wurde auf 4 Net Damage plus Next-ICE-No-Break-Modifier korrigiert.
- Neural Blade wurde auf 1 Net Damage plus denselben Next-ICE-No-Break-Modifier korrigiert.
- Fang verwendet bei erfolgreichem Trace den bestehenden Pay-to-run-Lock statt eines Tag-Effekts.
- Vacant Soulkiller skaliert Core/Brain Damage nach Advancement-Countern und behandelt 0 Counter als No-Damage-Fall.
- Microtech 'Trode Set erhöht Break-Kosten um 1 und reduziert ungebrochenen AP-Net-Damage auf 1.
- PublicPayload-Kontext wurde für die Microtech-AP-Reduktion explizit gemacht; Replay/StateHash-Smokes wurden ergänzt.
- Corporate Ally wurde mit deterministischem Mehragenda-Forfeit, No-agenda-Gate, Payload-Leakscan und Replay/StateHash gehärtet.
- Smith's Pawnshop wurde mit Pass-Replay, wrong-side/stale-Guards und Removed-target-Revalidation gehärtet.
- Jack Attack wurde mit direktem Jack-out-Lock-, Trace-Tag-, Payload-Leakscan-, Run-End-Cleanup- und Replay/StateHash-Test gehärtet.
- Singapore City Grid wurde mit eigenem Hidden-Info-sicheren HQ-ICE-Swap-Resolver umgesetzt: rezzed/servergebunden, nur während Runs auf das Fort, einmal pro Run, unrezzed ICE-Ziel im Fort, Corp-private HQ-ICE-Auswahl, Swap an gleicher Position, neue ICE-Instanz concealed/unrezzed, redigierte PublicPayload und Replay/StateHash-Abdeckung.

Fokussierter Check:

- `corepack pnpm --filter @netgrid/engine test -- -t "Vewy Vewy Quiet|Bolter Cluster|Fang trace|Vacant Soulkiller|Microtech Trode Set|remaining V1.9.19 access ambush|side-safe prevention choices|installs Shield"` - grün.
- `corepack pnpm --filter @netgrid/engine test -- -t "Corporate Ally|Smith's Pawnshop|Jack Attack"` - grün.
- `corepack pnpm --filter @netgrid/engine test -- -t "Singapore City Grid"` - grün.

Pflichtchecks:

- `corepack pnpm --filter @netgrid/engine test` - grün.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün.
- `corepack pnpm --filter @netgrid/catalog test` - grün.
- `corepack pnpm typecheck` - grün.

Finaler Status: `done`
