# Runner-Rig-Bedarfs- und Retentionsprojektion

Status: In Umsetzung – Paket P2 aktiv

## Quelle

Auslöser ist die Auswertung der NETGRID-KI-Metaserie 330 und der anschließende Vergleich mit der Runner-Kartennutzung. Insbesondere die frühe Installation von MU-Erweiterung, konkreter Breaker-Coverage, eingeschränkten Creditquellen und Run-Economy darf nicht nur aus dem unmittelbaren Boardzustand oder einem allgemeinen Doctrine-Label bewertet werden. Maßgeblich ist, ob das abgestimmte Deck einen konkreten, in einem belastbaren Horizont erreichbaren Rig-Meilenstein besitzt und ob Installation, Halten oder späterer Discard gegenüber der besten Alternative tatsächlich sinnvoll sind.

## Zielprüfung

Das Vorhaben ist realistisch umsetzbar. Der aktuelle Stand besitzt bereits `DeckCapabilityProfile`, `MemoryCapabilityProfile`, `RunnerHandDevelopmentEvaluation`, `RunnerPersistentInstallEvaluation`, planlokale Coverage-Bedarfe, Handrotationsbewertung und typisierte Ressourcenpfade. Es fehlt eine gemeinsame, side-sichere und an die aktuelle `stateVersion` gebundene Faktenprojektion für gleichzeitig gewünschten Rig-Bedarf und die Bindung sichtbarer eigener Karten an diesen Bedarf.

Die Projektion wird als gemeinsamer Fact-Service umgesetzt, weil MU, konkrete Coverage, Handretention und eingeschränkte Ressourcen von mehreren vorhandenen Runner-Ownern konsumiert werden. Sie ist weder Plan noch Chooser und erhält keine Ausführungsautorität.

## Gesamtziel

Die Runner-KI bewertet persistente Rig-Installationen und das Halten sichtbarer eigener Karten anhand konkreter, horizongebundener Deck- und Planbedarfe. Frühzeitige Vorbereitung ist zulässig, wenn ein gebundener nächster Rig-Meilenstein dadurch realistisch ermöglicht wird. Allgemeine Handfülle, bloße Deckdichte oder ein abstraktes `runner.rig_first` dürfen dagegen keinen Bedarf erfinden.

Die Änderung bleibt capability-basiert und generisch. Kartennamen dienen ausschließlich Testlesbarkeit und konkreter Instanzbindung, nicht der produktiven Strategieentscheidung.

## Annahmen

- Alle Fakten stammen ausschließlich aus `PlayerView`, aktuellen `LegalActions`, eigenen bekannten Karten, dem validierten eigenen Deck-Snapshot, DeckCapabilities, Strategic Intent und bereits vorhandenen planlokalen Bedarfen.
- Die Projektion wird für jede `stateVersion` neu aufgebaut und trägt den side-sicheren Planning-Fingerprint.
- Ein Demand Envelope beschreibt erforderliche, bevorzugte und alternative Provider; er ist kein statisches Zielrig.
- Konkrete Planbindungen haben Vorrang vor Doctrine- oder Optionssignalen.
- Draw und Search bleiben Informationsgrenzen. Eine unbekannte zukünftige Karte wird niemals als vorhandene oder garantierte Installation behandelt.

## Nicht-Ziele

- keine neue globale Planungs- oder Bewertungsautorität;
- kein statischer Soll-Rig-Score und keine kartennamenspezifische Freischaltung;
- keine neue Legalität, kein Nachbau von Engine-Kosten und keine zukünftigen Action-IDs;
- keine Entscheidung des Fact-Service über Installieren, Halten, Discard, Server, Runziel oder Executor;
- keine Persistenz hypothetischer Projektionen über eine neue `stateVersion`;
- keine beliebige Vorhersage verdeckter Stackreihenfolge oder gegnerischer Hidden-Zonen;
- kein Ausbau eines gemeinsamen MU-/Hosting-Kernels über die tatsächlich benötigte Runner-Faktenprojektion hinaus.

## Controller-Invarianten und Owner

