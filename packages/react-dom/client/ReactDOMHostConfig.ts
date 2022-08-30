import {DefaultEventPriority} from "react-reconciler/src/ReactEventPriorities";
import {getEventPriority} from "../events/ReactDOMEventListener";
import type {FiberRoot} from "react-reconciler/src/ReactInternalTypes";

export type Container =
  | (Element & {_reactRootContainer?: FiberRoot})
  | (Document & {_reactRootContainer?: FiberRoot})
  | (DocumentFragment & {_reactRootContainer?: FiberRoot});

export function getCurrentEventPriority() {
  const currentEvent = window.event;

  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}
