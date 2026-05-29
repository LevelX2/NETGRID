import { configureActionRuntimeBootstrap } from "./action-runtime-bootstrap";
import { configureCardRuntimeBootstrap } from "./card-runtime-bootstrap";
import { configureFlowRuntimeBootstrap } from "./flow-runtime-bootstrap";
import { initializeStateRuntimeBootstrap } from "./state-runtime-bootstrap";

export {
  applyEffectCommands,
  validateDeckDefinition,
} from "./public-event-runtime-bootstrap";

const cardBootstrap = configureCardRuntimeBootstrap();
const flowBootstrap = configureFlowRuntimeBootstrap({
  cardImplementationRuntimeDeps: cardBootstrap.cardImplementationRuntimeDeps,
});
const actionBootstrap = configureActionRuntimeBootstrap({
  cardImplementationRuntimeDeps: cardBootstrap.cardImplementationRuntimeDeps,
  runFlow: flowBootstrap.runFlow,
});

initializeStateRuntimeBootstrap({
  ...cardBootstrap,
  ...flowBootstrap,
  ...actionBootstrap,
});
