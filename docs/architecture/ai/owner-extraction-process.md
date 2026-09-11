# Fünf weitere vertikale AI-Owner

Status: aktiv; Auftrag: direkte Umsetzung vom 11.09.2026.

## Ziel und Grenzen

Die vorhandenen Owner werden ohne Änderung ihres Spielverhaltens vertikal
gebündelt: Verträge, Signalbildung, Planmodul, Disposition und gebundene
Fortsetzung. Geteilte Fakten und fremde Fachentscheidungen bleiben als
typisierte Dienste außerhalb. Keine neuen Plan-IDs, Kartenfähigkeiten,
Bewertungspolitiken, Engine-Regeln oder Runtime-Bibliotheken.

Worktree: `C:/Projekte/NETGRID-worktrees/ai-des01-next-five`.
Branch: `codex/ai-des01-next-five`; Basis: `94cbeb26a`.
Der integrierte Hidden-Node-Stand wird erhalten; vor Economy und Integration
wird der aktuelle Main-Stand erneut geprüft.

## Sequenz und Abnahme

Genau ein Paket ist aktiv. Jedes Paket erhält fokussierte bestehende
Regressionen, Typprüfung bei Vertragsänderung, `git diff --check` und einen
eigenen Commit. Fehler werden vor dem nächsten Paket behoben.

1. **NF01 abgeschlossen – Corp Punish Campaign:** gemeinsame Punish-Verträge,
   Opportunity-/Quote-Signale und Kampagnenmodul bündeln. Nachweis: Punish-
   Opportunity, unbekannte Quotes, Parent-Funding und reale Tag-/Damage-Linien.
2. **NF02 abgeschlossen – Corp Punish Sequence:** Ausführungsmodul, exakte Head- und
   Trace-/Continuation-Bindung innerhalb derselben Familie. Nachweis: aktuelle
   Action/StateVersion, Parent/Need und Requote nach beobachtetem Ergebnis.
3. **NF03 aktiv – Corp Hand Management:** Handplanung, Signale und gebundene
   Hand-Choices; Score bleibt zuständig für Agenda-Ziel und Punktehorizont.
   Nachweis: Overflow, Draw/Discard/Shuffle, Deckout und Agenda-Flood.
4. **NF04 offen – Runner Development:** Plan und Entwicklungs-/Suchsignale
   sowie Fortsetzungen mit vorhandener Handbewertung zusammenführen.
   Nachweis: Admission, Funding, Install/Search und private Choice-Bindung.
5. **NF05 offen – Corp Economy:** Need-Verträge, Einkommen, Investition,
   Auszahlung und Fundingplan bündeln. Nachweis: endliche Economy, Reserve,
   Counter-Finanzierung und exakte fremde Consumer-Bindung.

Am gemeinsamen Integrationscheckpoint: AI-Typecheck und betroffene
Struktur-/Hint-/Reachability-Gates. Wegen breiter Wirkung über beide Seiten
vollständige AI-Shards gemäß Projektvertrag, nicht je Einzelpaket.

## Integration und Retention

Nach fünf grünen Paketabschlüssen Änderungen lokal nach Main integrieren,
sauberen eigenen Worktree und gemergten Branch geprüft entfernen. Kein Push.
Dauerhafte Codekarte und Ownergrenzen in README und Fachverträge übertragen;
dieses Prozessartefakt anschließend entfernen. Git hält Paketnachweise.

## Controller

/Goal NF01 bis NF05 sequenziell im angegebenen Worktree abschließen, prüfen,
paketweise committen, lokal nach main integrieren und den eigenen Worktree
und Branch geprüft entfernen. Routinefragen selbst konservativ entscheiden.
Bei fachlicher Unvereinbarkeit beide Intentionen dokumentieren und eine
konkrete Entscheidung einholen; Tests nicht abschwächen oder Fallbacks bauen.

NF01: 33 Tests in fünf Punish-Dateien grün; AI-Typecheck und Strukturgate
(743 produktive Dateien, keine Zyklen) grün. Keine Verhaltensänderung.

NF02: 51 Tests in vier Quote-/Trace-/Sequenz-/Taktikdateien grün;
Strukturgate grün (744 produktive Dateien, keine Zyklen).