- `runner.rig_and_coverage` besitzt konkrete Breaker-, Spezial-Coverage-, MU-/Hosting- und zugehörige Search-/Install-/Funding-Bedarfe.
- `runner.develop_board_and_hand` besitzt nur allgemeine, admission-geprüfte Infrastruktur ohne bereits zuständigen Domainbedarf.
- `runner.defense_and_recovery` besitzt sichtbare Tag-, Damage- und Präventionsbedarfe.
- `runner.economy` führt ausschließlich den nächsten exakt gebundenen Funding-Step eines Parents oder einen eigenen endlichen Economy-Step aus.
- Handrotation und Cleanup vergleichen Retention und die beste sichtbare Alternativkarte, dürfen aber weder Rig-Bedarf noch einen Installationsowner erzeugen.
- Der Scheduler bleibt alleiniger Dirigent; genau ein bestehender Plan, Step und Route Head materialisiert die aktuelle LegalAction.
- Ein Choice-Resolver ändert weder Action-ID noch Executor noch Planbindung.

## Faktenvertrag

Der neue Vertrag `RunnerRigDemandProjection` enthält mindestens:

- Schema-Version, Runner-Seite, `stateVersion` und `sideSafePlanningFingerprint`;
- mehrere typisierte `doctrineSignals` statt eines globalen Doctrine-Modus;
- konkrete `roleDemands` mit Demand-ID, Owner, Ursprung, Horizont, Garantiegrad, Bedarfsart, Providerdefinitionen, MU-/Hostingbedarf und Erwerbsstatus;
- eine Memory-Projektion mit aktueller Belegung, gebundenem `required`-/`preferred`-Bedarf und sauber getrennten alternativen Host-/Providerwegen;
- sichtbare Acquisition-Routen mit aktuellem, suchbarem, draw-only oder nicht verfügbarem Status;
- kartenbezogene Fakten `boundDemandIds`, `retentionValue`, `installReadiness` und Evidenz.

Der Vertrag enthält ausdrücklich keine `selectedActionId`, keinen Executorwechsel und keine endgültige `cardDisposition`.

## Horizonte und Sicherheit

1. `current_step`: exakt aktuell und legal gebundener Bedarf;
2. `next_rig_milestone`: konkreter residenter oder aus sichtbaren eigenen Karten deterministisch vorbereitbarer Meilenstein;
3. `doctrine_option`: deckgestützte Option ohne Ausführungsbehauptung.

`required_simultaneously`, `preferred_simultaneously`, `alternative_provider`, `backup_only`, `conditional_support` und `optional_doctrine_reserve` bleiben unterscheidbar. Nur die ersten beiden können einen gebundenen MU- oder Coverage-Meilenstein tragen; Doctrine allein begründet höchstens Retention, nie unmittelbare Installation.

## Hand-, Ressourcen- und Run-Economy-Vertrag

- Handdruck beeinflusst nur Timing und Retentionsvergleich. Er ist keine Demand-Quelle.
- Der Installationswert wird gegen die beste bekannte Cleanup-/Discard-Alternative ohne Installation verglichen.
- Draw-Wirkung wird netto einschließlich Handkapazität und erwarteter Cleanup-Kosten betrachtet.
- Eingeschränkte Creditpools erhalten nur Wert für erwartete zulässige Nutzung innerhalb des gebundenen Horizonts.
- Run-Economy benötigt einen konkreten Run-/Coverage-Parent oder eine belegte wiederkehrende Decklinie; ein irgendwann möglicher Run genügt nicht.
- Finanzierung muss dieselbe Demand-ID und denselben Parent bewahren.

## Zustandsmaschine

```text
P0 Architektur- und Ursachenkarte
→ P1 Fact-Vertrag und reine Diagnose
→ P2 MU- und Coverage-Bindung an bestehende Owner
→ P3 Hand-/Ressourcen-/Run-Economy-Abwägung
→ P4 Regression, Dokumentation, Main-Integration und Cleanup
```

