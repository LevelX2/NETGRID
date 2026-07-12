# Prozess: Realitätsaudit der Nicht-KI-Tests

## Status

Aktiv seit 2026-07-12.

## Quelle und Zielprüfung

Fortsetzungsauftrag vom 2026-07-12: Nach dem KI-Testaudit alle übrigen Tests in
vergleichbarer Art prüfen und notwendige Härtungen direkt umsetzen. Der Scope
ist bestimmbar: alle Testdateien außerhalb von `packages/ai`, einschließlich
Engine, Server, Web, Shared, Catalog, Decks, übergreifender Contracts und E2E.

## Gesamtziel

Alle 240 Nicht-KI-Testdateien werden inventarisiert und darauf geprüft, ob ihr
Prüfgegenstand der behaupteten Fehlerklasse entspricht. Testentdeckung,
Engine-/Regelpfade, Server-/Transportpfade, Web-/UI-Ableitungen und Browser-E2E
werden getrennt bewertet. Priorisierte Scheintests, überfestgelegte Fixtures,
fehlende Negativproben und Lücken zwischen isolierter Logik und öffentlichem
Eintrittspfad werden gehärtet. Der fertige Branch wird lokal nach `main`
integriert.

## Ausgangsbestand

| Gruppe | Aktive Dateien | Registrierte Tests |
|---|---:|---:|
| Engine | 181 | 2.059 |
| Web | 39 | 502 |
| Server | 11 | 264 |
| Catalog | 3 | 16 |
| Decks | 1 | 18 |
| Shared | 1 | 10 |
| Contracts | 2 | 5 |
| Browser-E2E | 1 | 8 |
| **Aktiv** | **239** | **2.882** |

Eine weitere Web-Testdatei mit sieben deklarierten Tests wird vom normalen
Web-Gate nicht gesammelt. Der vollständige Auditbestand umfasst daher 240
Dateien und 2.889 registrierte Prüfungen.

## Annahmen und Nicht-Ziele

- Ein enger Unit-Test ist korrekt, wenn sein Name und seine Evidenzaussage auf
  den lokalen Vertrag begrenzt bleiben.
- Reales Regelverhalten benötigt `LegalActions`, `applyAction`, resultierenden
  Zustand und gegebenenfalls Replay-/PlayerView-Beleg.
- Transportbehauptungen benötigen den echten Handler-/Session-/Payload-Pfad;
  reine Formattertests reichen dafür nicht.
- UI-Ableitungen dürfen rein funktional geprüft werden. Sichtbares
  Browserverhalten benötigt E2E oder einen ausdrücklich begrenzten UI-Vertrag.
- Kein Umbau von Vitest, Playwright oder der allgemeinen Testarchitektur.
- Keine fachliche Regeländerung, außer eine gehärtete Prüfung deckt einen
  eindeutigen bestehenden Produktdefekt auf.
- Keine Behauptung vollständiger visueller Qualität aus Node-basierten UI-Tests.

## Controller-Invarianten

- Die Engine bleibt einzige Regelautorität.
- Tests reichen nur aus Engine-`LegalActions` abgeleitete `PlayerActions` ein,
  wenn sie reales Spielverhalten behaupten.
- Hidden-Info-, Replay-, StateHash-, Randomness- und stale-action-Verträge
  bleiben Pflichtdimensionen.
- Eine erwartete Fehlentscheidung muss im Fixture tatsächlich legal und neben
  einer plausiblen Gegenalternative möglich sein.
- Mutation Witnesses dürfen nur Testharnesses mutieren, nicht produktiven Code.
- Testdateien, die von keinem normalen Gate gesammelt werden, gelten als rot.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Bestehende rote Tests werden zuerst als Baseline-Abweichung klassifiziert.
- Durch Härtung sichtbar werdende Produktdefekte werden eng reproduziert und
  nur bei eindeutigem Vertrag im selben Paket korrigiert.
- Hidden-Info-Fixtures dürfen keine verdeckten Daten in öffentliche Snapshots
  oder Logs übernehmen.
- Bei widersprüchlichem Regelvertrag oder paralleler Änderung derselben
  Kernlogik stoppt der Prozess mit Removal Condition.

## State Machine

`INVENTORY -> DISCOVERY_GATE -> ENGINE_REALISM -> SERVER_WEB_REALISM -> E2E_CONTRACTS -> FINAL_VERIFY -> MERGED`

Genau ein Paket ist aktiv; jedes Paket endet mit Checks und eigenem Commit.

## Paketfolge

### NTR-01 – Vollständige Inventur und Risikomatrix

- Ziel: 240 Dateien gruppieren und nach Evidenzstufe, Eintrittspfad,
  Festsetzungen, Negativprobe und Mutation Witness klassifizieren.
- Artefakte: Prozess, Auditbericht, wiederholbare Inventurwerte.
- Checks: Vitest-Static-Collection, Playwright-List, Dateiabgleich,
  `git diff --check`.
