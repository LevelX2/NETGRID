# Legacy-Vereinfachung 2026-07-19

## Status

Aktiv. Genau ein Paket wird gleichzeitig bearbeitet. Der Fortschritt wird nach
jedem Paket in diesem Dokument aktualisiert.

## Fortschritt

- P0 Prozessbasis: abgeschlossen, Commit `1a8c0ba29`.
- P1 Statische Hint-Semantik: abgeschlossen. Alle produktiven Ableitungen sind
  als verbraucherspezifische statische Felder in
  `ai-card-hints-active.json` übernommen; Inspector-Index,
  Ableitungskataloge und Compiler-/Taxonomie-Skripte sind entfernt. Geprüft
  mit AI-/Web-Typecheck, 67 gezielten AI-Tests, 52 Webtests und einem
  AI-Gesamtlauf mit 2.769 grünen Tests; dessen zwei Befunde wurden danach
  gezielt korrigiert und grün nachgetestet.
- P2 Kartenrollen-/Access-Legacy: abgeschlossen. Die 34 Manifestrollen waren
  vollständig in den Active-Hints vorhanden. Manifest, Doppel-Lookups,
  Access-Legacy-Datei und alte Chimera-Choice-Verkabelung sind entfernt; die
  deklarative Bizarre-Encryption-Longtail-Wirkung läuft nun direkt im
  CardImplementation-Accesspfad. Geprüft mit AI-/Engine-/Web-Typechecks,
  61 gezielten AI-Tests, 101 Access-/CardImplementation-Engine-Tests,
  16 Catalogtests und 15 Inspector-UI-Tests.
- P3 Aussagekräftige Architekturgates: abgeschlossen. AI- und Engine-Checks
  schützen weiterhin Zyklen, Schichtgrenzen, Registry-Eigentum und verbotene
  Laufzeitabhängigkeiten; historische Zeilen-, Datei-, Testgrößen-, Fanout-
  und exakte Binding-Grenzwerte sowie der doppelte `check:ai:full`-Alias sind
  entfernt. Geprüft mit allen sechs betroffenen Checks/Selbsttests und dem
  vollständigen Workspace-Typecheck.
- P4 Kanonischer Server-Storage und Deck-Snapshot: als Nächstes.

## Quelle/Vorgabe

Die Umsetzung folgt dem Architektur-Audit aus der Spielanalyse-Nacharbeit vom 19. Juli 2026 und dem Nutzerauftrag, die dort empfohlenen Legacy-, Compiler-,
Fallback- und Moving-Target-Schichten direkt zu entfernen.

## Zielprüfung

Die Vorgabe ist für eine automatische Abarbeitung ausreichend präzise. Die
betroffenen Quellen und Verbraucher sind identifiziert. NETGRID ist eine
Version-0-Umgebung ohne Pflicht zur Rückwärtskompatibilität für lokale
Laufzeitdaten, alte Replays, alte Schemas oder historische Browserdaten.

## Gesamtziel

NETGRID besitzt nach Abschluss eine schlankere, eindeutige Struktur:

- Karten-Hints sind die statische semantische Quelle der KI;
- alte parallele Kartenrollen- und Access-Implementierungen sind entfernt;
- Architekturchecks schützen echte Schichtgrenzen statt historischer
  Zeilen-, Datei- und Fanout-Grenzwerte;
- der produktive Server verwendet ausschließlich SQLite;
- private Deck-Snapshots besitzen genau eine kanonische Form;
- ungenutzte Legacy-Daten, Berichte, Aliase und Importreste sind entfernt.

## Annahmen

- Aktuelle, fachlich geprüfte Ableitungsergebnisse dürfen einmalig in die
  Active-Hints übernommen und danach als statische Werte gepflegt werden.
- Bestehende lokale Schema-0/1-, JSON-Storage- und alte Matchdaten müssen nicht
  weiter lesbar bleiben.
- Der Inspector darf Darstellungen aus den Active-Hints aufbauen, aber keine
  zweite produktive Semantikquelle besitzen.
- Mechanische Importbereinigung wird durch Typecheck und relevante Tests
  abgesichert und erweitert keinen fachlichen Scope.

## Nicht-Ziele

- keine Abschwächung von `LegalAction`-/`applyAction`-Validierung;
- keine Abschwächung von Hidden-Information-Redaktion, Replay, StateHash,
  Authentifizierung, CSRF, Rate Limits oder aktuellen SQLite-Backups;
- kein großer Umbau von `public-context.ts`;
- keine neue Kartenmechanik oder neue KI-Strategie;
- keine Remote-Integration, kein Push und kein Pull Request;
- keine allgemeine Formatierungs- oder Architekturkampagne außerhalb der
  betroffenen Legacy-Pfade.

## Controller-Invarianten

- Es ist immer nur das aktuelle Paket aktiv.
- Jede fachliche Semantik hat genau eine produktive Quelle.
- Engine und Server behalten ihre bestehenden Sicherheitsgrenzen.
- Ein Paket endet erst nach seinen Checks, `git diff --check` und einem eigenen
  Commit.