Es ist immer genau ein Paket aktiv. Ein Paketwechsel erfolgt erst nach fokussiertem grünem Test, `git diff --check`, Dokumentationsfortschritt und eigenem Commit.

## Paketfolge

### P0 – Architektur- und Ursachenkarte

Ziel: Bestehende Owner, Inputs, Facts, Handentwicklung, MU-Druck, Ressourcenpfade und Testgrenzen vollständig lokalisieren.

Voraussetzungen: Wiki-first-Einstieg, `release-implementation-agent`, `packages/ai/AGENTS.md`, Änderungskompass sowie einschlägige Abschnitte aus Ziel-, Plan- und Turn-Campaign-Architektur gelesen.

Arbeit: Ursache der zu lokalen `useful_now`-/MU-Bewertung belegen; Fact-/Plan-/Choice-Grenze festschreiben; Worktree und Paketreihenfolge anlegen.

Artefakte: diese Activity und Code-/Testkarte in ihren Paketabschnitten.

Tests: `git diff --check`.

Done-Gate: Ziel, Owner, Nicht-Ziele, StateVersion-/Side-Safety, Paketfolge und Cleanup-Vertrag sind dokumentiert.

Commit: `docs(activities): plan runner rig demand projection`

### P1 – Zustandsgebundene Rig-Demand- und Retentionsfacts

Ziel: Einen reinen, deterministischen `RunnerRigDemandProjection`-Service ohne Entscheidungswirkung einführen.

Voraussetzungen: P0 committed.

Arbeit: typisierte Horizonte, Bedarfsarten, Owner-/Ursprungsbindung, Memory-Envelope, Acquisition-Status, Kartenretentionsfacts, Redaction/Evidence und Fail-closed-Statebindung implementieren; Diagnose im bestehenden Handentwicklungsweg sichtbar machen, ohne Prioritäten zu ändern.

Artefakte: neue Runner-Rig-Demand-Typen und Builder, Exporte, fokussierte Unit-Tests, Activity-Fortschritt.

Tests: neue Fact-Service-Testdatei; TypeScript nur soweit die neue Typoberfläche betroffen ist; `git diff --check`.

Done-Gate: identische side-sichere Eingaben erzeugen identische Facts; StateVersion/Fingerprint stimmen; Handdruck ist keine Demand-Quelle; Doctrine-Optionen erzeugen keine unmittelbare Installationsbereitschaft; keine Action-/Executorfelder im Vertrag.

Commit: `feat(ai): add runner rig demand projection facts`

Nachweis: Der reine Fact-Service, seine öffentliche Typoberfläche und fünf fokussierte Vertragsfälle sind umgesetzt. Die Tests belegen simultanen MU-Bedarf, getrennte Hosting-Nachfrage, doctrine-only ohne erfundenen Bedarf, fail-closed StateVersion-/Fingerprint-Bindung, deterministische Sortierung sowie action- und instanzfreie Redaction. Fokussierter Vitest und AI-Typecheck sind grün.

### P2 – Konkrete MU- und Coverage-Bindung

Ziel: Bestehende Owner konsumieren konkrete Demand-Bindungen statt allgemeiner `rig_first`- oder Handrollenannahmen.

Voraussetzungen: P1 committed.

Arbeit: `RunnerPersistentInstallEvaluation`, MU-Pressure und planlokale Coverage-/Development-Routen mit `boundDemandIds`, Horizon und Guarantee verbinden; Memory-Support nur bei belegtem simultanem MU-Bedarf aufwerten; bereits vollständiges Rig und alternative Provider berücksichtigen; Funding-Bedarfe beim Parent belassen.

Artefakte: angepasste Hand-/Installationsbewertung, MU-/Coverage-Adapter, Ownership-Evidence, fokussierte Regressionstests.

Tests: MU 0/4 mit zwei gebundenen Programmen positiv; MU 4/4 mit vollständigem Rig ohne Bonus; kein Killerplan für Killer-Credit-Hardware; konkreter suchbarer Killerpfad positiv; hosted und allgemeine MU getrennt; Plan/Step/Route/Action unverändert gebunden; `git diff --check`.