- Done: Jede Datei ist einer Gruppe zugeordnet; nicht gesammelte Dateien und
  kritische Lücken sind priorisiert.
- Commit: `docs(test): audit non-AI test realism`

### NTR-02 – Testentdeckung und lokale Vertragsrealität

- Ziel: Jedes versionierte Testfile wird von seinem normalen Gate gesammelt;
  lokale Verträge erhalten passende Gegen- und Grenzfälle.
- Scope: Vitest-Konfiguration, Shared, Catalog, Decks und reine Helperverträge.
- Checks: betroffene Pakettests, Discovery-Abgleich, Typechecks,
  `git diff --check`.
- Done: keine verwaiste Testdatei; priorisierte lokale Scheintests gehärtet.
- Commit: `test: harden discovery and local contracts`

### NTR-03 – Engine- und Regelrealismus

- Ziel: Kritische Regelbehauptungen über echte LegalAction-/applyAction-Pfade
  und kontrollierte Gegenvarianten absichern.
- Scope: Engine-Unit-, Mechanik-, Karten-, Visibility-, Replay- und
  Determinismustests.
- Checks: fokussierte Enginegruppen, Engine-Typecheck, Mutation Witnesses,
  `git diff --check`.
- Done: priorisierte Engine-Fehlerklassen würden durch eine gegenteilige
  Zustandsänderung, illegale Action oder Informationsleck rot.
- Commit: `test(engine): harden realistic rule paths`

### NTR-04 – Server-, Transport- und Webrealismus

- Ziel: Handler-, Session-, Reconnect-, Redaction- und UI-Verträge gegen reale
  Konkurrenzzustände und öffentliche Eintrittspfade prüfen.
- Scope: `apps/server`, `apps/web` und relevante Shared-Verträge.
- Checks: Server-/Web-Suiten, Typechecks, Redaction-/Payload-Negativproben,
  `git diff --check`.
- Done: priorisierte Transport-/UI-Fehler können nicht durch isolierte
  Formatterfixtures verdeckt bleiben.
- Commit: `test(apps): harden transport and UI realism`

### NTR-05 – E2E, Gesamtgate, Wissenspflege und Integration

- Ziel: Evidence-Grenzen dokumentieren, vollständige Nicht-KI-Gates ausführen
  und lokal nach `main` integrieren.
- Checks: Engine, Server, Web, Catalog, Decks, Shared, Contracts; E2E mindestens
  über Discovery/isolierbare Smokes und vollständig, sofern Laufzeitumgebung
  verfügbar; Typechecks, Format und Diff-Hygiene.
- Done: relevante Gates grün oder vorbestehender externer Blocker dokumentiert;
  Branch sauber, lokal integriert, Worktree entfernt.
- Commit: `docs(test): close non-AI test realism audit`

## Verifikationsregeln

- Jede geänderte Testdatei läuft zunächst fokussiert.
- Ein Mutation-Witness-Test muss mit der absichtlich falschen Harnessvariante
  nachweislich Fehler melden.
- Paketchecks laufen vor dem Paketcommit; breite Gates vor Integration.
- Statische Registrierungszahlen und dynamisch ausgeführte Tests werden nicht
  vermischt.
- `git diff --check` ist nach jedem Paket Pflicht.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_NON_AI_TEST_REALISM_AUDIT`
- Branch: `codex/non-ai-test-realism-audit`
- Integrationsbranch: lokales `main`
- Hauptworkspace nur für finalen Main-Abgleich und Fast-Forward-Merge nutzen.
- Kein Push oder Pull Request ohne ausdrücklichen Auftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Realitätsaudit der Nicht-KI-Tests sequenziell von NTR-01 bis
NTR-05 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, agents/test-quality-agent.md, die Pflichtseiten
der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_NON_AI_TEST_REALISM_AUDIT auf Branch
codex/non-ai-test-realism-audit. Nutze den Hauptworkspace nur für den finalen
Merge. Prüfe für jede Verhaltensbehauptung, ob das reale Eintrittspfad-Fixture
die Fehlfunktion tatsächlich zulässt und ob eine falsche Harnessvariante den
Test rot macht. Arbeite nur am aktuellen Paket, verifiziere und committe jedes
Paket. Bei Sicherheitsblocker dokumentiere Removal Condition. Nach NTR-05
aktuelles main defensiv abgleichen, final prüfen, lokal mergen, Worktree
entfernen und das Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Gruppen- und Anzahlübersicht ist ausgegeben.
- Alle 240 Testdateien sind erfasst und regulär gesammelt oder bewusst als
  gesondertes Gate dokumentiert.
- Kritische Engine-, Server-, Web- und Contract-Lücken sind gehärtet.
- Evidence-Stufen und Residualrisiken sind dokumentiert.
- Paketcommits, finale Verifikation, lokale Main-Integration und Cleanup sind
  abgeschlossen.