- Fehler werden im aktuellen Paket behoben; spätere Pakete beginnen nicht auf
  rotem Stand.
- Fremde Änderungen auf `main` werden beim finalen Abgleich inhaltlich
  verstanden und defensiv integriert.

## Automatische Fehlerbehandlung

1. Einen roten Check auf die kleinste betroffene Einheit eingrenzen.
2. Prüfen, ob der Fehler durch die Paketänderung oder bereits im Ausgangsstand
   vorhanden war.
3. Paketänderungen eng korrigieren, ohne neue dauerhafte Fallbacks oder
   Grenzwertlisten einzuführen.
4. Bei einem echten Sicherheits- oder Fachkonflikt einen Blocker mit genauer
   Removal Condition dokumentieren und stoppen.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn eine Entfernung:

- aktuelle PlayerViews oder öffentliche Events mit versteckten Daten anreichert;
- die Engine-Autorität oder erneute Action-Validierung umgeht;
- aktuelle SQLite-Daten ohne nachgewiesene kanonische Ersatzform zerstört;
- eine produktiv verwendete Semantik entfernt, ohne sie zuvor in die statische
  Quelle zu überführen.

## State Machine

`P0 Prozessbasis -> P1 Hint-Semantik -> P2 Rollen/Access -> P3 Gates ->
P4 Storage/Snapshots -> P5 tote Artefakte/Importe -> P6 Gesamtabschluss ->
Main-Merge -> Cleanup -> Complete`

Bei einem roten Done-Gate verbleibt der Prozess im aktuellen Paket.

## Paketfolge und Paketdetails

### P0 – Prozessbasis

- **Ziel:** Worktree, Branch, Scope und Controller-Vertrag festhalten.
- **Kernartefakt:** dieses Dokument.
- **Checks:** `git diff --check`, Worktree-/Branch-Prüfung.
- **Done-Gate:** Prozessartefakt committed, Arbeitsbaum sauber.
- **Commit:** `docs(architecture): define legacy simplification process`

### P1 – Statische Hint-Semantik

- **Ziel:** Ableitungsergebnisse einmalig in die Active-Hints übernehmen und
  die produktive Abhängigkeit vom Inspector-Index sowie von Ableitungsregeln
  entfernen.
- **Arbeit:** tatsächliche Runtime-Verbraucher ermitteln; benötigte Signale und
  Strategieunterstützungen verlustfrei einbacken; Inspector auf Active-Hints
  ausrichten; Compiler-/Taxonomie-Artefakte entfernen oder auf reine,
  quellnahe Validierung reduzieren.
- **Kernartefakte:** `data/ai/ai-card-hints-active.json`, AI-Runtime,
  Inspector-API/UI, AI-Checks und Tests.
- **Checks:** gezielte Hint-/DeckDoctrine-/Action-Semantik-Tests,
  `pnpm typecheck`, `git diff --check`.
- **Done-Gate:** kein produktiver Import des generierten Inspector-Index oder
  der entfernten Ableitungskataloge; Verhaltenstests grün.
- **Commit:** `refactor(ai): make active hints the single semantic source`

### P2 – Kartenrollen- und Access-Legacy

- **Ziel:** alte parallele Rollen- und Access-Quellen entfernen.
- **Arbeit:** 34 Manifest-Rollen verlustfrei in Active-Hints sichern;
  `card-role-manifest-0.9.json` und Mergepfade löschen;
  `access-effect-legacy.ts`, seine Aufrufe und alte Chimera-Choice-Auflösung
  entfernen.
- **Kernartefakte:** AI-Rollenlookup, Engine-Access-Handler und Tests.
- **Checks:** Rollen-/DeckDoctrine-Tests, Access-Kartentests,
  Engine-Typecheck, `git diff --check`.
- **Done-Gate:** keine Verbraucher der Legacy-Dateien; deklarative
  CardImplementations decken die aktuellen Karten ab.
- **Commit:** `refactor(engine-ai): remove parallel role and access legacy paths`

### P3 – Aussagekräftige Architekturgates

- **Ziel:** echte Architektur-Invarianten behalten und Moving-Target-Ratchets
  entfernen.
- **Arbeit:** Zeilen-, Testgrößen-, Root-Dateizahl- und exakte
  Fanout-Debt-Grenzen löschen; Zyklus-, Layer- und Registry-Grenzen behalten;
  überflüssige Gate-Selbsttests/-Berichte mitentfernen.
- **Kernartefakte:** AI- und Engine-Source-Structure-Checks, Paket-Skripte.
- **Checks:** betroffene Architekturchecks, `pnpm typecheck`,
  `git diff --check`.
- **Done-Gate:** Checks reagieren nur noch auf fachliche Strukturverletzungen.
- **Commit:** `refactor(checks): remove moving-target source ratchets`

### P4 – Kanonischer Server-Storage und Deck-Snapshot

- **Ziel:** SQLite als einzigen produktiven Speicher und Teilnehmer-Snapshots
  als einzige private Deckform etablieren.