Done-Gate: Generische MU- und Coverage-Bindung wirkt nur beim bestehenden Owner; kein zweiter Chooser oder globaler Rohscore entsteht.

Commit: `fix(ai): bind rig installs to concrete demand`

### P3 – Handökonomie, eingeschränkte Ressourcen und Run-Economy

Ziel: Frühinstallation und Retention als mehrzügige, aber begrenzte Gegenfaktualbewertung korrekt einordnen.

Voraussetzungen: P2 committed.

Arbeit: beste bekannte Cleanup-Alternative gegen Installation vergleichen; Handdruck nur als Timingfaktor verwenden; Net-Handeffekt von Draw-/Search-Routen berücksichtigen; eingeschränkte recurring Credits an erwartete zulässige Nutzung und Horizont binden; Funding- und Run-Economy-Bindungen zum Parent erhalten.

Artefakte: Retention-/Rotation-Adapter, Ressourcen-Nutzungsquote, Run-Economy-Evidence, fokussierte Tests.

Tests: volle Hand mit besserem Discardziel erzeugt keinen künstlichen MU-Wert; gebundene Killer-/Run-Linie kann eingeschränkte Credits früh rechtfertigen; unbelegte Run-Option nicht; nicht finanzierter Big-Gun-Pfad nur mit gebundener Fundingroute; dringender aktueller Run überstimmt allgemeine Langfristretention; `git diff --check`.

Done-Gate: Die Bewertung vergleicht echte Alternativen und Horizon-Nutzung, ohne Cleanup, Economy oder Runowner zu verschieben.

Commit: `fix(ai): project rig retention and restricted resource use`

### P4 – Regression, Wissen und Abschluss

Ziel: Den vollständigen Änderungsschnitt paketnah absichern, in den Current-State-Vertrag zurückführen und sauber lokal integrieren.

Voraussetzungen: P1 bis P3 committed.

Arbeit: Hidden-Info-Äquivalenz, StateVersion-Staleness, Ownership und ausgewählte Decision Checkpoints ergänzen; betroffene Architektur-/Wissensseiten nur bei neuem Current-State-Vertrag aktualisieren; fokussierte Suites, AI-Typecheck und aktive Struktur-/Hint-Gates ausführen; neuesten `main` einbinden; Branch lokal nach `main` mergen; Worktree und Branch verifiziert entfernen.

Artefakte: Regressionstests, gegebenenfalls Current-State-Dokumentation, Abschlussnachweis in dieser Activity bis unmittelbar vor dem Cleanup.

Tests: fokussierte neue Tests, direkt angrenzende bestehende Tests, `corepack pnpm --filter @netgrid/ai typecheck`, einschlägige aktive AI-Gates, `git diff --check`. Vollständige AI-Shards nur bei nachgewiesen breiter Wirkung oder explizitem Integrationscheckpoint.

Done-Gate: neue und angrenzende Tests grün; side-sichere Äquivalenz, unveränderte Ownership und keine zweite Autorität belegt; Branch in `main`; Hauptcheckout sauber; Worktree in Git und Dateisystem entfernt; Arbeitsbranch gelöscht.

Commit: `test(ai): close runner rig demand projection`

## Automatische Fehlerbehandlung

- Fehlende Pflichtdaten, ungültige Zahlen, abweichende StateVersion oder fehlender Planning-Fingerprint erzeugen eine strukturierte fail-closed Diagnose; sie werden nicht als null oder neutral behandelt.
- Ein nicht sicher klassifizierbarer Demand bleibt `unknown` und kann keine Installation oder Finanzierung freigeben.
- Eine nicht verfügbare oder nur draw-only Karte bleibt eine Option, keine aktuelle Route.
- Ein Konflikt zwischen Ownern, Demand-Bindungen oder Ressourcen stoppt den betroffenen Pfad; es erfolgt kein Wechsel auf eine andere LegalAction.
- Testfehler werden an der erzeugenden Schicht behoben. Unabhängige Baselinefehler werden getrennt dokumentiert und nicht in diesen Scope gezogen.

