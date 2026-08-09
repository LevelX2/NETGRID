import type { PublicCardView } from "./public/index";
import type { EngineCardView } from "./engine/index";
import type { PlanningCardView } from "./planning/index";
import * as PublicRuntime from "./public/index";
import type * as PublicTypes from "./public/index";

declare const publicCard: PublicCardView;
declare const engineCard: EngineCardView;
declare const planningCard: PlanningCardView;

// @ts-expect-error Public DTO cannot expose mechanical contracts.
publicCard.engine;
// @ts-expect-error Public DTO cannot expose planning annotations.
publicCard.planningAnnotations;
// @ts-expect-error Public DTO cannot expose publication control.
publicCard.publication;
// @ts-expect-error Engine view cannot expose planning annotations.
engineCard.planningAnnotations;
// @ts-expect-error Planning view cannot expose publication control.
planningCard.publication;

// @ts-expect-error The browser surface does not export full authoring specs.
type MissingCardSpec = PublicTypes.CardSpec;
// @ts-expect-error The browser surface does not export a registry handle.
PublicRuntime.CARD_REGISTRY;
// @ts-expect-error Server-side projection internals are not browser exports.
PublicRuntime.projectPublicCard;
// @ts-expect-error Engine views are not public DTOs.
type MissingEngineView = PublicTypes.EngineCardView;
// @ts-expect-error Planning views are not public DTOs.
type MissingPlanningView = PublicTypes.PlanningCardView;
// @ts-expect-error Editor views are not public DTOs.
type MissingEditorView = PublicTypes.EditorCardView;
