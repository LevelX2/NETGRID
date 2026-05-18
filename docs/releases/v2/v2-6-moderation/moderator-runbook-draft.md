# V2.6 Moderator-Runbook-Entwurf

Stand: 2026-05-17
Status: Planungsentwurf, keine Implementierungsfreigabe
Zielrelease: V2.6 Moderation Console

## Zweck

Dieses Runbook beschreibt den manuellen Zielablauf für spätere Moderatorhandlungen in V2.6. Es konkretisiert den Moderation-/Evidence-/RBAC-Vertrag, ohne eine Moderationskonsole, Report-API, Sanktionsarten oder rechtliche Endfassung vorwegzunehmen.

Führende Grundlage: `docs/releases/v2/v2-6-moderation/evidence-rbac-contract.md`.

## Rollen und Grundregeln

- `moderator` bearbeitet Reports und sieht nur reportbezogene, redigierte Evidence.
- `admin` verwaltet Rollen, bestätigt freigabepflichtige Eingriffe und kann Break-Glass-Anträge freigeben.
- `support_readonly` darf keine Sanktionen setzen und keine Hidden-Daten sehen.
- `reporter_self` sieht nur den eigenen Reportstatus und eigene eingereichte Evidence.
- RBAC wird serverseitig erzwungen; UI-Ausblendung reicht nie als Zugriffsschutz.
- Jede entscheidungsrelevante Ansicht oder Aktion schreibt Audit oder ist im jeweiligen Umsetzungsslice ausdrücklich auditfrei begründet.

## Ablauf

### 1. Reporteingang

Ein Report startet mit `reportId`, Zeitpunkt, meldendem Konto, optional gemeldetem Konto, Kategorie, Freitext, Matchbezug und Evidence-Referenzen. Reporttexte bleiben User-generated Content und dürfen nicht in Engine, Replay-StateHash oder KI-Input eingehen.

Der Eingang bestätigt nur den Erhalt. Er bewertet den Report nicht automatisch und löst keinen Hidden-Info-Zugriff aus.

### 2. Triage

Die erste Triage ordnet den Report nach Bearbeitbarkeit und Risiko:

- Ist ein konkreter Match-, Chat- oder Accountbezug vorhanden?
- Ist die Meldung mit redigierter Standard-Evidence prüfbar?
- Betrifft sie Abuse, technische Verbindungsdaten, Chatverhalten, Replay-Integrität oder eine mutmaßliche Hidden-Info-/KI-Grenzverletzung?
- Ist sofortige Eskalation an `admin` nötig, ohne schon Hidden-Daten zu öffnen?

Unklare Reports werden mit Notiz zurückgestellt oder zur Ergänzung markiert. Triage erzeugt keine Sanktion und keine automatische Entscheidung.

### 3. Evidence-Sichtung

Standard-Evidence bleibt auf erlaubte Datenklassen begrenzt:

- Reporttext und eingereichte Hinweise.
- Chat-Evidence mit Match-/Lobbybezug, redigiert und getrennt von GameEvents.
- Public-safe Replay-Auszug mit Eventfamilien, StateVersion, StateHash-Integritätsdaten und Hidden-Info-Barriere-Markern.
- Reportbezogene Connection-Audit-Auszüge ohne Tokens, Roh-Cookies, Invite-/Recovery-Codes oder lokale Pfade.
- Redigierte Konto-/PII-Daten nur soweit für den konkreten Report nötig.

Nicht zulässig im Standardpfad:

- FullState, `privatePayload`, `cardInstances`, verdeckte Karten und gegnerische Decklisten.
- `AIInput`, `DecisionDebug`, Belief-Fakten oder KI-Hypothesen als Standard-Evidence.
- `local_analysis` oder private Replay-Perspektiven außerhalb der freigegebenen Policy.
- Kopien von Hidden-Daten in Reports, Notizen, Exports oder Auditfeldern.

### 4. Entscheidung

Eine Moderatorentscheidung muss auf einer nachvollziehbaren Policy-Grundlage und der zulässigen Evidence beruhen. Wenn die Evidence nicht reicht, wird der Report ohne Sanktion geschlossen, zur weiteren Prüfung zurückgestellt oder an `admin` eskaliert.

Dieses Runbook definiert keine Sanktionsarten, keine Strafmaße und keine Rechtsbewertung. Diese Punkte bleiben eigene Produkt- und Policy-Entscheidungen vor einer Implementierung.

Automatisierte LLM- oder KI-Sanktionen sind verboten. KI-/LLM-Hilfen dürfen, falls später überhaupt vorgesehen, nur unterstützende, nicht entscheidende und auditierte Hinweise liefern.

### 5. Audit