## Sicherheitsblocker

Die Umsetzung stoppt mit Blocker-Report und Removal Condition, wenn:

- eine benötigte Bewertung gegnerische Hidden-Zonen oder die verdeckte Stackreihenfolge erfordern würde;
- die vorhandenen Planinstanzen keinen eindeutigen fachlichen Owner liefern;
- aktuelle Engine-Kosten, LegalActions oder Choice-Bindungen fehlen;
- eine notwendige Ressource doppelt als garantiert gebunden wäre;
- ein produktiver Fix nur durch Fallback, Resolver-Shortcut oder neue globale Autorität möglich wäre;
- der Worktree nicht sauber oder der Main-Abgleich nicht konfliktfrei abschließbar ist.

## Verifikationsregeln

- Tests prüfen nicht nur die gewählte Action, sondern Owner-Modul, Planinstanz, Step, Route, Parent-/Demand-Bindung und unveränderte Action-ID.
- Zwei Zustände mit identischem side-sicherem Runner-Input und abweichenden gegnerischen Hidden-Zonen erzeugen dieselbe Projektion und Entscheidung.
- Stale Facts dürfen in einer späteren `stateVersion` nicht konsumiert werden.
- Alle sortierten Mengen, IDs und Evidence sind deterministisch; technische IDs sind nur stabile Tiebreaks.
- Die fokussierten Tests verwenden realistische `PlayerView`s und echte oder exakt nachgebildete `LegalActions`.

## Worktree- und Git-Vertrag

Arbeitsworktree: `C:\Projekte\NETGRID_RUNNER_RIG_DEMAND_PROJECTION`

Arbeitsbranch: `codex/runner-rig-demand-projection`

Integrationsbranch: lokaler `main` im primären Checkout `C:\Projekte\NETGRID`

Kein Push. Vor dem finalen Merge wird der neueste lokale `main` in den Arbeitsbranch eingebunden. Nach erfolgreichem lokalem Merge werden Hauptcheckout und Mergezustand geprüft, der exakte Worktree-Pfad auf Sauberkeit validiert, der Worktree deregistriert und physisch entfernt, die Entfernung in `git worktree list` und im Dateisystem geprüft und anschließend der gemergte Arbeitsbranch gelöscht.

## Controller-Prompt-Kern

`/Goal Arbeite die Runner-Rig-Bedarfs- und Retentionsprojektion vollständig und sequenziell von P0 bis P4 ab. Lies zuerst AGENTS.md, die Wissensbasis, diese Activity und den vollständigen KI-Preflight. Arbeite ausschließlich im genannten Worktree; nutze den Hauptworkspace nur für den finalen lokalen Merge. Arbeite immer nur am aktiven Paket, führe dessen fokussierte Checks aus, aktualisiere den Paketfortschritt und committe es. Bewahre die bestehenden Owner und Side-Safety: Der Fact-Service wählt keine Action und entscheidet nicht über Installieren, Halten oder Discard. Bei einem Sicherheitsblocker stoppe mit Ursache und Removal Condition. Nach Abschluss neuesten main einbinden, relevante Checks ausführen, lokal nach main mergen, main prüfen, den sauberen Worktree entfernen und in Git sowie Dateisystem verifizieren, den gemergten Branch löschen und das Goal erst danach als complete markieren.`

## Abschlusskriterien

- Alle Pakete P0 bis P4 sind einzeln committed und ihre Done-Gates erfüllt.
- Konkreter zukünftiger Rigbedarf kann frühe MU-/Coverage-/Ressourcenentwicklung begründen; bloße Handfülle oder Doctrine kann dies nicht.
- Retention und Installation bleiben getrennte Entscheidungen der vorhandenen Owner.
- Tests belegen StateVersion-Bindung, Determinismus, Hidden-Info-Äquivalenz, Parent-/Need-Kohärenz und unveränderte Ausführungsautorität.
- Der Arbeitsbranch ist lokal in `main` integriert.
- Worktree und Branch sind verifiziert bereinigt.
