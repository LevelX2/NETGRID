"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  aiInspectorEntryKey,
  aiInspectorSections,
  defaultCollapsedAiInspectorSections,
  type AiInspectorEntry,
  type CatalogAiInspector,
} from "../../app/ai-hint-inspector-ui";
import {
  readCatalogAiInspectorOpen,
  writeCatalogAiInspectorOpen,
} from "./catalog-ai-inspector-state";
import { useAiDetailInformationSetting } from "../settings/ai-detail-information-setting";

const AI_SEMANTICS_EXPLANATION =
  "Interne strukturierte Merkmale, mit denen die KI Kartenfunktionen und Strategieeignung einordnet. Aktive Zielsemantik und ausdrücklich gekennzeichnete Alt- und Migrationsdaten werden getrennt dargestellt.";

export type CatalogStatusKey =
  | "imported"
  | "validated"
  | "catalog_ready"
  | "implemented"
  | "engine_supported"
  | "playable"
  | "human_playable"
  | "ai_supported"
  | "deck_legal"
  | "format_legal"
  | "blocked";

type CatalogStatuses = Record<CatalogStatusKey, boolean>;

export type CatalogAiHints = {
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  scenarioRefs: string[];
};

export function StatusBadges({
  statuses,
  compact = false,
  labels,
  statusKeys,
}: {
  statuses: CatalogStatuses;
  compact?: boolean;
  labels: Record<CatalogStatusKey, string>;
  statusKeys: CatalogStatusKey[];
}) {
  return (
    <div className={`statusBadges ${compact ? "compact" : ""}`}>
      {statusKeys
        .filter((key) => statuses[key])
        .map((key) => (
          <span className={`statusBadge ${key}`} key={key}>
            {labels[key]}
          </span>
        ))}
    </div>
  );
}

export function CatalogAiHintPanel({
  hints,
  inspector,
  aiSupportedLabel,
}: {
  hints?: CatalogAiHints | null;
  inspector?: CatalogAiInspector | null;
  aiSupportedLabel: string;
}) {
  const [aiDetailInformationEnabled] = useAiDetailInformationSetting();
  if (!aiDetailInformationEnabled) return null;
  if (inspector) return <CatalogAiHintInspectorPanel inspector={inspector} />;
  if (!hints) return null;
  return (
    <CatalogLegacyAiHintPanel
      hints={hints}
      aiSupportedLabel={aiSupportedLabel}
    />
  );
}