- **Arbeit:** JSON-Storage-Konfiguration/-Adapter entfernen;
  Schema-0/1-Migrationen und Legacy-Eventlog-Backfill entfernen;
  `InMemoryMatchStorage` nur als injizierbares Test-Doppel behalten;
  Top-Level-Runner/Corp-Deckduplikate und Fallbacks entfernen.
- **Kernartefakte:** Server-Storage, Multiplayer-Record, Start-/Health-Vertrag,
  Servertests.
- **Checks:** Storage-/Reconnect-/Series-/Replay-Tests, Server-Typecheck,
  `git diff --check`.
- **Done-Gate:** produktiver Server akzeptiert ausschließlich SQLite;
  aktuelle Matchpfade benötigen keine Legacy-Fallbacks.
- **Commit:** `refactor(server): remove legacy storage and deck snapshot fallbacks`

### P5 – Tote Artefakte, Browser-Aliase und Importreste

- **Ziel:** nachweislich ungenutzten Ballast entfernen.
- **Arbeit:** alte KI-Profile und Legacy-Card-Gate-Archive löschen;
  identische Browser-Storage-Aliase vereinfachen; unnötige generierte Berichte
  entfernen; unbenutzte Imports in den berührten Engine-/AI-Bereichen
  mechanisch bereinigen.
- **Kernartefakte:** `data/ai`, `data/manifests/archive`, Web-Storage-Helfer,
  relevante Scripts und Runtime-Dateien.
- **Checks:** Referenzsuche, Web-/AI-/Engine-Typecheck und Tests,
  `git diff --check`.
- **Done-Gate:** keine aktiven Verbraucher gelöschter Artefakte; keine neuen
  permanenten Allowlist- oder Berichtsschichten.
- **Commit:** `chore: remove obsolete legacy artifacts and aliases`

### P6 – Gesamtabschluss und Wissenspflege

- **Ziel:** Gesamtstand verifizieren und aktuelle Architektur dokumentieren.
- **Arbeit:** Status dieses Dokuments abschließen; relevante Wissensseiten auf
  die Single-Source-, Storage- und Gate-Entscheidungen aktualisieren.
- **Checks:** relevante Paketchecks, `pnpm lint`, `pnpm typecheck`, passende
  Tests, nach Risiko `pnpm build`, `git diff --check`.
- **Done-Gate:** Arbeitsbranch sauber, alle Paketcommits vorhanden, keine
  unerklärten roten Checks.
- **Commit:** `docs(architecture): record completed legacy simplification`

## Verifikationsregeln

- Engste Tests laufen zuerst; umfassendere Checks folgen beim Paketabschluss.
- Gelöschte Quellen werden mit `rg` auf verbliebene Verbraucher geprüft.
- Generierte Daten werden vor Löschung gegen die eingebrannte statische Quelle
  verglichen.
- Ein Check darf nicht durch Erhöhung eines historischen Grenzwerts „repariert“
  werden.
- Nicht ausgeführte oder aus Umgebungsgründen rote Checks werden mit Ursache
  dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree:
  `C:\Projekte\NETGRID_LEGACY_SIMPLIFICATION`
- Arbeitsbranch: `codex/legacy-simplification`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Integrationsbranch: `main`
- Der Hauptworkspace wird bis zum finalen Merge nicht für Paketänderungen
  verwendet.
- Nach jedem Paket werden ausschließlich paketzugehörige Änderungen gestaged
  und committed.
- Nach P6 wird aktuelles `main` defensiv in den Arbeitsbranch integriert, der
  finale Stand geprüft und bevorzugt per Fast-Forward nach `main` übernommen.
- Danach werden der saubere Worktree verifiziert entfernt und der vollständig
  gemergte Arbeitsbranch mit `git branch -d` gelöscht.

## Controller-Prompt-Kern

```text
/Goal Arbeite die NETGRID-Legacy-Vereinfachung vollständig und sequenziell von
P0 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, die betroffenen Paket-AGENTS.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_LEGACY_SIMPLIFICATION auf Branch
codex/legacy-simplification. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus,
aktualisiere den Paketstatus und committe jedes abgeschlossene Paket. Führe
keine neue Compiler-, Fallback- oder Allowlist-Schicht ein. Bei einem echten
Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Nach dem
letzten Paket final verifizieren, lokal nach main mergen, main prüfen,
Worktree und gemergten Branch verifiziert entfernen und das Goal erst danach
als complete markieren.
```

## Abschlusskriterien

- P0 bis P6 sind jeweils einzeln verifiziert und committed.
- Die im Gesamtziel genannten parallelen Quellen und Legacy-Pfade sind
  entfernt.
- Sicherheits- und Regelautoritätsgrenzen bleiben unverändert wirksam.
- Der finale Stand ist lokal in `main` enthalten.
- Arbeits-Worktree und Arbeitsbranch sind nachweislich entfernt.
- Das `/Goal` ist erst anschließend abgeschlossen.