Jede relevante Aktion schreibt ein manipulationsarmes Auditereignis mit Actor, Rolle, Aktion, Zieltyp, Ziel-ID, Datenklasse, Grund, Ergebnis und Zeit. Auditfelder dürfen keine Tokens, Roh-Cookies, FullState-Fragmente, verdeckte Kartenidentitäten, private Deckdaten oder KI-Debugdaten enthalten.

Mindestaktionen:

- `report_viewed`
- `evidence_viewed`
- `sanction_created` oder äquivalente spätere Policy-Aktion
- `sanction_changed` oder äquivalente spätere Policy-Aktion
- `role_changed`
- `break_glass_requested`
- `break_glass_approved`
- `export_created`

Wenn Hidden-Daten in einem freigegebenen Break-Glass-Fall genutzt wurden, hält der Audit nur Datenklasse, Grund und Ergebnis fest, nicht den Hidden-Inhalt selbst.

### 6. Abschluss

Ein Reportabschluss dokumentiert:

- Ergebnisstatus und kurze Begründung.
- genutzte Evidence-Klassen, nicht die rohen Hidden-Inhalte.
- Bearbeiter und Review-/Freigabereferenzen.
- Retention-Kategorie nach späterer Policy.
- offene Folgepunkte, falls ein technischer Bug, eine Policy-Lücke oder ein Redaction-Problem sichtbar wurde.

Reporter-Kommunikation ist eine eigene Produktentscheidung. Sie darf keine internen Notizen, gegnerischen Hidden-Daten, private Deckinformationen oder KI-Debugdaten veröffentlichen.

## Break-Glass

Break-Glass ist ein dokumentierter Ausnahmeprozess, kein Komfortzugriff.

Zulässig nur, wenn alle Bedingungen erfüllt sind:

1. Konkreter Report oder Sicherheitsvorfall mit Matchbezug.
2. Schriftlicher Grund, betroffene Datenklasse und engster möglicher Zeitraum/Eventbereich.
3. Standard-Evidence reicht nachweislich nicht aus.
4. Admin-Freigabe liegt vor.
5. Wenn mehr als eine Admin-/Moderatorperson verfügbar ist: Vier-Augen-Freigabe vor Zugriff.
6. Audit schreibt Antrag, Freigabe, Zugriff, Ergebnis und Ablehnungen.
7. Break-Glass-Evidence wird nicht exportiert, bis ein eigener Evidence-Export-Vertrag sie ausdrücklich und redigiert erlaubt.

Break-Glass darf keinen FullState-Standardzugriff etablieren. Nach Abschluss wird die Ausnahme geschlossen und für spätere Review-Fragen referenzierbar gemacht.

## Appeals und Review

Appeals, interne Zweitprüfung und externe Nutzerkommunikation bleiben offene Produktentscheidungen. Vor Implementierung müssen mindestens geklärt werden:

- Wer darf Appeal einreichen und in welchem Zeitfenster?
- Welche Report- und Auditdaten sieht die reviewende Rolle?
- Ob Review durch eine andere Moderator-/Adminperson verpflichtend ist.
- Welche Retention-Regel während offener Appeals gilt.
- Welche Ergebnisinformationen an Reporter und betroffene Nutzer gehen.
- Wie Fehlerkorrekturen, Aufhebungen und Audit-Ergänzungen dokumentiert werden.

Bis diese Entscheidungen getroffen sind, darf V2.6 nur Review-Fähigkeit vorbereiten, nicht als fertiges Appeals-System auftreten.

## No-Go-Liste

- Keine automatisierte LLM- oder KI-Sanktion.
- Kein FullState-Standardzugriff für Moderator, Support oder Admin.
- Keine Hidden-Info-Veröffentlichung in Reports, Exports, Public Replay, Nutzerkommunikation, Logs oder Auditfeldern.
- Keine Nutzung von `AIInput`, `DecisionDebug` oder Belief-Daten für automatische Sanktionen.
- Keine Token, Token-Hashes, Roh-Cookies, Invite-/Recovery-Codes oder lokalen Pfade in Moderationsflächen.
- Keine Änderung an Engine, LegalActions, Replay-StateHash, Kartenfreigaben oder KI-Deckpools durch Moderation.
- Keine Moderationskonsole, Report-/Sanktions-/Export-API oder rechtliche Endfassung aus diesem Entwurf ableiten.

## Umsetzungsgates

- RBAC- und Redaction-Tests decken erlaubte und verbotene Rollenrechte ab.
- Evidence-Export-Vertrag ist vorhanden, bevor Exports umgesetzt werden.
- Retention-Policy ist entschieden, bevor Reportdaten dauerhaft gespeichert werden.
- Break-Glass ist auditierbar und default-deny getestet.
- Appeals/Review ist als Produktentscheidung abgeschlossen oder ausdrücklich deferred.