function CatalogLegacyAiHintPanel({
  hints,
  aiSupportedLabel,
}: {
  hints: CatalogAiHints;
  aiSupportedLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const valueHintEntries = Object.entries(hints.valueHints).filter(
    ([, value]) => Number.isFinite(value),
  );
  return (
    <section
      className={`catalogAiHints catalogLegacyAiHints ${isOpen ? "" : "is-collapsed"}`}
    >
      <div className="catalogAiHintsHead">
        <button
          className="catalogAiHintsHeadToggle"
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          title={
            isOpen
              ? "Alt- und Migrationsdetails einklappen"
              : "Alt- und Migrationsdetails öffnen"
          }
        >
          <strong>Altdaten / Migration / KI-Hinweise</strong>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span>
          Altdaten vorhanden · {aiSupportedLabel}:{" "}
          {hints.aiSupportStatus === "ai_supported"
            ? "ja"
            : hints.aiSupportStatus}
        </span>
      </div>
      {isOpen ? (
        <>
          <p className="meta">
            Diese Felder gehören zum bisherigen KI-Pfad und werden noch nicht
            vollständig entfernt, solange Teile der KI darauf angewiesen sind.
            Sie sind nicht die neue Zielsemantik.
          </p>
          <AiHintChips title="Alte Rollen" values={hints.roles} />
          <AiHintChips title="Alte Planrollen" values={hints.planRoles} />
          {valueHintEntries.length > 0 ? (
            <div className="catalogAiValueGrid">
              {valueHintEntries.map(([key, value]) => (
                <span key={key}>
                  <strong>{value}</strong>
                  {formatAiHintLabel(key)}
                </span>
              ))}
            </div>
          ) : null}
          <AiHintChips title="Risiken" values={hints.riskTags} quiet />
          <AiHintChips
            title="Mechaniken"
            values={hints.requiredMechanics}
            quiet
          />
          <AiHintChips
            title="Szenarien"
            values={hints.scenarioRefs.map(
              (ref) => ref.split("#").at(-1) ?? ref,
            )}
            quiet
          />
        </>
      ) : null}
    </section>
  );
}

function CatalogAiHintInspectorPanel({
  inspector,
}: {
  inspector: CatalogAiInspector;
}) {
  const sections = useMemo(() => aiInspectorSections(inspector), [inspector]);
  const defaultCollapsedSections = useMemo(
    () => defaultCollapsedAiInspectorSections(sections),
    [sections],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(defaultCollapsedSections);

  useEffect(() => {
    setIsOpen(
      readCatalogAiInspectorOpen(
        typeof window === "undefined" ? null : window.sessionStorage,
      ),
    );
  }, []);

  const togglePanel = () => {
    setIsOpen((current) => {
      const next = !current;
      writeCatalogAiInspectorOpen(
        typeof window === "undefined" ? null : window.sessionStorage,
        next,
      );
      return next;
    });
  };

  return (
    <section
      className={`catalogAiHints catalogAiInspector ${isOpen ? "" : "is-collapsed"}`}
      data-testid="catalog-ai-hint-inspector"
    >
      <div className="catalogAiHintsHead">
        <button
          className="catalogAiHintsHeadToggle"
          type="button"
          aria-expanded={isOpen}
          aria-label={`KI-Semantik-Zielmodell: ${AI_SEMANTICS_EXPLANATION}`}
          title={AI_SEMANTICS_EXPLANATION}
          onClick={togglePanel}
        >
          <strong>KI-Semantik-Zielmodell</strong>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span>KI-Hinweisprüfung · {inspector.schemaVersion}</span>
      </div>
      {isOpen ? (
        <div className="catalogAiInspectorGrid">
          {sections.map((section) => {
            const isCollapsed = Boolean(collapsedSections[section.key]);
            return (
              <section
                className={`catalogAiInspectorSection section-${section.key} ${isCollapsed ? "is-collapsed" : ""}`}
                key={section.key}
              >
                <h4>
                  <button
                    className="catalogAiInspectorSectionToggle"
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() =>
                      setCollapsedSections((current) => ({
                        ...current,
                        [section.key]: !current[section.key],
                      }))
                    }
                    aria-label={
                      section.description
                        ? `${section.title}: ${section.description}`
                        : section.title
                    }
                    title={
                      section.description ??
                      (isCollapsed
                        ? "Abschnitt öffnen"
                        : "Abschnitt einklappen")
                    }
                  >
                    <span>{section.title}</span>
                    {isCollapsed ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronUp size={14} />
                    )}
                  </button>
                </h4>
                {!isCollapsed && section.entries.length > 0 ? (
                  <div className="catalogAiInspectorEntries">
                    {section.entries.map((entry, index) => (
                      <CatalogAiInspectorEntryItem
                        entry={entry}
                        key={aiInspectorEntryKey(section.key, entry, index)}
                      />
                    ))}
                  </div>
                ) : !isCollapsed && section.emptyText ? (
                  <p className="meta">{section.emptyText}</p>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function CatalogAiInspectorEntryItem({ entry }: { entry: AiInspectorEntry }) {
  return (
    <span className={`catalogAiInspectorEntry tone-${entry.tone}`}>
      <span>{entry.label}</span>
      {entry.value ? <strong>{entry.value}</strong> : null}
      {entry.detail ? <small>{entry.detail}</small> : null}
    </span>
  );
}

function AiHintChips({
  title,
  values,
  quiet = false,
}: {
  title: string;
  values: string[];
  quiet?: boolean;
}) {
  if (values.length === 0) return null;
  return (
    <div className="catalogAiHintRow">
      <span>{title}</span>
      <div>
        {values.map((value) => (
          <small className={quiet ? "quiet" : ""} key={value}>
            {formatAiHintLabel(value)}
          </small>
        ))}
      </div>
    </div>
  );
}

function formatAiHintLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}
